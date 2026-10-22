// ===================================================
// GESTOR DE PANTALLAS DINÁMICAS (UI)
// ===================================================

import { CONTROLS, DRAW_RESULT } from '../data/controls.js';
import { gameState } from '../core/state.js';
import { renderGameScreen } from './screens/GameScreen.js';
import { renderGameOverScreen } from './screens/GameOverScreen.js';
import { renderCharacterSelectScreen } from './screens/CharacterSelectScreen.js';
import { soundManager } from '../audio/sound-manager.js';

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
    const charSelectElem = renderCharacterSelectScreen(
      gameMode,
      onSelectionFinished,
      () => this.showScreen('start')
    );
    if (this.dynamicContainer) {
      this.dynamicContainer.appendChild(charSelectElem);
    }
    this.screenCharSelect = document.getElementById('screen-char-select');
    this.showScreen('charSelect');
    return charSelectElem;
  }

  mountGameScreen() {
    this.clearDynamicScreens();
    const gameElem = renderGameScreen(() => this.showScreen('start'));
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
      soundManager.playMenuMusic();
    } else {
      if (this.screenStart) this.screenStart.classList.remove('active-screen');
      if (this.screenCharSelect) this.screenCharSelect.classList.toggle('active-screen', screenName === 'charSelect');
      if (this.screenGame) this.screenGame.classList.toggle('active-screen', screenName === 'game');
      if (this.screenGameOver) this.screenGameOver.classList.toggle('active-screen', screenName === 'gameover');
    }
  }
  applyGameOverData(p1Prestige, p2Prestige) {
    const faceWrapper = document.getElementById('go-face-wrapper');
    const winnerTitleEl = document.getElementById('go-winner-title');

    const p1Char = gameState.p1?.character || CONTROLS.p1;
    const p2Char = gameState.p2?.character || CONTROLS.p2;

    const p1Val = Math.min(100, Math.max(0, p1Prestige ?? gameState.p1.prestige ?? 0));
    const p2Val = Math.min(100, Math.max(0, p2Prestige ?? gameState.p2.prestige ?? 0));

    const renderWinnerBlock = (winner, flipSprite = false, winnerPlayerKey = 'p1') => {
      const isP1 = winnerPlayerKey === 'p1';
      const label = isP1 ? '¡P1 GANA!' : (gameState.currentGameMode === 'vs-ai' ? '¡CPU GANA!' : '¡P2 GANA!');

      if (winnerTitleEl) {
        winnerTitleEl.textContent = label;
        winnerTitleEl.style.color = winner.color || '#ffd166';
      }

      if (faceWrapper) {
        const spriteSrc = winner.characterSprite || winner.fullPortrait || winner.animSprite || winner.iconSprite || winner.faceSprite;
        if (spriteSrc) {
          faceWrapper.innerHTML = `<img src="${spriteSrc}" alt="${winner.name}" class="go-winner-full-sprite"${flipSprite ? ' style="transform: scale(1.8) scaleX(-1);"' : ' style="transform: scale(1.8);"'}>`;
        } else {
          faceWrapper.innerHTML = `<div class="go-winner-square" style="background: ${winner.color};"><span>${winner.name[0]}</span></div>`;
        }
      }
    };

    if (p1Val === p2Val) {
      if (winnerTitleEl) {
        winnerTitleEl.textContent = '¡EMPATE!';
        winnerTitleEl.style.color = DRAW_RESULT.color || '#ffd166';
      }
      if (faceWrapper) {
        const s1 = p1Char.characterSprite || p1Char.iconSprite || p1Char.faceSprite;
        const s2 = p2Char.characterSprite || p2Char.iconSprite || p2Char.faceSprite;
        const p1Face = s1 ? `<img src="${s1}" class="go-winner-full-sprite">` : `<div class="go-winner-square" style="background: ${p1Char.color}">${p1Char.name[0]}</div>`;
        const p2Face = s2 ? `<img src="${s2}" class="go-winner-full-sprite" style="transform: scaleX(-1);">` : `<div class="go-winner-square" style="background: ${p2Char.color}">${p2Char.name[0]}</div>`;
        faceWrapper.innerHTML = `<div class="draw-faces-wrap">${p1Face}${p2Face}</div>`;
      }
    } else if (p2Val > p1Val) {
      renderWinnerBlock(p2Char, true, 'p2');
    } else {
      renderWinnerBlock(p1Char, false, 'p1');
    }
  }
}

export const screens = new ScreensManager();
