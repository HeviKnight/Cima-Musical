// ===================================================
// PASOS Y PUTASOS - PUNTO DE ENTRADA Y LOOP (MAIN)
// ===================================================

import './style.css';
import { PHASES, gameState } from './core/state.js';
import { calculateAttackArea, checkCollision, evaluateCellStates, isAdjacentCell } from './core/grid.js';
import { chooseBotPawnPosition, chooseBotAttackTarget } from './core/ai.js';
import { TRIBES } from './data/tribes.js';
import { ATTACK_TYPES, getAttackTypeForRoll, getDiceSprite } from './data/patterns.js';
import { screens } from './ui/screens.js';
import { feedback } from './ui/feedback.js';
import { soundManager } from './audio/sound-manager.js';

// Mapas de botones y matrices del tablero
let p1BoardButtons = new Map();
let p2BoardButtons = new Map();
let p1GridMatrix = [[], [], []];
let p2GridMatrix = [[], [], []];

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar gestor de pantallas
  screens.init();

  // Configurar botones del Menú Principal
  const btnVsAI = document.getElementById('btn-mode-vs-ai');
  const btnLocal = document.getElementById('btn-mode-local');
  const btnStory = document.getElementById('btn-mode-story');
  const btnTutorial = document.getElementById('btn-mode-tutorial');
  const btnSettings = document.getElementById('btn-mode-settings');

  if (btnVsAI) {
    btnVsAI.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      iniciarPartidaDinamica('vs-ai');
    });
  }

  if (btnLocal) {
    btnLocal.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      iniciarPartidaDinamica('local');
    });
  }

  // Placeholders con animación visual al pulsar
  [btnStory, btnTutorial, btnSettings].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        soundManager.startBackgroundMusic();
        const badge = btn.querySelector('.btn-badge');
        if (badge) {
          badge.style.transform = 'scale(1.25)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
      });
    }
  });

  // Activar música en el primer gesto del usuario
  document.addEventListener('click', () => soundManager.startBackgroundMusic(), { once: true });
  document.addEventListener('keydown', () => soundManager.startBackgroundMusic(), { once: true });

  // Control global de teclado
  window.addEventListener('keydown', (e) => {
    soundManager.startBackgroundMusic();
    const key = e.key.toLowerCase();
    if (TRIBES.p1.keyList.includes(key)) {
      handleInput('p1', key);
    } else if (TRIBES.p2.keyList.includes(key)) {
      if (currentGameMode !== 'vs-ai') {
        handleInput('p2', key);
      }
    }
  });
});

function iniciarPartidaDinamica(mode) {
  currentGameMode = mode;

  // 1. Montar pantalla de juego en el DOM
  screens.mountGameScreen();

  // 2. Inicializar feedback y referencias de UI
  feedback.init();

  if (feedback.p1Curtain) {
    feedback.p1Curtain.addEventListener('click', () => confirmarJugadorListo('p1'));
  }
  if (feedback.p2Curtain) {
    feedback.p2Curtain.addEventListener('click', () => {
      if (currentGameMode !== 'vs-ai') {
        confirmarJugadorListo('p2');
      }
    });
  }

  // 3. Re-construir mapeo de casillas y matrices del tablero
  p1BoardButtons = new Map();
  p2BoardButtons = new Map();
  p1GridMatrix = [[], [], []];
  p2GridMatrix = [[], [], []];

  document.querySelectorAll('.casilla-btn').forEach(btn => {
    const player = btn.getAttribute('data-player');
    const key = btn.getAttribute('data-key').toLowerCase();
    const row = parseInt(btn.getAttribute('data-row'), 10);
    const col = parseInt(btn.getAttribute('data-col'), 10);

    const cellInfo = { btn, key, row, col, player };

    if (player === 'p1') {
      p1BoardButtons.set(key, cellInfo);
      p1GridMatrix[row][col] = cellInfo;
    } else {
      p2BoardButtons.set(key, cellInfo);
      p2GridMatrix[row][col] = cellInfo;
    }

    btn.addEventListener('click', () => {
      if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
        if (player === 'p1' || currentGameMode !== 'vs-ai') {
          confirmarJugadorListo(player);
        }
      } else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
        if (player === 'p2') {
          handleInput('p1', null, row, col);
        } else if (currentGameMode !== 'vs-ai') {
          handleInput('p2', null, row, col);
        }
      } else {
        if (player === 'p1' || currentGameMode !== 'vs-ai') {
          handleInput(player, key);
        }
      }
    });
  });

  // 4. Animación de introducción: pasarela de casillas activándose consecutivamente
  feedback.playGridIntroAnimation(() => {
    reiniciarPartidaCompleta();
  });
}

