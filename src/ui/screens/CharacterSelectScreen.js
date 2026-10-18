// ===================================================
// PANTALLA DINÁMICA: SELECCIÓN DE PERSONAJES (CharacterSelectScreen.js)
// Layout estilo Juego de Lucha Arcade 1v1 (P1 - Select Panel - P2)
// ===================================================

import { CHARACTERS } from '../../data/characters.js';

export function renderCharacterSelectScreen(gameMode = 'vs-ai', onSelectionFinished, onNavigateHome = null) {
  const container = document.createElement('div');
  container.className = 'game-screen active-screen';
  container.id = 'screen-char-select';

  let currentStep = 'p1'; // 'p1' o 'p2'
  let p1SelectedChar = null;
  let p2SelectedChar = null;

  let p1HoverChar = null;
  let p2HoverChar = null;

  function generatePanelHTML(playerKey) {
    const isP1 = playerKey === 'p1';
    const playerTag = isP1 ? '1P' : (gameMode === 'vs-ai' ? 'CPU' : '2P');
    return `
      <div class="char-side-panel ${isP1 ? 'p1-side-panel' : 'p2-side-panel'}" id="panel-${playerKey}">
        <header class="side-panel-header">
          <span class="side-panel-badge" id="badge-${playerKey}">${playerTag}</span>
        </header>

        <div class="side-panel-stage">
          <img src="" alt="Sprite" class="side-panel-sprite ${!isP1 ? 'flipped-sprite' : ''}" id="sprite-${playerKey}" style="display:none">
          <div class="empty-sprite-placeholder" id="placeholder-${playerKey}">?</div>
        </div>

        <div class="side-panel-footer">
          <!-- Cuadradito que muestra el nombre -->
          <div class="char-name-square" id="name-square-${playerKey}">
            <span class="char-name-text" id="name-text-${playerKey}">???</span>
          </div>

          <!-- Botón desplegable para información extra (comentado a petición)
          <button class="info-toggle-btn" id="toggle-info-${playerKey}">
            <span>INFO EXTRA</span>
            <span class="toggle-arrow" id="arrow-${playerKey}">▼</span>
          </button>
          <div class="side-panel-details collapsed" id="details-${playerKey}">
          </div>
          -->
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="screen-card char-select-card arcade-select-card">
      <main class="char-select-arcade-layout">
        <!-- DIV 1: PANEL IZQUIERDO (P1) -->
        ${generatePanelHTML('p1')}

        <!-- DIV 2: PANEL CENTRAL (SELECT PANEL) -->
        <div class="char-center-section" id="select-panel">
          <header class="select-panel-header">
            <div class="char-nav-controls">
              <button class="nav-icon-btn" id="btn-char-nav-home" title="Volver al Menú Principal">
                <span class="nav-icon"><img src="/assets/sprites/UI/Icon_home.png" alt="Home"></span>
              </button>
              <button class="nav-icon-btn" id="btn-char-nav-back" title="Volver Atrás">
                <span class="nav-icon"><img src="/assets/sprites/UI/Icon_back.png" alt="Back"></span>
              </button>
            </div>
            <h2 class="char-select-title">Selecciona tu sintético</h2>
          </header>

          <div class="char-roster-grid">
            ${CHARACTERS.map(c => `
              <button class="roster-card ${!c.isPlayable ? 'disabled-card' : ''}"
                      data-id="${c.id}" ${!c.isPlayable ? 'disabled' : ''}
                      style="--char-theme-color: ${c.color}; --char-border-color: ${c.borderColor}; --char-bg-color: ${c.bgColor || '#181628'};">
                ${(c.iconSprite || c.faceSprite) ? `<img src="${c.iconSprite || c.faceSprite}" alt="${c.name}" class="roster-img">` : '<span class="lock-icon">🔒</span>'}
                <span class="roster-player-badge badge-p1" id="badge-p1-${c.id}" style="display:none">P1</span>
                <span class="roster-player-badge badge-p2" id="badge-p2-${c.id}" style="display:none">${gameMode === 'vs-ai' ? 'CPU' : 'P2'}</span>
              </button>
            `).join('')}

            <!-- Botón de selección aleatoria ? -->
            <button class="roster-card random-select-card" id="btn-random-select" title="Selección Aleatoria">
              <span class="random-icon">?</span>
            </button>
          </div>

          <button class="arcade-main-btn confirm-char-btn" id="btn-confirm-char" disabled>
            <span class="btn-text" id="btn-confirm-text">¡CONFIRMAR Y COMBATIR!</span>
          </button>
        </div>

        <!-- DIV 3: PANEL DERECHO (P2) -->
        ${generatePanelHTML('p2')}
      </main>
    </div>
  `;

  function updateSidePanel(playerKey, char, isCurrentTurn) {
    const panelEl = container.querySelector(`#panel-${playerKey}`);
    if (!panelEl) return;

    const isP1 = playerKey === 'p1';
    const themeColor = char ? (char.color || '#FFFFFF') : '#FFFFFF';
    const borderColor = char ? (char.borderColor || '#E6ECF5') : '#2B3245';
    const bgColor = char ? (char.bgColor || '#141726') : '#141726';

    panelEl.style.setProperty('--panel-theme', themeColor);
    panelEl.style.setProperty('--panel-border', borderColor);
    panelEl.style.setProperty('--panel-bg-color', bgColor);
    panelEl.style.setProperty('--panel-glow', `${themeColor}44`);

    if (isCurrentTurn) {
      panelEl.classList.add('active-turn-panel');
    } else {
      panelEl.classList.remove('active-turn-panel');
    }

    const spriteEl = panelEl.querySelector(`#sprite-${playerKey}`);
    const placeholderEl = panelEl.querySelector(`#placeholder-${playerKey}`);
    const nameTextEl = panelEl.querySelector(`#name-text-${playerKey}`);
    const detailsEl = panelEl.querySelector(`#details-${playerKey}`);

    if (char) {
      if (spriteEl) {
        spriteEl.src = char.characterSprite || char.fullPortrait || char.iconSprite || char.faceSprite;
        spriteEl.style.display = 'block';
      }
      if (placeholderEl) placeholderEl.style.display = 'none';
      if (nameTextEl) {
        nameTextEl.textContent = char.name;
        nameTextEl.style.color = themeColor;
      }
    } else {
      if (spriteEl) spriteEl.style.display = 'none';
      if (placeholderEl) placeholderEl.style.display = 'flex';
      if (nameTextEl) {
        nameTextEl.textContent = '???';
        nameTextEl.style.color = '#7A8499';
      }
    }

    if (detailsEl) {
      if (char) {
        detailsEl.innerHTML = `
          ${char.quote ? `
            <div class="char-quote-card" style="margin-bottom: 8px; font-style: italic; color: #94a3b8; font-size: 0.65rem; border-left: 2px solid ${themeColor}; padding-left: 6px;">
              "${char.quote}"
            </div>
          ` : ''}

          ${char.trait ? `
            <div class="ability-box trait-ability-box" style="border-color: #f59e0b;">
              <div class="ability-title" style="color: #fbbf24;">⚙️ TRAIT: ${char.trait.name}</div>
              <div class="ability-desc">${char.trait.description}</div>
            </div>
          ` : ''}

          <div class="ability-box passive-ability-box">
            <div class="ability-title">🛡️ PASIVA: ${char.passiveAbility?.name || 'Pasiva'}</div>
            <div class="ability-desc">${char.passiveAbility?.description || 'Efecto pasivo constante'}</div>
          </div>

          <div class="ability-box active-ability-box">
            <div class="ability-title">⚡ ACTIVA [1 Carga]: ${char.activeAbility?.name || 'Activa'}</div>
            <div class="ability-desc">${char.activeAbility?.description || 'Habilidad especial de combate'}</div>
            <div class="ability-charges">Coste: <strong>1 Carga</strong> (Capacidad máx: <strong>${char.activeAbility?.maxCharges || 1}</strong>)</div>
          </div>

          <div class="ability-box titan-ability-box" style="border-color: #ec4899;">
            <div class="ability-title" style="color: #f472b6;">👑 TITÁN (CON DADO 6): ${char.titanAbility?.name || 'Habilidad Titán'}</div>
            <div class="ability-desc">${char.titanAbility?.description || 'Boost titánico al sacar un 6'}</div>
          </div>

          ${char.units ? `
            <div class="ability-box units-overview-box" style="border-color: #38bdf8; background: rgba(15, 23, 42, 0.6);">
              <div class="ability-title" style="color: #38bdf8;">♟️ UNIDADES (DAÑO/VIDA)</div>
              <div class="ability-desc" style="display: flex; flex-direction: column; gap: 3px; font-size: 0.62rem;">
                <div><strong>👑 Titán (${char.units.titan.atk}/${char.units.titan.hp})</strong>: ${char.units.titan.description}</div>
                <div><strong>🗼 Mediana (${char.units.mediana.atk}/${char.units.mediana.hp})</strong>: ${char.units.mediana.description}</div>
                <div><strong>♟ Pequeña (${char.units.pequena.atk}/${char.units.pequena.hp})</strong>: ${char.units.pequena.description}</div>
              </div>
            </div>
          ` : ''}
        `;
      } else {
        detailsEl.innerHTML = `
          <div class="empty-details-msg">Selecciona un luchador para ver su información extra.</div>
        `;
      }
    }
  }

  function updateView() {
    const p1Char = p1HoverChar || p1SelectedChar;
    const p2Char = p2HoverChar || p2SelectedChar;

    updateSidePanel('p1', p1Char, currentStep === 'p1');
    updateSidePanel('p2', p2Char, currentStep === 'p2');

    // Actualizar subtítulo de turno
    const stepLabel = container.querySelector('#char-select-step-label');
    if (stepLabel) {
      if (gameMode === 'vs-ai') {
        stepLabel.textContent = 'TURNO DE SELECCIÓN (JUGADOR 1)';
      } else {
        stepLabel.textContent = currentStep === 'p1' ? 'JUGADOR 1: ELIGE P1' : 'JUGADOR 2: ELIGE P2';
      }
    }

    // Botón de confirmación
    const activeSelected = currentStep === 'p1' ? p1SelectedChar : p2SelectedChar;
    const confirmBtn = container.querySelector('#btn-confirm-char');
    const btnTextEl = container.querySelector('#btn-confirm-text');

    if (confirmBtn) {
      confirmBtn.disabled = !activeSelected;
    }

    if (btnTextEl) {
      if (gameMode === 'local' && currentStep === 'p1') {
        btnTextEl.textContent = p1SelectedChar ? 'CONFIRMAR P1' : 'ELIGE P1';
      } else {
        btnTextEl.textContent = activeSelected ? 'CONFIRMAR P2' : 'ELIGE P2';
      }
    }

    // Actualizar marcadores de selección (etiquetas P1 y P2/CPU)
    CHARACTERS.forEach(c => {
      const cardBtn = container.querySelector(`.roster-card[data-id="${c.id}"]`);
      const badgeP1 = container.querySelector(`#badge-p1-${c.id}`);
      const badgeP2 = container.querySelector(`#badge-p2-${c.id}`);

      if (cardBtn) {
        const isP1Sel = p1SelectedChar && p1SelectedChar.id === c.id;
        const isP2Sel = p2SelectedChar && p2SelectedChar.id === c.id;

        if (badgeP1) badgeP1.style.display = isP1Sel ? 'flex' : 'none';
        if (badgeP2) badgeP2.style.display = isP2Sel ? 'flex' : 'none';

        cardBtn.classList.toggle('selected-p1', Boolean(isP1Sel));
        cardBtn.classList.toggle('selected-p2', Boolean(isP2Sel));

        // Deshabilitar la casilla si está ocupada por el otro jugador
        const isTakenByOther = (currentStep === 'p2' && isP1Sel) || (currentStep === 'p1' && isP2Sel);
        cardBtn.classList.toggle('taken-card', Boolean(isTakenByOther));
        if (!c.isPlayable || isTakenByOther) {
          cardBtn.disabled = true;
        } else {
          cardBtn.disabled = false;
        }
      }
    });
  }

  // Event Listeners Roster
  container.querySelectorAll('.roster-card:not(.random-select-card)').forEach(btn => {
    const id = btn.getAttribute('data-id');
    const found = CHARACTERS.find(c => c.id === id);

    if (found && found.isPlayable) {
      btn.addEventListener('mouseenter', () => {
        if (currentStep === 'p1') {
          p1HoverChar = found;
        } else if (currentStep === 'p2') {
          if (p1SelectedChar && p1SelectedChar.id === found.id) return;
          p2HoverChar = found;
        }
        updateView();
      });

      btn.addEventListener('mouseleave', () => {
        p1HoverChar = null;
        p2HoverChar = null;
        updateView();
      });

      btn.addEventListener('click', () => {
        if (currentStep === 'p1') {
          p1SelectedChar = found;
          p1HoverChar = null;
          if (gameMode === 'local' && p2SelectedChar && p2SelectedChar.id === found.id) {
            p2SelectedChar = null;
          }
        } else if (currentStep === 'p2') {
          if (p1SelectedChar && p1SelectedChar.id === found.id) return;
          p2SelectedChar = found;
          p2HoverChar = null;
        }
        updateView();
      });
    }
  });

  // Evento Botón Selección Aleatoria ?
  const randomBtn = container.querySelector('#btn-random-select');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const playable = CHARACTERS.filter(c => c.isPlayable);
      if (playable.length === 0) return;

      if (currentStep === 'p1') {
        const randomChar = playable[Math.floor(Math.random() * playable.length)];
        p1SelectedChar = randomChar;
        p1HoverChar = null;
        if (gameMode === 'local' && p2SelectedChar && p2SelectedChar.id === p1SelectedChar.id) {
          p2SelectedChar = null;
        }
      } else {
        const available = playable.filter(c => !p1SelectedChar || c.id !== p1SelectedChar.id);
        if (available.length > 0) {
          p2SelectedChar = available[Math.floor(Math.random() * available.length)];
          p2HoverChar = null;
        }
      }
      updateView();
    });
  }

  // Botón Confirmar
  const confirmBtn = container.querySelector('#btn-confirm-char');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (gameMode === 'local' && currentStep === 'p1') {
        if (!p1SelectedChar) return;
        currentStep = 'p2';
        p1HoverChar = null;
        p2HoverChar = null;
        updateView();
      } else {
        if (!p1SelectedChar) return;
        let p2FinalChar = p2SelectedChar;
        if (gameMode === 'vs-ai') {
          const playable = CHARACTERS.filter(c => c.isPlayable);
          const p2Opts = playable.filter(c => c.id !== p1SelectedChar.id);
          p2FinalChar = p2Opts.length > 0 ? p2Opts[Math.floor(Math.random() * p2Opts.length)] : playable[0];
        }

        if (onSelectionFinished) {
          onSelectionFinished(p1SelectedChar, p2FinalChar);
        }
      }
    });
  }

  // Botones de navegación (Home y Back)
  const homeNavBtn = container.querySelector('#btn-char-nav-home');
  if (homeNavBtn) {
    homeNavBtn.addEventListener('click', () => {
      if (typeof onNavigateHome === 'function') {
        onNavigateHome();
      }
    });
  }

  const backNavBtn = container.querySelector('#btn-char-nav-back');
  if (backNavBtn) {
    backNavBtn.addEventListener('click', () => {
      if (currentStep === 'p2' && gameMode === 'local') {
        currentStep = 'p1';
        p2SelectedChar = null;
        p2HoverChar = null;
        updateView();
      } else if (p1SelectedChar) {
        p1SelectedChar = null;
        p1HoverChar = null;
        updateView();
      } else {
        if (typeof onNavigateHome === 'function') {
          onNavigateHome();
        }
      }
    });
  }

  updateView();
  return container;
}



