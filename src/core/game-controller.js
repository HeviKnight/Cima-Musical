// ===================================================
// CONTROLADOR DE PARTIDA Y CICLO DE JUEGO (GAME CONTROLLER)
// ===================================================

import { PHASES, gameState } from './state.js';
import { calculateAttackArea, checkCollision, evaluateCellStates, isAdjacentCell } from './grid.js';
import { chooseBotPawnPosition, chooseBotAttackTarget } from './ai.js';
import { CONTROLS } from '../data/controls.js';
import { getAttackTypeForRoll, getDiceSprite } from '../data/patterns.js';
import { screens } from '../ui/screens.js';
import { feedback } from '../ui/feedback.js';
import { soundManager } from '../audio/sound-manager.js';

export class GameController {
  constructor() {
    this.p1BoardButtons = new Map();
    this.p2BoardButtons = new Map();
    this.p1GridMatrix = [[], [], []];
    this.p2GridMatrix = [[], [], []];

    this.p1Ready = false;
    this.p2Ready = false;
    this.currentGameMode = 'vs-ai';

    this.lastAbilityKeyTimes = {
      p1: { key: null, time: 0 },
      p2: { key: null, time: 0 }
    };
    this.lastAbilityActivationTimes = { p1: 0, p2: 0 };
  }