let p1Ready = false;
let p2Ready = false;
let currentGameMode = 'vs-ai';

function confirmarJugadorListo(player) {
  if (gameState.currentPhase !== PHASES.WARNING_PLACEMENT) return;
  if (player === 'p1' && p1Ready) return;
  if (player === 'p2' && p2Ready) return;

  if (player === 'p1') {
    p1Ready = true;
    feedback.setBoardCurtain('p1', 'green', '¡LISTO!', 'face');
    soundManager.playPawnPlaceSound();

    if (currentGameMode === 'vs-ai' && !p2Ready) {
      p2Ready = true;
      feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
    }
  } else if (player === 'p2') {
    if (currentGameMode === 'vs-ai') return;
    p2Ready = true;
    feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
    soundManager.playPawnPlaceSound();
  }

  if (p1Ready && p2Ready) {
    setTimeout(() => {
      if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
        cambiarFase(PHASES.PHASE_1_PLACEMENT);
      }
    }, 350);
  }
}

// ================= ENTRADA DE JUGADORES =================
function handleInput(player, key, rowOverride = null, colOverride = null) {
  if (currentGameMode === 'vs-ai' && player === 'p2') return;

  // FASE PREPARACIÓN: Solo la tecla 's' (P1) o 'k' (P2) sirven para confirmar
  if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
    if ((player === 'p1' && key === 's') || (player === 'p2' && key === 'k')) {
      confirmarJugadorListo(player);
    }
    return;
  }

  // FASE 1: Colocar peón en secreto -> capa verde
  if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
    const pState = player === 'p1' ? gameState.p1 : gameState.p2;

    // Si el jugador ya ha colocado su peón en esta ronda, ignorar selecciones posteriores
    if (pState.pawnCell) return;

    const btnMap = player === 'p1' ? p1BoardButtons : p2BoardButtons;
    const cellInfo = btnMap.get(key);
    if (!cellInfo) return;

    // Verificar movimiento: en Ronda > 1 solo se puede mover a casillas adyacentes
    if (!isAdjacentCell(pState.lastPawnCell, cellInfo)) {
      return; // Casilla no adyacente, ignorar selección
    }

    if (player === 'p1') {
      gameState.p1.pawnCell = cellInfo;
      feedback.setBoardCurtain('p1', 'green', 'EN POSICION', 'face');
    } else {
      gameState.p2.pawnCell = cellInfo;
      feedback.setBoardCurtain('p2', 'green', 'EN POSICION', 'face');
    }
    soundManager.playPawnPlaceSound();
  }

  // FASE 2: Elegir dónde atacar en el tablero rival
  else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
    let row, col;
    if (rowOverride !== null && colOverride !== null) {
      row = rowOverride;
      col = colOverride;
    } else {
      const btnMap = player === 'p1' ? p1BoardButtons : p2BoardButtons;
      const cellInfo = btnMap.get(key);
      if (!cellInfo) return;
      row = cellInfo.row;
      col = cellInfo.col;
    }

    if (player === 'p1') {
      gameState.p1.attackAnchor = { row, col };
      gameState.p1.targetedCells = calculateAttackArea(gameState.p1.attackType.id, row, col);
      feedback.updateAttackHighlights(p2GridMatrix, gameState.p1.targetedCells);
    } else {
      gameState.p2.attackAnchor = { row, col };
      gameState.p2.targetedCells = calculateAttackArea(gameState.p2.attackType.id, row, col);
      feedback.updateAttackHighlights(p1GridMatrix, gameState.p2.targetedCells);
    }
  }
}

