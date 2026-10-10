// ===================================================
// PASOS Y PUTASOS - PUNTO DE ENTRADA Y NAVEGACIÓN (MAIN)
// ===================================================

import './style.css';
import { CONTROLS } from './data/controls.js';
import { screens } from './ui/screens.js';
import { soundManager } from './audio/sound-manager.js';
import { gameController } from './core/game-controller.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar gestor de pantallas
  screens.init();

  // Configurar botones del Menú Principal
  const btnVsAI = document.getElementById('btn-mode-vs-ai');
  const btnLocal = document.getElementById('btn-mode-local');
  const btnStory = document.getElementById('btn-mode-story');
  const btnTutorial = document.getElementById('btn-mode-tutorial');
  const btnSettings = document.getElementById('btn-mode-settings');

  if (btnVsAI) {
    btnVsAI.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      screens.mountCharacterSelectScreen('vs-ai', (p1Char, p2Char) => {
        gameController.iniciarPartidaDinamica('vs-ai', p1Char, p2Char);
      });
    });
  }

  if (btnLocal) {
    btnLocal.addEventListener('click', () => {
      soundManager.startBackgroundMusic();
      screens.mountCharacterSelectScreen('local', (p1Char, p2Char) => {
        gameController.iniciarPartidaDinamica('local', p1Char, p2Char);
      });
    });
  }

  // Placeholders con animación visual al pulsar
  [btnStory, btnTutorial, btnSettings].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        soundManager.startBackgroundMusic();
        const badge = btn.querySelector('.btn-badge');
        if (badge) {
          badge.style.transform = 'scale(1.25)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
      });
    }
  });

  // Activar música en el primer gesto del usuario
  document.addEventListener('click', () => soundManager.startBackgroundMusic(), { once: true });
  document.addEventListener('keydown', () => soundManager.startBackgroundMusic(), { once: true });

  // Control global de teclado
  window.addEventListener('keydown', (e) => {
    soundManager.startBackgroundMusic();
    const key = e.key.toLowerCase();
    if (CONTROLS.p1.keyList.includes(key)) {
      gameController.handleInput('p1', key);
    } else if (CONTROLS.p2.keyList.includes(key)) {
      if (gameController.currentGameMode !== 'vs-ai' || key === 'k') {
        gameController.handleInput('p2', key);
      }
    }
  });
});
