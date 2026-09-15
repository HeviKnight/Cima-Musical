// ===================================================
// GESTOR DE FEEDBACK VISUAL Y CLASES DOM (UI)
// ===================================================

import { TRIBES } from '../data/tribes.js';

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
    this.p1CurtainSub = null;
    this.p2CurtainSub = null;

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
  }

  init() {
    this.gameWrapper = document.getElementById('game-wrapper');

    this.p1Curtain = document.getElementById('p1-curtain');
    this.p2Curtain = document.getElementById('p2-curtain');
    this.p1CurtainImg = document.getElementById('p1-curtain-img');
    this.p2CurtainImg = document.getElementById('p2-curtain-img');
    this.p1CurtainTitle = document.getElementById('p1-curtain-title');
    this.p2CurtainTitle = document.getElementById('p2-curtain-title');

    this.p1BigCountdown = document.getElementById('p1-big-countdown');
    this.p2BigCountdown = document.getElementById('p2-big-countdown');
    this.p1CountdownNum = document.getElementById('p1-countdown-num');
    this.p2CountdownNum = document.getElementById('p2-countdown-num');

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
  }

  setBoardCurtain(player, mode, title = '', iconSrc = null) {
    const targets = player === 'both' ? ['p1', 'p2'] : [player];

    targets.forEach(p => {
      const curtain = p === 'p1' ? this.p1Curtain : this.p2Curtain;
      const titleEl = p === 'p1' ? this.p1CurtainTitle : this.p2CurtainTitle;
      const imgEl = p === 'p1' ? this.p1CurtainImg : this.p2CurtainImg;

      if (!curtain) return;

      let finalIcon = iconSrc;
      if (!finalIcon || finalIcon === 'face' || finalIcon === 'default') {
        finalIcon = TRIBES[p].faceSprite;
      }

      if (mode === 'hide') {
        curtain.classList.remove('active-black', 'active-green');
      } else if (mode === 'black') {
        curtain.classList.remove('active-green');
        curtain.classList.add('active-black');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
      } else if (mode === 'green') {
        curtain.classList.remove('active-black');
        curtain.classList.add('active-green');
        if (titleEl && title) titleEl.textContent = title;
        if (imgEl && finalIcon) imgEl.src = finalIcon;
      }
    });
  }

  showBigCountdown(num) {
    if (this.p1BigCountdown) this.p1BigCountdown.classList.add('show');
    if (this.p2BigCountdown) this.p2BigCountdown.classList.add('show');

    if (this.p1CountdownNum) this.p1CountdownNum.textContent = num;
    if (this.p2CountdownNum) this.p2CountdownNum.textContent = num;

    if (this.p1CountdownNum) this.p1CountdownNum.classList.add('tick-anim');
    if (this.p2CountdownNum) this.p2CountdownNum.classList.add('tick-anim');

    setTimeout(() => {
      if (this.p1CountdownNum) this.p1CountdownNum.classList.remove('tick-anim');
      if (this.p2CountdownNum) this.p2CountdownNum.classList.remove('tick-anim');
    }, 100);
  }

  hideBigCountdown() {
    if (this.p1BigCountdown) this.p1BigCountdown.classList.remove('show');
    if (this.p2BigCountdown) this.p2BigCountdown.classList.remove('show');
  }

  updateAttackHighlights(matrix, targetedCells) {
    // Limpiar previas
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (matrix[r] && matrix[r][c]) {
          matrix[r][c].btn.classList.remove('state-selected');
        }
      }
    }

    // Aplicar estado 'state-selected'
    (targetedCells || []).forEach(cell => {
      if (matrix[cell.row] && matrix[cell.row][cell.col]) {
        matrix[cell.row][cell.col].btn.classList.add('state-selected');
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

        btn.classList.remove('state-hit', 'state-fail', 'state-dodge', 'state-empty', 'state-selected');
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

  updateLivesUI(player, lives) {
    for (let i = 1; i <= 3; i++) {
      const lifeEl = document.getElementById(`${player}-life-${i}`);
      if (lifeEl) {
        if (i > lives) {
          lifeEl.src = '/assets/sprites/Vida_2.png';
          lifeEl.classList.add('lost');
        } else {
          lifeEl.src = '/assets/sprites/Vida.png';
          lifeEl.classList.remove('lost');
        }
      }
    }
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
      btn.classList.remove('pawn-revealed', 'state-hit', 'state-fail', 'state-dodge', 'state-empty', 'state-selected');
    });
  }
}

export const feedback = new FeedbackManager();