// ================= CONTROL DEL CICLO DE FASES =================
function cambiarFase(nuevaFase) {
  gameState.setPhase(nuevaFase);

  switch (nuevaFase) {
    case PHASES.WARNING_PLACEMENT:
      p1Ready = false;
      p2Ready = false;
      feedback.hideBigCountdown();
      feedback.updateKeyTags('placement', currentGameMode);
      feedback.removeStandingPawnIcons();
      feedback.setBoardCurtain('p1', 'black', 'A LA PISTA', 'face');

      if (currentGameMode === 'vs-ai') {
        p2Ready = true;
        feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
      } else {
        feedback.setBoardCurtain('p2', 'black', 'A LA PISTA', 'face');
      }
      feedback.updateRoundUI(gameState.roundNumber, 'pose');
      break;

    case PHASES.PHASE_1_PLACEMENT:
      feedback.setBoardCurtain('p1', 'hide');
      feedback.updateKeyTags('placement', currentGameMode);
      feedback.updateStandingPawnIcons(p1GridMatrix, gameState.p1.lastPawnCell, p2GridMatrix, gameState.p2.lastPawnCell);
      feedback.highlightValidPawnMoves(p1GridMatrix, gameState.p1.lastPawnCell);
      feedback.highlightValidPawnMoves(p2GridMatrix, gameState.p2.lastPawnCell);
      feedback.updateRoundUI(gameState.roundNumber, 'pose');

      if (currentGameMode === 'vs-ai') {
        gameState.p2.pawnCell = chooseBotPawnPosition(TRIBES.p2.keyList, p2BoardButtons, gameState.p2.lastPawnCell);
        feedback.setBoardCurtain('p2', 'green', 'EN POSICION', 'face');
      } else {
        feedback.setBoardCurtain('p2', 'hide');
      }

      iniciarTemporizador(3, () => {
        feedback.clearMoveHighlights();
        asegurarSeleccionPeones();
        cambiarFase(PHASES.PHASE_DICE_ROLL);
      });
      break;

    case PHASES.PHASE_DICE_ROLL:
      feedback.hideBigCountdown();
      feedback.setBoardCurtain('both', 'hide');
      feedback.removeStandingPawnIcons();
      feedback.updateRoundUI(gameState.roundNumber, 'baile');

      ejecutarTiradaDadosOverlay(() => {
        setTimeout(() => {
          cambiarFase(PHASES.PHASE_2_ATTACK);
        }, 1200);
      });
      break;

    case PHASES.PHASE_2_ATTACK:
      feedback.setBoardCurtain('both', 'hide');
      feedback.removeStandingPawnIcons();
      feedback.updateKeyTags('attack', currentGameMode);
      feedback.dockDiceOverlays();
      feedback.updateRoundUI(gameState.roundNumber, 'baile');

      if (currentGameMode === 'vs-ai') {
        const target = chooseBotAttackTarget(gameState.p2.attackType.id, TRIBES.p2.keyList, p1BoardButtons);
        gameState.p2.attackAnchor = { row: target.row, col: target.col };
        gameState.p2.targetedCells = target.targetedCells;
        feedback.updateAttackHighlights(p1GridMatrix, gameState.p2.targetedCells);
      } else {
        preconfigurarAtaquesAutomaticos();
      }

      iniciarTemporizador(3, () => {
        asegurarSeleccionAtaques();
        cambiarFase(PHASES.RESOLUTION);
      });
      break;

    case PHASES.RESOLUTION:
      feedback.hideBigCountdown();
      feedback.setBoardCurtain('both', 'hide');
      feedback.removeStandingPawnIcons();
      feedback.updateKeyTags('placement');
      ejecutarResolucionCombate();
      break;

    case PHASES.GAME_OVER:
      feedback.hideBigCountdown();
      break;
  }
}

// Temporizador visual y sonoro
function iniciarTemporizador(segundos, onComplete) {
  gameState.timer = segundos;
  feedback.showBigCountdown(gameState.timer);
  soundManager.playCountdownSound(gameState.timer);

  gameState.timerInterval = setInterval(() => {
    gameState.timer--;
    if (gameState.timer > 0) {
      feedback.showBigCountdown(gameState.timer);
      soundManager.playCountdownSound(gameState.timer);
    } else {
      feedback.hideBigCountdown();
      clearInterval(gameState.timerInterval);
      soundManager.playCountdownSound('go');
      if (onComplete) onComplete();
    }
  }, 1000);
}

