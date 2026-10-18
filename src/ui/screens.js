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
    } else {
      if (this.screenStart) this.screenStart.classList.remove('active-screen');
      if (this.screenCharSelect) this.screenCharSelect.classList.toggle('active-screen', screenName === 'charSelect');
      if (this.screenGame) this.screenGame.classList.toggle('active-screen', screenName === 'game');
      if (this.screenGameOver) this.screenGameOver.classList.toggle('active-screen', screenName === 'gameover');
    }
  }

  applyGameOverData(p1Prestige, p2Prestige) {
    const faceWrapper = document.getElementById('go-face-wrapper');
    const winnerNameEl = document.getElementById('go-winner-name');
    const winnerTagEl = document.getElementById('go-winner-tag');
    const crownEl = document.getElementById('go-crown');

    // Elementos de marcador y nombres
    const p1NameEl = document.getElementById('go-p1-name');
    const p2NameEl = document.getElementById('go-p2-name');
    const p1PresEl = document.getElementById('go-p1-prestige');
    const p2PresEl = document.getElementById('go-p2-prestige');
    const p1Col = document.getElementById('go-p1-col');
    const p2Col = document.getElementById('go-p2-col');

    const p1Char = gameState.p1?.character || CONTROLS.p1;
    const p2Char = gameState.p2?.character || CONTROLS.p2;

    const p1Val = Math.min(100, Math.max(0, p1Prestige ?? gameState.p1.prestige ?? 0));
    const p2Val = Math.min(100, Math.max(0, p2Prestige ?? gameState.p2.prestige ?? 0));

    if (p1NameEl) p1NameEl.textContent = p1Char.name || 'JUGADOR 1';
    if (p2NameEl) p2NameEl.textContent = p2Char.name || 'JUGADOR 2';
    if (p1PresEl) p1PresEl.textContent = p1Val;
    if (p2PresEl) p2PresEl.textContent = p2Val;

    const renderWinnerBlock = (winner, flipSprite = false, winnerPlayerKey = 'p1') => {
      const isP1 = winnerPlayerKey === 'p1';
      if (winnerTagEl) {
        winnerTagEl.textContent = isP1 ? '1P CAMPEÓN' : (gameState.currentGameMode === 'vs-ai' ? 'CPU CAMPEÓN' : '2P CAMPEÓN');
        winnerTagEl.style.backgroundColor = winner.color;
      }
      if (winnerNameEl) {
        winnerNameEl.textContent = `${winner.name} CONQUISTA LA CIMA`;
        winnerNameEl.style.color = winner.color;
      }
      if (crownEl) {
        crownEl.textContent = '👑';
      }

      if (faceWrapper) {
        faceWrapper.style.borderColor = winner.borderColor || winner.color;
        // Priorizar characterSprite / fullPortrait para que luzca imponente en el podio
        const spriteSrc = winner.characterSprite || winner.fullPortrait || winner.animSprite || winner.iconSprite || winner.faceSprite;
        if (spriteSrc) {
          faceWrapper.innerHTML = `<img src="${spriteSrc}" alt="${winner.name}" class="go-winner-full-sprite"${flipSprite ? ' style="transform: scaleX(-1);"' : ''}>`;
        } else {
          faceWrapper.innerHTML = `<div class="go-winner-square" style="background: ${winner.color}; border: 3px solid ${winner.borderColor}"><span>${winner.name[0]}</span></div>`;
        }
      }

      if (p1Col && p2Col) {
        p1Col.classList.toggle('winner-col', isP1);
        p1Col.classList.toggle('loser-col', !isP1);
        p2Col.classList.toggle('winner-col', !isP1);
        p2Col.classList.toggle('loser-col', isP1);
      }

      if (this.goFlavor) {
        this.goFlavor.textContent = winner.quote || `La vibra arrolladora de ${winner.name} resuena en todo el escenario musical.`;
      }
    };

    if (p1Val === p2Val) {
      // EMPATE
      if (winnerTagEl) {
        winnerTagEl.textContent = 'EMPATE';
        winnerTagEl.style.backgroundColor = DRAW_RESULT.color;
      }
      if (winnerNameEl) {
        winnerNameEl.textContent = DRAW_RESULT.headline;
        winnerNameEl.style.color = DRAW_RESULT.color;
      }
      if (crownEl) {
        crownEl.textContent = '⚔️';
      }
      if (faceWrapper) {
        faceWrapper.style.borderColor = DRAW_RESULT.borderColor;
        const s1 = p1Char.characterSprite || p1Char.iconSprite || p1Char.faceSprite;
        const s2 = p2Char.characterSprite || p2Char.iconSprite || p2Char.faceSprite;
        const p1Face = s1 ? `<img src="${s1}" class="go-winner-face">` : `<div class="go-winner-square" style="background: ${p1Char.color}">${p1Char.name[0]}</div>`;
        const p2Face = s2 ? `<img src="${s2}" class="go-winner-face" style="transform: scaleX(-1);">` : `<div class="go-winner-square" style="background: ${p2Char.color}">${p2Char.name[0]}</div>`;
        faceWrapper.innerHTML = `<div class="draw-faces-wrap">${p1Face}<span class="draw-vs-symbol">⚡</span>${p2Face}</div>`;
      }
      if (p1Col && p2Col) {
        p1Col.classList.remove('winner-col', 'loser-col');
        p2Col.classList.remove('winner-col', 'loser-col');
      }
      if (this.goFlavor) {
        this.goFlavor.textContent = DRAW_RESULT.flavor || 'Un duelo legendario donde ambos artistas igualaron su nivel de energía sonora.';
      }
    } else if (p2Val > p1Val) {
      renderWinnerBlock(p2Char, true, 'p2');
    } else {
      renderWinnerBlock(p1Char, false, 'p1');
    }
  }
}

export const screens = new ScreensManager();
