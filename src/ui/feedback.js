// ===================================================
// GESTOR DE FEEDBACK VISUAL Y CLASES DOM (UI)
// ===================================================

import { CONTROLS } from '../data/controls.js';
import { gameState, getPawnSprite } from '../core/state.js';
import { soundManager } from '../audio/sound-manager.js';


class FeedbackManager {
  constructor() {
    this.gameWrapper = null;

    // Capas sólidas (negra y verde)
    this.p1Curtain = null;
    this.p2Curtain = null;
    this.p1CurtainImg = null;
    this.p2CurtainImg = null;
    this.p1CurtainTitle = null;
    this.p2CurtainTitle = null;

    // Contadores gigantes
    this.p1BigCountdown = null;
    this.p2BigCountdown = null;
    this.p1CountdownNum = null;
    this.p2CountdownNum = null;

    // Overlays de dados y peones
    this.p1RollOverlay = null;
    this.p2RollOverlay = null;
    this.p1RollDiceImg = null;
    this.p2RollDiceImg = null;
    this.p1RollPawnBox = null;
    this.p2RollPawnBox = null;
    this.p1RollPawnImg = null;
    this.p2RollPawnImg = null;
    this.p1RollPawnHpText = null;
    this.p2RollPawnHpText = null;

    // Personajes y reacciones
    this.p1Character = null;
    this.p2Character = null;
    this.p1Reaction = null;
    this.p2Reaction = null;

    // Estado de Prestigio Animado
    this.prestigeValues = { p1: 0, p2: 0 };
    this.prestigeAnimFrames = { p1: null, p2: null };
  }

  init() {
    this.gameWrapper = document.getElementById('game-wrapper');

    this.p1Curtain = document.getElementById('p1-curtain');
    this.p2Curtain = document.getElementById('p2-curtain');
    this.p1CurtainImg = document.getElementById('p1-curtain-img');
    this.p2CurtainImg = document.getElementById('p2-curtain-img');
    this.p1CurtainTitle = document.getElementById('p1-curtain-title');
    this.p2CurtainTitle = document.getElementById('p2-curtain-title');

    this.sharedBigCountdown = document.getElementById('shared-big-countdown');
    this.sharedCountdownNum = document.getElementById('shared-countdown-num');

    this.p1RollOverlay = document.getElementById('p1-roll-overlay');
    this.p2RollOverlay = document.getElementById('p2-roll-overlay');
    this.p1RollDiceImg = document.getElementById('p1-roll-dice-img');
    this.p2RollDiceImg = document.getElementById('p2-roll-dice-img');
    this.p1RollPawnBox = document.getElementById('p1-roll-pawn-box');
    this.p2RollPawnBox = document.getElementById('p2-roll-pawn-box');
    this.p1RollPawnImg = document.getElementById('p1-roll-pawn-img');
    this.p2RollPawnImg = document.getElementById('p2-roll-pawn-img');
    this.p1RollPawnHpText = document.getElementById('p1-roll-pawn-hp-text');
    this.p2RollPawnHpText = document.getElementById('p2-roll-pawn-hp-text');

    this.p1Character = document.getElementById('p1-character');
    this.p2Character = document.getElementById('p2-character');
    this.p1Reaction = document.getElementById('p1-reaction');
    this.p2Reaction = document.getElementById('p2-reaction');

    gameState.subscribe((event, payload) => {
      if (event === 'chargeGained' || event === 'prestigeChange') {
        if (payload?.player) {
          this.updateAbilityChargesUI(payload.player);
        }
      }
    });

    this.updateAbilityChargesUI('both');
  }

