// ===================================================
// GESTOR DE FEEDBACK VISUAL Y CLASES DOM (UI)
// ===================================================

import { CONTROLS } from '../data/controls.js';
import { gameState } from '../core/state.js';
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

    // Overlays de dados
    this.p1RollOverlay = null;
    this.p2RollOverlay = null;
    this.p1RollDiceImg = null;
    this.p2RollDiceImg = null;
    this.p1RollShapeImg = null;
    this.p2RollShapeImg = null;

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
    this.p1BigCountdown = this.sharedBigCountdown || document.getElementById('p1-big-countdown');
    this.p2BigCountdown = this.sharedBigCountdown || document.getElementById('p2-big-countdown');
    this.p1CountdownNum = this.sharedCountdownNum || document.getElementById('p1-countdown-num');
    this.p2CountdownNum = this.sharedCountdownNum || document.getElementById('p2-countdown-num');

    this.p1RollOverlay = document.getElementById('p1-roll-overlay');
    this.p2RollOverlay = document.getElementById('p2-roll-overlay');
    this.p1RollDiceImg = document.getElementById('p1-roll-dice-img');
    this.p2RollDiceImg = document.getElementById('p2-roll-dice-img');
    this.p1RollShapeImg = document.getElementById('p1-roll-shape-img');
    this.p2RollShapeImg = document.getElementById('p2-roll-shape-img');

    this.p1Character = document.getElementById('p1-character');
    this.p2Character = document.getElementById('p2-character');
    this.p1Reaction = document.getElementById('p1-reaction');
    this.p2Reaction = document.getElementById('p2-reaction');

    this.updateAssaultChargesUI('both');
  }

  updateAssaultChargesUI(player = 'both') {
    const targets = player === 'both' ? ['p1', 'p2'] : [player];
    targets.forEach(p => {
      const container = document.getElementById(`${p}-charges-slots`);
      if (!container) return;

      const pState = gameState[p];
      const maxCharges = pState?.maxAbilityCharges ?? (pState?.character?.activeAbility?.maxCharges ?? 1);
      const currentCharges = pState?.activeAbilityCharges ?? maxCharges;

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
    });
  }

  updateAbilityChargesUI(player = 'both') {
    this.updateAssaultChargesUI(player);
  }

  playGridIntroAnimation(onComplete) {
    this.setBoardCurtain('both', 'hide');
    this.hideBigCountdown();
    this.removeStandingPawnIcons();

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

  setBoardCurtain(player, mode, title = '', iconSrc = null, promptText = '') {
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
        if (keyCapEl) keyCapEl.style.display = 'flex';
      } else if (mode === 'green') {
        curtain.classList.remove('active-black');
        curtain.classList.add('active-green');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
        if (keyCapEl) keyCapEl.style.display = 'none';
      }
    });
  }

  removeStandingPawnIcons() {
    document.querySelectorAll('.standing-pawn-face, .standing-pawn-square').forEach(el => el.remove());
    document.querySelectorAll('.casilla-btn').forEach(btn => btn.classList.remove('state-player'));
  }

  updateStandingPawnIcons(p1Matrix, p1LastCell, p2Matrix, p2LastCell) {
    this.removeStandingPawnIcons();

    document.querySelectorAll('.casilla-btn').forEach(btn => btn.classList.remove('state-player'));

    const p1Cell = p1LastCell || { row: 1, col: 1 };
    const p2Cell = p2LastCell || { row: 1, col: 1 };

    const p1Char = gameState.p1?.character || CONTROLS.p1;
    const p2Char = gameState.p2?.character || CONTROLS.p2;

    const p1Icon = p1Char.iconSprite || p1Char.faceSprite;
    const p2Icon = p2Char.iconSprite || p2Char.faceSprite;

    if (p1Matrix[p1Cell.row] && p1Matrix[p1Cell.row][p1Cell.col]) {
      const btn = p1Matrix[p1Cell.row][p1Cell.col].btn;
      btn.classList.add('state-player');

      if (p1Icon) {
        const img = document.createElement('img');
        img.src = p1Icon;
        img.alt = 'P1 Standing';
        img.className = 'standing-pawn-face';
        btn.appendChild(img);
      } else {
        const sq = document.createElement('div');
        sq.className = 'standing-pawn-square';
        sq.style.background = p1Char.color || '#22D3EE';
        sq.style.borderColor = p1Char.borderColor || '#7C3AED';
        sq.textContent = (p1Char.name || 'P1')[0];
        btn.appendChild(sq);
      }
    }

    if (p2Matrix[p2Cell.row] && p2Matrix[p2Cell.row][p2Cell.col]) {
      const btn = p2Matrix[p2Cell.row][p2Cell.col].btn;
      btn.classList.add('state-player');

      if (p2Icon) {
        const img = document.createElement('img');
        img.src = p2Icon;
        img.alt = 'P2 Standing';
        img.className = 'standing-pawn-face';
        btn.appendChild(img);
      } else {
        const sq = document.createElement('div');
        sq.className = 'standing-pawn-square';
        sq.style.background = p2Char.color || '#FF6F59';
        sq.style.borderColor = p2Char.borderColor || '#EF233C';
        sq.textContent = (p2Char.name || 'P2')[0];
        btn.appendChild(sq);
      }
    }
  }

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

  showBigCountdown(num) {
    if (this.sharedBigCountdown) this.sharedBigCountdown.classList.add('show');
    if (this.p1BigCountdown && this.p1BigCountdown !== this.sharedBigCountdown) this.p1BigCountdown.classList.add('show');
    if (this.p2BigCountdown && this.p2BigCountdown !== this.sharedBigCountdown) this.p2BigCountdown.classList.add('show');

    if (this.sharedCountdownNum) this.sharedCountdownNum.textContent = num;
    if (this.p1CountdownNum) this.p1CountdownNum.textContent = num;
    if (this.p2CountdownNum) this.p2CountdownNum.textContent = num;

    if (this.sharedCountdownNum) this.sharedCountdownNum.classList.add('tick-anim');
    if (this.p1CountdownNum) this.p1CountdownNum.classList.add('tick-anim');
    if (this.p2CountdownNum) this.p2CountdownNum.classList.add('tick-anim');

    setTimeout(() => {
      if (this.sharedCountdownNum) this.sharedCountdownNum.classList.remove('tick-anim');
      if (this.p1CountdownNum) this.p1CountdownNum.classList.remove('tick-anim');
      if (this.p2CountdownNum) this.p2CountdownNum.classList.remove('tick-anim');
    }, 100);
  }

  hideBigCountdown() {
    if (this.sharedBigCountdown) this.sharedBigCountdown.classList.remove('show');
    if (this.p1BigCountdown) this.p1BigCountdown.classList.remove('show');
    if (this.p2BigCountdown) this.p2BigCountdown.classList.remove('show');
  }

  highlightValidPawnMoves(matrix, lastPawnCell) {
    const currentPawn = lastPawnCell || { row: 1, col: 1 };
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!matrix[r] || !matrix[r][c]) continue;
        const cell = matrix[r][c];
        const isCurrentPawn = Boolean(currentPawn && currentPawn.row === r && currentPawn.col === c);

        cell.btn.classList.remove('state-hit', 'state-miss', 'state-active', 'state-player', 'state-off');

        if (isCurrentPawn) {
          cell.btn.classList.add('state-player');
        } else {
          const isValid = Math.abs(currentPawn.row - r) <= 1 && Math.abs(currentPawn.col - c) <= 1;
          if (isValid) {
            cell.btn.classList.add('state-active');
          } else {
            cell.btn.classList.add('state-off');
          }
        }
      }
    }
  }

  clearMoveHighlights() {
    document.querySelectorAll('.casilla-btn').forEach(btn => {
      btn.classList.remove('state-active');
      if (!btn.classList.contains('state-player') && !btn.classList.contains('state-hit') && !btn.classList.contains('state-miss')) {
        btn.classList.add('state-off');
      }
    });
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

  revealPawn(pawnCell) {
    if (pawnCell && pawnCell.btn) {
      pawnCell.btn.classList.add('pawn-revealed');
    }
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

  showPlaceholderActivation(player, message = 'placeholder activado') {
    this.showReactionBadge(player, message, 'show-placeholder');

    const panelId = player === 'p1' ? 'player-1-panel' : 'player-2-panel';
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.querySelectorAll('.placeholder-activation-banner').forEach(el => el.remove());
      const banner = document.createElement('div');
      banner.className = 'placeholder-activation-banner';
      banner.innerHTML = `<span class="placeholder-icon">⚡</span> ${message}`;
      panel.appendChild(banner);

      setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 400);
      }, 1600);
    }

    if (!this.placeholderBadgeTimeouts) this.placeholderBadgeTimeouts = {};
    if (this.placeholderBadgeTimeouts[player]) {
      clearTimeout(this.placeholderBadgeTimeouts[player]);
    }
    this.placeholderBadgeTimeouts[player] = setTimeout(() => {
      const badge = player === 'p1' ? this.p1Reaction : this.p2Reaction;
      if (badge && badge.classList.contains('show-placeholder')) {
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

  showVerticalCombatBars() {
    const section = document.querySelector('.vertical-combat-section');
    if (section) section.classList.add('show');
  }

  hideVerticalCombatBars() {
    const section = document.querySelector('.vertical-combat-section');
    if (section) section.classList.remove('show');
  }

  clearBoardEffects() {
    this.hideVerticalCombatBars();
    document.querySelectorAll('.casilla-btn').forEach(btn => {
      btn.classList.remove('pawn-revealed', 'state-hit', 'state-miss', 'state-active', 'state-player');
      btn.classList.add('state-off');
    });
  }
}

export const feedback = new FeedbackManager();