  iniciarPartidaDinamica(mode, p1Char = null, p2Char = null) {
    this.currentGameMode = mode;

    if (p1Char) {
      gameState.p1.character = p1Char;
      gameState.p1.maxAbilityCharges = p1Char.activeAbility?.maxCharges ?? 1;
      gameState.p1.activeAbilityCharges = gameState.p1.maxAbilityCharges;
    }
    if (p2Char) {
      gameState.p2.character = p2Char;
      gameState.p2.maxAbilityCharges = p2Char.activeAbility?.maxCharges ?? 1;
      gameState.p2.activeAbilityCharges = gameState.p2.maxAbilityCharges;
    }

    // 1. Montar pantalla de juego en el DOM
    screens.mountGameScreen();

    // 2. Inicializar feedback y referencias de UI
    feedback.init();

    if (feedback.p1Curtain) {
      feedback.p1Curtain.addEventListener('click', () => this.confirmarJugadorListo('p1'));
    }
    if (feedback.p2Curtain) {
      feedback.p2Curtain.addEventListener('click', () => {
        if (this.currentGameMode !== 'vs-ai') {
          this.confirmarJugadorListo('p2');
        }
      });
    }

    // 3. Re-construir mapeo de casillas y matrices del tablero
    this.p1BoardButtons = new Map();
    this.p2BoardButtons = new Map();
    this.p1GridMatrix = [[], [], []];
    this.p2GridMatrix = [[], [], []];

    document.querySelectorAll('.casilla-btn').forEach(btn => {
      const player = btn.getAttribute('data-player');
      const key = btn.getAttribute('data-key').toLowerCase();
      const row = parseInt(btn.getAttribute('data-row'), 10);
      const col = parseInt(btn.getAttribute('data-col'), 10);

      const cellInfo = { btn, key, row, col, player };

      if (player === 'p1') {
        this.p1BoardButtons.set(key, cellInfo);
        this.p1GridMatrix[row][col] = cellInfo;
      } else {
        this.p2BoardButtons.set(key, cellInfo);
        this.p2GridMatrix[row][col] = cellInfo;
      }

      btn.addEventListener('click', () => {
        if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
          if (player === 'p1' || this.currentGameMode !== 'vs-ai') {
            this.confirmarJugadorListo(player);
          }
        } else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
          if (player === 'p2') {
            this.handleInput('p1', null, row, col);
          } else if (this.currentGameMode !== 'vs-ai') {
            this.handleInput('p2', null, row, col);
          }
        } else {
          if (player === 'p1' || this.currentGameMode !== 'vs-ai') {
            this.handleInput(player, key);
          }
        }
      });

      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (gameState.currentPhase !== PHASES.PHASE_2_ATTACK) return;
        if (player === 'p1' && key === 's') {
          this.activatePlaceholderAbility('p1');
        } else if (player === 'p2' && key === 'k') {
          this.activatePlaceholderAbility('p1');
          if (this.currentGameMode !== 'vs-ai') {
            this.activatePlaceholderAbility('p2');
          }
        }
      });
    });

    // 4. Animación de introducción: pasarela de casillas activándose consecutivamente
    feedback.playGridIntroAnimation(() => {
      this.reiniciarPartidaCompleta();
    });
  }

  confirmarJugadorListo(player) {
    if (gameState.currentPhase !== PHASES.WARNING_PLACEMENT) return;
    if (player === 'p1' && this.p1Ready) return;
    if (player === 'p2' && this.p2Ready) return;

    if (player === 'p1') {
      this.p1Ready = true;
      feedback.setBoardCurtain('p1', 'green', '¡LISTO!', 'face');
      soundManager.playPawnPlaceSound();

      if (this.currentGameMode === 'vs-ai' && !this.p2Ready) {
        this.p2Ready = true;
        feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
      }
    } else if (player === 'p2') {
      if (this.currentGameMode === 'vs-ai') return;
      this.p2Ready = true;
      feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
      soundManager.playPawnPlaceSound();
    }

    if (this.p1Ready && this.p2Ready) {
      setTimeout(() => {
        if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
          this.cambiarFase(PHASES.PHASE_1_PLACEMENT);
        }
      }, 350);
    }
  }

  checkDoubleTapAbility(player, key) {
    // El doble click solo se activa durante la selección de ataque
    if (gameState.currentPhase !== PHASES.PHASE_2_ATTACK) return false;
    if (!key) return false;
    const normalizedKey = key.toLowerCase();
    const targetKey = player === 'p1' ? 's' : 'k';
    if (normalizedKey !== targetKey) return false;

    const now = Date.now();
    const last = this.lastAbilityKeyTimes[player] || { key: null, time: 0 };
    const timeDiff = now - last.time;

    // Detectar doble pulsación en ventana de 450ms
    if (last.key === targetKey && timeDiff < 450 && timeDiff > 20) {
      this.lastAbilityKeyTimes[player] = { key: null, time: 0 };
      this.activatePlaceholderAbility(player);
      return true;
    }

    this.lastAbilityKeyTimes[player] = { key: targetKey, time: now };
    return false;
  }

  activatePlaceholderAbility(player) {
    const pState = gameState[player];
    if (!pState) return;

    // Solo se activa durante la fase de selección de ataque
    if (gameState.currentPhase !== PHASES.PHASE_2_ATTACK) {
      return;
    }

    const now = Date.now();
    if ((now - (this.lastAbilityActivationTimes[player] || 0)) < 300) {
      return;
    }
    this.lastAbilityActivationTimes[player] = now;

    if (pState.activeAbilityCharges <= 0) {
      return;
    }

    pState.activeAbilityCharges--;
    feedback.updateAssaultChargesUI(player);
    soundManager.playPawnPlaceSound();
    feedback.showPlaceholderActivation(player, 'placeholder activado');
  }

  // ================= ENTRADA DE JUGADORES =================
  handleInput(player, key, rowOverride = null, colOverride = null) {
    let effectiveKey = key;
    if (!effectiveKey && rowOverride === 1 && colOverride === 1) {
      effectiveKey = player === 'p1' ? 's' : 'k';
    }
    if (effectiveKey) {
      this.checkDoubleTapAbility(player, effectiveKey);
    }

    if (this.currentGameMode === 'vs-ai' && player === 'p2') return;

    // FASE PREPARACIÓN: Solo la tecla 's' (P1) o 'k' (P2) sirven para confirmar
    if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
      if ((player === 'p1' && key === 's') || (player === 'p2' && key === 'k')) {
        this.confirmarJugadorListo(player);
      }
      return;
    }

    // FASE 1: Colocar peón en secreto -> capa verde
    if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
      const pState = player === 'p1' ? gameState.p1 : gameState.p2;

      // Si el jugador ya ha colocado su peón en esta ronda, ignorar selecciones posteriores
      if (pState.pawnCell) return;

      const btnMap = player === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
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
        const btnMap = player === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
        const cellInfo = btnMap.get(key);
        if (!cellInfo) return;
        row = cellInfo.row;
        col = cellInfo.col;
      }

      if (player === 'p1') {
        gameState.p1.attackAnchor = { row, col };
        gameState.p1.targetedCells = calculateAttackArea(gameState.p1.attackType.id, row, col);
        feedback.updateAttackHighlights(this.p2GridMatrix, gameState.p1.targetedCells);
      } else {
        gameState.p2.attackAnchor = { row, col };
        gameState.p2.targetedCells = calculateAttackArea(gameState.p2.attackType.id, row, col);
        feedback.updateAttackHighlights(this.p1GridMatrix, gameState.p2.targetedCells);
      }
    }
  }

  // ================= CONTROL DEL CICLO DE FASES =================
  cambiarFase(nuevaFase) {
    gameState.setPhase(nuevaFase);

    switch (nuevaFase) {
      case PHASES.WARNING_PLACEMENT:
        this.p1Ready = false;
        this.p2Ready = false;
        feedback.hideBigCountdown();
        feedback.hideVerticalCombatBars();
        feedback.updateKeyTags('placement', this.currentGameMode);
        feedback.removeStandingPawnIcons();
        feedback.setBoardCurtain('p1', 'black', 'A LA PISTA', 'face');

        if (this.currentGameMode === 'vs-ai') {
          this.p2Ready = true;
          feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
        } else {
          feedback.setBoardCurtain('p2', 'black', 'A LA PISTA', 'face');
        }
        feedback.updateRoundUI(gameState.roundNumber, 'placement');
        break;

      case PHASES.PHASE_1_PLACEMENT:
        feedback.setBoardCurtain('p1', 'hide');
        feedback.hideVerticalCombatBars();
        feedback.updateKeyTags('placement', this.currentGameMode);
        feedback.updateStandingPawnIcons(this.p1GridMatrix, gameState.p1.lastPawnCell, this.p2GridMatrix, gameState.p2.lastPawnCell);
        feedback.highlightValidPawnMoves(this.p1GridMatrix, gameState.p1.lastPawnCell);
        feedback.highlightValidPawnMoves(this.p2GridMatrix, gameState.p2.lastPawnCell);
        feedback.updateRoundUI(gameState.roundNumber, 'placement');

        if (this.currentGameMode === 'vs-ai') {
          gameState.p2.pawnCell = chooseBotPawnPosition(CONTROLS.p2.keyList, this.p2BoardButtons, gameState.p2.lastPawnCell);
          feedback.setBoardCurtain('p2', 'green', 'EN POSICION', 'face');
        } else {
          feedback.setBoardCurtain('p2', 'hide');
        }

        this.iniciarTemporizador(3, () => {
          feedback.clearMoveHighlights();
          this.asegurarSeleccionPeones();
          this.cambiarFase(PHASES.PHASE_DICE_ROLL);
        });
        break;

      case PHASES.PHASE_DICE_ROLL:
        feedback.hideBigCountdown();
        feedback.hideVerticalCombatBars();
        feedback.setBoardCurtain('both', 'hide');
        feedback.removeStandingPawnIcons();
        feedback.updateRoundUI(gameState.roundNumber, 'placement');

        this.ejecutarTiradaDadosOverlay(() => {
          this.cambiarFase(PHASES.PHASE_2_ATTACK);
        });
        break;

      case PHASES.PHASE_2_ATTACK:
        feedback.setBoardCurtain('both', 'hide');
        feedback.showVerticalCombatBars();
        feedback.removeStandingPawnIcons();
        feedback.updateKeyTags('attack', this.currentGameMode);
        feedback.clearDiceOverlays();
        feedback.updateRoundUI(gameState.roundNumber, 'attack');

        if (this.currentGameMode === 'vs-ai') {
          const target = chooseBotAttackTarget(gameState.p2.attackType.id, CONTROLS.p2.keyList, this.p1BoardButtons);
          gameState.p2.attackAnchor = { row: target.row, col: target.col };
          gameState.p2.targetedCells = target.targetedCells;
          feedback.updateAttackHighlights(this.p1GridMatrix, gameState.p2.targetedCells);
        } else {
          this.preconfigurarAtaquesAutomaticos();
        }

        this.iniciarTemporizador(3, () => {
          this.asegurarSeleccionAtaques();
          this.cambiarFase(PHASES.RESOLUTION);
        });
        break;

      case PHASES.RESOLUTION:
        feedback.hideBigCountdown();
        feedback.setBoardCurtain('both', 'hide');
        feedback.removeStandingPawnIcons();
        feedback.updateKeyTags('placement');
        feedback.updateRoundUI(gameState.roundNumber, 'attack');
        this.ejecutarResolucionCombate();
        break;

      case PHASES.GAME_OVER:
        feedback.hideBigCountdown();
        break;
    }
  }

  // Temporizador visual y sonoro
  iniciarTemporizador(segundos, onComplete) {
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
  ejecutarTiradaDadosOverlay(onFinished) {
    const p1RollOverlay = feedback.p1RollOverlay;
    const p2RollOverlay = feedback.p2RollOverlay;
    const p1RollDiceImg = feedback.p1RollDiceImg;
    const p2RollDiceImg = feedback.p2RollDiceImg;
    const p1RollShapeImg = feedback.p1RollShapeImg;
    const p2RollShapeImg = feedback.p2RollShapeImg;

    if (!p1RollOverlay || !p2RollOverlay) return;

    p1RollOverlay.className = 'board-roll-overlay active-center';
    p2RollOverlay.className = 'board-roll-overlay active-center';

    p1RollDiceImg.style.display = 'block';
    p2RollDiceImg.style.display = 'block';
    p1RollShapeImg.style.display = 'none';
    p2RollShapeImg.style.display = 'none';

    p1RollDiceImg.classList.remove('shape-reveal-anim');
    p2RollDiceImg.classList.remove('shape-reveal-anim');
    p1RollShapeImg.classList.remove('shape-reveal-anim');
    p2RollShapeImg.classList.remove('shape-reveal-anim');

    p1RollDiceImg.classList.add('rolling-anim');
    p2RollDiceImg.classList.add('rolling-anim');

    let ticks = 0;
    const p1CentralDiceImg = document.getElementById('p1-central-dice-img');
    const p2CentralDiceImg = document.getElementById('p2-central-dice-img');
    const p1CentralShapeImg = document.getElementById('p1-central-shape-img');
    const p2CentralShapeImg = document.getElementById('p2-central-shape-img');

    const rollTimer = setInterval(() => {
      const temp1 = Math.floor(Math.random() * 6) + 1;
      const temp2 = Math.floor(Math.random() * 6) + 1;

      const spr1 = getDiceSprite(temp1);
      const spr2 = getDiceSprite(temp2);

      p1RollDiceImg.src = spr1;
      p2RollDiceImg.src = spr2;

      if (p1CentralDiceImg) p1CentralDiceImg.src = spr1;
      if (p2CentralDiceImg) p2CentralDiceImg.src = spr2;

      soundManager.playDiceRollTick(ticks);

      ticks++;
      if (ticks >= 8) {
        clearInterval(rollTimer);
        p1RollDiceImg.classList.remove('rolling-anim');
        p2RollDiceImg.classList.remove('rolling-anim');

        const p1Faces = gameState.p1.character?.diceFaces || [1, 1, 1, 4, 4, 6];
        const p2Faces = gameState.p2.character?.diceFaces || [1, 1, 1, 4, 4, 6];

        const final1 = p1Faces[Math.floor(Math.random() * p1Faces.length)];
        const final2 = p2Faces[Math.floor(Math.random() * p2Faces.length)];

        gameState.p1.diceRoll = final1;
        gameState.p2.diceRoll = final2;

        const finalSpr1 = getDiceSprite(final1);
        const finalSpr2 = getDiceSprite(final2);

        p1RollDiceImg.src = finalSpr1;
        p2RollDiceImg.src = finalSpr2;

        if (p1CentralDiceImg) p1CentralDiceImg.src = finalSpr1;
        if (p2CentralDiceImg) p2CentralDiceImg.src = finalSpr2;

        gameState.p1.attackType = getAttackTypeForRoll(final1);
        gameState.p2.attackType = getAttackTypeForRoll(final2);

        p1RollShapeImg.src = gameState.p1.attackType.sprite;
        p2RollShapeImg.src = gameState.p2.attackType.sprite;

        if (p1CentralShapeImg) p1CentralShapeImg.src = gameState.p1.attackType.sprite;
        if (p2CentralShapeImg) p2CentralShapeImg.src = gameState.p2.attackType.sprite;

        // 1. El dado obtenido se queda en pantalla 800ms para apreciarlo
        setTimeout(() => {
          // Ocultar dado y revelar la figura/patrón de ataque
          p1RollDiceImg.style.display = 'none';
          p2RollDiceImg.style.display = 'none';

          p1RollShapeImg.style.display = 'block';
          p2RollShapeImg.style.display = 'block';

          void p1RollShapeImg.offsetWidth;
          void p2RollShapeImg.offsetWidth;

          p1RollShapeImg.classList.add('shape-reveal-anim');
          p2RollShapeImg.classList.add('shape-reveal-anim');

          // 2. El patrón de ataque se muestra 900ms y luego se oculta el overlay para mostrar el tablero y emergen las barritas
          setTimeout(() => {
            feedback.clearDiceOverlays();
            feedback.showVerticalCombatBars();
            if (onFinished) onFinished();
          }, 900);
        }, 800);
      }
    }, 90);
  }

  preconfigurarAtaquesAutomaticos() {
    gameState.p1.attackAnchor = { row: 0, col: 0 };
    gameState.p1.targetedCells = calculateAttackArea(gameState.p1.attackType.id, 0, 0);
    feedback.updateAttackHighlights(this.p2GridMatrix, gameState.p1.targetedCells);

    gameState.p2.attackAnchor = { row: 0, col: 0 };
    gameState.p2.targetedCells = calculateAttackArea(gameState.p2.attackType.id, 0, 0);
    feedback.updateAttackHighlights(this.p1GridMatrix, gameState.p2.targetedCells);
  }

  asegurarSeleccionPeones() {
    if (!gameState.p1.pawnCell) {
      const lastRow = gameState.p1.lastPawnCell?.row ?? 1;
      const lastCol = gameState.p1.lastPawnCell?.col ?? 1;
      gameState.p1.pawnCell = this.p1GridMatrix[lastRow][lastCol];
      feedback.setBoardCurtain('p1', 'green', 'EN POSICION', 'face');
    }
    if (!gameState.p2.pawnCell) {
      if (this.currentGameMode === 'vs-ai') {
        gameState.p2.pawnCell = chooseBotPawnPosition(CONTROLS.p2.keyList, this.p2BoardButtons, gameState.p2.lastPawnCell);
      } else {
        const lastRow = gameState.p2.lastPawnCell?.row ?? 1;
        const lastCol = gameState.p2.lastPawnCell?.col ?? 1;
        gameState.p2.pawnCell = this.p2GridMatrix[lastRow][lastCol];
      }
      feedback.setBoardCurtain('p2', 'green', 'EN POSICION', 'face');
    }
  }

  asegurarSeleccionAtaques() {
    if (!gameState.p1.attackAnchor) {
      const target = chooseBotAttackTarget(gameState.p1.attackType.id, CONTROLS.p1.keyList, this.p1BoardButtons);
      gameState.p1.attackAnchor = { row: target.row, col: target.col };
      gameState.p1.targetedCells = target.targetedCells;
      feedback.updateAttackHighlights(this.p2GridMatrix, gameState.p1.targetedCells);
    }
    if (!gameState.p2.attackAnchor) {
      const target = chooseBotAttackTarget(gameState.p2.attackType.id, CONTROLS.p2.keyList, this.p2BoardButtons);
      gameState.p2.attackAnchor = { row: target.row, col: target.col };
      gameState.p2.targetedCells = target.targetedCells;
      feedback.updateAttackHighlights(this.p1GridMatrix, gameState.p2.targetedCells);
    }
  }

  // ================= RESOLUCIÓN DEL COMBATE =================
  ejecutarResolucionCombate() {
    // 1. Calcular estados dinámicos (hit, fail, dodge, empty)
    const p1States = evaluateCellStates(gameState.p2.targetedCells, gameState.p1.pawnCell);
    const p2States = evaluateCellStates(gameState.p1.targetedCells, gameState.p2.pawnCell);

    feedback.applyCellStates(this.p1GridMatrix, p1States);
    feedback.applyCellStates(this.p2GridMatrix, p2States);

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
        let baseHit = 33;
        let p2Damage = 10;
        p1Delta += baseHit;
        p2Delta -= p2Damage;
        feedback.triggerHurtAnimation('p2');
        feedback.showReactionBadge('p2', `¡DAÑO! -${p2Damage}`, 'show-hit');
        soundManager.playHitSound();
      } else {
        // Fallo resta 3 de tensión
        p1Delta -= 3;
        feedback.showReactionBadge('p2', '¡ESQUIVADO!', 'show-dodge');
      }

      // Ataque de P2 -> P1
      if (p2HitsP1) {
        let baseHit = 33;
        let p1Damage = 10;
        p2Delta += baseHit;
        p1Delta -= p1Damage;
        feedback.triggerHurtAnimation('p1');
        feedback.showReactionBadge('p1', `¡DAÑO! -${p1Damage}`, 'show-hit');
        soundManager.playHitSound();
      } else {
        // Fallo resta 3 de tensión
        p2Delta -= 3;
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
          this.finalizarPartida();
        } else {
          this.iniciarCicloRonda();
        }
      }, 2000);
    }, 500);
  }

  finalizarPartida() {
    gameState.setPhase(PHASES.GAME_OVER);
    soundManager.playGameOverSound();
    screens.mountGameOverScreen(gameState.p1.prestige, gameState.p2.prestige);

    const btnRestartGame = document.getElementById('btn-restart-game');
    const btnMenuGame = document.getElementById('btn-menu-game');

    if (btnRestartGame) {
      btnRestartGame.addEventListener('click', () => {
        soundManager.startBackgroundMusic();
        this.iniciarPartidaDinamica('vs-ai');
      });
    }

    if (btnMenuGame) {
      btnMenuGame.addEventListener('click', () => {
        soundManager.playMenuMusic();
        screens.showScreen('start');
      });
    }
  }

  reiniciarPartidaCompleta() {
    gameState.resetMatch();
    feedback.updatePrestigeUI('both', 0, { silent: true });
    feedback.updateRoundUI(gameState.roundNumber);
    feedback.updateAssaultChargesUI('both');
    this.iniciarCicloRonda();
  }

  iniciarCicloRonda() {
    gameState.resetRound();
    feedback.updateRoundUI(gameState.roundNumber);
    soundManager.playRoundMusic(gameState.roundNumber);
    feedback.clearDiceOverlays();
    feedback.clearBoardEffects();
    this.cambiarFase(PHASES.WARNING_PLACEMENT);
  }
}

export const gameController = new GameController();
