// ===================================================
// GESTOR DE PANTALLAS (UI)
// ===================================================

import { TRIBES, DRAW_RESULT } from '../data/tribes.js';

class ScreensManager {
  constructor() {
    this.screenStart = null;
    this.screenGame = null;
    this.screenGameOver = null;

    this.goTitle = null;
    this.goWinnerBadge = null;
    this.goWinnerImg = null;
    this.goFlavor = null;
  }

  init() {
    this.screenStart = document.getElementById('screen-start');
    this.screenGame = document.getElementById('screen-game');
    this.screenGameOver = document.getElementById('screen-gameover');

    this.goTitle = document.getElementById('go-title');
    this.goWinnerBadge = document.getElementById('go-winner-badge');
    this.goWinnerImg = document.getElementById('go-winner-img');
    this.goFlavor = document.getElementById('go-flavor');
  }

  showScreen(screenName) {
    if (this.screenStart) this.screenStart.classList.toggle('active-screen', screenName === 'start');
    if (this.screenGame) this.screenGame.classList.toggle('active-screen', screenName === 'game');
    if (this.screenGameOver) this.screenGameOver.classList.toggle('active-screen', screenName === 'gameover');
  }

  showGameOver(p1Lives, p2Lives) {
    if (p1Lives <= 0 && p2Lives <= 0) {
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = DRAW_RESULT.headline;
        this.goWinnerBadge.style.color = DRAW_RESULT.color;
        this.goWinnerBadge.style.borderColor = DRAW_RESULT.borderColor;
      }
      if (this.goWinnerImg) this.goWinnerImg.src = DRAW_RESULT.faceSprite;
      if (this.goFlavor) this.goFlavor.textContent = DRAW_RESULT.flavor;
    } else if (p1Lives <= 0) {
      // Gana Rock (P2)
      const winner = TRIBES.p2;
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = winner.victoryHeadline;
        this.goWinnerBadge.style.color = winner.color;
        this.goWinnerBadge.style.borderColor = winner.borderColor;
      }
      if (this.goWinnerImg) this.goWinnerImg.src = winner.faceSprite;
      if (this.goFlavor) this.goFlavor.textContent = winner.victoryFlavor;
    } else {
      // Gana Pop (P1)
      const winner = TRIBES.p1;
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = winner.victoryHeadline;
        this.goWinnerBadge.style.color = winner.color;
        this.goWinnerBadge.style.borderColor = winner.borderColor;
      }
      if (this.goWinnerImg) this.goWinnerImg.src = winner.faceSprite;
      if (this.goFlavor) this.goFlavor.textContent = winner.victoryFlavor;
    }

    setTimeout(() => {
      this.showScreen('gameover');
    }, 700);
  }
}

export const screens = new ScreensManager();
