// ===================================================
// GESTOR DE PANTALLAS DINÁMICAS (UI)
// ===================================================

import { CONTROLS, DRAW_RESULT } from '../data/controls.js';
import { gameState } from '../core/state.js';
import { renderGameScreen } from './screens/GameScreen.js';
import { renderGameOverScreen } from './screens/GameOverScreen.js';
import { renderCharacterSelectScreen } from './screens/CharacterSelectScreen.js';

class ScreensManager {
  constructor() {
    this.screenStart = null;
    this.dynamicContainer = null;
    this.screenGame = null;
    this.screenGameOver = null;
    this.screenCharSelect = null;

    this.goWinnerBadge = null;
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
    this.screenCharSelect = null;
  }

  mountCharacterSelectScreen(gameMode, onSelectionFinished) {
    this.clearDynamicScreens();
    const charSelectElem = renderCharacterSelectScreen(gameMode, onSelectionFinished);
    if (this.dynamicContainer) {
      this.dynamicContainer.appendChild(charSelectElem);
    }
    this.screenCharSelect = document.getElementById('screen-char-select');
    this.showScreen('charSelect');
    return charSelectElem;
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

  mountGameOverScreen(p1Prestige, p2Prestige) {
    this.clearDynamicScreens();
    const gameOverElem = renderGameOverScreen();
    if (this.dynamicContainer) {
      this.dynamicContainer.appendChild(gameOverElem);
    }
    this.screenGameOver = document.getElementById('screen-gameover');
    this.goWinnerBadge = document.getElementById('go-winner-badge');
    this.goFlavor = document.getElementById('go-flavor');

    this.applyGameOverData(p1Prestige, p2Prestige);
    this.showScreen('gameover');
    return gameOverElem;
  }

  showScreen(screenName) {
    if (screenName === 'start') {
      this.clearDynamicScreens();
      if (this.screenStart) this.screenStart.classList.add('active-screen');
    } else {
      if (this.screenStart) this.screenStart.classList.remove('active-screen');
      if (this.screenCharSelect) this.screenCharSelect.classList.toggle('active-screen', screenName === 'charSelect');
      if (this.screenGame) this.screenGame.classList.toggle('active-screen', screenName === 'game');
      if (this.screenGameOver) this.screenGameOver.classList.toggle('active-screen', screenName === 'gameover');
    }
  }

  applyGameOverData(p1Prestige, p2Prestige) {
    const faceWrapper = document.getElementById('go-face-wrapper');

    const p1Char = gameState.p1?.character || CONTROLS.p1;
    const p2Char = gameState.p2?.character || CONTROLS.p2;

    if (p1Prestige === p2Prestige) {
      // EMPATE (Draw)
      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = DRAW_RESULT.headline;
        this.goWinnerBadge.style.color = DRAW_RESULT.color;
        this.goWinnerBadge.style.borderColor = DRAW_RESULT.borderColor;
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = DRAW_RESULT.borderColor;
        const p1Face = p1Char.faceSprite ? `<img src="${p1Char.faceSprite}" class="go-winner-face">` : `<div class="go-winner-square" style="background: ${p1Char.color}">${p1Char.name[0]}</div>`;
        const p2Face = p2Char.faceSprite ? `<img src="${p2Char.faceSprite}" class="go-winner-face" style="transform: scaleX(-1);">` : `<div class="go-winner-square" style="background: ${p2Char.color}">${p2Char.name[0]}</div>`;
        faceWrapper.innerHTML = `
          ${p1Face}
          <span class="draw-vs-symbol">⚡</span>
          ${p2Face}
        `;
      }
      if (this.goFlavor) this.goFlavor.textContent = DRAW_RESULT.flavor;

    } else if (p2Prestige > p1Prestige) {
      // GANA P2
      const winner = p2Char;
      const titleText = `${winner.name} DOMINA LAS PLAYLISTS`;
      const flavorText = `La vibra y actitud de ${winner.name} arrasan en la cima musical.`;

      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = titleText;
        this.goWinnerBadge.style.color = winner.color;
        this.goWinnerBadge.style.borderColor = winner.borderColor;
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = winner.borderColor;
        if (winner.faceSprite) {
          faceWrapper.innerHTML = `<img src="${winner.faceSprite}" alt="${winner.name}" class="go-winner-face" style="transform: scaleX(-1);">`;
        } else {
          faceWrapper.innerHTML = `<div class="go-winner-square" style="background: ${winner.color}; border: 3px solid ${winner.borderColor}"><span>${winner.name[0]}</span></div>`;
        }
      }
      if (this.goFlavor) this.goFlavor.textContent = flavorText;

    } else {
      // GANA P1
      const winner = p1Char;
      const titleText = `${winner.name} DOMINA LAS PLAYLISTS`;
      const flavorText = `La vibra y actitud de ${winner.name} arrasan en la cima musical.`;

      if (this.goWinnerBadge) {
        this.goWinnerBadge.textContent = titleText;
        this.goWinnerBadge.style.color = winner.color;
        this.goWinnerBadge.style.borderColor = winner.borderColor;
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = winner.borderColor;
        if (winner.faceSprite) {
          faceWrapper.innerHTML = `<img src="${winner.faceSprite}" alt="${winner.name}" class="go-winner-face">`;
        } else {
          faceWrapper.innerHTML = `<div class="go-winner-square" style="background: ${winner.color}; border: 3px solid ${winner.borderColor}"><span>${winner.name[0]}</span></div>`;
        }
      }
      if (this.goFlavor) this.goFlavor.textContent = flavorText;
    }
  }
}

export const screens = new ScreensManager();
