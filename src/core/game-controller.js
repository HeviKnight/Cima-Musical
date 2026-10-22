// ===================================================
// CONTROLADOR DE PARTIDA Y CICLO DE JUEGO (GAME CONTROLLER)
// ===================================================

import { PHASES, gameState, getPawnEmoji, getPawnSprite, getUnitTypeForDiceRoll, getUnitTemplate, getStrongestUnit, getWeakestUnit, getKillTension, applyDamageToPawn } from './state.js';
import { calculateAttackArea, evaluateCellStates } from './grid.js';
import { chooseBotPawnPosition, chooseBotAttackTarget, decideBotAction } from './ai.js';
import { CONTROLS, getControlScheme, CONTROL_SCHEMES } from '../data/controls.js';
import { CHARACTERS } from '../data/characters.js';
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

    // Regla: No puede haber enfrentamientos mirror (incluso para futuros personajes)
    if (p1Char && p2Char && p1Char.id === p2Char.id) {
      const altChar = CHARACTERS.find(c => c.isPlayable && c.id !== p1Char.id);
      if (altChar) p2Char = altChar;
    }

    if (p1Char) {
      gameState.p1.character = p1Char;
      gameState.p1.maxAbilityCharges = p1Char.activeAbility?.maxCharges || 1;
      gameState.p1.activeAbilityCharges = p1Char.activeAbility?.initialCharges ?? p1Char.activeAbility?.maxCharges ?? 1;
    }
    if (p2Char) {
      gameState.p2.character = p2Char;
      gameState.p2.maxAbilityCharges = p2Char.activeAbility?.maxCharges || 1;
      gameState.p2.activeAbilityCharges = p2Char.activeAbility?.initialCharges ?? p2Char.activeAbility?.maxCharges ?? 1;
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
        } else if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
          if (!gameState.p1.pendingPawn) {
            this.handleReadyInput('p1');
          }
        } else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
          const targetPlayer = this.currentGameMode !== 'vs-ai' ? 'p2' : 'p1';
          this.handleReadyInput(targetPlayer);
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
        } else if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
          if (this.currentGameMode !== 'vs-ai' && !gameState.p2.pendingPawn) {
            this.handleReadyInput('p2');
          }
        } else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
          this.handleReadyInput('p1');
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
      if ((player === 'p1' && (key === ' ' || key === 'space' || key === 's')) ||
        (player === 'p2' && (key === 'enter' || key === 'k'))) {
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
      feedback.updateRoundDrawer('TITÁN', 'titan');
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
        feedback.showReactionBadge(player, 'OBJETIVO DE AGARRE FIJADO', 'show-hit');
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

  // ================= PASIVAS DE INICIO DE RONDA DE COMBATE =================
  ejecutarPasivasDeRonda() {
    let changed = false;

    // Aplicar pasivas "Cada ronda" (Cyborg Medio, Swarm Medio)
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (!pState || !pState.character) return;
      const charId = pState.character.id;
      const living = pState.pawns.filter(p => p && p.hp > 0);
      if (living.length === 0) return;

      // Cyborg Medio: "Cada ronda, otorga escudo a una unidad adyacente"
      if (charId === 'cyborg') {
        const mediums = living.filter(p => p.unitType === 'mediana');
        mediums.forEach(med => {
          // Priorizar aliados adyacentes que NO tengan escudo activo (máx 1 escudo por unidad)
          const adjAllies = living.filter(p =>
            p.id !== med.id &&
            Math.abs(p.row - med.row) <= 1 && Math.abs(p.col - med.col) <= 1
          );
          if (adjAllies.length > 0) {
            const unshielded = adjAllies.filter(p => !p.shield || p.shield <= 0);
            const pool = unshielded.length > 0 ? unshielded : adjAllies;
            const tgt = pool[Math.floor(Math.random() * pool.length)];
            tgt.shield = 1; // Tope de 1 escudo según reglas de duración de 1 ronda
            tgt.shieldExpiresAtRound = gameState.roundNumber;
            feedback.animateShieldGrant(playerKey, tgt.row, tgt.col, 1);
            feedback.showReactionBadge(playerKey, '️ CENTINELA: ESCUDO ADYACENTE', 'show-dodge');
            changed = true;
          }
        });

        // Cyborg Pequeño: "Si tiene unidades adyacentes, gana 1 de ataque"
        const smalls = living.filter(p => p.unitType === 'pequena');
        smalls.forEach(small => {
          const adjUnits = living.filter(p =>
            p.id !== small.id &&
            Math.abs(p.row - small.row) <= 1 && Math.abs(p.col - small.col) <= 1
          );
          if (adjUnits.length > 0) {
            small.atk = (small.atk || 0) + 1;
            feedback.showReactionBadge(playerKey, 'CIBERMUÑECO: +1 ATAQUE (ADY)', 'show-dodge');
            feedback.animateStatBuff(playerKey, small.row, small.col, 'atk', 1);
            changed = true;
          }
        });
      }

      // Swarm Medio: "Cada ronda, añade 1 de daño a un dron adyacente"
      if (charId === 'dron_enjambre') {
        const mediums = living.filter(p => p.unitType === 'mediana');
        mediums.forEach(med => {
          const adjDrones = living.filter(p =>
            p.id !== med.id &&
            Math.abs(p.row - med.row) <= 1 && Math.abs(p.col - med.col) <= 1
          );
          if (adjDrones.length > 0) {
            const tgt = adjDrones[Math.floor(Math.random() * adjDrones.length)];
            tgt.atk = (tgt.atk || 0) + 1;
            feedback.showReactionBadge(playerKey, 'NODRIZA: +1 ATAQUE A DRON', 'show-dodge');
            changed = true;
          }
        });
      }
    });

    if (changed) {
      feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
    }
  }

  // ================= SELECCIÓN DE ACCIÓN (A/D o J/L) =================
  mostrarOverlaySeleccionAccion(player) {
    const pState = gameState[player];
    if (!pState || !pState.character) return;

    const isP1 = player === 'p1';
    const isDanceMat = getControlScheme() === CONTROL_SCHEMES.DANCE_MAT;
    const normalKey = isDanceMat ? '⬅' : (isP1 ? 'A' : 'J');
    const abilityKey = isDanceMat ? '➡' : (isP1 ? 'D' : 'L');
    const char = pState.character;
    const abilityName = char.activeAbility?.name || 'Habilidad';
    const maxCharges = pState.maxAbilityCharges || char.activeAbility?.maxCharges || 1;
    const charges = pState.activeAbilityCharges ?? 0;
    const canUseAbility = charges >= 1;

    const isAttackSelected = pState.selectedAction === 'attack';
    const isAbilitySelected = pState.selectedAction === 'ability';

    const abilityIconSrc = canUseAbility
      ? '/assets/sprites/UI/UI_Hero_Skill.svg'
      : '/assets/sprites/UI/UI_Hero_Skill_empty.svg';

    const attackIconSrc = '/assets/sprites/UI/UI_PawnIcon_Atk.svg';

    const customKeyHTML = `
      <div class="curtain-action-choices ${isDanceMat ? 'mat-action-choices' : ''}" id="${player}-action-choices">
        <div class="curtain-action-opt ${isAttackSelected ? 'action-selected' : ''}" data-action="attack" title="Ataque básico normal">
          <div class="action-icon-badge">
            <img src="${attackIconSrc}" class="action-badge-svg" alt="Ataque" draggable="false" />
            <span class="action-badge-key ${isDanceMat ? 'mat-badge-key' : ''}">${normalKey}</span>
          </div>
          <div class="action-opt-label">- ATAQUE -</div>
        </div>
        <div class="curtain-action-opt ${isAbilitySelected ? 'action-selected' : ''} ${!canUseAbility ? 'action-disabled' : ''}" data-action="ability" title="${abilityName} (${charges}/${maxCharges} cargas)">
          <div class="action-icon-badge">
            <img src="${abilityIconSrc}" class="action-badge-svg ${!canUseAbility ? 'badge-empty' : ''}" alt="${abilityName}" draggable="false" />
            <span class="action-badge-key ${isDanceMat ? 'mat-badge-key' : ''}">${abilityKey}</span>
          </div>
          <div class="action-opt-label">- HABILIDAD -</div>
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
        feedback.showReactionBadge(player, `REQUIERE 1 CARGA (${pState.activeAbilityCharges ?? 0} disp.)`, 'show-hit');
        soundManager.playMissBothSound();
        this.mostrarOverlaySeleccionAccion(player);
        return;
      }

      pState.selectedAction = 'ability';
      this.setJugadorListo(player, true);
    }
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
        feedback.showReactionBadge(playerKey, '️ ATAQUE PREPARADO', 'show-dodge');
      } else if (pState.selectedAction === 'ability') {
        if (char.id === 'cyborg') {
          pState.isCyborgBoosted = true;
          const extraDamage = Math.floor((pState.prestige || 0) / 20);
          const totalDamage = 1 + extraDamage;
          feedback.showAbilityActivation(playerKey, `BIOIMPACTO ARMADO: ${totalDamage} DAÑO`);
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
        } else if (char.id === 'el_brazo') {
          feedback.showAbilityActivation(playerKey, 'DESPLAZAR: ELIGE ENEMIGO A MOVER');
          if (!pState.abilityTarget) {
            const livingEnemies = gameState[enemyKey].pawns.filter(p => p && p.hp > 0);
            if (livingEnemies.length > 0) {
              const targetP = livingEnemies[0];
              pState.abilityTarget = { row: targetP.row, col: targetP.col };
              feedback.updateAttackHighlights(enemyMatrix, [{ row: targetP.row, col: targetP.col }]);
            }
          }
        } else {
          // Habilidades que NO requieren elegir casilla enemiga (Incinerador, Swarm, Taladro, Holo):
          pState.attackTarget = null;
          pState.targetedCells = [];

          if (char.id === 'incinerador') {
            feedback.showAbilityActivation(playerKey, 'CALCINAR: CONSUMIR TODA LA CHATARRA');
          } else if (char.id === 'dron_enjambre') {
            feedback.showAbilityActivation(playerKey, 'PEM: DETONAR TODOS LOS DRONES');
          } else if (char.id === 'taladro') {
            feedback.showAbilityActivation(playerKey, '️ TERRAFORMAR: 1 DAÑO A TODOS');
          } else if (char.id === 'holo') {
            feedback.showAbilityActivation(playerKey, 'PRESTIGIO: CONVERTIR ESCUDOS EN +1/+1');
          }

          // Para jugadores humanos (no CPU lista), mostrar telón de Listo con overlay simplificado
          const isAI = this.currentGameMode === 'vs-ai' && playerKey === 'p2';
          const isPlayerReady = playerKey === 'p1' ? this.p1Ready : this.p2Ready;
          const targetCurtain = playerKey === 'p1' ? 'p2' : 'p1';

          if (!isAI && !isPlayerReady) {
            const abilityName = char.activeAbility?.name || 'Habilidad';
            const abilityDesc = char.activeAbility?.description || 'Habilidad preparada';
            const abilityIcon = '/assets/sprites/UI/UI_Hero_Skill.svg';
            feedback.setBoardCurtain(targetCurtain, 'black', abilityName, abilityIcon, abilityDesc, false);
          }
        }
      }
    });

    feedback.updateRoundDrawer('ATACAR', 'attack');
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
        feedback.setBoardCurtain('p1', 'black', 'TIRAR DADO', 'face');

        if (this.currentGameMode === 'vs-ai') {
          feedback.setBoardCurtain('p2', 'green', '¡LISTO!', 'face');
        } else {
          feedback.setBoardCurtain('p2', 'black', 'TIRAR DADO', 'face');
        }
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);
        feedback.updateRoundUI(gameState.roundNumber, 'dice');
        feedback.updateRoundDrawer('DADO', 'dice');
        break;

      case PHASES.ROUND_0_PLACEMENT: {
        this.p1Ready = false;
        this.p2Ready = (this.currentGameMode === 'vs-ai');
        feedback.updateReadyCheckboxes(this.p1Ready, this.p2Ready, this.currentGameMode);
        feedback.hideBigCountdown();
        feedback.setBoardCurtain('both', 'hide');
        feedback.updateKeyTags('placement', this.currentGameMode);
        feedback.updateRoundUI(0, 'titan');
        feedback.updateRoundDrawer('TITÁN', 'titan');

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
        feedback.updateRoundUI(gameState.roundNumber, 'dice');
        feedback.updateRoundDrawer('DADO', 'dice');

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
        feedback.updateRoundDrawer('COLOCAR', 'placement');

        const p1Pending = gameState.p1.pendingPawn;
        const p1Pawns = gameState.p1.pawns.filter(p => p && p.hp > 0);

        if (p1Pending) {
          feedback.highlightFreeCells(this.p1GridMatrix, p1Pawns);
        } else {
          const p1Char = gameState.p1.character;
          const titanName = p1Char?.titanAbility?.name || 'HABILIDAD TITÁN';
          const titanDesc = p1Char?.titanAbility?.description || 'Efecto de Titán ejecutado';
          const titanIcon = '/assets/sprites/UI/Dado_spr_6.png';
          feedback.setBoardCurtain('p1', 'black', titanName, titanIcon, titanDesc, false);
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
          } else {
            const p2Char = gameState.p2.character;
            const titanName2 = p2Char?.titanAbility?.name || 'HABILIDAD TITÁN';
            const titanDesc2 = p2Char?.titanAbility?.description || 'Efecto de Titán ejecutado';
            const titanIcon = '/assets/sprites/UI/Dado_spr_6.png';
            feedback.setBoardCurtain('p2', 'black', titanName2, titanIcon, titanDesc2, false);
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
        feedback.updateRoundDrawer('ATACAR', 'attack');

        // Resetear selección de acción por defecto a 'attack'
        gameState.p1.selectedAction = 'attack';
        gameState.p2.selectedAction = 'attack';
        feedback.updateAbilitySelectionUI('both', false);

        // Ejecutar pasivas de inicio de ronda de combate (Holo otorga escudo, Cyborg medio, Swarm medio)
        this.ejecutarPasivasDeRonda();

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
        feedback.updateRoundUI(gameState.roundNumber, 'resolution');
        feedback.updateRoundDrawer('RESOLUCIÓN', 'resolution');
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
    } else if (gameState.currentPhase === PHASES.PHASE_1_PLACEMENT) {
      const pState = gameState[player];
      if (!pState?.pendingPawn) {
        if (isReady) {
          feedback.setBoardCurtain(player, 'green', '¡LISTO!', 'face');
        } else {
          this.cambiarFase(PHASES.PHASE_1_PLACEMENT);
        }
      }
    } else if (gameState.currentPhase === PHASES.PHASE_ACTION_SELECT) {
      const targetCurtain = player === 'p1' ? 'p2' : 'p1';
      this[player + 'ActionReady'] = isReady;
      if (isReady) {
        feedback.setBoardCurtain(targetCurtain, 'green', '¡LISTO!', 'face');
      } else {
        this.mostrarOverlaySeleccionAccion(player);
      }
    } else if (gameState.currentPhase === PHASES.PHASE_2_ATTACK) {
      const pState = gameState[player];
      const isSpecialAbility = pState?.selectedAction === 'ability' && ['incinerador', 'dron_enjambre', 'taladro', 'holo'].includes(pState.character?.id);
      if (isSpecialAbility) {
        const targetCurtain = player === 'p1' ? 'p2' : 'p1';
        if (isReady) {
          feedback.setBoardCurtain(targetCurtain, 'green', '¡LISTO!', 'face');
        } else {
          this.iniciarRondaDeAtaque();
        }
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
                feedback.showReactionBadge(playerKey, '+1/+1 A UNIDAD MÁS FUERTE', 'show-dodge');
                feedback.animateStatBuff(playerKey, strongest.row, strongest.col, 'all', 1);
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
          if (p1PawnHpText) p1PawnHpText.textContent = 'HABILIDAD TITÁN';
          if (p1PawnImg) p1PawnImg.src = getPawnSprite('titan', 'p1');
        } else {
          if (p1PawnImg) p1PawnImg.src = getPawnSprite(res1.pendingPawn || res1.hp, 'p1');
          if (p1PawnHpText) p1PawnHpText.textContent = `${res1.pendingPawn?.name || 'Unidad'} (${res1.pendingPawn?.atk ?? 0}/${res1.pendingPawn?.hp ?? res1.hp})`;
        }

        if (res2.isTitanBoost) {
          if (p2PawnHpText) p2PawnHpText.textContent = 'HABILIDAD TITÁN';
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

        feedback.showReactionBadge(playerKey, `TITÁN 6: ${toConsume.length} CHATARRAS AL HORNO`, 'show-dodge');

        // Comprobar si detona
        while (pState.hornoCount >= 3) {
          pState.hornoCount -= 3;
          this.detonarHorno(playerKey);
        }
        feedback.updateAbilityChargesUI(playerKey);
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
        feedback.showReactionBadge(playerKey, 'TITÁN 6: +2 DRONES GENERADOS', 'show-dodge');
        return true;
      }

      case 'cyborg': {
        // Cyborg: ganas 5 de tensión
        gameState.addPrestige(playerKey, 5);
        feedback.updatePrestigeUI(playerKey, pState.prestige);
        feedback.showReactionBadge(playerKey, 'TITÁN 6: +5 DE TENSIÓN', 'show-dodge');
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
          feedback.showReactionBadge(playerKey, 'TITÁN 6: ENROQUE Y +1 ATAQUE A AMBOS', 'show-dodge');
          return true;
        }
        return false;
      }

      case 'taladro': {
        // Taladro: cura completamente a la unidad con menos vida
        // 1. Filtrar unidades aliadas vivas que hayan sufrido daño (hp < maxHp)
        const damagedAllies = pState.pawns.filter(p => p && p.hp > 0 && p.hp < p.maxHp);
        if (damagedAllies.length > 0) {
          // Ordenar por menor vida actual (y menor suma total como desempate)
          damagedAllies.sort((a, b) => {
            if (a.hp !== b.hp) return a.hp - b.hp;
            const aTot = (a.atk || 0) + a.hp;
            const bTot = (b.atk || 0) + b.hp;
            return aTot - bTot;
          });
          const target = damagedAllies[0];
          target.hp = target.maxHp;
          feedback.showReactionBadge(playerKey, `️ TITÁN 6: CURA COMPLETA A ${target.name || 'ALIADO'}`, 'show-dodge');
          feedback.animateStatBuff(playerKey, target.row, target.col, 'heal', target.hp);
          if (typeof soundManager?.playPawnPlaceSound === 'function') {
            soundManager.playPawnPlaceSound();
          }
          return true;
        }
        return false;
      }

      case 'holo': {
        // Holo: su daño se iguala a su vida (inicia en 0/5 y con un 6 se iguala a su vida)
        const titan = pState.pawns.find(p => p.isTitan && p.hp > 0);
        if (titan) {
          titan.atk = titan.hp;
          feedback.showReactionBadge(playerKey, `TITÁN 6: REFLEJO VITAL (${titan.atk}/${titan.hp})`, 'show-dodge');
          feedback.animateStatBuff(playerKey, titan.row, titan.col, 'atk', titan.atk);
          return true; // Habilidad ejecutada con éxito (no da +1/+1 de fallback a menos que esté muerto)
        }
        return false;
      }

      default:
        return false;
    }
  }

  // ================= MUERTE DE PEONES Y PASIVAS ON-DEATH =================
  // BUG-4 guard: Set de IDs ya procesados para evitar recursión infinita en cadenas de muerte
  _deathProcessingIds = new Set();

  ejecutarMuerteDronSwarm(swarmPlayerKey, deadDronePawn) {
    if (!deadDronePawn || deadDronePawn.isTitan) return;
    const enemyKey = swarmPlayerKey === 'p1' ? 'p2' : 'p1';
    const enemyPawns = gameState[enemyKey].pawns;
    const enemyLiving = enemyPawns.filter(p => p && p.hp > 0);
    if (enemyLiving.length === 0) return;

    const target = enemyLiving[Math.floor(Math.random() * enemyLiving.length)];
    const enemyMatrix = enemyKey === 'p1' ? this.p1GridMatrix : this.p2GridMatrix;

    const { absorbed, actualDamage: damage, isDead } = applyDamageToPawn(target, 1);

    // Disparar proyectil de partículas desde el dron que muere hacia la unidad enemiga
    feedback.shootDirectDamageParticles(deadDronePawn, target, {
      color: ['#ffd166', '#f59e0b', '#fbbf24', '#ffffff'],
      fromPlayerKey: swarmPlayerKey,
      toPlayerKey: enemyKey
    }).then(() => {
      feedback.showReactionBadge(swarmPlayerKey, '¡EXPLOSIÓN DE DRON! (-1)', 'show-hit');
      feedback.animatePawnHit(enemyMatrix, target.row, target.col, isDead, target, enemyKey, damage, absorbed);
      soundManager.playHitSound();

      const targetCell = enemyMatrix[target.row] && enemyMatrix[target.row][target.col];
      if (targetCell && targetCell.btn) {
        targetCell.btn.classList.add('cell-damage-flash');
        const pawnEl = targetCell.btn.querySelector('.board-pawn-unit');
        if (pawnEl) {
          pawnEl.classList.remove('pawn-hit-flash');
          void pawnEl.offsetWidth;
          pawnEl.classList.add('pawn-hit-flash');
        }
        setTimeout(() => targetCell.btn.classList.remove('cell-damage-flash'), 500);
      }

      if (isDead) {
        const killTension = getKillTension(target);
        gameState.addPrestige(swarmPlayerKey, killTension);
        feedback.updatePrestigeUI(swarmPlayerKey, gameState[swarmPlayerKey].prestige);
        feedback.spawnSquareTensionParticles(target, swarmPlayerKey, killTension);
        this.procesarMuerteDePeon(enemyKey, target, swarmPlayerKey);
        gameState[enemyKey].pawns = gameState[enemyKey].pawns.filter(p => p.hp > 0);
      }

      // Retrasar renderPawns para permitir que las animaciones de impacto y muerte se reproduzcan completamente
      setTimeout(() => {
        feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
      }, 650);
    });
  }

  procesarMuerteDePeon(ownerKey, deadPawn, killerKey = null) {
    if (!deadPawn) return;

    // BUG-4: Evitar re-procesamiento recursivo del mismo peón
    const deathId = deadPawn.id || `${ownerKey}_${deadPawn.row}_${deadPawn.col}`;
    if (this._deathProcessingIds.has(deathId)) return;
    this._deathProcessingIds.add(deathId);
    // Limpiar después de un ciclo de eventos para permitir futuras muertes del mismo tipo
    setTimeout(() => this._deathProcessingIds.delete(deathId), 3000);

    // 1. Swarm pasiva: Al morir un dron (pequeña o mediana), hace 1 de daño a una unidad enemiga aleatoria
    if (gameState[ownerKey]?.character?.id === 'dron_enjambre' && !deadPawn.isTitan) {
      this.ejecutarMuerteDronSwarm(ownerKey, deadPawn);
    }

    // 2. Incinerador Medio al morir: mejora 1 HP a una chatarra aliada
    if (gameState[ownerKey]?.character?.id === 'incinerador' && deadPawn.unitType === 'mediana') {
      const chatarras = gameState[ownerKey].pawns.filter(p => p && p.unitType === 'pequena' && p.hp > 0);
      if (chatarras.length > 0) {
        const c = chatarras[0];
        c.hp += 1;
        c.maxHp += 1;
        feedback.showReactionBadge(ownerKey, 'MEJORA +1 HP A CHATARRA', 'show-dodge');
        feedback.animateStatBuff(ownerKey, c.row, c.col, 'hp', 1);
      }
    }

    // 3. Taladro Medio al morir: otorga 1 de ataque a una unidad aliada aleatoria
    if (gameState[ownerKey]?.character?.id === 'taladro' && deadPawn.unitType === 'mediana') {
      const allies = gameState[ownerKey].pawns.filter(p => p && p.hp > 0 && p.id !== deadPawn.id);
      if (allies.length > 0) {
        const a = allies[Math.floor(Math.random() * allies.length)];
        a.atk = (a.atk || 0) + 1;
        feedback.showReactionBadge(ownerKey, '️ +1 ATAQUE A ALIADO', 'show-dodge');
        feedback.animateStatBuff(ownerKey, a.row, a.col, 'atk', 1);
      }
    }

    // 4. Taladro Pequeño al morir: realiza 1 de daño en su casilla homóloga
    if (gameState[ownerKey]?.character?.id === 'taladro' && deadPawn.unitType === 'pequena') {
      const enemyKey = ownerKey === 'p1' ? 'p2' : 'p1';
      const enemyMatrix = enemyKey === 'p1' ? this.p1GridMatrix : this.p2GridMatrix;
      const targetHomologous = { row: deadPawn.row, col: deadPawn.col, playerKey: enemyKey };
      const opp = gameState[enemyKey].pawns.find(p => p && p.row === deadPawn.row && p.col === deadPawn.col && p.hp > 0);

      // Paleta temática de taladro: ámbar, óxido metálico, naranja y blanco
      const drillPalette = ['#f59e0b', '#d97706', '#b45309', '#fef08a', '#ffffff'];

      // Disparar proyectil hacia la casilla homóloga enemiga siempre, haya o no enemigo
      feedback.shootDirectDamageParticles(deadPawn, targetHomologous, {
        color: drillPalette,
        fromPlayerKey: ownerKey,
        toPlayerKey: enemyKey,
        count: 10,
        duration: 320
      }).then(() => {
        const oppCell = enemyMatrix[deadPawn.row] && enemyMatrix[deadPawn.row][deadPawn.col];

        if (opp) {
          const { absorbed: oppAbsorbed, actualDamage: oppDmg, isDead: oppDead } = applyDamageToPawn(opp, 1);
          feedback.showReactionBadge(ownerKey, '️ ¡TALADRO SUBTERRÁNEO! (-1)', 'show-hit');
          feedback.animatePawnHit(enemyMatrix, opp.row, opp.col, oppDead, opp, enemyKey, oppDmg, oppAbsorbed);
          soundManager.playHitSound();

          if (oppCell && oppCell.btn) {
            oppCell.btn.classList.add('cell-damage-flash');
            const pEl = oppCell.btn.querySelector('.board-pawn-unit');
            if (pEl) {
              pEl.classList.remove('pawn-hit-flash');
              void pEl.offsetWidth;
              pEl.classList.add('pawn-hit-flash');
            }
            setTimeout(() => oppCell.btn.classList.remove('cell-damage-flash'), 500);
          }

          if (oppDead) {
            const k = getKillTension(opp);
            gameState.addPrestige(ownerKey, k);
            feedback.updatePrestigeUI(ownerKey, gameState[ownerKey].prestige);
            feedback.spawnSquareTensionParticles(opp, ownerKey, k);
            this.procesarMuerteDePeon(enemyKey, opp, ownerKey);
            gameState[enemyKey].pawns = gameState[enemyKey].pawns.filter(p => p.hp > 0);
          }

          setTimeout(() => {
            feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
          }, 650);
        } else {
          // Si no hay enemigo en la casilla homóloga, dar feedback visual claro del impacto en la casilla vacía
          feedback.showReactionBadge(ownerKey, '️ IMPACTO EN CASILLA (AGUA)', 'show-dodge');
          soundManager.playMissSound ? soundManager.playMissSound() : soundManager.playHitSound();

          if (oppCell && oppCell.btn) {
            oppCell.btn.classList.add('cell-damage-flash');
            setTimeout(() => oppCell.btn.classList.remove('cell-damage-flash'), 500);
          }
          feedback.spawnHitParticles({ row: deadPawn.row, col: deadPawn.col, playerKey: enemyKey });
        }
      });
    }
  }

  // Detonación del Horno (Incinerador): 1 de daño a todas las unidades enemigas
  detonarHorno(attackerKey) {
    const enemyKey = attackerKey === 'p1' ? 'p2' : 'p1';
    const enemyPawns = gameState[enemyKey].pawns;

    feedback.showAbilityActivation(attackerKey, '¡HORNO DETONA! 1 DAÑO AoE');
    soundManager.playHitSound();

    let deadTension = 0;
    enemyPawns.forEach(pawn => {
      if (pawn && pawn.hp > 0) {
        const { absorbed, actualDamage: damage, isDead } = applyDamageToPawn(pawn, 1);
        const enemyMatrix = enemyKey === 'p1' ? this.p1GridMatrix : this.p2GridMatrix;
        feedback.animatePawnHit(enemyMatrix, pawn.row, pawn.col, isDead, pawn, enemyKey, damage, absorbed);
        const cellInfo = enemyMatrix[pawn.row] && enemyMatrix[pawn.row][pawn.col];
        if (cellInfo && cellInfo.btn) {
          cellInfo.btn.classList.add('cell-damage-flash');
          setTimeout(() => cellInfo.btn.classList.remove('cell-damage-flash'), 450);
        }
        if (isDead) {
          const killTension = getKillTension(pawn);
          deadTension += killTension;
          feedback.spawnSquareTensionParticles(pawn, attackerKey, killTension);
          this.procesarMuerteDePeon(enemyKey, pawn, attackerKey);
        }
      }
    });

    if (deadTension > 0) {
      gameState.addPrestige(attackerKey, deadTension);
      feedback.updatePrestigeUI(attackerKey, gameState[attackerKey].prestige);
      feedback.showReactionBadge(attackerKey, `HORNO KILLS: +${deadTension} TENSIÓN`, 'show-hit');
    }

    feedback.updateAbilityChargesUI(attackerKey);

    gameState[enemyKey].pawns = gameState[enemyKey].pawns.filter(p => p.hp > 0);
    feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
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
          feedback.animateStatBuff(pKey, target.row, target.col, 'all', pending.hp);
        }
      } else if (pending.row === null) {
        const pos = chooseBotPawnPosition([], btnMap, pState.pawns);
        if (pos.isUpgrade) {
          const target = pState.pawns.find(p => p.row === pos.row && p.col === pos.col);
          if (target) {
            target.hp += pending.hp;
            target.maxHp += pending.hp;
            target.atk = (target.atk || 0) + (pending.atk || 0);
            feedback.animateStatBuff(pKey, target.row, target.col, 'all', pending.hp);
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
            feedback.animateStatBuff(pKey, target.row, target.col, 'all', pending.hp);
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
    // PASO 0: PASIVA DE HOLO (PRIMERA ACCIÓN AL ENTRAR EN RESOLUCIÓN)
    // -------------------------------------------------------------
    let holoPassiveTriggered = false;

    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (!pState || pState.character?.id !== 'holo') return;

      const living = pState.pawns.filter(p => p && p.hp > 0);
      if (living.length === 0) return;

      const chosen = living[Math.floor(Math.random() * living.length)];
      if (chosen.unitType === 'pequena') {
        chosen.atk = (chosen.atk || 0) + 1;
        feedback.animateStatBuff(playerKey, chosen.row, chosen.col, 'atk', chosen.atk);
        feedback.showReactionBadge(playerKey, 'ESPEJO FRÁGIL: +1 ATAQUE', 'show-hit');
        soundManager.playPawnPlaceSound();
      } else {
        chosen.shield = (chosen.shield || 0) + 1;
        chosen.shieldExpiresAtRound = gameState.roundNumber;
        feedback.animateShieldGrant(playerKey, chosen.row, chosen.col, chosen.shield);
        feedback.showReactionBadge(playerKey, 'ESCUDO HOLOGRÁFICO (+1)', 'show-dodge');
        soundManager.playShieldSound();
      }
      holoPassiveTriggered = true;
    });

    if (holoPassiveTriggered) {
      feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
    }

    const resolverFaseCombate = () => {
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
            feedback.showReactionBadge(playerKey, 'REUBICACIÓN Y 1 DAÑO', 'show-hit');
          } else {
            targetPawn.hp -= 2;
            feedback.showReactionBadge(playerKey, 'SIN ESPACIO: ¡2 DE DAÑO!', 'show-hit');
          }

          // RoboHand Medio: "Cada ronda que se mueve una unidad enemiga, gana 1 de ataque"
          pState.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
            m.atk = (m.atk || 0) + 1;
          });

          if (targetPawn.hp <= 0) {
            const killPrestige = getKillTension(targetPawn);
            gameState.addPrestige(playerKey, killPrestige);
            feedback.spawnSquareTensionParticles(targetPawn, playerKey, killPrestige);
            this.procesarMuerteDePeon(enemyKey, targetPawn, playerKey);
            gameState[enemyKey].pawns = gameState[enemyKey].pawns.filter(p => p.hp > 0);
          }
        } else {
          feedback.showReactionBadge(playerKey, 'AGARRE AL VACÍO', 'show-dodge');
        }
      }
    });

    // Taladro Activa: Hace 1 de daño a todas las unidades de ambos tableros
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'taladro') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        feedback.showReactionBadge(playerKey, '️ TERRAFORMAR: 1 DAÑO A AMBOS TABLEROS', 'show-hit');

        ['p1', 'p2'].forEach(sideKey => {
          const sidePawns = gameState[sideKey].pawns;
          sidePawns.forEach(p => {
            if (p && p.hp > 0) {
              const { absorbed, actualDamage, isDead } = applyDamageToPawn(p, 1);
              if (actualDamage > 0 && gameState[sideKey].character?.id === 'taladro' && !isDead) {
                p.atk = (p.atk || 0) + 1;
              }

              if (isDead) {
                if (sideKey !== playerKey) {
                  const killT = getKillTension(p);
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
                // Taladro Pequeño al morir: se procesa mediante procesarMuerteDePeon
                this.procesarMuerteDePeon(sideKey, p, playerKey);
              }
            }
          });
        });
      }
    });

    // Incinerador Activa: Suma +1 al horno y consume TODA tu chatarra (cada una suma +1 al horno)
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'incinerador') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        const matrix = playerKey === 'p1' ? this.p1GridMatrix : this.p2GridMatrix;
        const chatarras = pState.pawns.filter(p => !p.isTitan && p.unitType === 'pequena' && p.hp > 0);

        // Suma +1 de base por ignición del horno
        pState.hornoCount = (pState.hornoCount || 0) + 1;

        // Cada chatarra arde y se añade al horno
        chatarras.forEach(c => {
          const cell = matrix[c.row] && matrix[c.row][c.col];
          if (cell && cell.btn) {
            feedback.spawnFloatingBuff(cell.btn, 'AL HORNO (+1)', 'all');
            feedback.spawnHitParticles(cell.btn);
          }
        });

        pState.hornoCount += chatarras.length;
        pState.pawns = pState.pawns.filter(p => p.isTitan || p.unitType !== 'pequena');

        soundManager.playHitSound();
        feedback.showReactionBadge(playerKey, `IGNICIÓN (+${1 + chatarras.length} AL HORNO: ${pState.hornoCount}/3)`, 'show-dodge');
        feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);

        while (pState.hornoCount >= 3) {
          pState.hornoCount -= 3;
          this.detonarHorno(playerKey);
        }
        feedback.updateAbilityChargesUI(playerKey);
      }
    });

    // Swarm Activa: Sacrifica todas tus unidades pequeñas y medianas (Drones)
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'dron_enjambre') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        const matrix = playerKey === 'p1' ? this.p1GridMatrix : this.p2GridMatrix;
        const drones = pState.pawns.filter(p => p && !p.isTitan && p.hp > 0);
        pState.pawns = pState.pawns.filter(p => p && p.isTitan);

        if (drones.length > 0) {
          feedback.showReactionBadge(playerKey, `SACRIFICIO DE ${drones.length} DRONES`, 'show-hit');
          drones.forEach((drone, idx) => {
            const cell = matrix[drone.row] && matrix[drone.row][drone.col];
            if (cell && cell.btn) {
              feedback.spawnDeathParticles(cell.btn);
              const pUnit = cell.btn.querySelector('.board-pawn-unit');
              if (pUnit) pUnit.remove();
            }
            setTimeout(() => {
              this.ejecutarMuerteDronSwarm(playerKey, drone);
            }, idx * 260);
          });
        } else {
          feedback.showReactionBadge(playerKey, 'SIN DRONES PARA SACRIFICAR', 'show-dodge');
        }
      }
    });

    // Holo Activa (Prestigio): Convierte los escudos en +1/+1 de daño y vida
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.selectedAction === 'ability' && pState.character?.id === 'holo') {
        pState.activeAbilityCharges = Math.max(0, pState.activeAbilityCharges - 1);
        feedback.updateAbilityChargesUI(playerKey);

        let count = 0;
        pState.pawns.forEach(pawn => {
          if (pawn && pawn.hp > 0 && pawn.shield > 0) {
            const shieldsToConvert = pawn.shield;
            pawn.shield = 0;
            pawn.atk = (pawn.atk || 0) + shieldsToConvert;
            pawn.hp += shieldsToConvert;
            pawn.maxHp += shieldsToConvert;
            count += shieldsToConvert;
            feedback.animateStatBuff(playerKey, pawn.row, pawn.col, 'all', shieldsToConvert);
          }
        });

        if (count > 0) {
          feedback.showReactionBadge(playerKey, `PRESTIGIO: ${count} ESCUDOS EN +1/+1`, 'show-dodge');
          feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);
        } else {
          feedback.showReactionBadge(playerKey, 'PRESTIGIO: SIN ESCUDOS', 'show-dodge');
        }
      }
    });

    // -------------------------------------------------------------
    // PASO 2: ATAQUES DIRECTOS DE CASILLAS
    // -------------------------------------------------------------
    const target1 = gameState.p1.attackTarget || { row: 0, col: 0 };
    const target2 = gameState.p2.attackTarget || { row: 0, col: 0 };

    const p1Attacking = gameState.p1.selectedAction === 'attack' ||
      (gameState.p1.selectedAction === 'ability' && gameState.p1.character?.id === 'cyborg');
    const p2Attacking = gameState.p2.selectedAction === 'attack' ||
      (gameState.p2.selectedAction === 'ability' && gameState.p2.character?.id === 'cyborg');

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
          // Holo Medio: la ronda siguiente a la que el jugador dispara a una unidad, recibe un escudo
          if (gameState.p1.character?.id === 'holo') {
            gameState.p1.holoMediumShieldNextRound = true;
          }

          const { absorbed: p1Absorbed, actualDamage: p1ActualDamage, isDead: isDestroyed } = applyDamageToPawn(hitPawn2, p1Damage);
          if (p1Absorbed > 0) {
            feedback.showReactionBadge('p2', `️ ESCUDO ABSORBE ${p1Absorbed} DAÑO`, 'show-dodge');
          }

          // Taladro Pasiva: Cuando un aliado recibe daño, gana 1 de ataque extra
          if (gameState.p2.character?.id === 'taladro' && p1ActualDamage > 0 && hitPawn2.hp > 0) {
            hitPawn2.atk = (hitPawn2.atk || 0) + 1;
            feedback.showReactionBadge('p2', '️ RESILIENCIA: +1 ATAQUE TRAS DAÑO', 'show-dodge');
            feedback.animateStatBuff('p2', hitPawn2.row, hitPawn2.col, 'atk', 1);
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
            feedback.showReactionBadge('p1', 'IMPULSO VERTICAL (EMPUJE)', 'show-dodge');
            gameState.p1.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
              m.atk = (m.atk || 0) + 1;
            });
          }

          feedback.animatePawnHit(this.p2GridMatrix, hitPawn2.row, hitPawn2.col, isDestroyed, hitPawn2, 'p2', p1ActualDamage, p1Absorbed);

          if (isDestroyed) {
            const killTension = getKillTension(hitPawn2);
            p1TensionDelta += killTension;
            feedback.showReactionBadge('p1', `¡ELIMINADO! (+${killTension})`, 'show-hit');
            hitPawn2.playerKey = 'p2';
            feedback.spawnSquareTensionParticles(hitPawn2, 'p1', killTension);
            this.procesarMuerteDePeon('p2', hitPawn2, 'p1');
          } else {
            feedback.showReactionBadge('p1', `¡IMPACTO! (-${p1ActualDamage} HP)`, 'show-hit');
          }
          feedback.triggerHurtAnimation('p2');
          soundManager.playHitSound();
        } else {
          feedback.showReactionBadge('p1', '¡FALLO! (AGUA)', 'show-dodge');
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
          // Holo Medio: la ronda siguiente a la que el jugador dispara a una unidad, recibe un escudo
          if (gameState.p2.character?.id === 'holo') {
            gameState.p2.holoMediumShieldNextRound = true;
          }

          const { absorbed: p2Absorbed, actualDamage: p2ActualDamage, isDead: isDestroyed } = applyDamageToPawn(hitPawn1, p2Damage);
          if (p2Absorbed > 0) {
            feedback.showReactionBadge('p1', `️ ESCUDO ABSORBE ${p2Absorbed} DAÑO`, 'show-dodge');
          }

          if (gameState.p1.character?.id === 'taladro' && p2ActualDamage > 0 && hitPawn1.hp > 0) {
            hitPawn1.atk = (hitPawn1.atk || 0) + 1;
            feedback.showReactionBadge('p1', '️ RESILIENCIA: +1 ATAQUE TRAS DAÑO', 'show-dodge');
            feedback.animateStatBuff('p1', hitPawn1.row, hitPawn1.col, 'atk', 1);
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
            feedback.showReactionBadge('p2', 'IMPULSO VERTICAL (EMPUJE)', 'show-dodge');
            gameState.p2.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0).forEach(m => {
              m.atk = (m.atk || 0) + 1;
            });
          }

          feedback.animatePawnHit(this.p1GridMatrix, hitPawn1.row, hitPawn1.col, isDestroyed, hitPawn1, 'p1', p2ActualDamage, p2Absorbed);

          if (isDestroyed) {
            const killTension = getKillTension(hitPawn1);
            p2TensionDelta += killTension;
            feedback.showReactionBadge('p2', `¡ELIMINADO! (+${killTension})`, 'show-hit');
            hitPawn1.playerKey = 'p1';
            feedback.spawnSquareTensionParticles(hitPawn1, 'p2', killTension);
            this.procesarMuerteDePeon('p1', hitPawn1, 'p2');
          } else {
            feedback.showReactionBadge('p2', `¡IMPACTO! (-${p2ActualDamage} HP)`, 'show-hit');
          }
          feedback.triggerHurtAnimation('p1');
          soundManager.playHitSound();
        } else {
          feedback.showReactionBadge('p2', '¡FALLO! (AGUA)', 'show-dodge');
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
            feedback.showReactionBadge(playerKey, `BATERÍA HUMANA: +${gain} TENSIÓN`, 'show-dodge');
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
              feedback.showReactionBadge(playerKey, '️ CHATARRERÍA (+1 CHATARRA)', 'show-dodge');
            }
          }
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

      // Caducar escudos de la ronda que no hayan sido consumidos
      ['p1', 'p2'].forEach(sideKey => {
        gameState[sideKey].pawns.forEach(p => {
          if (p && p.shield > 0 && p.shieldExpiresAtRound && p.shieldExpiresAtRound <= gameState.roundNumber) {
            p.shield = 0;
          }
        });
      });

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
  };

  if (holoPassiveTriggered) {
    setTimeout(() => {
      resolverFaseCombate();
    }, 750);
  } else {
    resolverFaseCombate();
  }
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
      }, { once: true });
    }

    if (btnMenuGame) {
      btnMenuGame.addEventListener('click', () => {
        soundManager.playPawnPlaceSound();
        soundManager.playMenuMusic();
        screens.showScreen('start');
      }, { once: true });
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
    feedback.updateRoundDrawer('TITÁN', 'titan');

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

    // Prisma Holográfico (Holo): la ronda siguiente a disparar a una unidad enemiga, recibe un escudo
    ['p1', 'p2'].forEach(playerKey => {
      const pState = gameState[playerKey];
      if (pState.character?.id === 'holo' && pState.holoMediumShieldNextRound) {
        const mediums = pState.pawns.filter(p => p && p.unitType === 'mediana' && p.hp > 0);
        if (mediums.length > 0) {
          mediums.forEach(m => {
            m.shield = (m.shield || 0) + 1;
            m.shieldExpiresAtRound = gameState.roundNumber;
            feedback.animateShieldGrant(playerKey, m.row, m.col, m.shield);
          });
          feedback.showReactionBadge(playerKey, 'PRISMA HOLOGRÁFICO (+1 ESCUDO)', 'show-dodge');
          soundManager.playShieldSound();
        }
        pState.holoMediumShieldNextRound = false;
      }
    });

    feedback.renderPawns(this.p1GridMatrix, gameState.p1.pawns, this.p2GridMatrix, gameState.p2.pawns, this.currentGameMode);

    this.cambiarFase(PHASES.WARNING_PLACEMENT);
  }
}

export const gameController = new GameController();
