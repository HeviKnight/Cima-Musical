// ===================================================
// CONTROLADOR DE PARTIDA Y CICLO DE JUEGO (GAME CONTROLLER)
// ===================================================

import { PHASES, KILL_TENSION, gameState, getHpForDiceRoll, getPawnEmoji, getPawnSprite, getUnitTypeForDiceRoll, getUnitTemplate, getStrongestUnit, getWeakestUnit } from './state.js';
import { calculateAttackArea, evaluateCellStates } from './grid.js';
import { chooseBotPawnPosition, chooseBotAttackTarget, decideBotAction } from './ai.js';
import { CONTROLS } from '../data/controls.js';
import { getDiceSprite } from '../data/patterns.js';
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
    this.p1ActionReady = false;
    this.p2ActionReady = false;
    this.currentGameMode = 'vs-ai';

    this.lastAbilityKeyTimes = {
      p1: { key: null, time: 0 },
      p2: { key: null, time: 0 }
    };
    this.lastAbilityActivationTimes = { p1: 0, p2: 0 };

    // Estado de Ronda 0: Colocación de 1 Titán (6 HP) por jugador
    this.round0State = {
      p1: { titan: null, placed: false },
      p2: { titan: null, placed: false }
    };
  }

  iniciarPartidaDinamica(mode, p1Char = null, p2Char = null) {
    this.currentGameMode = mode;

    if (p1Char) {
      gameState.p1.character = p1Char;
      gameState.p1.maxAbilityCharges = p1Char.activeAbility?.maxCharges || 1;
      gameState.p1.activeAbilityCharges = p1Char.activeAbility?.initialCharges ?? 0;
    }
    if (p2Char) {
      gameState.p2.character = p2Char;
      gameState.p2.maxAbilityCharges = p2Char.activeAbility?.maxCharges || 1;
      gameState.p2.activeAbilityCharges = p2Char.activeAbility?.initialCharges ?? 0;
    }

    // 1. Montar pantalla de juego en el DOM
    screens.mountGameScreen();

    // 2. Inicializar feedback y referencias de UI
    feedback.init();

    // Listeners interactivos para barras de Listo de Jugador 1 y Jugador 2
    const p1ReadyBar = document.getElementById('p1-ready-bar');
    if (p1ReadyBar) {
      p1ReadyBar.addEventListener('click', () => {
        this.handleReadyInput('p1');
      });
    }
    const p2ReadyBar = document.getElementById('p2-ready-bar');
    if (p2ReadyBar) {
      p2ReadyBar.addEventListener('click', () => {
        if (this.currentGameMode !== 'vs-ai') {
          this.handleReadyInput('p2');
        }
      });
    }

    if (feedback.p1Curtain) {
      feedback.p1Curtain.addEventListener('click', (e) => {
        if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
          this.confirmarJugadorListo('p1');
        } else if (gameState.currentPhase === PHASES.PHASE_ACTION_SELECT) {
          const opt = e.target.closest('.curtain-action-opt');
          if (opt) {
            const action = opt.getAttribute('data-action');
            // En fase de selección con rotación, la cortinilla sobre el tablero P1 corresponde a P2 (o P1 según corresponda)
            const targetPlayer = opt.closest('#p2-curtain') ? 'p1' : (opt.closest('#p1-curtain') && this.currentGameMode !== 'vs-ai' ? 'p2' : 'p1');
            if (action) this.seleccionarAccionCombate(targetPlayer, action);
          }
        }
      });
    }
    if (feedback.p2Curtain) {
      feedback.p2Curtain.addEventListener('click', (e) => {
        if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
          if (this.currentGameMode !== 'vs-ai') {
            this.confirmarJugadorListo('p2');
          }
        } else if (gameState.currentPhase === PHASES.PHASE_ACTION_SELECT) {
          const opt = e.target.closest('.curtain-action-opt');
          if (opt) {
            const action = opt.getAttribute('data-action');
            // La cortinilla en el tablero contrario (p2) corresponde a la selección de acción de P1
            const targetPlayer = opt.closest('#p2-curtain') ? 'p1' : 'p2';
            if (action) this.seleccionarAccionCombate(targetPlayer, action);
          }
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
        } else if (gameState.currentPhase !== PHASES.PHASE_ACTION_SELECT) {
          if (player === 'p1' || this.currentGameMode !== 'vs-ai') {
            this.handleInput(player, key, row, col);
          }
        }
      });
    });



    // 4. Animación de introducción
    feedback.playGridIntroAnimation(() => {
      this.reiniciarPartidaCompleta();
    });
  }

  confirmarJugadorListo(player) {
    this.setJugadorListo(player, true);
  }

  // ================= ENTRADA DE JUGADORES =================
  handleInput(player, key, rowOverride = null, colOverride = null) {
    if (this.currentGameMode === 'vs-ai' && player === 'p2') return;

    // FASE PREPARACIÓN
    if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
      if ((player === 'p1' && key === 's') || (player === 'p2' && key === 'k')) {
        this.confirmarJugadorListo(player);
      }
      return;
    }

    // FASE RONDA 0: Colocar el Titán (6 HP)
    if (gameState.currentPhase === PHASES.ROUND_0_PLACEMENT) {
      const pR0 = this.round0State[player];
      if (!pR0 || pR0.placed) return;

      let row = rowOverride;
      let col = colOverride;
      if (row === null || col === null) {
        const btnMap = player === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
        const cellInfo = btnMap.get(key);
        if (!cellInfo) return;
        row = cellInfo.row;
        col = cellInfo.col;
      }

      pR0.titan.row = row;
      pR0.titan.col = col;
      pR0.placed = true;
      gameState[player].pawns = [pR0.titan];

      feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
      soundManager.playPawnPlaceSound();
      feedback.updateRoundDrawer('TITÁN COLOCADO [MARCA LISTO]', 'placement');
    }

    // FASE 1: Colocar unidad o mejorar unidad si el tablero está lleno
    else if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
      const pState = gameState[player];
      if (!pState.pendingPawn) return;

      let row = rowOverride;
      let col = colOverride;
      if (row === null || col === null) {
        const btnMap = player === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
        const cellInfo = btnMap.get(key);
        if (!cellInfo) return;
        row = cellInfo.row;
        col = cellInfo.col;
      }

      const livingPawns = pState.pawns.filter(p => p && p.hp > 0);
      const isBoardFull = livingPawns.length >= 9;
      const existingAtCell = livingPawns.find(p => p.row === row && p.col === col);

      if (isBoardFull) {
        // Tablero lleno: Mejora la unidad seleccionada
        if (existingAtCell) {
          pState.pendingPawn.targetUpgradeId = existingAtCell.id;
          pState.pendingPawn.row = row;
          pState.pendingPawn.col = col;
          feedback.showReactionBadge(player, `⭐ MEJORA: +${pState.pendingPawn.hp} HP AL PEÓN`, 'show-dodge');
          soundManager.playPawnPlaceSound();
        }
      } else {
        // Tablero no lleno: Colocar en casilla libre
        if (existingAtCell) {
          soundManager.playMissBothSound();
          return;
        }

        pState.pendingPawn.row = row;
        pState.pendingPawn.col = col;

        const activeP1 = [...gameState.p1.pawns];
        if (gameState.p1.pendingPawn && gameState.p1.pendingPawn.row !== null) {
          activeP1.push(gameState.p1.pendingPawn);
        }
        const activeP2 = [...gameState.p2.pawns];
        if (gameState.p2.pendingPawn && gameState.p2.pendingPawn.row !== null) {
          activeP2.push(gameState.p2.pendingPawn);
        }

        feedback.renderPawns(this.p1GridMatrix, activeP1, this.p2GridMatrix, activeP2, this.currentGameMode);
        soundManager.playPawnPlaceSound();
      }
    }

    // FASE DE SELECCIÓN DE ACCIÓN (Ataque vs Habilidad)
    else if (gameState.currentPhase === PHASES.PHASE_ACTION_SELECT) {
      if (player === 'p1') {
        if (key === 'a') {
          this.seleccionarAccionCombate('p1', 'attack');
          return;
        }
        if (key === 'd') {
          this.seleccionarAccionCombate('p1', 'ability');
          return;
        }
      } else if (player === 'p2') {
        if (key === 'j') {
          this.seleccionarAccionCombate('p2', 'attack');
          return;
        }
        if (key === 'l') {
          this.seleccionarAccionCombate('p2', 'ability');
          return;
        }
      }
    }

    // FASE 2: Período de Ataque (Apuntado en tablero y disparo)
    else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
      let row = rowOverride;
      let col = colOverride;
      if (row === null || col === null) {
        const btnMap = player === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
        const cellInfo = btnMap.get(key);
        if (!cellInfo) return;
        row = cellInfo.row;
        col = cellInfo.col;
      }

      const pState = gameState[player];

      // Si está en modo habilidad y es RoboHand: la celda objetivo es el enemigo a mover
      if (pState.selectedAction === 'ability' && (pState.character?.id === 'el_brazo' || pState.character?.id === 'robohand')) {
        pState.abilityTarget = { row, col };
        const targetMatrix = player === 'p1' ? this.p2GridMatrix : this.p1GridMatrix;
        feedback.updateAttackHighlights(targetMatrix, [{ row, col }]);
        soundManager.playPawnPlaceSound();
        feedback.showReactionBadge(player, '🎯 OBJETIVO DE AGARRE FIJADO', 'show-hit');
        return;
      }

      // En fase de ataque, las teclas y clics son exclusivamente para apuntar la retícula
      pState.attackTarget = { row, col };
      pState.targetedCells = calculateAttackArea(row, col);

      const targetMatrix = player === 'p1' ? this.p2GridMatrix : this.p1GridMatrix;
      feedback.updateAttackHighlights(targetMatrix, pState.targetedCells);
      soundManager.playPawnPlaceSound();
    }
  }

  // ================= SELECCIÓN DE ACCIÓN (A/D o J/L) =================
  mostrarOverlaySeleccionAccion(player) {
    const pState = gameState[player];
    if (!pState || !pState.character) return;

    const isP1 = player === 'p1';
    const normalKey = isP1 ? 'A' : 'J';
    const abilityKey = isP1 ? 'D' : 'L';
    const char = pState.character;
    const abilityName = char.activeAbility?.name || 'Habilidad';
    const maxCharges = pState.maxAbilityCharges || char.activeAbility?.maxCharges || 1;
    const charges = pState.activeAbilityCharges ?? 0;
    const canUseAbility = charges >= 1;

    const isAttackSelected = pState.selectedAction === 'attack';
    const isAbilitySelected = pState.selectedAction === 'ability';

    const customKeyHTML = `
      <div class="curtain-action-choices" id="${player}-action-choices">
        <div class="curtain-action-opt ${isAttackSelected ? 'action-selected' : ''}" data-action="attack" title="Ataque básico normal">
          <div class="action-opt-key">${normalKey}</div>
          <div class="action-opt-label">ATAQUE</div>
          <div class="action-opt-sub">1 Casilla (1 Daño)</div>
        </div>
        <div class="curtain-action-opt ${isAbilitySelected ? 'action-selected' : ''} ${!canUseAbility ? 'action-disabled' : ''}" data-action="ability" title="${abilityName}">
          <div class="action-opt-key">${abilityKey}</div>
          <div class="action-opt-label">${abilityName.toUpperCase()}</div>
          <div class="action-opt-sub">⚡ ${charges}/${maxCharges} (1 CARGA)</div>
        </div>
      </div>
    `;

    // En Fase de selección los tableros están rotados 180°:
    // Para P1 (izquierda), su área de interacción está en el tablero P2.
    // Para P2 (derecha), su área de interacción está en el tablero P1.
    const targetCurtain = isP1 ? 'p2' : 'p1';
    feedback.setBoardCurtain(targetCurtain, 'black', 'ELIGE TU ACCIÓN', 'face', '', customKeyHTML);
  }

  seleccionarAccionCombate(player, actionType) {
    if (gameState.currentPhase !== PHASES.PHASE_ACTION_SELECT) return;
    const pState = gameState[player];
    if (!pState || !pState.character) return;

    const char = pState.character;
    const targetCurtain = player === 'p1' ? 'p2' : 'p1';

    if (actionType === 'attack') {
      pState.selectedAction = 'attack';
      pState.isCyborgBoosted = false;
      this.setJugadorListo(player, true);
      return;
    }

    if (actionType === 'ability') {
      if ((pState.activeAbilityCharges ?? 0) < 1) {
        feedback.showReactionBadge(player, `⚡ REQUIERE 1 CARGA (${pState.activeAbilityCharges ?? 0} disp.)`, 'show-hit');
        soundManager.playMissBothSound();
        this.mostrarOverlaySeleccionAccion(player);
        return;
      }

      pState.selectedAction = 'ability';
      this.setJugadorListo(player, true);
    }
  }

  verificarAmbosListosParaCombate() {
    this.verificarAmbosListosParaAvanzar();
  }

  iniciarRondaDeAtaque() {
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      const char = pState.character;
      const enemyKey = playerKey === 'p1' ? 'p2' : 'p1';
      const enemyBoard = playerKey === 'p1' ? this.p2BoardButtons : this.p1BoardButtons;
      const enemyMatrix = playerKey === 'p1' ? this.p2GridMatrix : this.p1GridMatrix;

      if (pState.selectedAction === 'attack') {
        if (!pState.attackTarget) {
          if (playerKey === 'p1') {
            // Predeterminado en el centro (1, 1), sin disparar al azar
            pState.attackTarget = { row: 1, col: 1 };
            pState.targetedCells = calculateAttackArea(1, 1);
          } else {
            const target = chooseBotAttackTarget(enemyBoard, gameState[enemyKey].pawns);
            pState.attackTarget = { row: target.row, col: target.col };
            pState.targetedCells = target.targetedCells;
          }
        }
        feedback.updateAttackHighlights(enemyMatrix, pState.targetedCells);
        feedback.showReactionBadge(playerKey, '⚔️ ATAQUE PREPARADO', 'show-dodge');
      } else if (pState.selectedAction === 'ability') {
        if (char.id === 'cyborg') {
          pState.isCyborgBoosted = true;
          const extraDamage = Math.floor((pState.prestige || 0) / 20);
          const totalDamage = 1 + extraDamage;
          feedback.showAbilityActivation(playerKey, `⚡ FINISHER ARMADO: ${totalDamage} DAÑO`);
          if (!pState.attackTarget) {
            if (playerKey === 'p1') {
              pState.attackTarget = { row: 1, col: 1 };
              pState.targetedCells = calculateAttackArea(1, 1);
            } else {
              const target = chooseBotAttackTarget(enemyBoard, gameState[enemyKey].pawns);
              pState.attackTarget = { row: target.row, col: target.col };
              pState.targetedCells = target.targetedCells;
            }
          }
          feedback.updateAttackHighlights(enemyMatrix, pState.targetedCells);
        } else if (char.id === 'incinerador') {
          feedback.showAbilityActivation(playerKey, '🔥 HORNO: CONSUMIR TODA LA CHATARRA');
          pState.attackTarget = null;
          pState.targetedCells = [];
        } else if (char.id === 'dron_enjambre') {
          feedback.showAbilityActivation(playerKey, '🐝 SACRIFICIO DE DRONES PREPARADO');
          pState.attackTarget = null;
          pState.targetedCells = [];
        } else if (char.id === 'el_brazo') {
          feedback.showAbilityActivation(playerKey, '🤖 ELIGE ENEMIGO PARA REUBICAR');
          if (!pState.abilityTarget) {
            const livingEnemies = gameState[enemyKey].pawns.filter(p => p && p.hp > 0);
            if (livingEnemies.length > 0) {
              const targetP = livingEnemies[0];
              pState.abilityTarget = { row: targetP.row, col: targetP.col };
              feedback.updateAttackHighlights(enemyMatrix, [{ row: targetP.row, col: targetP.col }]);
            }
          }
        } else if (char.id === 'taladro') {
          feedback.showAbilityActivation(playerKey, '⛏️ FALLA TECTÓNICA: 1 DAÑO A TODOS');
          pState.attackTarget = null;
          pState.targetedCells = [];
        } else if (char.id === 'holo') {
          feedback.showAbilityActivation(playerKey, '🌀 CONVERTIR ESCUDOS EN +1/+1');
          pState.attackTarget = null;
          pState.targetedCells = [];
        }
      }
    });

    feedback.updateRoundDrawer(`RONDA DE ATAQUE LISTA [MARCA LISTO]`, 'attack');
  }

  // ================= ACTIVAR O DESACTIVAR HABILIDAD =================
  toggleActiveAbility(player) {
    if (gameState.currentPhase !== PHASES.PHASE_2_ATTACK) return;
    const pState = gameState[player];
    if (!pState || !pState.character) return;

    if (pState.selectedAction === 'ability') {
      this.seleccionarAccionCombate(player, 'attack');
    } else {
      this.seleccionarAccionCombate(player, 'ability');
    }
  }

  // ================= CONTROL DEL CICLO DE FASES =================
  cambiarFase(nuevaFase) {
    gameState.setPhase(nuevaFase);

    switch (nuevaFase) {
      case PHASES.WARNING_PLACEMENT:
        this.p1Ready = false;
        this.p2Ready = (this.currentGameMode === 'vs-ai');
        feedback.hideBigCountdown();
        feedback.updateKeyTags('placement', this.currentGameMode);
        feedback.removeStandingPawnIcons();
        feedback.setBoardCurtain('p1', 'black', 'TIRAR DADO', 'face');

        if (this.currentGameMode === 'vs-ai') {
          feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
        } else {
          feedback.setBoardCurtain('p2', 'black', 'TIRAR DADO', 'face');
        }
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);
        feedback.updateRoundUI(gameState.roundNumber, 'placement');
        feedback.updateRoundDrawer('TIRAR DADO: [ESPACIO] P1 / [ENTER] P2', 'placement');
        break;

      case PHASES.ROUND_0_PLACEMENT: {
        this.p1Ready = false;
        this.p2Ready = (this.currentGameMode === 'vs-ai');
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);
        feedback.hideBigCountdown();
        feedback.setBoardCurtain('both', 'hide');
        feedback.updateKeyTags('placement', this.currentGameMode);
        feedback.updateRoundUI(0, 'placement');

        // Generar 1 Titán con las estadísticas específicas de su sintético
        const createTitan = (playerKey) => {
          const tpl = getUnitTemplate(gameState[playerKey]?.character?.id, 'titan');
          return {
            id: `${playerKey}_titan_${Date.now()}`,
            playerKey,
            ...tpl,
            diceRoll: 6,
            shield: 0,
            row: null,
            col: null
          };
        };

        this.round0State.p1 = { titan: createTitan('p1'), placed: false };
        this.round0State.p2 = { titan: createTitan('p2'), placed: false };

        const p1Titan = this.round0State.p1.titan;
        feedback.updateRoundDrawer(`COLOCAR TITÁN 👑 (${p1Titan.atk}/${p1Titan.hp})`, 'placement');
        feedback.highlightFreeCells(this.p1GridMatrix, []);

        if (this.currentGameMode === 'vs-ai') {
          // El Bot coloca su Titán automáticamente
          const freeCell = chooseBotPawnPosition(CONTROLS.p2.keyList, this.p2BoardButtons, []);
          this.round0State.p2.titan.row = freeCell.row;
          this.round0State.p2.titan.col = freeCell.col;
          this.round0State.p2.placed = true;
          gameState.p2.pawns = [this.round0State.p2.titan];
        } else {
          feedback.highlightFreeCells(this.p2GridMatrix, []);
        }

        feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
        break;
      }

      case PHASES.PHASE_DICE_ROLL:
        this.p1Ready = false;
        this.p2Ready = false;
        feedback.updateReadyCheckboxes(false, false, this.currentGameMode, true);
        feedback.hideBigCountdown();
        feedback.setBoardCurtain('both', 'hide');
        feedback.updateRoundUI(gameState.roundNumber, 'placement');
        feedback.updateRoundDrawer('LANZANDO DADOS...', 'placement');

        this.ejecutarTiradaDadosOverlay(() => {
          this.cambiarFase(PHASES.PHASE_1_PLACEMENT);
        });
        break;

      case PHASES.PHASE_1_PLACEMENT: {
        this.p1Ready = false;
        this.p2Ready = (this.currentGameMode === 'vs-ai');
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);
        feedback.setBoardCurtain('both', 'hide');
        feedback.updateKeyTags('placement', this.currentGameMode);
        feedback.updateRoundUI(gameState.roundNumber, 'placement');

        const p1Pending = gameState.p1.pendingPawn;
        const p1Pawns = gameState.p1.pawns.filter(p => p && p.hp > 0);

        if (p1Pending) {
          const emoji = getPawnEmoji(p1Pending.hp);
          if (p1Pawns.length >= 9) {
            feedback.updateRoundDrawer(`TABLERO LLENO: SELECCIONA UNIDAD (+${p1Pending.hp} HP)`, 'placement');
          } else {
            feedback.updateRoundDrawer(`COLOCAR ${emoji} (${p1Pending.hp} HP)`, 'placement');
          }
          feedback.highlightFreeCells(this.p1GridMatrix, p1Pawns);
        } else {
          feedback.updateRoundDrawer('HABILIDAD TITÁN ACTIVADA', 'placement');
        }

        if (this.currentGameMode === 'vs-ai') {
          if (gameState.p2.pendingPawn) {
            const botPos = chooseBotPawnPosition(CONTROLS.p2.keyList, this.p2BoardButtons, gameState.p2.pawns);
            if (botPos.isUpgrade) {
              const target = gameState.p2.pawns.find(p => p && p.row === botPos.row && p.col === botPos.col && p.hp > 0);
              if (target) {
                gameState.p2.pendingPawn.targetUpgradeId = target.id;
                gameState.p2.pendingPawn.row = botPos.row;
                gameState.p2.pendingPawn.col = botPos.col;
              }
            } else {
              gameState.p2.pendingPawn.row = botPos.row;
              gameState.p2.pendingPawn.col = botPos.col;
            }
          }
        } else {
          const p2Pending = gameState.p2.pendingPawn;
          const p2Pawns = gameState.p2.pawns.filter(p => p && p.hp > 0);
          if (p2Pending) {
            feedback.highlightFreeCells(this.p2GridMatrix, p2Pawns);
          }
        }

        const activeP1 = [...gameState.p1.pawns];
        if (gameState.p1.pendingPawn && gameState.p1.pendingPawn.row !== null && !gameState.p1.pendingPawn.targetUpgradeId) {
          activeP1.push(gameState.p1.pendingPawn);
        }
        const activeP2 = [...gameState.p2.pawns];
        if (gameState.p2.pendingPawn && gameState.p2.pendingPawn.row !== null && !gameState.p2.pendingPawn.targetUpgradeId) {
          activeP2.push(gameState.p2.pendingPawn);
        }
        feedback.renderPawns(this.p1GridMatrix, activeP1, this.p2GridMatrix, activeP2, this.currentGameMode);
        break;
      }

      case PHASES.PHASE_ACTION_SELECT:
        this.p1Ready = false;
        this.p2Ready = (this.currentGameMode === 'vs-ai');
        this.p1ActionReady = false;
        this.p2ActionReady = (this.currentGameMode === 'vs-ai');
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);

        feedback.updateKeyTags('attack', this.currentGameMode);
        feedback.clearDiceOverlays();
        feedback.updateRoundUI(gameState.roundNumber, 'attack');
        feedback.updateRoundDrawer('ELIGE ACCIÓN: [A] ATACAR O [D] HABILIDAD', 'attack');

        // Resetear selección de acción por defecto a 'attack'
        gameState.p1.selectedAction = 'attack';
        gameState.p2.selectedAction = 'attack';
        feedback.updateAbilitySelectionUI('both', false);

        // Mostrar overlay de selección de acción en el tablero para P1
        this.mostrarOverlaySeleccionAccion('p1');

        if (this.currentGameMode === 'vs-ai') {
          // IA decide si usar habilidad o disparar
          const botDecision = decideBotAction('p2');
          if (botDecision.useAbility) {
            gameState.p2.selectedAction = 'ability';
            if (botDecision.target) {
              gameState.p2.abilityTarget = botDecision.target;
            }
          } else {
            gameState.p2.selectedAction = 'attack';
            const target = chooseBotAttackTarget(this.p1BoardButtons, gameState.p1.pawns);
            gameState.p2.attackTarget = { row: target.row, col: target.col };
            gameState.p2.targetedCells = target.targetedCells;
          }
          // El Bot queda listo inmediatamente con cortinilla verde en su lado correspondiente (p1)
          this.p2ActionReady = true;
          this.p2Ready = true;
          feedback.setBoardCurtain('p1', 'green', '¡LISTO!', 'face');
          feedback.setPlayerReadyCheckbox('p2', true, this.currentGameMode);
        } else {
          this.mostrarOverlaySeleccionAccion('p2');
          this.preconfigurarAtaquesAutomaticos();
        }
        break;

      case PHASES.PHASE_2_ATTACK:
        this.p1Ready = false;
        this.p2Ready = (this.currentGameMode === 'vs-ai');
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);
        feedback.updateKeyTags('attack', this.currentGameMode);
        feedback.updateRoundUI(gameState.roundNumber, 'attack');
        feedback.setBoardCurtain('both', 'hide');
        this.iniciarRondaDeAtaque();
        break;

      case PHASES.RESOLUTION:
        this.p1Ready = false;
        this.p2Ready = false;
        feedback.updateReadyCheckboxes(false, false, this.currentGameMode, true);
        feedback.hideBigCountdown();
        feedback.setBoardCurtain('both', 'hide');
        feedback.updateKeyTags('placement');
        feedback.updateRoundUI(gameState.roundNumber, 'attack');
        feedback.updateRoundDrawer('RESOLUCIÓN', 'attack');
        this.ejecutarResolucionCombate();
        break;

      case PHASES.GAME_OVER:
        feedback.hideBigCountdown();
        feedback.updateReadyCheckboxes(false, false, this.currentGameMode, true);
        break;
    }
  }

  // ================= CONTROL DE LISTO Y AVANCE DE FASES =================
  handleReadyInput(player) {
    if (gameState.currentPhase === PHASES.RESOLUTION ||
        gameState.currentPhase === PHASES.PHASE_DICE_ROLL ||
        gameState.currentPhase === PHASES.GAME_OVER) {
      return;
    }

    if (this.currentGameMode === 'vs-ai' && player === 'p2') {
      return;
    }

    const currentState = player === 'p1' ? this.p1Ready : this.p2Ready;
    this.setJugadorListo(player, !currentState);
  }

  setJugadorListo(player, isReady) {
    if (player === 'p1') {
      this.p1Ready = isReady;
    } else {
      this.p2Ready = isReady;
    }

    if (gameState.currentPhase === PHASES.WARNING_PLACEMENT) {
      if (isReady) {
        feedback.setBoardCurtain(player, 'green', '¡LISTO!', 'face');
      } else {
        feedback.setBoardCurtain(player, 'black', 'TIRAR DADO', 'face');
      }
    } else if (gameState.currentPhase === PHASES.PHASE_ACTION_SELECT) {
      const targetCurtain = player === 'p1' ? 'p2' : 'p1';
      this[player + 'ActionReady'] = isReady;
      if (isReady) {
        feedback.setBoardCurtain(targetCurtain, 'green', '¡LISTO!', 'face');
      } else {
        this.mostrarOverlaySeleccionAccion(player);
      }
    }

    feedback.setPlayerReadyCheckbox(player, isReady, this.currentGameMode);

    if (isReady) {
      soundManager.playPawnPlaceSound();
    }

    if (this.p1Ready && this.p2Ready) {
      this.verificarAmbosListosParaAvanzar();
    }
  }

  verificarAmbosListosParaAvanzar() {
    if (!this.p1Ready || !this.p2Ready) return;

    setTimeout(() => {
      if (!this.p1Ready || !this.p2Ready) return;

      switch (gameState.currentPhase) {
        case PHASES.WARNING_PLACEMENT:
          if (gameState.roundNumber === 0) {
            this.cambiarFase(PHASES.ROUND_0_PLACEMENT);
          } else {
            this.cambiarFase(PHASES.PHASE_DICE_ROLL);
          }
          break;

        case PHASES.ROUND_0_PLACEMENT:
          this.finalizarRonda0();
          break;

        case PHASES.PHASE_1_PLACEMENT:
          feedback.clearPawnHighlights();
          this.asegurarSeleccionPeones();
          feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
          soundManager.playPawnPlaceSound();

          // Rotar tablero 180º intercambiando de posición los tableros
          feedback.rotateBoards(true);

          setTimeout(() => {
            this.cambiarFase(PHASES.PHASE_ACTION_SELECT);
          }, 850);
          break;

        case PHASES.PHASE_ACTION_SELECT:
          feedback.setBoardCurtain('both', 'hide');
          this.cambiarFase(PHASES.PHASE_2_ATTACK);
          break;

        case PHASES.PHASE_2_ATTACK:
          this.asegurarSeleccionAcciones();
          soundManager.playPawnPlaceSound();
          this.cambiarFase(PHASES.RESOLUTION);
          break;

        default:
          break;
      }
    }, 250);
  }

  // Avanzar manualmente (alias retrocompatible)
  avanzarPorEspacio() {
    this.handleReadyInput('p1');
  }

  // Tirada animada de dados d6
  ejecutarTiradaDadosOverlay(onFinished) {
    const p1RollOverlay = feedback.p1RollOverlay;
    const p2RollOverlay = feedback.p2RollOverlay;
    const p1RollDiceImg = feedback.p1RollDiceImg;
    const p2RollDiceImg = feedback.p2RollDiceImg;
    const p1PawnBox = feedback.p1RollPawnBox;
    const p2PawnBox = feedback.p2RollPawnBox;
    const p1PawnImg = feedback.p1RollPawnImg;
    const p2PawnImg = feedback.p2RollPawnImg;
    const p1PawnHpText = feedback.p1RollPawnHpText;
    const p2PawnHpText = feedback.p2RollPawnHpText;

    if (!p1RollOverlay || !p2RollOverlay) return;

    p1RollOverlay.className = 'board-roll-overlay active-center';
    p2RollOverlay.className = 'board-roll-overlay active-center';

    if (p1RollDiceImg) p1RollDiceImg.style.display = 'block';
    if (p2RollDiceImg) p2RollDiceImg.style.display = 'block';
    if (p1PawnBox) p1PawnBox.style.display = 'none';
    if (p2PawnBox) p2PawnBox.style.display = 'none';

    if (p1RollDiceImg) p1RollDiceImg.classList.add('rolling-anim');
    if (p2RollDiceImg) p2RollDiceImg.classList.add('rolling-anim');

    let ticks = 0;

    const rollTimer = setInterval(() => {
      const temp1 = Math.floor(Math.random() * 6) + 1;
      const temp2 = Math.floor(Math.random() * 6) + 1;

      const spr1 = getDiceSprite(temp1);
      const spr2 = getDiceSprite(temp2);

      if (p1RollDiceImg) p1RollDiceImg.src = spr1;
      if (p2RollDiceImg) p2RollDiceImg.src = spr2;

      soundManager.playDiceRollTick(ticks);

      ticks++;
      if (ticks >= 8) {
        clearInterval(rollTimer);
        if (p1RollDiceImg) p1RollDiceImg.classList.remove('rolling-anim');
        if (p2RollDiceImg) p2RollDiceImg.classList.remove('rolling-anim');

        // Determinación del dado para P1 y P2
        let rawRoll1 = Math.floor(Math.random() * 6) + 1;
        let rawRoll2 = Math.floor(Math.random() * 6) + 1;

        // Trait Swarm: en Ronda 1 siempre sale 1
        if (gameState.p1.character?.id === 'dron_enjambre' && gameState.roundNumber === 1) {
          rawRoll1 = 1;
        }
        if (gameState.p2.character?.id === 'dron_enjambre' && gameState.roundNumber === 1) {
          rawRoll2 = 1;
        }

        gameState.p1.diceRoll = rawRoll1;
        gameState.p2.diceRoll = rawRoll2;

        const processRoll = (playerKey, rawRoll) => {
          const p = gameState[playerKey];
          const hasTitanAlive = p.pawns.some(unit => unit && unit.isTitan && unit.hp > 0);

          if (rawRoll === 6) {
            let usedBoost = false;
            if (hasTitanAlive) {
              usedBoost = this.activarHabilidadTitan(playerKey);
            }

            if (!usedBoost) {
              // Regla PDF: "en caso de no ser posible, añade +1/+1 a la unidad más fuerte"
              const strongest = getStrongestUnit(p.pawns);
              if (strongest) {
                strongest.atk = (strongest.atk || 0) + 1;
                strongest.hp += 1;
                strongest.maxHp += 1;
                feedback.showReactionBadge(playerKey, '👑 +1/+1 A UNIDAD MÁS FUERTE', 'show-dodge');
                p.pendingPawn = null;
                return { isTitanBoost: true, hp: 0, pendingPawn: null, playerKey };
              } else {
                // Si no hay unidades para potenciar: invoca pequeña
                const tpl = getUnitTemplate(p.character?.id, 'pequena');
                p.pendingPawn = {
                  id: `${playerKey}_${Date.now()}_${Math.random()}`,
                  playerKey,
                  ...tpl,
                  diceRoll: 6,
                  shield: 0,
                  row: null,
                  col: null
                };
                return { isTitanBoost: false, hp: tpl.hp, pendingPawn: p.pendingPawn, playerKey };
              }
            } else {
              p.pendingPawn = null;
              return { isTitanBoost: true, hp: 0, pendingPawn: null, playerKey };
            }
          } else {
            const unitType = getUnitTypeForDiceRoll(rawRoll);
            const tpl = getUnitTemplate(p.character?.id, unitType);
            p.pendingPawn = {
              id: `${playerKey}_${Date.now()}_${Math.random()}`,
              playerKey,
              ...tpl,
              diceRoll: rawRoll,
              shield: 0,
              row: null,
              col: null
            };
            return { isTitanBoost: false, hp: tpl.hp, pendingPawn: p.pendingPawn, playerKey };
          }
        };

        const res1 = processRoll('p1', rawRoll1);
        const res2 = processRoll('p2', rawRoll2);

        if (p1RollDiceImg) p1RollDiceImg.src = getDiceSprite(rawRoll1);
        if (p2RollDiceImg) p2RollDiceImg.src = getDiceSprite(rawRoll2);

        if (res1.isTitanBoost) {
          if (p1PawnHpText) p1PawnHpText.textContent = '👑 HABILIDAD TITÁN';
          if (p1PawnImg) p1PawnImg.src = getPawnSprite('titan', 'p1');
        } else {
          if (p1PawnImg) p1PawnImg.src = getPawnSprite(res1.pendingPawn || res1.hp, 'p1');
          if (p1PawnHpText) p1PawnHpText.textContent = `${res1.pendingPawn?.name || 'Unidad'} (${res1.pendingPawn?.atk ?? 0}/${res1.pendingPawn?.hp ?? res1.hp})`;
        }

        if (res2.isTitanBoost) {
          if (p2PawnHpText) p2PawnHpText.textContent = '👑 HABILIDAD TITÁN';
          if (p2PawnImg) p2PawnImg.src = getPawnSprite('titan', 'p2');
        } else {
          if (p2PawnImg) p2PawnImg.src = getPawnSprite(res2.pendingPawn || res2.hp, 'p2');
          if (p2PawnHpText) p2PawnHpText.textContent = `${res2.pendingPawn?.name || 'Unidad'} (${res2.pendingPawn?.atk ?? 0}/${res2.pendingPawn?.hp ?? res2.hp})`;
        }

        setTimeout(() => {
          if (p1RollDiceImg) p1RollDiceImg.style.display = 'none';
          if (p2RollDiceImg) p2RollDiceImg.style.display = 'none';

          if (p1PawnBox) {
            p1PawnBox.style.display = 'flex';
            p1PawnBox.classList.add('shape-reveal-anim');
          }
          if (p2PawnBox) {
            p2PawnBox.style.display = 'flex';
            p2PawnBox.classList.add('shape-reveal-anim');
          }

          setTimeout(() => {
            feedback.clearDiceOverlays();
            if (onFinished) onFinished();
          }, 950);
        }, 700);
      }
    }, 90);
  }

  // Ejecuta el boost de Habilidad del Titán (sacar un 6 con Titán vivo)
  activarHabilidadTitan(playerKey) {
    const pState = gameState[playerKey];
    const char = pState.character;

    soundManager.playPawnPlaceSound();

    switch (char?.id) {
      case 'incinerador': {
        // Incinerador: consume hasta 2 chatarras (cada una suma al horno)
        const livingChatarras = pState.pawns.filter(p => !p.isTitan && p.unitType === 'pequena' && p.hp > 0);
        if (livingChatarras.length === 0) return false;
        const toConsume = livingChatarras.slice(0, 2);
        toConsume.forEach(c => {
          pState.pawns = pState.pawns.filter(p => p.id !== c.id);
          pState.hornoCount = (pState.hornoCount || 0) + 1;
        });

        feedback.showReactionBadge(playerKey, `🔥 TITÁN 6: ${toConsume.length} CHATARRAS AL HORNO`, 'show-dodge');

        // Comprobar si detona
        while (pState.hornoCount >= 3) {
          pState.hornoCount -= 3;
          this.detonarHorno(playerKey);
        }
        return true;
      }

      case 'dron_enjambre': {
        // Swarm: genera dos unidades pequeñas (1/1)
        const btnMap = playerKey === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
        const tpl = getUnitTemplate('dron_enjambre', 'pequena');
        for (let i = 0; i < 2; i++) {
          const freeCell = chooseBotPawnPosition([], btnMap, pState.pawns);
          if (freeCell) {
            if (freeCell.isUpgrade) {
              const target = pState.pawns.find(p => p.row === freeCell.row && p.col === freeCell.col);
              if (target) {
                target.hp += tpl.hp;
                target.maxHp += tpl.hp;
                target.atk = (target.atk || 0) + tpl.atk;
              }
            } else {
              pState.pawns.push({
                id: `${playerKey}_dron_${Date.now()}_${i}`,
                playerKey,
                ...tpl,
                shield: 0,
                row: freeCell.row,
                col: freeCell.col
              });
            }
          }
        }
        feedback.showReactionBadge(playerKey, '🐝 TITÁN 6: +2 DRONES GENERADOS', 'show-dodge');
        return true;
      }

      case 'cyborg': {
        // Cyborg: ganas 5 de tensión
        gameState.addPrestige(playerKey, 5);
        feedback.updatePrestigeUI(playerKey, pState.prestige);
        feedback.showReactionBadge(playerKey, '⚡ TITÁN 6: +5 DE TENSIÓN', 'show-dodge');
        const titan = pState.pawns.find(p => p && p.isTitan && p.hp > 0);
        if (titan) {
          feedback.spawnSquareTensionParticles(titan, playerKey, 5);
        }
        return true;
      }

      case 'el_brazo': {
        // RoboHand: intercambia la posición con otra unidad y les otorga a ambos 1 de ataque extra
        const titan = pState.pawns.find(p => p.isTitan && p.hp > 0);
        const otherAllies = pState.pawns.filter(p => !p.isTitan && p.hp > 0);
        if (titan && otherAllies.length > 0) {
          const ally = otherAllies[Math.floor(Math.random() * otherAllies.length)];
          const tempR = titan.row;
          const tempC = titan.col;
          titan.row = ally.row;
          titan.col = ally.col;
          ally.row = tempR;
          ally.col = tempC;
          titan.atk = (titan.atk || 0) + 1;
          ally.atk = (ally.atk || 0) + 1;
          feedback.showReactionBadge(playerKey, '🤖 TITÁN 6: ENROQUE Y +1 ATAQUE A AMBOS', 'show-dodge');
          return true;
        }
        return false;
      }

      case 'taladro': {
        // Taladro: cura completamente a la unidad con menos vida
        const weakest = getWeakestUnit(pState.pawns);
        if (weakest && weakest.hp < weakest.maxHp) {
          weakest.hp = weakest.maxHp;
          feedback.showReactionBadge(playerKey, `⛏️ TITÁN 6: CURA COMPLETA A ${weakest.name || 'ALIADO'}`, 'show-dodge');
          return true;
        }
        return false;
      }

      case 'holo': {
        // Holo: su daño se iguala a su vida
        const titan = pState.pawns.find(p => p.isTitan && p.hp > 0);
        if (titan) titan.atk = titan.hp;
        return false; // Al devolver false, ejecuta "+1/+1 a la unidad más fuerte"
      }

      default:
        return false;
    }
  }

  // Detonación del Horno (Incinerador): 1 de daño a todas las unidades enemigas
  detonarHorno(attackerKey) {
    const enemyKey = attackerKey === 'p1' ? 'p2' : 'p1';
    const enemyPawns = gameState[enemyKey].pawns;

    feedback.showAbilityActivation(attackerKey, '💥 ¡HORNO DETONA! 1 DAÑO AoE');
    soundManager.playHitSound();

    let deadTension = 0;
    enemyPawns.forEach(pawn => {
      if (pawn && pawn.hp > 0) {
        if (pawn.shield > 0) {
          pawn.shield -= 1;
        } else {
          pawn.hp -= 1;
        }
        if (pawn.hp <= 0) {
          const killTension = pawn.isTitan ? KILL_TENSION.TITAN : (pawn.unitType === 'mediana' ? KILL_TENSION.MEDIANA : KILL_TENSION.PEQUENA);
          deadTension += killTension;
          feedback.spawnSquareTensionParticles(pawn, attackerKey, killTension);
        }
      }
    });

    if (deadTension > 0) {
      gameState.addPrestige(attackerKey, deadTension);
      feedback.updatePrestigeUI(attackerKey, gameState[attackerKey].prestige);
      feedback.showReactionBadge(attackerKey, `🔥 HORNO KILLS: +${deadTension} TENSIÓN`, 'show-hit');
    }

    gameState[enemyKey].pawns = gameState[enemyKey].pawns.filter(p => p.hp > 0);
  }

  preconfigurarAtaquesAutomaticos() {
    gameState.p1.attackTarget = { row: 0, col: 0 };
    gameState.p1.targetedCells = calculateAttackArea(0, 0);
    feedback.updateAttackHighlights(this.p2GridMatrix, gameState.p1.targetedCells);

    gameState.p2.attackTarget = { row: 0, col: 0 };
    gameState.p2.targetedCells = calculateAttackArea(0, 0);
    feedback.updateAttackHighlights(this.p1GridMatrix, gameState.p2.targetedCells);
  }

  asegurarSeleccionPeones() {
    ['p1', 'p2'].forEach(pKey => {
      const pState = gameState[pKey];
      const pending = pState.pendingPawn;
      if (!pending) return;

      const living = pState.pawns.filter(p => p && p.hp > 0);
      const isFull = living.length >= 9;
      const btnMap = pKey === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;

      if (pending.targetUpgradeId) {
        const target = pState.pawns.find(p => p.id === pending.targetUpgradeId);
        if (target) {
          target.hp += pending.hp;
          target.maxHp += pending.hp;
          target.atk = (target.atk || 0) + (pending.atk || 0);
        }
      } else if (pending.row === null) {
        const pos = chooseBotPawnPosition([], btnMap, pState.pawns);
        if (pos.isUpgrade) {
          const target = pState.pawns.find(p => p.row === pos.row && p.col === pos.col);
          if (target) {
            target.hp += pending.hp;
            target.maxHp += pending.hp;
            target.atk = (target.atk || 0) + (pending.atk || 0);
          }
        } else {
          pending.row = pos.row;
          pending.col = pos.col;
          pState.pawns.push({ ...pending });
        }
      } else {
        if (isFull) {
          const target = pState.pawns.find(p => p.row === pending.row && p.col === pending.col);
          if (target) {
            target.hp += pending.hp;
            target.maxHp += pending.hp;
            target.atk = (target.atk || 0) + (pending.atk || 0);
          }
        } else {
          pState.pawns.push({ ...pending });
        }
      }

      pState.pendingPawn = null;
    });
  }

  asegurarSeleccionAcciones() {
    ['p1', 'p2'].forEach(pKey => {
      const pState = gameState[pKey];
      const enemyKey = pKey === 'p1' ? 'p2' : 'p1';
      const enemyBoard = pKey === 'p1' ? this.p2BoardButtons : this.p1BoardButtons;
      const enemyMatrix = pKey === 'p1' ? this.p2GridMatrix : this.p1GridMatrix;

      if (pState.selectedAction === 'attack' && !pState.attackTarget) {
        if (pKey === 'p1') {
          pState.attackTarget = { row: 1, col: 1 };
          pState.targetedCells = calculateAttackArea(1, 1);
        } else {
          const target = chooseBotAttackTarget(enemyBoard, gameState[enemyKey].pawns);
          pState.attackTarget = { row: target.row, col: target.col };
          pState.targetedCells = target.targetedCells;
        }
        feedback.updateAttackHighlights(enemyMatrix, pState.targetedCells);
      }
    });
  }

  // ================= RESOLUCIÓN DEL COMBATE =================
  ejecutarResolucionCombate() {
    // -------------------------------------------------------------
    // PASO 1: HABILIDADES ACTIVAS QUE SE EJECUTAN ANTES DEL ATAQUE
    // -------------------------------------------------------------

    // RoboHand Activa: Mueve 1 unidad enemiga y le hace 1 daño (o 2 si no se puede mover)
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && (pState.character?.id === 'el_brazo' || pState.character?.id === 'robohand')) {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        const enemyKey = playerKey === 'p1' ? 'p2' : 'p1';
        const enemyState = gameState[enemyKey];
        const targetCell = pState.abilityTarget || { row: 1, col: 1 };
        const targetPawn = enemyState.pawns.find(p => p && p.row === targetCell.row && p.col === targetCell.col && p.hp > 0);

        if (targetPawn) {
          const enemyLiving = enemyState.pawns.filter(p => p && p.hp > 0);
          const occupied = new Set(enemyLiving.map(p => `${p.row},${p.col}`));
          const freeSpots = [];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              if (!occupied.has(`${r},${c}`)) freeSpots.push({ r, c });
            }
          }

          if (freeSpots.length > 0) {
            const spot = freeSpots[Math.floor(Math.random() * freeSpots.length)];
            targetPawn.row = spot.r;
            targetPawn.col = spot.c;
            targetPawn.hp -= 1;
            feedback.showReactionBadge(playerKey, '🤖 REUBICACIÓN Y 1 DAÑO', 'show-hit');
          } else {
            targetPawn.hp -= 2;
            feedback.showReactionBadge(playerKey, '🤖 SIN ESPACIO: ¡2 DE DAÑO!', 'show-hit');
          }

          // RoboHand Medio: "Cada ronda que se mueve una unidad enemiga, gana 1 de ataque"
          pState.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
            m.atk = (m.atk || 0) + 1;
          });

          if (targetPawn.hp <= 0) {
            const killPrestige = targetPawn.isTitan ? KILL_TENSION.TITAN : (targetPawn.unitType === 'mediana' ? KILL_TENSION.MEDIANA : KILL_TENSION.PEQUENA);
            gameState.addPrestige(playerKey, killPrestige);
            feedback.spawnSquareTensionParticles(targetPawn, playerKey, killPrestige);
          }
        } else {
          feedback.showReactionBadge(playerKey, '🤖 AGARRE AL VACÍO', 'show-dodge');
        }
      }
    });

    // Taladro Activa: Hace 1 de daño a todas las unidades de ambos tableros
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'taladro') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        feedback.showReactionBadge(playerKey, '⛏️ FALLA TECTÓNICA: 1 DAÑO A AMBOS TABLEROS', 'show-hit');

        ['p1', 'p2'].forEach(sideKey => {
          const sidePawns = gameState[sideKey].pawns;
          sidePawns.forEach(p => {
            if (p && p.hp > 0) {
              if (p.shield > 0) {
                p.shield -= 1;
              } else {
                p.hp -= 1;
                // Taladro Pasiva: "Cuando un aliado recibe daño, gana 1 de ataque extra"
                if (gameState[sideKey].character?.id === 'taladro' && p.hp > 0) {
                  p.atk = (p.atk || 0) + 1;
                }
              }

              if (p.hp <= 0) {
                if (sideKey !== playerKey) {
                  const killT = p.isTitan ? KILL_TENSION.TITAN : (p.unitType === 'mediana' ? KILL_TENSION.MEDIANA : KILL_TENSION.PEQUENA);
                  gameState.addPrestige(playerKey, killT);
                  feedback.spawnSquareTensionParticles(p, playerKey, killT);
                }
                // Taladro Medio al morir: otorga 1 de daño a un aliado aleatorio
                if (p.unitType === 'mediana' && gameState[sideKey].character?.id === 'taladro') {
                  const allies = gameState[sideKey].pawns.filter(a => a && a.hp > 0 && a.id !== p.id);
                  if (allies.length > 0) {
                    const chosen = allies[Math.floor(Math.random() * allies.length)];
                    chosen.atk = (chosen.atk || 0) + 1;
                  }
                }
                // Taladro Pequeño al morir: realiza 1 de daño en casilla homóloga
                if (p.unitType === 'pequena' && gameState[sideKey].character?.id === 'taladro') {
                  const oppKey = sideKey === 'p1' ? 'p2' : 'p1';
                  const oppPawn = gameState[oppKey].pawns.find(op => op && op.row === p.row && op.col === p.col && op.hp > 0);
                  if (oppPawn) {
                    if (oppPawn.shield > 0) oppPawn.shield -= 1;
                    else oppPawn.hp -= 1;
                  }
                }
              }
            }
          });
        });
      }
    });

    // Incinerador Activa: Consume TODA tu chatarra (cada una suma al horno)
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'incinerador') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        const chatarras = pState.pawns.filter(p => !p.isTitan && p.unitType === 'pequena');
        pState.pawns = pState.pawns.filter(p => p.isTitan || p.unitType !== 'pequena');
        pState.hornoCount = (pState.hornoCount || 0) + chatarras.length;
        feedback.showReactionBadge(playerKey, `🔥 CONSUMIDAS ${chatarras.length} CHATARRAS`, 'show-dodge');

        while (pState.hornoCount >= 3) {
          pState.hornoCount -= 3;
          this.detonarHorno(playerKey);
        }
      }
    });

    // Swarm Activa: Sacrifica todas tus unidades pequeñas
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'dron_enjambre') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        const drones = pState.pawns.filter(p => !p.isTitan && p.unitType === 'pequena');
        pState.pawns = pState.pawns.filter(p => p.isTitan || p.unitType !== 'pequena');

        const enemyKey = playerKey === 'p1' ? 'p2' : 'p1';
        let killedTension = 0;

        drones.forEach(() => {
          const enemyLiving = gameState[enemyKey].pawns.filter(p => p && p.hp > 0);
          if (enemyLiving.length > 0) {
            const target = enemyLiving[Math.floor(Math.random() * enemyLiving.length)];
            if (target.shield > 0) {
              target.shield -= 1;
            } else {
              target.hp -= 1;
            }
            if (target.hp <= 0) {
              const k = target.isTitan ? KILL_TENSION.TITAN : (target.unitType === 'mediana' ? KILL_TENSION.MEDIANA : KILL_TENSION.PEQUENA);
              killedTension += k;
              feedback.spawnSquareTensionParticles(target, playerKey, k);
            }
          }
        });

        if (killedTension > 0) {
          gameState.addPrestige(playerKey, killedTension);
          feedback.showReactionBadge(playerKey, `🐝 DRONES DETONADOS: +${killedTension} TENSIÓN`, 'show-hit');
        } else {
          feedback.showReactionBadge(playerKey, `🐝 SACRIFICADOS ${drones.length} DRONES`, 'show-dodge');
        }
      }
    });

    // Holo Activa: Convierte los escudos en +1/+1 de daño y vida
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'holo') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        let count = 0;
        pState.pawns.forEach(pawn => {
          if (pawn && pawn.hp > 0 && pawn.shield > 0) {
            pawn.shield = 0;
            pawn.atk = (pawn.atk || 0) + 1;
            pawn.hp += 1;
            pawn.maxHp += 1;
            count++;
          }
        });
        feedback.showReactionBadge(playerKey, `🌀 ${count} ESCUDOS CONVERTIDOS EN +1/+1`, 'show-dodge');
      }
    });

    // Holo Pasiva: Otorga escudo a una unidad aleatoria (o +1 atk si es Holo Pequeño)
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.character?.id === 'holo') {
        const living = pState.pawns.filter(p => p && p.hp > 0);
        if (living.length > 0) {
          const chosen = living[Math.floor(Math.random() * living.length)];
          if (chosen.unitType === 'pequena') {
            chosen.atk = (chosen.atk || 0) + 1;
            feedback.showReactionBadge(playerKey, '🌀 PEQUEÑO RECIBE +1 ATAQUE (EN VEZ DE ESCUDO)', 'show-dodge');
          } else {
            chosen.shield = (chosen.shield || 0) + 1;
            feedback.showReactionBadge(playerKey, '🌀 ESCUDO HOLOGRÁFICO', 'show-dodge');
          }
        }
      }
    });

    // Swarm Medio: "Cada ronda, añade 1 de daño a un dron adyacente"
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.character?.id === 'dron_enjambre') {
        const mediums = pState.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0);
        mediums.forEach(med => {
          const adjDrones = pState.pawns.filter(p =>
            p && p.hp > 0 && p.id !== med.id &&
            Math.abs(p.row - med.row) <= 1 && Math.abs(p.col - med.col) <= 1
          );
          if (adjDrones.length > 0) {
            const tgt = adjDrones[Math.floor(Math.random() * adjDrones.length)];
            tgt.atk = (tgt.atk || 0) + 1;
            feedback.showReactionBadge(playerKey, '🐝 NODRIZA: +1 ATAQUE A DRON ADYACENTE', 'show-dodge');
          }
        });
      }
    });

    // Cyborg Medio: "Cada ronda, otorga escudo a una unidad adyacente"
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.character?.id === 'cyborg') {
        const mediums = pState.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0);
        mediums.forEach(med => {
          const adjAllies = pState.pawns.filter(p =>
            p && p.hp > 0 && p.id !== med.id &&
            Math.abs(p.row - med.row) <= 1 && Math.abs(p.col - med.col) <= 1
          );
          if (adjAllies.length > 0) {
            const tgt = adjAllies[Math.floor(Math.random() * adjAllies.length)];
            tgt.shield = (tgt.shield || 0) + 1;
            feedback.showReactionBadge(playerKey, '🛡️ CENTINELA: ESCUDO ADYACENTE', 'show-dodge');
          }
        });
      }
    });

    // -------------------------------------------------------------
    // PASO 2: ATAQUES DIRECTOS DE CASILLAS
    // -------------------------------------------------------------
    const target1 = gameState.p1.attackTarget || { row: 0, col: 0 };
    const target2 = gameState.p2.attackTarget || { row: 0, col: 0 };

    const p1Attacking = gameState.p1.selectedAction === 'attack';
    const p2Attacking = gameState.p2.selectedAction === 'attack';

    let hitPawn2 = p1Attacking ? gameState.p2.pawns.find(p => p && p.row === target1.row && p.col === target1.col && p.hp > 0) : null;
    let hitPawn1 = p2Attacking ? gameState.p1.pawns.find(p => p && p.row === target2.row && p.col === target2.col && p.hp > 0) : null;

    const p1States = evaluateCellStates(p2Attacking ? [target2] : [], gameState.p1.pawns);
    const p2States = evaluateCellStates(p1Attacking ? [target1] : [], gameState.p2.pawns);

    feedback.applyCellStates(this.p1GridMatrix, p1States);
    feedback.applyCellStates(this.p2GridMatrix, p2States);

    if (p1Attacking || p2Attacking) {
      feedback.triggerAttackAnimations();
    }

    setTimeout(() => {
      feedback.clearAttackAnimations();

      let p1TensionDelta = 0;
      let p2TensionDelta = 0;

      // Calcular daño de P1
      if (p1Attacking) {
        let p1Damage = 1;
        if (gameState.p1.isCyborgBoosted) {
          p1Damage += Math.floor((gameState.p1.prestige || 0) / 20);
          gameState.p1.isCyborgBoosted = false;
          gameState.p1.activeAbilityCharges = Math.max(0, gameState.p1.activeAbilityCharges - 1);
          feedback.updateAbilityChargesUI('p1');
        }

        if (hitPawn2) {
          if (hitPawn2.shield > 0) {
            hitPawn2.shield -= 1;
            p1Damage -= 1;
            feedback.showReactionBadge('p2', '🛡️ ESCUDO ABSORBE DAÑO', 'show-dodge');
          }
          if (p1Damage > 0) {
            hitPawn2.hp -= p1Damage;
          }

          // Holo Medio: Cada vez que el enemigo recibe daño, esta unidad recibe un escudo
          if (gameState.p1.character?.id === 'holo') {
            gameState.p1.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
              m.shield = (m.shield || 0) + 1;
            });
          }

          // Taladro Pasiva: Cuando un aliado recibe daño, gana 1 de ataque extra
          if (gameState.p2.character?.id === 'taladro' && hitPawn2.hp > 0) {
            hitPawn2.atk = (hitPawn2.atk || 0) + 1;
            feedback.showReactionBadge('p2', '⛏️ RESILIENCIA: +1 ATAQUE TRAS DAÑO', 'show-dodge');
          }

          // RoboHand Pasiva: Los ataques mueven a las unidades hacia una casilla superior, si no hay superior, la manda abajo del todo
          if (gameState.p1.character?.id === 'el_brazo' && hitPawn2.hp > 0) {
            const nextRow = (hitPawn2.row - 1 + 3) % 3;
            const occupant = gameState.p2.pawns.find(p => p && p.row === nextRow && p.col === hitPawn2.col && p.hp > 0);
            if (occupant) {
              const oldR = hitPawn2.row;
              hitPawn2.row = nextRow;
              occupant.row = oldR;
            } else {
              hitPawn2.row = nextRow;
            }
            feedback.showReactionBadge('p1', '🤖 IMPULSO VERTICAL (EMPUJE)', 'show-dodge');
            gameState.p1.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
              m.atk = (m.atk || 0) + 1;
            });
          }

          const isDestroyed = hitPawn2.hp <= 0;
          feedback.animatePawnHit(this.p2GridMatrix, hitPawn2.row, hitPawn2.col, isDestroyed, hitPawn2, 'p2');

          if (isDestroyed) {
            const killTension = hitPawn2.isTitan ? KILL_TENSION.TITAN : (hitPawn2.unitType === 'mediana' ? KILL_TENSION.MEDIANA : KILL_TENSION.PEQUENA);
            p1TensionDelta += killTension;
            feedback.showReactionBadge('p1', `💥 ¡ELIMINADO! (+${killTension})`, 'show-hit');
            hitPawn2.playerKey = 'p2';
            feedback.spawnSquareTensionParticles(hitPawn2, 'p1', killTension);

            // Swarm pasiva al morir dron
            if (gameState.p2.character?.id === 'dron_enjambre' && !hitPawn2.isTitan) {
              const p1Living = gameState.p1.pawns.filter(p => p && p.hp > 0);
              if (p1Living.length > 0) {
                const randP1 = p1Living[Math.floor(Math.random() * p1Living.length)];
                randP1.hp -= 1;
                feedback.showReactionBadge('p2', '🐝 DRON EXPLOSIÓN (-1 HP)', 'show-hit');
              }
            }

            // Incinerador Medio al morir: mejora 1hp a una chatarra
            if (gameState.p2.character?.id === 'incinerador' && hitPawn2.unitType === 'mediana') {
              const chatarras = gameState.p2.pawns.filter(p => p && p.unitType === 'pequena' && p.hp > 0);
              if (chatarras.length > 0) {
                const c = chatarras[0];
                c.hp += 1;
                c.maxHp += 1;
                feedback.showReactionBadge('p2', '🔥 MEJORA +1 HP A CHATARRA', 'show-dodge');
              }
            }

            // Taladro Medio al morir: otorga 1 de daño a una unidad aliada aleatoria
            if (gameState.p2.character?.id === 'taladro' && hitPawn2.unitType === 'mediana') {
              const allies = gameState.p2.pawns.filter(p => p && p.hp > 0 && p.id !== hitPawn2.id);
              if (allies.length > 0) {
                const a = allies[Math.floor(Math.random() * allies.length)];
                a.atk = (a.atk || 0) + 1;
                feedback.showReactionBadge('p2', '⛏️ +1 ATAQUE A ALIADO', 'show-dodge');
              }
            }

            // Taladro Pequeño al morir: realiza 1 de daño en su casilla homóloga
            if (gameState.p2.character?.id === 'taladro' && hitPawn2.unitType === 'pequena') {
              const opp = gameState.p1.pawns.find(p => p && p.row === hitPawn2.row && p.col === hitPawn2.col && p.hp > 0);
              if (opp) {
                if (opp.shield > 0) opp.shield -= 1;
                else opp.hp -= 1;
                feedback.showReactionBadge('p2', '⛏️ DAÑO EN CASILLA HOMÓLOGA', 'show-hit');
              }
            }
          } else {
            feedback.showReactionBadge('p1', `⚡ ¡IMPACTO! (-${p1Damage} HP)`, 'show-hit');
          }
          feedback.triggerHurtAnimation('p2');
          soundManager.playHitSound();
        } else {
          feedback.showReactionBadge('p1', '💧 ¡FALLO! (AGUA)', 'show-dodge');
        }
      }

      // Calcular daño de P2
      if (p2Attacking) {
        let p2Damage = 1;
        if (gameState.p2.isCyborgBoosted) {
          p2Damage += Math.floor((gameState.p2.prestige || 0) / 20);
          gameState.p2.isCyborgBoosted = false;
          gameState.p2.activeAbilityCharges = Math.max(0, gameState.p2.activeAbilityCharges - 1);
          feedback.updateAbilityChargesUI('p2');
        }

        if (hitPawn1) {
          if (hitPawn1.shield > 0) {
            hitPawn1.shield -= 1;
            p2Damage -= 1;
            feedback.showReactionBadge('p1', '🛡️ ESCUDO ABSORBE DAÑO', 'show-dodge');
          }
          if (p2Damage > 0) {
            hitPawn1.hp -= p2Damage;
          }

          if (gameState.p2.character?.id === 'holo') {
            gameState.p2.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
              m.shield = (m.shield || 0) + 1;
            });
          }

          if (gameState.p1.character?.id === 'taladro' && hitPawn1.hp > 0) {
            hitPawn1.atk = (hitPawn1.atk || 0) + 1;
            feedback.showReactionBadge('p1', '⛏️ RESILIENCIA: +1 ATAQUE TRAS DAÑO', 'show-dodge');
          }

          if (gameState.p2.character?.id === 'el_brazo' && hitPawn1.hp > 0) {
            const nextRow = (hitPawn1.row - 1 + 3) % 3;
            const occupant = gameState.p1.pawns.find(p => p && p.row === nextRow && p.col === hitPawn1.col && p.hp > 0);
            if (occupant) {
              const oldR = hitPawn1.row;
              hitPawn1.row = nextRow;
              occupant.row = oldR;
            } else {
              hitPawn1.row = nextRow;
            }
            feedback.showReactionBadge('p2', '🤖 IMPULSO VERTICAL (EMPUJE)', 'show-dodge');
            gameState.p2.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
              m.atk = (m.atk || 0) + 1;
            });
          }

          const isDestroyed = hitPawn1.hp <= 0;
          feedback.animatePawnHit(this.p1GridMatrix, hitPawn1.row, hitPawn1.col, isDestroyed, hitPawn1, 'p1');

          if (isDestroyed) {
            const killTension = hitPawn1.isTitan ? KILL_TENSION.TITAN : (hitPawn1.unitType === 'mediana' ? KILL_TENSION.MEDIANA : KILL_TENSION.PEQUENA);
            p2TensionDelta += killTension;
            feedback.showReactionBadge('p2', `💥 ¡ELIMINADO! (+${killTension})`, 'show-hit');
            hitPawn1.playerKey = 'p1';
            feedback.spawnSquareTensionParticles(hitPawn1, 'p2', killTension);

            if (gameState.p1.character?.id === 'dron_enjambre' && !hitPawn1.isTitan) {
              const p2Living = gameState.p2.pawns.filter(p => p && p.hp > 0);
              if (p2Living.length > 0) {
                const randP2 = p2Living[Math.floor(Math.random() * p2Living.length)];
                randP2.hp -= 1;
                feedback.showReactionBadge('p1', '🐝 DRON EXPLOSIÓN (-1 HP)', 'show-hit');
              }
            }

            if (gameState.p1.character?.id === 'incinerador' && hitPawn1.unitType === 'mediana') {
              const chatarras = gameState.p1.pawns.filter(p => p && p.unitType === 'pequena' && p.hp > 0);
              if (chatarras.length > 0) {
                const c = chatarras[0];
                c.hp += 1;
                c.maxHp += 1;
                feedback.showReactionBadge('p1', '🔥 MEJORA +1 HP A CHATARRA', 'show-dodge');
              }
            }

            if (gameState.p1.character?.id === 'taladro' && hitPawn1.unitType === 'mediana') {
              const allies = gameState.p1.pawns.filter(p => p && p.hp > 0 && p.id !== hitPawn1.id);
              if (allies.length > 0) {
                const a = allies[Math.floor(Math.random() * allies.length)];
                a.atk = (a.atk || 0) + 1;
                feedback.showReactionBadge('p1', '⛏️ +1 ATAQUE A ALIADO', 'show-dodge');
              }
            }

            if (gameState.p1.character?.id === 'taladro' && hitPawn1.unitType === 'pequena') {
              const opp = gameState.p2.pawns.find(p => p && p.row === hitPawn1.row && p.col === hitPawn1.col && p.hp > 0);
              if (opp) {
                if (opp.shield > 0) opp.shield -= 1;
                else opp.hp -= 1;
                feedback.showReactionBadge('p1', '⛏️ DAÑO EN CASILLA HOMÓLOGA', 'show-hit');
              }
            }
          } else {
            feedback.showReactionBadge('p2', `⚡ ¡IMPACTO! (-${p2Damage} HP)`, 'show-hit');
          }
          feedback.triggerHurtAnimation('p1');
          soundManager.playHitSound();
        } else {
          feedback.showReactionBadge('p2', '💧 ¡FALLO! (AGUA)', 'show-dodge');
        }
      }

      // -------------------------------------------------------------
      // PASO 3: TENSIÓN POR DAÑO AL FINAL DE LA RONDA & PARTÍCULAS
      // -------------------------------------------------------------
      // Regla PDF: "Cada unidad tiene estadísticas (daño/vida), el daño genera ese número de tensión al final de la ronda"
      const unitTensionDelays = { p1: 0, p2: 0 };
      ['p1', 'p2'].forEach(playerKey => {
        const pState = gameState[playerKey];
        pState.pawns.filter(p => p && p.hp > 0).forEach(unit => {
          if (unit.atk && unit.atk > 0) {
            if (playerKey === 'p1') p1TensionDelta += unit.atk;
            else p2TensionDelta += unit.atk;
            const delayForUnit = unitTensionDelays[playerKey] * 420;
            feedback.spawnSquareTensionParticles(unit, playerKey, unit.atk, null, delayForUnit);
            unitTensionDelays[playerKey]++;
          }
        });
      });

      // Cyborg Pasiva: +1 de tensión por aliado vivo (máx +3)
      ['p1', 'p2'].forEach(playerKey => {
        const pState = gameState[playerKey];
        if (pState.character?.id === 'cyborg') {
          const livingAllies = pState.pawns.filter(p => p && p.hp > 0);
          const gain = Math.min(3, livingAllies.length);
          if (gain > 0) {
            if (playerKey === 'p1') p1TensionDelta += gain;
            else p2TensionDelta += gain;
            feedback.showReactionBadge(playerKey, `⚡ BATERÍA HUMANA: +${gain} TENSIÓN`, 'show-dodge');
            const baseDelay = unitTensionDelays[playerKey] * 420;
            livingAllies.slice(0, gain).forEach((ally, idx) => {
              feedback.spawnSquareTensionParticles(ally, playerKey, 1, null, baseDelay + idx * 280);
            });
            unitTensionDelays[playerKey] += gain;
          }
        }
      });

      // Incinerador Pasiva: Al final del turno genera 1 chatarra (0/1) si hay espacio
      ['p1', 'p2'].forEach(playerKey => {
        const pState = gameState[playerKey];
        if (pState.character?.id === 'incinerador') {
          const btnMap = playerKey === 'p1' ? this.p1BoardButtons : this.p2BoardButtons;
          const living = pState.pawns.filter(p => p && p.hp > 0);
          if (living.length < 9) {
            const freeSpot = chooseBotPawnPosition([], btnMap, pState.pawns);
            if (freeSpot && !freeSpot.isUpgrade) {
              const tpl = getUnitTemplate('incinerador', 'pequena');
              pState.pawns.push({
                id: `${playerKey}_chatarra_${Date.now()}`,
                playerKey,
                ...tpl,
                shield: 0,
                row: freeSpot.row,
                col: freeSpot.col
              });
              feedback.showReactionBadge(playerKey, '⚙️ CHATARRERÍA (+1 CHATARRA)', 'show-dodge');
            }
          }
        }
      });

      // Holo Titán: su daño se iguala a su vida
      ['p1', 'p2'].forEach(playerKey => {
        const pState = gameState[playerKey];
        if (pState.character?.id === 'holo') {
          const titan = pState.pawns.find(p => p && p.isTitan && p.hp > 0);
          if (titan) titan.atk = titan.hp;
        }
      });

      // Aplicar tensión acumulada
      gameState.addPrestige('p1', p1TensionDelta);
      gameState.addPrestige('p2', p2TensionDelta);
      feedback.updatePrestigeUI('p1', gameState.p1.prestige);
      feedback.updatePrestigeUI('p2', gameState.p2.prestige);

      // Eliminar unidades con 0 HP
      gameState.p1.pawns = gameState.p1.pawns.filter(p => p && p.hp > 0);
      gameState.p2.pawns = gameState.p2.pawns.filter(p => p && p.hp > 0);

      // Limpiar escudos caducados
      gameState.p1.pawns.forEach(p => p.shield = 0);
      gameState.p2.pawns.forEach(p => p.shield = 0);

      if (hitPawn1 || hitPawn2) {
        feedback.shakeScreen();
      }

      setTimeout(() => {
        feedback.clearHurtAnimations();
        feedback.hideReactionBadges();
        feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);

        // Condición de victoria: 100 de tensión
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
        soundManager.playPawnPlaceSound();
        soundManager.startBackgroundMusic();
        const currentMode = this.currentGameMode || 'vs-ai';
        const p1Char = gameState.p1?.character;
        const p2Char = gameState.p2?.character;
        this.iniciarPartidaDinamica(currentMode, p1Char, p2Char);
      });
    }

    if (btnMenuGame) {
      btnMenuGame.addEventListener('click', () => {
        soundManager.playPawnPlaceSound();
        soundManager.playMenuMusic();
        screens.showScreen('start');
      });
    }
  }

  reiniciarPartidaCompleta() {
    gameState.resetMatch();
    feedback.updatePrestigeUI('both', 0, { silent: true });
    feedback.updateAbilityChargesUI('both');
    this.iniciarRonda0();
  }

  iniciarRonda0() {
    gameState.roundNumber = 0;
    feedback.resetBoardsRotation();
    feedback.updateRoundUI(0, 'placement');
    soundManager.playRoundMusic(1);
    feedback.clearDiceOverlays();
    feedback.clearBoardEffects();
    feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);

    this.cambiarFase(PHASES.ROUND_0_PLACEMENT);
  }

  finalizarRonda0() {
    feedback.hideBigCountdown();
    feedback.clearPawnHighlights();

    // Asegurar que el Titán esté colocado para P1
    if (!this.round0State.p1.placed) {
      const freeCell = chooseBotPawnPosition(CONTROLS.p1.keyList, this.p1BoardButtons, []);
      this.round0State.p1.titan.row = freeCell.row;
      this.round0State.p1.titan.col = freeCell.col;
      this.round0State.p1.placed = true;
      gameState.p1.pawns = [this.round0State.p1.titan];
    }

    // Asegurar que el Titán esté colocado para P2
    if (!this.round0State.p2.placed) {
      const freeCell = chooseBotPawnPosition(CONTROLS.p2.keyList, this.p2BoardButtons, []);
      this.round0State.p2.titan.row = freeCell.row;
      this.round0State.p2.titan.col = freeCell.col;
      this.round0State.p2.placed = true;
      gameState.p2.pawns = [this.round0State.p2.titan];
    }

    feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
    soundManager.playPawnPlaceSound();
    feedback.updateRoundDrawer('¡TITANES COLOCADOS!', 'placement');

    setTimeout(() => {
      this.iniciarCicloRonda();
    }, 1200);
  }

  iniciarCicloRonda() {
    gameState.resetRound();
    feedback.resetBoardsRotation();
    feedback.updateRoundUI(gameState.roundNumber);
    feedback.updateAbilityChargesUI('both');
    soundManager.playRoundMusic(gameState.roundNumber);
    feedback.clearDiceOverlays();
    feedback.clearBoardEffects();
    feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);

    this.cambiarFase(PHASES.WARNING_PLACEMENT);
  }
}

export const gameController = new GameController();
