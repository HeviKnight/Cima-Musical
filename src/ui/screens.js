// ===================================================
// GESTOR DE PANTALLAS DINÁMICAS (UI)
// ===================================================

import { TRIBES, DRAW_RESULT } from '../data/tribes.js';
import { renderGameScreen } from './screens/GameScreen.js';
import { renderGameOverScreen } from './screens/GameOverScreen.js';

class ScreensManager {
  constructor() {
    this.screenStart = null;
    this.dynamicContainer = null;
    this.screenGame = null;
    this.screenGameOver = null;

    this.goTitle = null;
    this.goWinnerBadge = null;
    this.goWinnerImg = null;
    this.goFlavor = null;
  }

  init() {
    this.screenStart = document.getElementById('screen-start');
    this.dynamicContainer = document.getElementById('app-dynamic-content');
  }

  clearDynamicScreens() {
    if (this.dynamicContainer) {
      this.dynamicContainer.innerHTML = '';
    }
    this.screenGame = null;
    this.screenGameOver = null;
  }

  mountGameScreen() {
    this.clearDynamicScreens();
    const gameElem = renderGameScreen();
    if (this.dynamicContainer) {
      this.dynamicContainer.appendChild(gameElem);
    }
    this.screenGame = document.getElementById('screen-game');
    this.showScreen('game');
    return gameElem;
  }

  mountGameOverScreen(p1Lives, p2Lives) {
    this.clearDynamicScreens();
    const gameOverElem = renderGameOverScreen();
    if (this.dynamicContainer) {
      this.dynamicContainer.appendChild(gameOverElem);
    }
    this.screenGameOver = document.getElementById('screen-gameover');

    this.goTitle = document.getElementById('go-title');
    this.goWinnerBadge = document.getElementById('go-winner-badge');
    this.goWinnerImg = document.getElementById('go-winner-img');
    this.goFlavor = document.getElementById('go-flavor');

    this.applyGameOverData(p1Lives, p2Lives);
    this.showScreen('gameover');
    return gameOverElem;
  }

  showScreen(screenName) {
    if (screenName === 'start') {
      this.clearDynamicScreens();
      if (this.screenStart) this.screenStart.classList.add('active-screen');
    } else {
      if (this.screenStart) this.screenStart.classList.remove('active-screen');
      if (this.screenGame) this.screenGame.classList.toggle('active-screen', screenName === 'game');
      if (this.screenGameOver) this.screenGameOver.classList.toggle('active-screen', screenName === 'gameover');
    }
  }

  applyGameOverData(p1Prestige, p2Prestige) {
    const faceWrapper = document.getElementById('go-face-wrapper');

    if (p1Prestige === p2Prestige) {
      // EMPATE (Draw)
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = DRAW_RESULT.headline;
        this.goWinnerBadge.style.color = DRAW_RESULT.color;
        this.goWinnerBadge.style.borderColor = DRAW_RESULT.borderColor;
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = DRAW_RESULT.borderColor;
        faceWrapper.innerHTML = `
          <img src="${TRIBES.p1.faceSprite}" alt="P1 Pop" class="go-winner-face">
          <span class="draw-vs-symbol">⚡</span>
          <img src="${TRIBES.p2.faceSprite}" alt="P2 Rock" class="go-winner-face" style="transform: scaleX(-1);">
        `;
      }
      if (this.goFlavor) this.goFlavor.textContent = DRAW_RESULT.flavor;

    } else if (p2Prestige > p1Prestige) {
      // GANA P2 (Rock)
      const winner = TRIBES.p2;
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = winner.victoryHeadline;
        this.goWinnerBadge.style.color = winner.color;
        this.goWinnerBadge.style.borderColor = winner.borderColor;
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = winner.borderColor;
        faceWrapper.innerHTML = `
          <img src="${winner.faceSprite}" alt="P2 Rock" class="go-winner-face" style="transform: scaleX(-1);">
        `;
      }
      if (this.goFlavor) this.goFlavor.textContent = winner.victoryFlavor;

    } else {
      // GANA P1 (Pop)
      const winner = TRIBES.p1;
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = winner.victoryHeadline;
        this.goWinnerBadge.style.color = winner.color;
        this.goWinnerBadge.style.borderColor = winner.borderColor;
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = winner.borderColor;
        faceWrapper.innerHTML = `
          <img src="${winner.faceSprite}" alt="P1 Pop" class="go-winner-face">
        `;
      }
      if (this.goFlavor) this.goFlavor.textContent = winner.victoryFlavor;
    }
  }
}

export const screens = new ScreensManager();
