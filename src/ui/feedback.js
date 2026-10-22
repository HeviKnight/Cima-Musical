// ===================================================
// GESTOR DE FEEDBACK VISUAL Y CLASES DOM (UI)
// ===================================================

import { CONTROLS, getControlScheme, CONTROL_SCHEMES, getCellDisplay } from '../data/controls.js';
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
      if (event === 'chargeGained' || event === 'prestigeChange' || event === 'roundReset' || event === 'characterSelect') {
        if (payload?.player) {
          this.updateAbilityChargesUI(payload.player);
        } else {
          this.updateAbilityChargesUI('both');
        }
      }
    });

    this.updateAbilityChargesUI('both');
  }

  updateAbilityChargesUI(player = 'both') {
    const targets = player === 'both' ? ['p1', 'p2'] : [player];
    targets.forEach(p => {
      const container = document.getElementById(`${p}-charges-slots`);
      const furnaceContainer = document.getElementById(`${p}-furnace-slots`);
      const abilityBtn = document.getElementById(`${p}-ability-btn`);
      const hornoText = document.getElementById(`${p}-horno-text`);
      const pState = gameState[p];
      if (!pState) return;

      const char = pState.character;
      const maxCharges = pState.maxAbilityCharges || char?.activeAbility?.maxCharges || 1;
      const currentCharges = pState.activeAbilityCharges ?? 0;

      // 1. Indicadores de Cargas de Habilidad del Héroe
      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < maxCharges; i++) {
          const slot = document.createElement('div');
          const isAvailable = i < currentCharges;
          slot.className = `charge-icon-slot ${isAvailable ? 'active' : 'empty'}`;
          slot.title = isAvailable ? `Carga ${i + 1}/${maxCharges} Disponible` : `Carga ${i + 1}/${maxCharges} Vacía`;

          slot.innerHTML = `
            <img src="${isAvailable ? '/assets/sprites/UI/UI_Hero_Skill.svg' : '/assets/sprites/UI/UI_Hero_Skill_empty.svg'}"
                 class="charge-icon-img ${isAvailable ? 'charge-full' : 'charge-empty'}"
                 alt="${isAvailable ? 'Carga Activa' : 'Carga Vacía'}" draggable="false" />
          `;
          container.appendChild(slot);
        }
      }

      // 2. Indicadores de Cargas del Horno (Furnace) si el héroe es Incinerador
      if (furnaceContainer) {
        furnaceContainer.innerHTML = '';
        const hornoCount = pState.hornoCount || 0;
        for (let i = 0; i < 3; i++) {
          const isFilled = i < hornoCount;
          const slot = document.createElement('div');
          slot.className = `furnace-scrap-slot ${isFilled ? 'active' : 'empty'}`;
          slot.title = isFilled ? `Chatarra ${i + 1}/3 Acumulada` : `Horno ${i + 1}/3 Vacío`;

          slot.innerHTML = `
            <img src="${isFilled ? '/assets/sprites/UI/UI_Furnance_Scrap.svg' : '/assets/sprites/UI/UI_Furnance_Scrap_empty.svg'}"
                 class="furnace-scrap-img ${isFilled ? 'scrap-full' : 'scrap-empty'}"
                 alt="${isFilled ? 'Chatarra Activa' : 'Horno Vacío'}" draggable="false" />
          `;
          furnaceContainer.appendChild(slot);
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
      const descEl = curtain ? curtain.querySelector('.curtain-desc') : null;

      if (!curtain) return;

      if (descEl) {
        if (mode === 'black' && promptText) {
          descEl.style.display = 'block';
          descEl.textContent = promptText;
        } else {
          descEl.style.display = 'none';
          descEl.textContent = '';
        }
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
        curtain.classList.remove('active-black', 'active-green', 'curtain-action-select-mode');
        if (descEl) descEl.style.display = 'none';
      } else if (mode === 'black') {
        curtain.classList.remove('active-green');
        curtain.classList.add('active-black');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
        if (keyCapEl) {
          if (customKeyHTML === false) {
            // Elimina por completo el indicador de enter y espacio (sin div adicional)
            keyCapEl.style.display = 'none';
            keyCapEl.innerHTML = '';
          } else if (customKeyHTML !== null) {
            keyCapEl.style.display = 'flex';
            keyCapEl.classList.add('has-choices');
            curtain.classList.add('curtain-action-select-mode');
            keyCapEl.innerHTML = customKeyHTML;
          } else {
            keyCapEl.style.display = 'flex';
            keyCapEl.classList.remove('has-choices');
            curtain.classList.remove('curtain-action-select-mode');
            const isMat = getControlScheme() === CONTROL_SCHEMES.DANCE_MAT;
            keyCapEl.textContent = isMat ? 'START' : (p === 'p1' ? 'ESPACIO' : 'ENTER');
          }
        }
      } else if (mode === 'green') {
        curtain.classList.remove('active-black', 'curtain-action-select-mode');
        curtain.classList.add('active-green');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
        if (descEl) descEl.style.display = 'none';
        if (keyCapEl) {
          keyCapEl.style.display = 'none';
        }
      }
    });
  }


  updateKeyTags(mode, gameMode = 'vs-ai') {
    const isDanceMat = getControlScheme() === CONTROL_SCHEMES.DANCE_MAT;
    const p1Keys = [['Q', 'W', 'E'], ['A', 'S', 'D'], ['Z', 'X', 'C']];
    const p2Keys = [['U', 'I', 'O'], ['J', 'K', 'L'], ['M', ',', '.']];

    const p1Btns = document.querySelectorAll('#p1-grid .casilla-btn');
    const p2Btns = document.querySelectorAll('#p2-grid .casilla-btn');

    const applyCellDisplay = (btn, r, c, fallbackKey) => {
      const tag = btn.querySelector('.key-tag');
      if (!tag) return;
      if (isDanceMat) {
        const display = getCellDisplay(r, c, fallbackKey);
        btn.classList.add('is-mat-mode');
        tag.innerHTML = `<span class="mat-icon-tag ${display.iconClass}" title="${display.label}">${display.symbol}</span>`;
      } else {
        btn.classList.remove('is-mat-mode');
        tag.textContent = fallbackKey || '';
      }
    };

    if (mode === 'attack') {
      // En fase de ataque: P1 (humano) ataca sobre el tablero de P2, por lo que ve sus controles (alfombra o Q,W,E...)
      p2Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const key = p1Keys[r]?.[c] || '';
        applyCellDisplay(btn, r, c, key);
      });

      // En el tablero de P1: En vs-ai no se muestra ninguna tecla (la IA ataca automáticamente). En 2P local muestra controles de P2.
      p1Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const tag = btn.querySelector('.key-tag');
        if (!tag) return;
        if (gameMode === 'vs-ai') {
          btn.classList.remove('is-mat-mode');
          tag.textContent = '';
        } else {
          const key = p2Keys[r]?.[c] || '';
          applyCellDisplay(btn, r, c, key);
        }
      });
    } else {
      // En fase de colocación: P1 ve sus controles en su propio tablero.
      p1Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const key = p1Keys[r]?.[c] || '';
        applyCellDisplay(btn, r, c, key);
      });

      // En el tablero de P2: En vs-ai NO se muestran teclas. En 2P local se muestran las de P2.
      p2Btns.forEach(btn => {
        const r = parseInt(btn.getAttribute('data-row'), 10);
        const c = parseInt(btn.getAttribute('data-col'), 10);
        const tag = btn.querySelector('.key-tag');
        if (!tag) return;
        if (gameMode === 'vs-ai') {
          btn.classList.remove('is-mat-mode');
          tag.textContent = '';
        } else {
          const key = p2Keys[r]?.[c] || '';
          applyCellDisplay(btn, r, c, key);
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
        const atkVal = pawn.atk ?? 0;
        const shieldVal = pawn.shield || 0;

        const atkHTML = `
          <div class="pawn-stat-badge pawn-stat-atk pawn-atk-corner" title="Ataque (Genera tensión): ${atkVal}">
            <img src="/assets/sprites/UI/UI_PawnIcon_Atk.svg" alt="Ataque" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">${atkVal}</span>
          </div>`;

        const hpHTML = `
          <div class="pawn-stat-badge pawn-stat-hp pawn-hp-corner hp-${hpClass}" title="Vida: ${pawn.hp}">
            <img src="/assets/sprites/UI/UI_PawnIcon_HP.svg" alt="Vida" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">${pawn.hp}</span>
          </div>`;

        const shieldHTML = (shieldVal > 0) ? `
          <div class="pawn-stat-badge pawn-stat-shield pawn-shield-corner" title="Escudo (+${shieldVal})">
            <img src="/assets/sprites/UI/UI_PawnIcon_Shield.svg" alt="Escudo" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">${shieldVal}</span>
          </div>` : '';



        unitEl.innerHTML = `
          <img src="${pawnSrc}" alt="${pawn.name || 'Peón'}" class="pawn-avatar ${isDust ? 'dust-hidden' : ''}">
          ${atkHTML}
          ${hpHTML}
          ${shieldHTML}
        `;
        cell.btn.appendChild(unitEl);
      });
    };

    renderList(p1Matrix, p1Pawns, 'p1');
    renderList(p2Matrix, p2Pawns, 'p2');
  }

  /**
   * Genera número flotante de daño o escudo sobre el peón/casilla
   */
  spawnFloatingDamage(sourceEl, amount = 1, isShield = false) {
    if (!sourceEl) return;
    const center = this.getScreenCenter(sourceEl);
    const floatEl = document.createElement('div');
    floatEl.className = `pawn-combat-float ${isShield ? 'float-shield' : 'float-damage'}`;
    floatEl.innerHTML = isShield ? `ABSORBE ${amount}` : `-${amount}`;
    floatEl.style.left = `${center.x}px`;
    floatEl.style.top = `${center.y - 12}px`;
    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1450);
  }

  /**
   * Genera número/texto flotante de buff sobre el peón/casilla
   */
  spawnFloatingBuff(sourceEl, text, type = 'atk') {
    if (!sourceEl) return;
    const center = this.getScreenCenter(sourceEl);
    const floatEl = document.createElement('div');
    floatEl.className = `pawn-combat-float float-buff buff-${type}`;
    floatEl.innerHTML = text;
    floatEl.style.left = `${center.x}px`;
    floatEl.style.top = `${center.y - 12}px`;
    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1450);
  }

  animatePawnHit(matrix, row, col, isDestroyed = false, pawnOrHp = 0, targetPlayer = 'p2', damageAmount = 1, absorbedShield = 0) {
    if (!matrix || !matrix[row] || !matrix[row][col]) return;
    const btn = matrix[row][col].btn;
    if (!btn) return;

    if (absorbedShield > 0) {
      this.spawnFloatingDamage(btn, absorbedShield, true);
    }
    if (damageAmount > 0) {
      this.spawnFloatingDamage(btn, damageAmount, false);
    }

    const currentHp = typeof pawnOrHp === 'object' ? (pawnOrHp.hp || 0) : (parseInt(pawnOrHp, 10) || 0);
    const currentAtk = typeof pawnOrHp === 'object' ? (pawnOrHp.atk ?? 0) : 0;
    const currentShield = typeof pawnOrHp === 'object' ? (pawnOrHp.shield || 0) : 0;
    const unitEl = btn.querySelector('.board-pawn-unit');

    if (unitEl) {
      if (isDestroyed) {
        unitEl.classList.remove('pawn-damaged', 'pawn-hit-flash');
        unitEl.classList.add('pawn-destroyed');
        this.spawnDeathParticles(btn);
        setTimeout(() => unitEl.remove(), 650);
      } else {
        unitEl.classList.remove('pawn-damaged', 'pawn-hit-flash');
        void unitEl.offsetWidth;
        unitEl.classList.add('pawn-hit-flash');
        this.spawnHitParticles(btn);

        const hpBadge = unitEl.querySelector('.pawn-hp-corner');
        if (hpBadge) {
          const hpClass = Math.min(6, Math.max(1, currentHp));
          hpBadge.className = `pawn-stat-badge pawn-stat-hp pawn-hp-corner hp-${hpClass}`;
          const numSpan = hpBadge.querySelector('.pawn-stat-num');
          if (numSpan) {
            numSpan.textContent = currentHp;
          } else {
            hpBadge.textContent = currentHp;
          }
          hpBadge.title = `Vida: ${currentHp}`;
        }
        const atkBadge = unitEl.querySelector('.pawn-atk-corner');
        if (atkBadge) {
          const numSpan = atkBadge.querySelector('.pawn-stat-num');
          if (numSpan) {
            numSpan.textContent = currentAtk;
          } else {
            atkBadge.textContent = currentAtk;
          }
          atkBadge.title = `Ataque: ${currentAtk}`;
        }
        let shieldBadge = unitEl.querySelector('.pawn-shield-corner');
        if (currentShield > 0) {
          if (shieldBadge) {
            const numSpan = shieldBadge.querySelector('.pawn-stat-num');
            if (numSpan) numSpan.textContent = currentShield;
            shieldBadge.title = `Escudo (+${currentShield})`;
          } else {
            const newShieldBadge = document.createElement('div');
            newShieldBadge.className = 'pawn-stat-badge pawn-stat-shield pawn-shield-corner';
            newShieldBadge.title = `Escudo (+${currentShield})`;
            newShieldBadge.innerHTML = `
              <img src="/assets/sprites/UI/UI_PawnIcon_Shield.svg" alt="Escudo" class="pawn-stat-svg" draggable="false">
              <span class="pawn-stat-num">${currentShield}</span>
            `;
            unitEl.appendChild(newShieldBadge);
          }
        } else if (shieldBadge) {
          shieldBadge.remove();
        }

        const img = unitEl.querySelector('.pawn-avatar');
        if (img) {
          img.src = getPawnSprite(pawnOrHp, targetPlayer);
        }
        setTimeout(() => unitEl.classList.remove('pawn-hit-flash'), 550);
      }
    } else {
      const pawnSrc = getPawnSprite(pawnOrHp, targetPlayer);
      const createdUnitEl = document.createElement('div');
      createdUnitEl.className = 'board-pawn-unit';

      if (isDestroyed) {
        createdUnitEl.classList.add('pawn-destroyed');
        createdUnitEl.innerHTML = `
          <img src="${pawnSrc}" alt="Peón Eliminado" class="pawn-avatar">
          <div class="pawn-stat-badge pawn-stat-hp pawn-hp-corner hp-1" title="Vida: 0">
            <img src="/assets/sprites/UI/UI_PawnIcon_HP.svg" alt="Vida" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">0</span>
          </div>
        `;
        btn.appendChild(createdUnitEl);
        this.spawnDeathParticles(btn);
        setTimeout(() => createdUnitEl.remove(), 650);
      } else {
        const hpClass = Math.min(6, Math.max(1, currentHp));
        createdUnitEl.classList.add('pawn-hit-flash');
        const shieldHTML = (currentShield > 0) ? `
          <div class="pawn-stat-badge pawn-stat-shield pawn-shield-corner" title="Escudo (+${currentShield})">
            <img src="/assets/sprites/UI/UI_PawnIcon_Shield.svg" alt="Escudo" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">${currentShield}</span>
          </div>` : '';
        createdUnitEl.innerHTML = `
          <img src="${pawnSrc}" alt="Peón" class="pawn-avatar">
          <div class="pawn-stat-badge pawn-stat-atk pawn-atk-corner" title="Ataque: ${currentAtk}">
            <img src="/assets/sprites/UI/UI_PawnIcon_Atk.svg" alt="Ataque" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">${currentAtk}</span>
          </div>
          <div class="pawn-stat-badge pawn-stat-hp pawn-hp-corner hp-${hpClass}" title="Vida: ${currentHp}">
            <img src="/assets/sprites/UI/UI_PawnIcon_HP.svg" alt="Vida" class="pawn-stat-svg" draggable="false">
            <span class="pawn-stat-num">${currentHp}</span>
          </div>
          ${shieldHTML}
        `;
        btn.appendChild(createdUnitEl);
        this.spawnHitParticles(btn);
        setTimeout(() => createdUnitEl.classList.remove('pawn-hit-flash'), 550);
      }
    }
  }

  /**
   * Animación visual de concesión de escudo: parpadeo azul de 1s, crecimiento y ráfaga de partículas azules
   */
  animateShieldGrant(playerKey, row, col, shieldAmount = 1) {
    const gridId = playerKey === 'p1' ? '#p1-grid' : '#p2-grid';
    const btn = document.querySelector(`${gridId} .casilla-btn[data-row="${row}"][data-col="${col}"]`);
    if (!btn) return;

    btn.classList.add('cell-shield-pulse');
    setTimeout(() => btn.classList.remove('cell-shield-pulse'), 1000);

    const unitEl = btn.querySelector('.board-pawn-unit');
    if (unitEl) {
      unitEl.classList.remove('pawn-shield-gain');
      void unitEl.offsetWidth;
      unitEl.classList.add('pawn-shield-gain');
      setTimeout(() => unitEl.classList.remove('pawn-shield-gain'), 1000);
    }

    this.spawnShieldParticles(btn);
    this.spawnFloatingBuff(btn, `+${shieldAmount} ESCUDO`, 'shield');

    const effect = document.createElement('div');
    effect.className = 'shield-grant-effect-layer';
    effect.innerHTML = `
      <div class="shield-grant-ring"></div>
      <img src="/assets/sprites/UI/UI_PawnIcon_Shield.svg" class="shield-grant-burst-svg" alt="Escudo">
      <div class="shield-grant-tag">+${shieldAmount} ESCUDO</div>
    `;
    btn.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);

    const shieldBadge = btn.querySelector('.pawn-stat-shield');
    if (shieldBadge) {
      shieldBadge.classList.add('shield-stat-boost');
      setTimeout(() => shieldBadge.classList.remove('shield-stat-boost'), 1000);
    }
  }

  /**
   * Animación visual de buff de stats: parpadeo verde, crecimiento y partículas ascendentes
   */
  animateStatBuff(playerKey, row, col, statType = 'atk', amount = 1) {
    const gridId = playerKey === 'p1' ? '#p1-grid' : '#p2-grid';
    const btn = document.querySelector(`${gridId} .casilla-btn[data-row="${row}"][data-col="${col}"]`);
    if (!btn) return;

    btn.classList.add('cell-atk-pulse');
    setTimeout(() => btn.classList.remove('cell-atk-pulse'), 900);

    const unitEl = btn.querySelector('.board-pawn-unit');
    if (unitEl) {
      unitEl.classList.remove('pawn-stat-gain');
      void unitEl.offsetWidth;
      unitEl.classList.add('pawn-stat-gain');
      setTimeout(() => unitEl.classList.remove('pawn-stat-gain'), 900);

      // Actualizar visualmente los badges en el DOM para feedback instantáneo
      if (statType === 'atk' || statType === 'all') {
        const atkSpan = unitEl.querySelector('.pawn-atk-corner .pawn-stat-num');
        if (atkSpan) atkSpan.textContent = (parseInt(atkSpan.textContent, 10) || 0) + amount;
      }
      if (statType === 'hp' || statType === 'all') {
        const hpSpan = unitEl.querySelector('.pawn-hp-corner .pawn-stat-num');
        if (hpSpan) {
          const newHp = (parseInt(hpSpan.textContent, 10) || 0) + amount;
          hpSpan.textContent = newHp;
          const hpBadge = unitEl.querySelector('.pawn-hp-corner');
          if (hpBadge) {
            hpBadge.className = hpBadge.className.replace(/\bhp-\d\b/g, '').trim();
            hpBadge.classList.add(`hp-${Math.min(6, Math.max(1, newHp))}`);
          }
        }
      }
      if (statType === 'heal') {
        const hpSpan = unitEl.querySelector('.pawn-hp-corner .pawn-stat-num');
        if (hpSpan) {
          hpSpan.textContent = amount; // amount es la vida curada resultante
          const hpBadge = unitEl.querySelector('.pawn-hp-corner');
          if (hpBadge) {
            hpBadge.className = hpBadge.className.replace(/\bhp-\d\b/g, '').trim();
            hpBadge.classList.add(`hp-${Math.min(6, Math.max(1, amount))}`);
          }
        }
      }
    }

    this.spawnStatParticles(btn);

    if (statType !== 'heal') {
      let label = `+${amount} ${statType.toUpperCase()}`;
      if (statType === 'all') label = `+${amount}/+${amount}`;
      this.spawnFloatingBuff(btn, label, statType);

      const iconSrc = statType === 'hp' ? '/assets/sprites/UI/UI_PawnIcon_HP.svg' : '/assets/sprites/UI/UI_PawnIcon_Atk.svg';

      const effect = document.createElement('div');
      effect.className = 'atk-grant-effect-layer';
      effect.innerHTML = `
        <div class="atk-grant-ring"></div>
        <img src="${iconSrc}" class="atk-grant-burst-svg" alt="Stat">
        <div class="atk-grant-tag">${label}</div>
      `;
      btn.appendChild(effect);
      setTimeout(() => effect.remove(), 900);
    } else {
      // Para la cura, solo anillo verde de curación sin texto flotante
      const effect = document.createElement('div');
      effect.className = 'atk-grant-effect-layer';
      effect.innerHTML = `
        <div class="atk-grant-ring"></div>
        <img src="/assets/sprites/UI/UI_PawnIcon_HP.svg" class="atk-grant-burst-svg" alt="Vida">
      `;
      btn.appendChild(effect);
      setTimeout(() => effect.remove(), 900);
    }
  }

  /**
   * Helper para obtener el contenedor global de partículas
   */
  getOrCreateParticleContainer() {
    let overlay = document.getElementById('tension-particles-container');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tension-particles-container';
      overlay.className = 'tension-particles-layer';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  /**
   * Obtiene las coordenadas en pantalla (viewport) de un elemento o casilla
   */
  getScreenCenter(source, defaultPlayerKey = null) {
    if (!source) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    if (source instanceof HTMLElement) {
      const rect = source.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    if (typeof source.x === 'number' && typeof source.y === 'number') {
      return { x: source.x, y: source.y };
    }
    if (typeof source === 'object') {
      if (source.id) {
        const pEl = document.querySelector(`[data-pawn-id="${source.id}"]`);
        if (pEl) {
          const rect = pEl.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      }
      let pKey = source.playerKey || defaultPlayerKey;
      if (!pKey && source.id) {
        if (gameState?.p1?.pawns?.some(p => p.id === source.id)) pKey = 'p1';
        else if (gameState?.p2?.pawns?.some(p => p.id === source.id)) pKey = 'p2';
      }
      if (typeof source.row === 'number' && typeof source.col === 'number') {
        if (!pKey) {
          if (gameState?.p1?.pawns?.some(p => p.row === source.row && p.col === source.col)) pKey = 'p1';
          else if (gameState?.p2?.pawns?.some(p => p.row === source.row && p.col === source.col)) pKey = 'p2';
        }
        if (pKey) {
          const btn = document.querySelector(`#${pKey}-grid .casilla-btn[data-row="${source.row}"][data-col="${source.col}"]`);
          if (btn) {
            const rect = btn.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          }
        }
        const fallbackBtn = document.querySelector(`.casilla-btn[data-row="${source.row}"][data-col="${source.col}"]`);
        if (fallbackBtn) {
          const rect = fallbackBtn.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      }
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  /**
   * Partículas de Escudo: Ráfaga circular de partículas cuadradas azules / cian
   */
  spawnShieldParticles(source) {
    const { x: startX, y: startY } = this.getScreenCenter(source);
    const overlay = this.getOrCreateParticleContainer();
    const colors = ['#38bdf8', '#67e8f9', '#0284c7', '#bae6fd', '#ffffff'];
    const count = 14;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'pixel-fx-square';
      const size = 6 + (i % 3) * 2;
      const col = colors[i % colors.length];
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = col;
      p.style.left = '0px';
      p.style.top = '0px';
      p.style.boxShadow = `0 0 6px ${col}, 0 0 12px ${col}`;
      overlay.appendChild(p);

      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
      const dist = 32 + Math.random() * 28;
      const endX = startX + Math.cos(angle) * dist - size / 2;
      const endY = startY + Math.sin(angle) * dist - 12 - size / 2;
      const originX = startX - size / 2;
      const originY = startY - size / 2;

      p.animate([
        {
          transform: `translate(${originX}px, ${originY}px) scale(0.2) rotate(0deg)`,
          opacity: 0
        },
        {
          transform: `translate(${originX + (endX - originX) * 0.4}px, ${originY + (endY - originY) * 0.4}px) scale(1.3) rotate(45deg)`,
          opacity: 1,
          offset: 0.25
        },
        {
          transform: `translate(${endX}px, ${endY}px) scale(0.9) rotate(90deg)`,
          opacity: 0.8,
          offset: 0.7
        },
        {
          transform: `translate(${endX}px, ${endY - 14}px) scale(0) rotate(135deg)`,
          opacity: 0,
          offset: 1.0
        }
      ], {
        duration: 850 + Math.random() * 150,
        easing: 'cubic-bezier(0.2, 0.9, 0.4, 1.1)',
        fill: 'forwards'
      }).onfinish = () => p.remove();
    }
  }

  /**
   * Partículas de Daño / Impacto: Chispas cuadradas rojas / ámbar / blancas
   */
  spawnHitParticles(source) {
    const { x: startX, y: startY } = this.getScreenCenter(source);
    const overlay = this.getOrCreateParticleContainer();
    const colors = ['#ef4444', '#f87171', '#fbbf24', '#fca5a5', '#ffffff'];
    const count = 14;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'pixel-fx-square';
      const size = 6 + (i % 3) * 2;
      const col = colors[i % colors.length];
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = col;
      p.style.left = '0px';
      p.style.top = '0px';
      p.style.boxShadow = `0 0 6px ${col}, 0 0 10px #ef4444`;
      overlay.appendChild(p);

      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const dist = 28 + Math.random() * 32;
      const originX = startX - size / 2;
      const originY = startY - size / 2;
      const endX = originX + Math.cos(angle) * dist;
      const endY = originY + Math.sin(angle) * dist + 10;

      p.animate([
        {
          transform: `translate(${originX}px, ${originY}px) scale(0.3)`,
          opacity: 1
        },
        {
          transform: `translate(${originX + (endX - originX) * 0.5}px, ${originY + (endY - originY) * 0.5 - 12}px) scale(1.4)`,
          opacity: 1,
          offset: 0.3
        },
        {
          transform: `translate(${endX}px, ${endY}px) scale(0)`,
          opacity: 0,
          offset: 1.0
        }
      ], {
        duration: 500 + Math.random() * 150,
        easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
        fill: 'forwards'
      }).onfinish = () => p.remove();
    }
  }

  /**
   * Partículas de Estadísticas: Partículas cuadradas verdes / doradas que flotan hacia arriba
   */
  spawnStatParticles(source) {
    const { x: startX, y: startY } = this.getScreenCenter(source);
    const overlay = this.getOrCreateParticleContainer();
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#ffffff'];
    const count = 16;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'pixel-fx-square';
      const size = 6 + (i % 3) * 2;
      const col = colors[i % colors.length];
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = col;
      p.style.left = '0px';
      p.style.top = '0px';
      p.style.boxShadow = `0 0 6px ${col}, 0 0 12px ${col}`;
      overlay.appendChild(p);

      const offsetX = (Math.random() - 0.5) * 44;
      const riseY = 36 + Math.random() * 38;
      const originX = startX + (Math.random() - 0.5) * 16 - size / 2;
      const originY = startY + (Math.random() - 0.5) * 12 - size / 2;
      const delay = (i % 6) * 40;

      p.animate([
        {
          transform: `translate(${originX}px, ${originY}px) scale(0.2) rotate(0deg)`,
          opacity: 0
        },
        {
          transform: `translate(${originX + offsetX * 0.5}px, ${originY - riseY * 0.4}px) scale(1.3) rotate(45deg)`,
          opacity: 1,
          offset: 0.3
        },
        {
          transform: `translate(${originX + offsetX}px, ${originY - riseY}px) scale(0.8) rotate(90deg)`,
          opacity: 0.8,
          offset: 0.75
        },
        {
          transform: `translate(${originX + offsetX}px, ${originY - riseY - 10}px) scale(0) rotate(135deg)`,
          opacity: 0,
          offset: 1.0
        }
      ], {
        duration: 850,
        delay,
        easing: 'ease-out',
        fill: 'forwards'
      }).onfinish = () => p.remove();
    }
  }

  /**
   * Partículas de Muerte: Estallido explosivo radial de partículas pixeladas en 360º
   */
  spawnDeathParticles(source) {
    const { x: startX, y: startY } = this.getScreenCenter(source);
    const overlay = this.getOrCreateParticleContainer();
    const colors = ['#ef4444', '#f97316', '#fbbf24', '#ffffff', '#e4ddcd', '#374151'];
    const count = 24;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'pixel-fx-square';
      const size = 6 + (i % 4) * 2;
      const col = colors[i % colors.length];
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = col;
      p.style.left = '0px';
      p.style.top = '0px';
      p.style.boxShadow = `0 0 6px ${col}, 0 0 12px ${col}`;
      overlay.appendChild(p);

      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
      const speed = 40 + Math.random() * 50;
      const originX = startX - size / 2;
      const originY = startY - size / 2;
      const endX = originX + Math.cos(angle) * speed;
      const endY = originY + Math.sin(angle) * speed + (Math.random() * 20);

      p.animate([
        {
          transform: `translate(${originX}px, ${originY}px) scale(0.4) rotate(0deg)`,
          opacity: 1
        },
        {
          transform: `translate(${originX + (endX - originX) * 0.4}px, ${originY + (endY - originY) * 0.4 - 15}px) scale(1.5) rotate(45deg)`,
          opacity: 1,
          offset: 0.25
        },
        {
          transform: `translate(${originX + (endX - originX) * 0.8}px, ${originY + (endY - originY) * 0.8}px) scale(1.0) rotate(90deg)`,
          opacity: 0.8,
          offset: 0.65
        },
        {
          transform: `translate(${endX}px, ${endY}px) scale(0) rotate(180deg)`,
          opacity: 0,
          offset: 1.0
        }
      ], {
        duration: 650 + Math.random() * 120,
        easing: 'cubic-bezier(0.15, 0.9, 0.35, 1)',
        fill: 'forwards'
      }).onfinish = () => p.remove();
    }
  }

  /**
   * Dispara una ráfaga de partículas cuadradas pixeladas desde una unidad hacia otra unidad objetivo
   * cuando realiza daño directo (por ejemplo, dron del Swarm al morir o Taladro en casilla homóloga).
   * @param {HTMLElement|Object} fromSource Unidad o casilla de origen
   * @param {HTMLElement|Object} toTarget Unidad o casilla de destino
   * @param {Object} [options]
   * @param {string|string[]} [options.color] Color o paleta de colores
   * @param {number} [options.count=9] Cantidad de proyectiles
   * @param {number} [options.duration=340] Duración del trayecto en ms
   * @param {boolean} [options.sound=true] Reproducir sonido de disparo
   * @param {string} [options.fromPlayerKey] Clave del jugador de origen
   * @param {string} [options.toPlayerKey] Clave del jugador objetivo
   * @returns {Promise<void>} Se resuelve en el momento del impacto en el objetivo
   */
  shootDirectDamageParticles(fromSource, toTarget, options = {}) {
    return new Promise(resolve => {
      const fromPlayer = options.fromPlayerKey || fromSource?.playerKey;
      const toPlayer = options.toPlayerKey || toTarget?.playerKey;
      const start = this.getScreenCenter(fromSource, fromPlayer);
      const end = this.getScreenCenter(toTarget, toPlayer);
      const overlay = this.getOrCreateParticleContainer();

      if (options.sound !== false && typeof soundManager?.playShootSound === 'function') {
        soundManager.playShootSound();
      }

      // Pequeño fogonazo / chispazo de disparo en el origen
      const muzzleColors = ['#ffffff', '#fbbf24', '#f59e0b'];
      for (let m = 0; m < 5; m++) {
        const mp = document.createElement('div');
        mp.className = 'pixel-fx-square';
        const mSize = 5 + (m % 2) * 2;
        const col = muzzleColors[m % muzzleColors.length];
        mp.style.width = `${mSize}px`;
        mp.style.height = `${mSize}px`;
        mp.style.background = col;
        mp.style.boxShadow = `0 0 6px ${col}`;
        overlay.appendChild(mp);

        const mAngle = (m / 5) * Math.PI * 2;
        const mDist = 14 + Math.random() * 12;
        const mOriginX = start.x - mSize / 2;
        const mOriginY = start.y - mSize / 2;
        const mEndX = mOriginX + Math.cos(mAngle) * mDist;
        const mEndY = mOriginY + Math.sin(mAngle) * mDist;

        mp.animate([
          { transform: `translate(${mOriginX}px, ${mOriginY}px) scale(0.5)`, opacity: 1 },
          { transform: `translate(${mEndX}px, ${mEndY}px) scale(1.2)`, opacity: 0.9, offset: 0.4 },
          { transform: `translate(${mEndX}px, ${mEndY}px) scale(0)`, opacity: 0, offset: 1.0 }
        ], {
          duration: 180 + Math.random() * 60,
          easing: 'ease-out',
          fill: 'forwards'
        }).onfinish = () => mp.remove();
      }

      // Proyectiles pixelados que vuelan en arco hacia el objetivo
      let palette = ['#ffd166', '#f59e0b', '#fbbf24', '#ffffff', '#ef4444'];
      if (options.color) {
        palette = Array.isArray(options.color) ? options.color : [options.color, '#ffffff', '#fbbf24'];
      }

      const count = options.count || 9;
      const baseDuration = options.duration || 340;
      let resolved = false;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);

      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'pixel-fx-square direct-damage-particle';
        const size = 6 + (i % 3) * 2;
        const col = palette[i % palette.length];
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.background = col;
        p.style.boxShadow = `0 0 6px ${col}, 0 0 12px ${col}`;
        overlay.appendChild(p);

        const stagger = i * 20;
        const arcHeight = Math.min(60, Math.max(25, distance * 0.15)) * (i % 2 === 0 ? 1 : 0.7);
        const arcSpreadX = (Math.random() - 0.5) * 24;
        const midX = start.x + dx * 0.45 + arcSpreadX;
        const midY = start.y + dy * 0.45 - arcHeight;

        const originX = start.x - size / 2;
        const originY = start.y - size / 2;
        const destX = end.x - size / 2 + (Math.random() - 0.5) * 10;
        const destY = end.y - size / 2 + (Math.random() - 0.5) * 10;

        const anim = p.animate([
          {
            transform: `translate(${originX}px, ${originY}px) scale(0.3) rotate(0deg)`,
            opacity: 0
          },
          {
            transform: `translate(${originX + (midX - originX) * 0.3}px, ${originY + (midY - originY) * 0.3}px) scale(1.4) rotate(45deg)`,
            opacity: 1,
            offset: 0.2
          },
          {
            transform: `translate(${midX}px, ${midY}px) scale(1.1) rotate(90deg)`,
            opacity: 1,
            offset: 0.55
          },
          {
            transform: `translate(${destX}px, ${destY}px) scale(1.3) rotate(180deg)`,
            opacity: 0.95,
            offset: 0.9
          },
          {
            transform: `translate(${destX}px, ${destY}px) scale(0) rotate(225deg)`,
            opacity: 0,
            offset: 1.0
          }
        ], {
          duration: baseDuration,
          delay: stagger,
          easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)',
          fill: 'forwards'
        });

        anim.onfinish = () => {
          p.remove();
        };

        if (i === 0) {
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              this.spawnHitParticles(toTarget);
              resolve();
            }
          }, baseDuration * 0.88);
        }
      }

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.spawnHitParticles(toTarget);
          resolve();
        }
      }, baseDuration + count * 20 + 50);
    });
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
   * Muestra un número flotante (+X) sin fondo, únicamente el número encima de quien genera la acción (normalmente un peón).
   * @param {HTMLElement|Object|number} fromSource Peón, casilla o coordenada X
   * @param {number} amount Cantidad de tensión generada
   * @param {number} [initialDelay=0] Retraso en ms para sincronizar con la secuencia
   * @param {string} [color=null] Color opcional
   */
  spawnTensionFloatingNumber(fromSource, amount, initialDelay = 0, color = null) {
    if (!amount || amount <= 0) return;

    const { x: posX, y: posY } = this.getScreenCenter(fromSource);

    setTimeout(() => {
      const floatEl = document.createElement('div');
      floatEl.className = 'tension-floating-number';
      floatEl.textContent = `+${amount}`;
      if (color) {
        floatEl.style.color = color;
      }
      floatEl.style.left = `${posX}px`;
      floatEl.style.top = `${posY}px`;
      document.body.appendChild(floatEl);

      setTimeout(() => {
        floatEl.remove();
      }, 1250);
    }, initialDelay);
  }

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
    if (amount > 0) {
      this.spawnTensionFloatingNumber(fromSource, amount, initialDelay, color);
    }

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

    const heroWrapperEl = document.getElementById(`${targetPlayerKey}-character`);
    const heroSpriteEl = document.getElementById(`${targetPlayerKey}-character-sprite`) || heroWrapperEl;
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

      // Pulso reactivo en el contenedor del héroe conforme cada partícula impacta (no interrumpe el sprite sheet)
      setTimeout(() => {
        const pulseTarget = heroWrapperEl || heroSpriteEl;
        if (pulseTarget) {
          pulseTarget.classList.remove('hero-tension-pulse');
          void pulseTarget.offsetWidth;
          pulseTarget.classList.add('hero-tension-pulse');
          setTimeout(() => {
            pulseTarget.classList.remove('hero-tension-pulse');
          }, 380);
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
      banner.innerHTML = `<span class="ability-icon placeholder-icon"></span> ${message}`;
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

    if (phaseType === 'titan') {
      text = 'TITÁN';
      theme = 'titan';
    } else if (phaseType === 'dice') {
      text = 'DADO';
      theme = 'dice';
    } else if (phaseType === 'attack' || phaseType === 'baile') {
      text = 'ATACAR';
      theme = 'attack';
    } else if (phaseType === 'resolution') {
      text = 'RESOLUCIÓN';
      theme = 'resolution';
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
    const keyBadge = bar.querySelector('.ready-key-badge');
    if (keyBadge) {
      keyBadge.style.display = isBot ? 'none' : '';
      const isMat = getControlScheme() === CONTROL_SCHEMES.DANCE_MAT;
      keyBadge.textContent = `[${isMat ? 'START' : (player === 'p1' ? 'ESPACIO' : 'ENTER')}]`;
    }

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