  updateAbilityChargesUI(player = 'both') {
    const targets = player === 'both' ? ['p1', 'p2'] : [player];
    targets.forEach(p => {
      const container = document.getElementById(`${p}-charges-slots`);
      const abilityBtn = document.getElementById(`${p}-ability-btn`);
      const hornoText = document.getElementById(`${p}-horno-text`);
      const pState = gameState[p];
      if (!pState) return;

      const maxCharges = pState.maxAbilityCharges || char?.activeAbility?.maxCharges || 1;
      const currentCharges = pState.activeAbilityCharges ?? 0;

      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < maxCharges; i++) {
          const slot = document.createElement('div');
          const isAvailable = i < currentCharges;
          slot.className = `charge-slot ${isAvailable ? 'active' : 'used'}`;
          slot.title = isAvailable ? `Carga ${i + 1} Disponible` : `Carga ${i + 1} Usada`;

          if (isAvailable) {
            slot.innerHTML = `<span class="charge-icon">⚡</span>`;
          } else {
            slot.innerHTML = `<span class="charge-used-sq"></span>`;
          }
          container.appendChild(slot);
        }
      }

      if (abilityBtn) {
        const canUse = currentCharges >= 1;
        abilityBtn.disabled = !canUse;
        if (pState.selectedAction === 'ability') {
          abilityBtn.classList.add('action-selected');
        } else {
          abilityBtn.classList.remove('action-selected');
        }
      }

      if (hornoText) {
        hornoText.textContent = `${pState.hornoCount || 0}/3`;
      }
    });
  }

  updateAbilitySelectionUI(playerKey, isSelected) {
    const targets = playerKey === 'both' ? ['p1', 'p2'] : [playerKey];
    targets.forEach(p => {
      const btn = document.getElementById(`${p}-ability-btn`);
      if (btn) {
        if (isSelected) {
          btn.classList.add('action-selected');
        } else {
          btn.classList.remove('action-selected');
        }
      }
    });
  }

  /**
   * Muestra el contador central con el número dado.
   * @param {number|string} num
   */
  showBigCountdown(num) {
    if (this.sharedBigCountdown) this.sharedBigCountdown.classList.add('show');
    if (this.sharedCountdownNum) {
      this.sharedCountdownNum.textContent = num;
      this.sharedCountdownNum.classList.add('tick-anim');
      setTimeout(() => this.sharedCountdownNum.classList.remove('tick-anim'), 100);
    }
  }

  hideBigCountdown() {
    if (this.sharedBigCountdown) this.sharedBigCountdown.classList.remove('show');
  }

  playGridIntroAnimation(onComplete) {
    this.setBoardCurtain('both', 'hide');
    this.hideBigCountdown();


    const p1Btns = Array.from(document.querySelectorAll('#p1-grid .casilla-btn'));
    const p2Btns = Array.from(document.querySelectorAll('#p2-grid .casilla-btn'));

    [...p1Btns, ...p2Btns].forEach(btn => {
      btn.className = 'casilla-btn state-off';
    });

    const stepDelay = 95;
    let step = 0;
    const totalSteps = 9;

    const interval = setInterval(() => {
      if (step > 0) {
        const prevIdx = step - 1;
        if (p1Btns[prevIdx]) p1Btns[prevIdx].className = 'casilla-btn state-off';
        if (p2Btns[prevIdx]) p2Btns[prevIdx].className = 'casilla-btn state-off';
      }

      if (step < totalSteps) {
        if (p1Btns[step]) p1Btns[step].className = 'casilla-btn state-active';
        if (p2Btns[step]) p2Btns[step].className = 'casilla-btn state-active';
        soundManager.playGridIntroSound();
        step++;
      } else {
        clearInterval(interval);
        [...p1Btns, ...p2Btns].forEach(btn => {
          btn.className = 'casilla-btn state-off';
        });
        if (onComplete) onComplete();
      }
    }, stepDelay);
  }

  setBoardCurtain(player, mode, title = '', iconSrc = null, promptText = '', customKeyHTML = null) {
    const targets = player === 'both' ? ['p1', 'p2'] : [player];

    targets.forEach(p => {
      const curtain = p === 'p1' ? this.p1Curtain : this.p2Curtain;
      const titleEl = p === 'p1' ? this.p1CurtainTitle : this.p2CurtainTitle;
      const imgEl = p === 'p1' ? this.p1CurtainImg : this.p2CurtainImg;

      if (!curtain) return;

      let promptEl = curtain.querySelector('.curtain-prompt');
      if (promptEl) {
        promptEl.style.display = (mode === 'black' && promptText) ? 'block' : 'none';
        if (promptText) promptEl.textContent = promptText;
      }

      let keyCapEl = curtain.querySelector('.curtain-key-cap');
      if (!keyCapEl) {
        keyCapEl = document.createElement('div');
        keyCapEl.className = 'curtain-key-cap';
        const contentBox = curtain.querySelector('.curtain-content');
        if (contentBox) contentBox.appendChild(keyCapEl);
      }

      let finalIcon = iconSrc;
      if (!finalIcon || finalIcon === 'face' || finalIcon === 'default') {
        const activeChar = gameState[p]?.character || CONTROLS[p];
        finalIcon = activeChar?.iconSprite || activeChar?.faceSprite;
      }

      if (mode === 'hide') {
        curtain.classList.remove('active-black', 'active-green');
      } else if (mode === 'black') {
        curtain.classList.remove('active-green');
        curtain.classList.add('active-black');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
        if (keyCapEl) {
          keyCapEl.style.display = 'flex';
          if (customKeyHTML !== null) {
            keyCapEl.classList.add('has-choices');
            keyCapEl.innerHTML = customKeyHTML;
          } else {
            keyCapEl.classList.remove('has-choices');
            keyCapEl.textContent = p === 'p1' ? 'S' : 'K';
          }
        }
      } else if (mode === 'green') {
        curtain.classList.remove('active-black');
        curtain.classList.add('active-green');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
        if (keyCapEl) {
          keyCapEl.style.display = 'none';
        }
      }
    });
  }

  removeStandingPawnIcons() {}


  updateKeyTags(mode, gameMode = 'vs-ai') {
    const p1Keys = [['Q', 'W', 'E'], ['A', 'S', 'D'], ['Z', 'X', 'C']];
    const p2Keys = [['U', 'I', 'O'], ['J', 'K', 'L'], ['M', ',', '.']];

    const p1Btns = document.querySelectorAll('#p1-grid .casilla-btn');
    const p2Btns = document.querySelectorAll('#p2-grid .casilla-btn');

    if (mode === 'attack') {
      // En fase de ataque: P1 (humano) ataca sobre el tablero de P2, por lo que ve sus teclas (Q,W,E...)
      p2Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const tag = btn.querySelector('.key-tag');
        if (tag && p1Keys[r] && p1Keys[r][c]) {
          tag.textContent = p1Keys[r][c];
        }
      });

      // En el tablero de P1: En vs-ai no se muestra ninguna tecla (la IA ataca automáticamente). En 2P local muestra las teclas de P2.
      p1Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const tag = btn.querySelector('.key-tag');
        if (tag) {
          tag.textContent = (gameMode === 'vs-ai') ? '' : (p2Keys[r] ? p2Keys[r][c] : '');
        }
      });
    } else {
      // En fase de colocación: P1 ve sus teclas en su propio tablero.
      p1Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const tag = btn.querySelector('.key-tag');
        if (tag && p1Keys[r] && p1Keys[r][c]) {
          tag.textContent = p1Keys[r][c];
        }
      });

      // En el tablero de P2: En vs-ai NO se muestran teclas. En 2P local se muestran las teclas de P2.
      p2Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const tag = btn.querySelector('.key-tag');
        if (tag) {
          tag.textContent = (gameMode === 'vs-ai') ? '' : (p2Keys[r] ? p2Keys[r][c] : '');
        }
      });
    }
  }

  updateAttackHighlights(matrix, targetedCells) {
    // Limpiar previas
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (matrix[r] && matrix[r][c]) {
          matrix[r][c].btn.classList.remove('state-active');
          if (!matrix[r][c].btn.classList.contains('state-player')) {
            matrix[r][c].btn.classList.add('state-off');
          }
        }
      }
    }

    // Aplicar estado 'state-active'
    (targetedCells || []).forEach(cell => {
      if (matrix[cell.row] && matrix[cell.row][cell.col]) {
        matrix[cell.row][cell.col].btn.classList.remove('state-off');
        matrix[cell.row][cell.col].btn.classList.add('state-active');
      }
    });
  }

  applyCellStates(matrix, cellStates) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cellInfo = matrix[r][c];
        if (!cellInfo) continue;
        const btn = cellInfo.btn;
        const cellState = cellStates[r][c].state;

        btn.classList.remove('state-hit', 'state-miss', 'state-active', 'state-player', 'state-off');
        btn.classList.add(`state-${cellState}`);
      }
    }
  }

  renderPawns(p1Matrix, p1Pawns = [], p2Matrix, p2Pawns = [], gameMode = 'vs-ai') {
    // Eliminar peones visuales existentes
    document.querySelectorAll('.board-pawn-unit').forEach(el => el.remove());

    const renderList = (matrix, pawns, playerKey) => {
      if (!matrix || !pawns) return;
      const isDust = gameState[playerKey]?.isDustCloudActive;

      pawns.forEach(pawn => {
        if (!pawn || pawn.hp <= 0) return;
        const cell = matrix[pawn.row]?.[pawn.col];
        if (!cell || !cell.btn) return;

        const unitEl = document.createElement('div');
        unitEl.className = `board-pawn-unit ${isDust ? 'pawn-cloaked' : ''} ${pawn.isTitan ? 'is-titan-unit' : ''}`;
        unitEl.setAttribute('data-pawn-id', pawn.id || `${playerKey}_${pawn.row}_${pawn.col}`);

        const pawnSrc = getPawnSprite(pawn, playerKey);
        const hpClass = Math.min(6, Math.max(1, pawn.hp));
        const shieldHTML = (pawn.shield > 0) ? `<span class="pawn-shield-corner" title="Escudo (+${pawn.shield})">🛡️</span>` : '';
        const dustHTML = isDust ? `<div class="pawn-dust-cloud" title="Oculto por polvo">☁️</div>` : '';
        const atkVal = pawn.atk ?? 0;
        const atkHTML = `<span class="pawn-atk-corner" title="Ataque (Genera tensión): ${atkVal}">⚔️${atkVal}</span>`;
        const titanHTML = pawn.isTitan ? `<span class="pawn-crown-tag" title="Titán">👑</span>` : '';

        unitEl.innerHTML = `
          ${dustHTML}
          <img src="${pawnSrc}" alt="${pawn.name || 'Peón'}" class="pawn-avatar ${isDust ? 'dust-hidden' : ''}">
          ${atkHTML}
          <span class="pawn-hp-corner hp-${hpClass}" title="Vida: ${pawn.hp}">${pawn.hp}</span>
          ${shieldHTML}
          ${titanHTML}
        `;
        cell.btn.appendChild(unitEl);
      });
    };

    renderList(p1Matrix, p1Pawns, 'p1');
    renderList(p2Matrix, p2Pawns, 'p2');
  }

  animatePawnHit(matrix, row, col, isDestroyed = false, pawnOrHp = 0, targetPlayer = 'p2') {
    if (!matrix || !matrix[row] || !matrix[row][col]) return;
    const btn = matrix[row][col].btn;
    if (!btn) return;

    const currentHp = typeof pawnOrHp === 'object' ? (pawnOrHp.hp || 0) : (parseInt(pawnOrHp, 10) || 0);
    const currentAtk = typeof pawnOrHp === 'object' ? (pawnOrHp.atk ?? 0) : 0;
    const unitEl = btn.querySelector('.board-pawn-unit');

    if (unitEl) {
      if (isDestroyed) {
        unitEl.classList.add('pawn-destroyed');
        setTimeout(() => unitEl.remove(), 550);
      } else {
        unitEl.classList.add('pawn-damaged');
        const hpBadge = unitEl.querySelector('.pawn-hp-corner');
        if (hpBadge) {
          const hpClass = Math.min(6, Math.max(1, currentHp));
          hpBadge.className = `pawn-hp-corner hp-${hpClass}`;
          hpBadge.textContent = currentHp;
        }
        const atkBadge = unitEl.querySelector('.pawn-atk-corner');
        if (atkBadge) {
          atkBadge.textContent = `⚔️${currentAtk}`;
        }
        const img = unitEl.querySelector('.pawn-avatar');
        if (img) {
          img.src = getPawnSprite(pawnOrHp, targetPlayer);
        }
        setTimeout(() => unitEl.classList.remove('pawn-damaged'), 400);
      }
    } else {
      const pawnSrc = getPawnSprite(pawnOrHp, targetPlayer);
      const createdUnitEl = document.createElement('div');
      createdUnitEl.className = 'board-pawn-unit';

      if (isDestroyed) {
        createdUnitEl.classList.add('pawn-destroyed');
        createdUnitEl.innerHTML = `
          <img src="${pawnSrc}" alt="Peón Eliminado" class="pawn-avatar">
          <span class="pawn-hp-corner hp-1">0</span>
        `;
        btn.appendChild(createdUnitEl);
        setTimeout(() => createdUnitEl.remove(), 600);
      } else {
        const hpClass = Math.min(6, Math.max(1, currentHp));
        createdUnitEl.classList.add('pawn-damaged');
        createdUnitEl.innerHTML = `
          <img src="${pawnSrc}" alt="Peón" class="pawn-avatar">
          <span class="pawn-atk-corner">⚔️${currentAtk}</span>
          <span class="pawn-hp-corner hp-${hpClass}">${currentHp}</span>
        `;
        btn.appendChild(createdUnitEl);
        setTimeout(() => createdUnitEl.classList.remove('pawn-damaged'), 400);
      }
    }
  }

  /**
   * Genera partículas cuadradas que viajan desde la unidad hasta el sprite del héroe
   * cuando algo añade tensión (daño por unidad, eliminaciones, habilidades).
   * @param {HTMLElement|{row: number, col: number, playerKey?: string}|{x: number, y: number}} fromSource
   * @param {string} targetPlayerKey 'p1' o 'p2'
   * @param {number} amount Puntos de tensión
   * @param {string} [color] Color de las partículas
   */
  /**
   * Genera partículas cuadradas pixeladas que viajan desde una unidad hasta el sprite del héroe
   * cuando algo añade tensión (daño por unidad, eliminaciones, habilidades).
   * Aparecen justo sobre la unidad, levitan/se reúnen unos instantes por encima de ella y luego
   * vuelan de forma escalonada (no simultánea) hacia el avatar del héroe.
   * @param {HTMLElement|{row: number, col: number, playerKey?: string, id?: string}|{x: number, y: number}} fromSource
   * @param {string} targetPlayerKey 'p1' o 'p2'
   * @param {number} amount Puntos de tensión
   * @param {string} [color] Color de las partículas
   * @param {number} [initialDelay=0] Retraso inicial para secuenciar diferentes unidades
   */
  spawnSquareTensionParticles(fromSource, targetPlayerKey, amount = 1, color = null, initialDelay = 0) {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;
    let sourceEl = null;

    if (fromSource instanceof HTMLElement) {
      sourceEl = fromSource;
    } else if (fromSource && typeof fromSource === 'object') {
      if (fromSource.id) {
        sourceEl = document.querySelector(`[data-pawn-id="${fromSource.id}"]`);
      }

      let sourcePlayerKey = fromSource.playerKey;
      if (!sourcePlayerKey && fromSource.id) {
        if (gameState.p1?.pawns?.some(p => p.id === fromSource.id)) sourcePlayerKey = 'p1';
        else if (gameState.p2?.pawns?.some(p => p.id === fromSource.id)) sourcePlayerKey = 'p2';
      }

      if (typeof fromSource.row === 'number' && typeof fromSource.col === 'number') {
        if (!sourcePlayerKey) {
          if (gameState.p1?.pawns?.some(p => p.row === fromSource.row && p.col === fromSource.col)) {
            sourcePlayerKey = 'p1';
          } else if (gameState.p2?.pawns?.some(p => p.row === fromSource.row && p.col === fromSource.col)) {
            sourcePlayerKey = 'p2';
          } else {
            sourcePlayerKey = targetPlayerKey;
          }
        }
        if (!sourceEl) {
          sourceEl = document.querySelector(`.casilla-btn[data-player="${sourcePlayerKey}"][data-row="${fromSource.row}"][data-col="${fromSource.col}"]`);
        }
      }
    }

    if (sourceEl) {
      const rect = sourceEl.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      // Posicionar el origen en la parte superior del peón (cabeza / borde superior)
      startY = rect.top + Math.min(20, rect.height * 0.28);

      // Resaltar visualmente la unidad que genera tensión
      const unitPawnEl = sourceEl.classList.contains('board-pawn-unit') 
        ? sourceEl 
        : (sourceEl.querySelector('.board-pawn-unit') || sourceEl);

      setTimeout(() => {
        unitPawnEl.classList.add('tension-source-active');
        setTimeout(() => unitPawnEl.classList.remove('tension-source-active'), 1200);
      }, initialDelay);
    } else if (fromSource && typeof fromSource.x === 'number' && typeof fromSource.y === 'number') {
      startX = fromSource.x;
      startY = fromSource.y;
    }

    const heroSpriteEl = document.getElementById(`${targetPlayerKey}-character-sprite`) || document.getElementById(`${targetPlayerKey}-character`);
    let endX = targetPlayerKey === 'p1' ? 120 : window.innerWidth - 120;
    let endY = 160;

    if (heroSpriteEl) {
      const hRect = heroSpriteEl.getBoundingClientRect();
      endX = hRect.left + hRect.width / 2;
      endY = hRect.top + hRect.height / 2;
    }

    const charColor = color || gameState[targetPlayerKey]?.character?.color || (targetPlayerKey === 'p1' ? '#38bdf8' : '#fbbf24');
    // Cantidad de partículas adaptada al valor de tensión (entre 3 y 10)
    const particleCount = Math.min(10, Math.max(3, Math.round(amount * 1.5)));

    let overlay = document.getElementById('tension-particles-container');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tension-particles-container';
      overlay.className = 'tension-particles-layer';
      document.body.appendChild(overlay);
    }

    // Escalado de tiempos: partículas escalonadas (no simultáneas)
    // Cada partícula sale con una cadencia marcada (120ms)
    const staggerStep = 120;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'pixel-tension-square';
      const size = 8 + (i % 3) * 2; // 8px, 10px, 12px
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = charColor;
      p.style.color = charColor;
      p.style.boxShadow = `0 0 6px #fff, 0 0 10px ${charColor}, 0 0 16px ${charColor}`;
      p.style.left = '0px';
      p.style.top = '0px';

      overlay.appendChild(p);

      // Posición inicial justo arriba del peón
      const originX = startX - size / 2;
      const originY = startY - size / 2;
      const targetX = endX - size / 2;
      const targetY = endY - size / 2;

      // Desplazamiento flotante sobre la unidad (entre 26px y 44px por encima)
      const hoverSpreadX = (Math.random() - 0.5) * 28;
      const hoverSpreadY = -(28 + Math.random() * 18);
      const hoverX = originX + hoverSpreadX;
      const hoverY = originY + hoverSpreadY;

      const particleDelay = initialDelay + i * staggerStep;
      const flightDuration = 820;

      // Animación en fases:
      // 1. Emerge y sube flotando por encima de la unidad (offset 0 -> 0.22)
      // 2. Levita suspendida brevemente sobre la cabeza de la unidad (offset 0.22 -> 0.38)
      // 3. Acelera rápidamente hacia el avatar del héroe (offset 0.38 -> 0.88)
      // 4. Detona al absorberse en el sprite del héroe (offset 0.88 -> 1.0)
      p.animate([
        {
          transform: `translate(${originX}px, ${originY}px) scale(0.2)`,
          opacity: 0,
          easing: 'ease-out'
        },
        {
          transform: `translate(${hoverX}px, ${hoverY}px) scale(1.4)`,
          opacity: 1,
          offset: 0.22,
          easing: 'ease-in-out'
        },
        {
          transform: `translate(${hoverX}px, ${hoverY - 4}px) scale(1.15)`,
          opacity: 1,
          offset: 0.38,
          easing: 'cubic-bezier(0.5, 0, 0.2, 1)'
        },
        {
          transform: `translate(${targetX}px, ${targetY}px) scale(0.85)`,
          opacity: 1,
          offset: 0.88,
          easing: 'ease-out'
        },
        {
          transform: `translate(${targetX}px, ${targetY}px) scale(1.8)`,
          opacity: 0,
          offset: 1.0
        }
      ], {
        duration: flightDuration,
        delay: particleDelay,
        fill: 'forwards'
      }).onfinish = () => {
        p.remove();
      };

      // Pulso reactivo en el sprite del héroe conforme cada partícula impacta
      setTimeout(() => {
        if (heroSpriteEl) {
          heroSpriteEl.classList.remove('hero-tension-pulse');
          void heroSpriteEl.offsetWidth;
          heroSpriteEl.classList.add('hero-tension-pulse');
        }
      }, particleDelay + Math.round(flightDuration * 0.88));
    }
  }

  highlightFreeCells(matrix, pawns = [], isCellBlocked = null) {
    const pawnList = Array.isArray(pawns) ? pawns : [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!matrix[r] || !matrix[r][c]) continue;
        const btn = matrix[r][c].btn;
        const isOccupied = pawnList.some(p => p && p.row === r && p.col === c && p.hp > 0);
        const isBlocked = isCellBlocked ? isCellBlocked(r, c) : false;
        btn.classList.remove('state-active', 'state-hit', 'state-miss');
        if (!isOccupied && !isBlocked) {
          btn.classList.remove('state-off');
          btn.classList.add('state-active');
        } else {
          btn.classList.remove('state-active');
          btn.classList.add('state-off');
        }
      }
    }
  }

  clearPawnHighlights() {
    document.querySelectorAll('.casilla-btn').forEach(btn => {
      btn.classList.remove('state-active');
      if (!btn.classList.contains('state-hit') && !btn.classList.contains('state-miss')) {
        btn.classList.add('state-off');
      }
    });
  }

  triggerAttackAnimations() {
    if (this.p1Character) this.p1Character.classList.add('active-attack-anim');
    if (this.p2Character) this.p2Character.classList.add('active-attack-anim');
  }

  clearAttackAnimations() {
    if (this.p1Character) this.p1Character.classList.remove('active-attack-anim');
    if (this.p2Character) this.p2Character.classList.remove('active-attack-anim');
  }

  triggerHurtAnimation(player) {
    const char = player === 'p1' ? this.p1Character : this.p2Character;
    if (char) char.classList.add('active-hurt-anim');
  }

  clearHurtAnimations() {
    if (this.p1Character) this.p1Character.classList.remove('active-hurt-anim');
    if (this.p2Character) this.p2Character.classList.remove('active-hurt-anim');
  }

  showReactionBadge(player, text, cssClass) {
    const badge = player === 'p1' ? this.p1Reaction : this.p2Reaction;
    if (badge) {
      badge.textContent = text;
      badge.className = `character-reaction-badge ${cssClass}`;
    }
  }

  showAbilityActivation(player, message = 'Habilidad activada') {
    this.showReactionBadge(player, message, 'show-ability show-placeholder');

    const panelId = player === 'p1' ? 'player-1-panel' : 'player-2-panel';
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.querySelectorAll('.ability-activation-banner, .placeholder-activation-banner').forEach(el => el.remove());
      const banner = document.createElement('div');
      banner.className = 'ability-activation-banner placeholder-activation-banner';
      banner.innerHTML = `<span class="ability-icon placeholder-icon">⚡</span> ${message}`;
      panel.appendChild(banner);

      setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 400);
      }, 1600);
    }

    if (!this.abilityBadgeTimeouts) this.abilityBadgeTimeouts = {};
    if (this.abilityBadgeTimeouts[player]) {
      clearTimeout(this.abilityBadgeTimeouts[player]);
    }
    this.abilityBadgeTimeouts[player] = setTimeout(() => {
      const badge = player === 'p1' ? this.p1Reaction : this.p2Reaction;
      if (badge && (badge.classList.contains('show-ability') || badge.classList.contains('show-placeholder'))) {
        badge.className = 'character-reaction-badge';
      }
    }, 2000);
  }

  showPlaceholderActivation(player, message) {
    this.showAbilityActivation(player, message);
  }

  hideReactionBadge(player) {
    const badge = player === 'p1' ? this.p1Reaction : this.p2Reaction;
    if (badge) badge.className = 'character-reaction-badge';
  }

  hideReactionBadges() {
    if (this.p1Reaction) this.p1Reaction.className = 'character-reaction-badge';
    if (this.p2Reaction) this.p2Reaction.className = 'character-reaction-badge';
  }

  shakeScreen() {
    if (this.gameWrapper) {
      this.gameWrapper.classList.add('screen-shake');
      setTimeout(() => this.gameWrapper.classList.remove('screen-shake'), 450);
    }
  }

  updatePrestigeUI(player, prestigeVal, options = {}) {
    const targets = player === 'both' ? ['p1', 'p2'] : [player];
    targets.forEach(p => {
      const targetVal = Math.max(0, Math.min(100, Math.round(prestigeVal)));
      const startVal = this.prestigeValues[p] || 0;
      const delta = targetVal - startVal;

      const widgetEl = document.getElementById(`${p}-prestige-widget`);
      const valEl = document.getElementById(`${p}-prestige-val`);
      const barEl = document.getElementById(`${p}-prestige-bar`);
      const trailEl = document.getElementById(`${p}-prestige-trail`);
      const floatContainerEl = document.getElementById(`${p}-prestige-float`);

      // 1. Actualizar barras (Barra blanca sale primero y luego se rellena con el degradado)
      if (delta > 0) {
        // GANANCIA: Primero sale disparada la barra blanca (trail), y luego la barra de color (fill) se rellena sobre ella
        if (trailEl) {
          trailEl.style.transition = 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          trailEl.style.width = `${targetVal}%`;
        }
        if (barEl) {
          barEl.style.transition = 'width 0.55s cubic-bezier(0.25, 1, 0.5, 1) 0.18s';
          barEl.style.width = `${targetVal}%`;
        }
      } else if (delta < 0) {
        // PÉRDIDA: La barra de color baja rápido y la barra blanca se retarda antes de encogerse
        if (barEl) {
          barEl.style.transition = 'width 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
          barEl.style.width = `${targetVal}%`;
        }
        if (trailEl) {
          trailEl.style.transition = 'width 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.25s';
          trailEl.style.width = `${targetVal}%`;
        }
      } else {
        // RESET / INICIALIZACIÓN DIRECTA
        if (barEl) {
          barEl.style.transition = 'none';
          barEl.style.width = `${targetVal}%`;
        }
        if (trailEl) {
          trailEl.style.transition = 'none';
          trailEl.style.width = `${targetVal}%`;
        }
      }

      // 2. Animación de rebote/pulso en la caja del widget
      if (widgetEl && delta !== 0) {
        widgetEl.classList.remove('prestige-gain-bump', 'prestige-loss-bump');
        // Force reflow
        void widgetEl.offsetWidth;
        if (delta > 0) {
          widgetEl.classList.add('prestige-gain-bump');
        } else {
          widgetEl.classList.add('prestige-loss-bump');
        }
      }

      // 3. Indicador flotante numérico (+15, -10)
      if (floatContainerEl && delta !== 0 && !options.silent) {
        const floatEl = document.createElement('div');
        const sign = delta > 0 ? '+' : '';
        floatEl.className = `prestige-float-num ${delta > 0 ? 'positive' : 'negative'}`;
        floatEl.textContent = `${sign}${delta}`;
        // Posicionar horizontalmente según el % actual aproximado para un efecto visual dinámico
        const leftPercent = Math.max(10, Math.min(85, targetVal));
        floatEl.style.left = `${leftPercent}%`;

        floatContainerEl.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 1100);
      }

      // 4. Interpolación suave del número [ X / 100 ]
      if (valEl) {
        if (this.prestigeAnimFrames[p]) {
          cancelAnimationFrame(this.prestigeAnimFrames[p]);
        }

        const duration = 600; // ms
        const startTime = performance.now();

        const animateNumber = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          // Easing cubic out
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentInterpolated = Math.round(startVal + delta * easeProgress);

          valEl.textContent = `[${currentInterpolated} / 100]`;

          if (progress < 1) {
            this.prestigeAnimFrames[p] = requestAnimationFrame(animateNumber);
          } else {
            valEl.textContent = `[${targetVal} / 100]`;
            this.prestigeValues[p] = targetVal;
          }
        };

        this.prestigeAnimFrames[p] = requestAnimationFrame(animateNumber);
      } else {
        this.prestigeValues[p] = targetVal;
      }
    });
  }

  updateRoundUI(roundNum, phaseType = 'placement') {
    const roundValEl = document.getElementById('round-num-val');
    if (roundValEl) {
      if (roundValEl.textContent !== String(roundNum)) {
        roundValEl.textContent = roundNum;
        roundValEl.classList.remove('val-pop');
        void roundValEl.offsetWidth;
        roundValEl.classList.add('val-pop');
      }
    }

    let text = 'COLOCAR';
    let theme = 'placement';

    if (phaseType === 'attack' || phaseType === 'baile' || phaseType === 'resolution') {
      text = 'ATAQUE';
      theme = 'attack';
    } else {
      text = 'COLOCAR';
      theme = 'placement';
    }

    this.updateRoundDrawer(text, theme);
  }

  updateRoundDrawer(text, theme = 'placement') {
    const drawerEl = document.getElementById('round-drawer-badge');
    const textEl = document.getElementById('round-drawer-text');

    if (!drawerEl || !textEl) return;

    textEl.textContent = text;
    drawerEl.className = `phase-tag-banner phase-${theme}`;
  }

  dockDiceOverlays() {
    if (this.p1RollOverlay) this.p1RollOverlay.className = 'board-roll-overlay active-docked';
    if (this.p2RollOverlay) this.p2RollOverlay.className = 'board-roll-overlay active-docked';
  }

  clearDiceOverlays() {
    if (this.p1RollOverlay) this.p1RollOverlay.className = 'board-roll-overlay';
    if (this.p2RollOverlay) this.p2RollOverlay.className = 'board-roll-overlay';
  }

  clearBoardEffects() {
    document.querySelectorAll('.casilla-btn').forEach(btn => {
      btn.classList.remove('cell-damage-flash', 'state-hit', 'state-miss', 'state-active', 'state-player', 'state-scan-enemy', 'state-scan-empty');
      btn.classList.add('state-off');
    });
  }

  rotateBoards(rotated = true) {
    const cluster = document.getElementById('boards-cluster');
    if (!cluster) return;
    if (rotated) {
      cluster.classList.add('rotated-180');
    } else {
      cluster.classList.remove('rotated-180');
    }
  }

  resetBoardsRotation() {
    this.rotateBoards(false);
  }

  setPlayerReadyCheckbox(player, isReady, gameMode = 'vs-ai', disabled = false) {
    const bar = document.getElementById(`${player}-ready-bar`);
    const check = document.getElementById(`${player}-ready-checkbox`);
    const textLabel = document.getElementById(`${player}-ready-text-label`);

    if (!bar || !check || !textLabel) return;

    if (disabled) {
      bar.classList.add('is-disabled');
      bar.classList.remove('is-ready');
      check.disabled = true;
      check.checked = false;
      textLabel.textContent = 'ESPERA';
      return;
    }

    bar.classList.remove('is-disabled');

    const isBot = (gameMode === 'vs-ai' && player === 'p2');
    if (isBot) {
      check.disabled = true;
      bar.style.pointerEvents = 'none';
      check.checked = isReady;
      if (isReady) {
        bar.classList.add('is-ready');
        textLabel.textContent = 'IA LISTA';
      } else {
        bar.classList.remove('is-ready');
        textLabel.textContent = 'PENSANDO';
      }
      return;
    }

    check.disabled = false;
    bar.style.pointerEvents = 'auto';
    check.checked = isReady;

    if (isReady) {
      bar.classList.add('is-ready');
      textLabel.textContent = '¡LISTO!';
    } else {
      bar.classList.remove('is-ready');
      textLabel.textContent = 'LISTO';
    }
  }

  updateReadyCheckboxes(p1Ready, p2Ready, gameMode = 'vs-ai', disabled = false) {
    this.setPlayerReadyCheckbox('p1', p1Ready, gameMode, disabled);
    this.setPlayerReadyCheckbox('p2', p2Ready, gameMode, disabled);
  }
}

export const feedback = new FeedbackManager();
