// ===================================================
// PASOS Y PUTASOS - PUNTO DE ENTRADA Y LOOP (MAIN)
// ===================================================

import './style.css';
import { PHASES, gameState } from './core/state.js';
import { calculateAttackArea, checkCollision, evaluateCellStates } from './core/grid.js';
import { chooseBotPawnPosition, chooseBotAttackTarget } from './core/ai.js';
import { TRIBES } from './data/tribes.js';
import { ATTACK_TYPES, getAttackTypeForRoll, getDiceSprite } from './data/patterns.js';
import { screens } from './ui/screens.js';
import { feedback } from './ui/feedback.js';
import { soundManager } from './audio/sound-manager.js';

// Mapas de botones y matrices del tablero
const p1BoardButtons = new Map();
const p2BoardButtons = new Map();
const p1GridMatrix = [[], [], []];
const p2GridMatrix = [[], [], []];

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar sub-módulos UI
  screens.init();
  feedback.init();

  // Configurar botones de navegación entre pantallas
  const btnStartGame = document.getElementById('btn-start-game');
  const btnRestartGame = document.getElementById('btn-restart-game');
  const btnMenuGame = document.getElementById('btn-menu-game');

  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      screens.showScreen('game');
      reiniciarPartidaCompleta();
    });
  }

  if (btnRestartGame) {
    btnRestartGame.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      screens.showScreen('game');
      reiniciarPartidaCompleta();
    });
  }

  if (btnMenuGame) {
    btnMenuGame.addEventListener('click', () => {
      screens.showScreen('start');
    });
  }

  // Inicializar casillas de los tableros
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
      if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
        // En ataque, si haces clic sobre un tablero rival, apuntas directamente allí
        if (player === 'p2') {
          handleInput('p1', null, row, col);
        } else {
          handleInput('p2', null, row, col);
        }
      } else {
        handleInput(player, key);
      }
    });
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
      handleInput('p2', key);
    }
  });
});

// ================= ENTRADA DE JUGADORES =================
function handleInput(player, key, rowOverride = null, colOverride = null) {
  // FASE 1: Colocar peón en secreto -> capa verde
  if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
    const btnMap = player === 'p1' ? p1BoardButtons : p2BoardButtons;
    const cellInfo = btnMap.get(key);
    if (!cellInfo) return;

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
      feedback.hideBigCountdown();
      feedback.setBoardCurtain('both', 'black', '¡A LA PISTA!', 'face');

      setTimeout(() => {
        cambiarFase(PHASES.PHASE_1_PLACEMENT);
      }, 1200);
      break;

    case PHASES.PHASE_1_PLACEMENT:
      feedback.setBoardCurtain('both', 'hide');

      iniciarTemporizador(3, () => {
        asegurarSeleccionPeones();
        cambiarFase(PHASES.PHASE_DICE_ROLL);
      });
      break;

    case PHASES.PHASE_DICE_ROLL:
      feedback.hideBigCountdown();
      feedback.setBoardCurtain('both', 'hide');

      ejecutarTiradaDadosOverlay(() => {
        setTimeout(() => {
          cambiarFase(PHASES.PHASE_2_ATTACK);
        }, 1200);
      });
      break;

    case PHASES.PHASE_2_ATTACK:
      feedback.setBoardCurtain('both', 'hide');
      feedback.dockDiceOverlays();
      preconfigurarAtaquesAutomaticos();

      iniciarTemporizador(3, () => {
        asegurarSeleccionAtaques();
        cambiarFase(PHASES.RESOLUTION);
      });
      break;

    case PHASES.RESOLUTION:
      feedback.hideBigCountdown();
      feedback.setBoardCurtain('both', 'hide');
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
    gameState.p1.pawnCell = chooseBotPawnPosition(TRIBES.p1.keyList, p1BoardButtons);
    feedback.setBoardCurtain('p1', 'green', 'EN POSICION', 'face');
  }
  if (!gameState.p2.pawnCell) {
    gameState.p2.pawnCell = chooseBotPawnPosition(TRIBES.p2.keyList, p2BoardButtons);
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
  // Tablero de P1: atacado por P2, donde está el peón de P1
  const p1States = evaluateCellStates(gameState.p2.targetedCells, gameState.p1.pawnCell);
  // Tablero de P2: atacado por P1, donde está el peón de P2
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

    if (p1HitsP2) {
      gameState.p2.lives--;
      feedback.updateLivesUI('p2', gameState.p2.lives);
      feedback.triggerHurtAnimation('p2');
      feedback.showReactionBadge('p2', '¡HIT! -1 PRESTIGIO', 'show-hit');
      feedback.shakeScreen();
      soundManager.playHitSound();
    } else {
      feedback.showReactionBadge('p2', '¡ESQUIVADO!', 'show-dodge');
    }

    if (p2HitsP1) {
      gameState.p1.lives--;
      feedback.updateLivesUI('p1', gameState.p1.lives);
      feedback.triggerHurtAnimation('p1');
      feedback.showReactionBadge('p1', '¡HIT! -1 PRESTIGIO', 'show-hit');
      feedback.shakeScreen();
      soundManager.playHitSound();
    } else {
      feedback.showReactionBadge('p1', '¡ESQUIVADO!', 'show-dodge');
    }

    if (!p1HitsP2 && !p2HitsP1) {
      soundManager.playMissBothSound();
    }

    setTimeout(() => {
      feedback.clearHurtAnimations();
      feedback.hideReactionBadges();

      if (gameState.p1.lives <= 0 || gameState.p2.lives <= 0) {
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
  screens.showGameOver(gameState.p1.lives, gameState.p2.lives);
}

function reiniciarPartidaCompleta() {
  gameState.resetMatch();
  feedback.updateLivesUI('p1', 3);
  feedback.updateLivesUI('p2', 3);
  iniciarCicloRonda();
}

function iniciarCicloRonda() {
  gameState.resetRound();
  feedback.clearDiceOverlays();
  feedback.clearBoardEffects();
  cambiarFase(PHASES.WARNING_PLACEMENT);
}