// Tirada animada de dados
function ejecutarTiradaDadosOverlay(onFinished) {
  const p1RollOverlay = feedback.p1RollOverlay;
  const p2RollOverlay = feedback.p2RollOverlay;
  const p1RollDiceImg = feedback.p1RollDiceImg;
  const p2RollDiceImg = feedback.p2RollDiceImg;
  const p1RollShapeImg = feedback.p1RollShapeImg;
  const p2RollShapeImg = feedback.p2RollShapeImg;

  if (!p1RollOverlay || !p2RollOverlay) return;

  p1RollOverlay.className = 'board-roll-overlay active-center';
  p2RollOverlay.className = 'board-roll-overlay active-center';

  p1RollDiceImg.classList.add('rolling-anim');
  p2RollDiceImg.classList.add('rolling-anim');

  let ticks = 0;
  const rollTimer = setInterval(() => {
    const temp1 = Math.floor(Math.random() * 6) + 1;
    const temp2 = Math.floor(Math.random() * 6) + 1;

    p1RollDiceImg.src = getDiceSprite(temp1);
    p2RollDiceImg.src = getDiceSprite(temp2);

    p1RollShapeImg.src = getAttackTypeForRoll(temp1).sprite;
    p2RollShapeImg.src = getAttackTypeForRoll(temp2).sprite;

    soundManager.playDiceRollTick(ticks);

    ticks++;
    if (ticks >= 8) {
      clearInterval(rollTimer);
      p1RollDiceImg.classList.remove('rolling-anim');
      p2RollDiceImg.classList.remove('rolling-anim');

      const final1 = Math.floor(Math.random() * 6) + 1;
      const final2 = Math.floor(Math.random() * 6) + 1;

      gameState.p1.diceRoll = final1;
      gameState.p2.diceRoll = final2;

      p1RollDiceImg.src = getDiceSprite(final1);
      p2RollDiceImg.src = getDiceSprite(final2);

      gameState.p1.attackType = getAttackTypeForRoll(final1);
      gameState.p2.attackType = getAttackTypeForRoll(final2);

      p1RollShapeImg.src = gameState.p1.attackType.sprite;
      p2RollShapeImg.src = gameState.p2.attackType.sprite;

      if (onFinished) onFinished();
    }
  }, 90);
}

function preconfigurarAtaquesAutomaticos() {
  gameState.p1.attackAnchor = { row: 0, col: 0 };
  gameState.p1.targetedCells = calculateAttackArea(gameState.p1.attackType.id, 0, 0);
  feedback.updateAttackHighlights(p2GridMatrix, gameState.p1.targetedCells);

  gameState.p2.attackAnchor = { row: 0, col: 0 };
  gameState.p2.targetedCells = calculateAttackArea(gameState.p2.attackType.id, 0, 0);
  feedback.updateAttackHighlights(p1GridMatrix, gameState.p2.targetedCells);
}

function asegurarSeleccionPeones() {
  if (!gameState.p1.pawnCell) {
    const lastRow = gameState.p1.lastPawnCell?.row ?? 1;
    const lastCol = gameState.p1.lastPawnCell?.col ?? 1;
    gameState.p1.pawnCell = p1GridMatrix[lastRow][lastCol];
    feedback.setBoardCurtain('p1', 'green', 'EN POSICION', 'face');
  }
  if (!gameState.p2.pawnCell) {
    if (currentGameMode === 'vs-ai') {
      gameState.p2.pawnCell = chooseBotPawnPosition(TRIBES.p2.keyList, p2BoardButtons, gameState.p2.lastPawnCell);
    } else {
      const lastRow = gameState.p2.lastPawnCell?.row ?? 1;
      const lastCol = gameState.p2.lastPawnCell?.col ?? 1;
      gameState.p2.pawnCell = p2GridMatrix[lastRow][lastCol];
    }
    feedback.setBoardCurtain('p2', 'green', 'EN POSICION', 'face');
  }
}

function asegurarSeleccionAtaques() {
  if (!gameState.p1.attackAnchor) {
    const target = chooseBotAttackTarget(gameState.p1.attackType.id, TRIBES.p1.keyList, p1BoardButtons);
    gameState.p1.attackAnchor = { row: target.row, col: target.col };
    gameState.p1.targetedCells = target.targetedCells;
    feedback.updateAttackHighlights(p2GridMatrix, gameState.p1.targetedCells);
  }
  if (!gameState.p2.attackAnchor) {
    const target = chooseBotAttackTarget(gameState.p2.attackType.id, TRIBES.p2.keyList, p2BoardButtons);
    gameState.p2.attackAnchor = { row: target.row, col: target.col };
    gameState.p2.targetedCells = target.targetedCells;
    feedback.updateAttackHighlights(p1GridMatrix, gameState.p2.targetedCells);
  }
}

// ================= RESOLUCIÓN DEL COMBATE =================
function ejecutarResolucionCombate() {
  // 1. Calcular estados dinámicos (hit, fail, dodge, empty)
  const p1States = evaluateCellStates(gameState.p2.targetedCells, gameState.p1.pawnCell);
  const p2States = evaluateCellStates(gameState.p1.targetedCells, gameState.p2.pawnCell);

  feedback.applyCellStates(p1GridMatrix, p1States);
  feedback.applyCellStates(p2GridMatrix, p2States);

  // 2. Revelar peones
  feedback.revealPawn(gameState.p1.pawnCell);
  feedback.revealPawn(gameState.p2.pawnCell);

  feedback.triggerAttackAnimations();

  const p1HitsP2 = checkCollision(gameState.p1.targetedCells, gameState.p2.pawnCell);
  const p2HitsP1 = checkCollision(gameState.p2.targetedCells, gameState.p1.pawnCell);

  setTimeout(() => {
    feedback.clearAttackAnimations();

    // Cálculo de cambios de prestigio por combate
    // Acertar: +33, Fallar: -10, Recibir daño: -10, Tensión de ronda: +15
    let p1Delta = 15; // Tensión pasiva de fin de ronda
    let p2Delta = 15; // Tensión pasiva de fin de ronda

    // Ataque de P1 -> P2
    if (p1HitsP2) {
      p1Delta += 33;
      p2Delta -= 10;
      feedback.triggerHurtAnimation('p2');
      feedback.showReactionBadge('p2', '¡DAÑO! -10', 'show-hit');
      soundManager.playHitSound();
    } else {
      feedback.showReactionBadge('p2', '¡ESQUIVADO!', 'show-dodge');
    }

    // Ataque de P2 -> P1
    if (p2HitsP1) {
      p2Delta += 33;
      p1Delta -= 10;
      feedback.triggerHurtAnimation('p1');
      feedback.showReactionBadge('p1', '¡DAÑO! -10', 'show-hit');
      soundManager.playHitSound();
    } else {
      feedback.showReactionBadge('p1', '¡ESQUIVADO!', 'show-dodge');
    }

    if (p1HitsP2 || p2HitsP1) {
      feedback.shakeScreen();
    } else {
      soundManager.playMissBothSound();
    }

    // Aplicar prestigio
    gameState.addPrestige('p1', p1Delta);
    gameState.addPrestige('p2', p2Delta);
    feedback.updatePrestigeUI('p1', gameState.p1.prestige);
    feedback.updatePrestigeUI('p2', gameState.p2.prestige);

    setTimeout(() => {
      feedback.clearHurtAnimations();
      feedback.hideReactionBadges();

      // Condición de victoria: alcanzar 100 de prestigio
      if (gameState.p1.prestige >= 100 || gameState.p2.prestige >= 100) {
        finalizarPartida();
      } else {
        iniciarCicloRonda();
      }
    }, 2000);
  }, 500);
}

function finalizarPartida() {
  gameState.setPhase(PHASES.GAME_OVER);
  soundManager.playGameOverSound();
  screens.mountGameOverScreen(gameState.p1.prestige, gameState.p2.prestige);

  const btnRestartGame = document.getElementById('btn-restart-game');
  const btnMenuGame = document.getElementById('btn-menu-game');

  if (btnRestartGame) {
    btnRestartGame.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      iniciarPartidaDinamica('vs-ai');
    });
  }

  if (btnMenuGame) {
    btnMenuGame.addEventListener('click', () => {
      screens.showScreen('start');
    });
  }
}

function reiniciarPartidaCompleta() {
  gameState.resetMatch();
  feedback.updatePrestigeUI('both', 0, { silent: true });
  feedback.updateRoundUI(gameState.roundNumber);
  iniciarCicloRonda();
}

function iniciarCicloRonda() {
  gameState.resetRound();
  feedback.updateRoundUI(gameState.roundNumber);
  feedback.clearDiceOverlays();
  feedback.clearBoardEffects();
  cambiarFase(PHASES.WARNING_PLACEMENT);
}
