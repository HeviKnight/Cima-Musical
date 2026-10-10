// ===================================================
// PANTALLA DINÁMICA: JUEGO ACTIVO (GameScreen.js)
// Overhaul general: Layout de 3 secciones estilo Selección de Personajes Arcade
// (P1 Panel Izquierdo - Sección Central - P2 Panel Derecho)
// ===================================================

import { CONTROLS } from '../../data/controls.js';
import { gameState } from '../../core/state.js';

function renderGridButtons(playerKey) {
  const ctrl = CONTROLS[playerKey];
  return ctrl.keyMatrix.flatMap((row, r) =>
    row.map((key, c) => `
      <button class="casilla-btn" data-key="${key}" data-row="${r}" data-col="${c}" data-player="${playerKey}">
        <span class="key-tag">${key.toUpperCase()}</span>
        <span class="pawn-reveal-marker"></span>
      </button>`
    )
  ).join('');
}

function renderPlayerPanel(playerKey) {
  const isP1 = playerKey === 'p1';
  const playerNum = isP1 ? '1' : '2';
  const playerTag = isP1 ? '1P' : '2P';
  const initialKey = isP1 ? 'S' : 'K';
  const char = gameState[playerKey]?.character || (isP1 ? CONTROLS.p1 : CONTROLS.p2);

  const themeColor = char.color || (isP1 ? '#8B5CF6' : '#EF4444');
  const borderColor = char.borderColor || (isP1 ? '#7C3AED' : '#B91C1C');
  const charName = char.name || (isP1 ? 'P1' : 'P2');
  const initialLetter = charName[0] || playerTag;
  const bgColor = char.bgColor || (isP1 ? '#110323' : '#230303');

  const panelStyle = `
    --panel-theme: ${themeColor};
    --panel-border: ${borderColor};
    --panel-bg-color: ${bgColor};
    --player-theme-color: ${themeColor};
    --player-border-color: ${borderColor};
    --player-panel-bg: ${bgColor};
    --player-header-bg: linear-gradient(90deg, ${borderColor}dd 0%, ${themeColor}aa 100%);
    --player-badge-bg: linear-gradient(135deg, ${themeColor} 0%, ${borderColor} 100%);
    --player-glow: ${themeColor}44;
    --player-stage-bg: ${bgColor};
  `.replace(/\s+/g, ' ');

  const characterAvatarHTML = (char.animSprite || char.characterSprite || char.fullPortrait) ? `
    <div class="character-sprite" id="${playerKey}-character-sprite" style="background-image: url('${char.animSprite || char.characterSprite || char.fullPortrait}')"></div>
  ` : `
    <div class="character-square-avatar" id="${playerKey}-character-sprite" style="background: ${themeColor}; border: 3px solid ${borderColor}; box-shadow: 0 0 20px ${themeColor}">
      <span>${initialLetter}</span>
    </div>
  `;

  const curtainAvatarHTML = (char.iconSprite || char.faceSprite) ? `
    <img src="${char.iconSprite || char.faceSprite}" alt="${charName}" class="curtain-img" id="${playerKey}-curtain-img">
  ` : `
    <div class="curtain-square-avatar" id="${playerKey}-curtain-img" style="background: ${themeColor}; border: 2px solid ${borderColor}">
      <span>${initialLetter}</span>
    </div>
  `;

  const maxCharges = char.activeAbility?.maxCharges ?? 1;
  const currentCharges = gameState[playerKey]?.activeAbilityCharges ?? maxCharges;

  let chargesSlotsHTML = '';
  for (let i = 0; i < maxCharges; i++) {
    const isAvailable = i < currentCharges;
    chargesSlotsHTML += `
      <div class="charge-slot ${isAvailable ? 'active' : 'used'}" title="${isAvailable ? 'Carga Disponible' : 'Carga Usada'}">
        ${isAvailable ? '<span class="charge-icon">⚡</span>' : '<span class="charge-used-sq"></span>'}
      </div>
    `;
  }

  return `
    <section class="game-side-panel char-side-panel ${isP1 ? 'p1-side-panel' : 'p2-side-panel'}" id="player-${playerNum}-panel" style="${panelStyle}">
      <!-- Cabecera de Jugador: Badge -->
      <header class="side-panel-header">
        <span class="side-panel-badge ${playerKey}-badge">${playerTag}</span>
      </header>

      <!-- Stage del Personaje (Sprite animado) -->
      <div class="side-panel-stage combat-stage">
        <div class="character-wrapper ${playerKey}-character" id="${playerKey}-character">
          <div class="character-reaction-badge" id="${playerKey}-reaction"></div>
          ${characterAvatarHTML}
          <div class="character-shadow"></div>
        </div>
      </div>

      <!-- Contenedor conjunto de Cargas y Barra de Tensión -->
      <div class="prestige-section-wrapper ${playerKey}-prestige-section">
        <!-- Iconos de Cargas de Asalto (encima de la barra de tensión) -->
        <div class="charges-slots-wrapper" id="${playerKey}-charges-slots">
          ${chargesSlotsHTML}
        </div>

        <!-- Barra de Tensión / Prestigio ocupando todo el ancho debajo del personaje -->
        <div class="prestige-widget full-width-prestige" id="${playerKey}-prestige-widget" title="Medidor de Prestigio Jugador ${playerNum}">
          <div class="prestige-trail ${playerKey}-trail" id="${playerKey}-prestige-trail" style="width: 0%;"></div>
          <div class="prestige-fill ${playerKey}-fill" id="${playerKey}-prestige-bar" style="width: 0%; background: linear-gradient(90deg, ${themeColor}, ${borderColor});">
            <div class="prestige-sparkle"></div>
            <div class="healthbar-shine shine-1"></div>
            <div class="healthbar-shine shine-2"></div>
            <div class="healthbar-star star-1"></div>
            <div class="healthbar-star star-2"></div>
          </div>
          <div class="prestige-shine"></div>
          <span class="prestige-num-text" id="${playerKey}-prestige-val">[0 / 100]</span>
          <div class="prestige-float-container" id="${playerKey}-prestige-float"></div>
        </div>
      </div>

      <!-- Tablero 3x3 y Cortinilla -->
      <div class="grid-board-wrapper">
        <div class="grid-relative-box" id="${playerKey}-grid-container">
          <div class="grid-3x3" id="${playerKey}-grid">
            ${renderGridButtons(playerKey)}
          </div>

          <!-- Overlay de Animación de Dados sobre el Grid -->
          <div class="board-roll-overlay" id="${playerKey}-roll-overlay">
            <div class="roll-overlay-box">
              <div class="roll-number-badge">
                <img src="/assets/sprites/Dado_spr_1.png" alt="Dado" class="roll-dice-sprite" id="${playerKey}-roll-dice-img">
              </div>
              <div class="roll-shape-badge">
                <img src="/assets/sprites/attack1.png" alt="Ataque" class="roll-shape-sprite" id="${playerKey}-roll-shape-img">
              </div>
            </div>
          </div>

          <!-- Cortinilla Overlay sobre el tablero -->
          <div class="board-curtain-overlay active-black" id="${playerKey}-curtain">
            <div class="curtain-content">
              <div class="curtain-icon-wrapper" id="${playerKey}-curtain-icon-box">
                ${curtainAvatarHTML}
              </div>
              <div class="curtain-title" id="${playerKey}-curtain-title">A LA PISTA</div>
              <div class="curtain-key-cap" id="${playerKey}-curtain-key">${initialKey}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderGameScreen() {
  const container = document.createElement('div');
  container.className = 'game-screen active-screen';
  container.id = 'screen-game';

  const p1Char = gameState.p1?.character || CONTROLS.p1;
  const p2Char = gameState.p2?.character || CONTROLS.p2;

  const p1Theme = p1Char.color || '#8B5CF6';
  const p1Border = p1Char.borderColor || '#7C3AED';
  const p1Bg = p1Char.bgColor || '#110323';

  const p2Theme = p2Char.color || '#EF4444';
  const p2Border = p2Char.borderColor || '#B91C1C';
  const p2Bg = p2Char.bgColor || '#230303';

  container.innerHTML = `
    <div class="screen-card game-battle-card arcade-select-card" id="game-wrapper">
      <main class="battle-arcade-layout">
        <!-- DIV 1: PANEL IZQUIERDO (JUGADOR 1) -->
        ${renderPlayerPanel('p1')}

        <!-- DIV 2: SECCIÓN CENTRAL DE COMBATE -->
        <div class="game-center-section" id="battle-center-panel">
          <!-- Botón Superior de Menú/Home sin H de Combate -->
          <div class="center-top-bar">
            <button class="nav-icon-btn" id="btn-game-nav-home" title="Volver al Menú Principal">
              <span class="nav-icon"><img src="/assets/sprites/Icon_home.png" alt="Home"></span>
            </button>
          </div>

          <!-- Contador de Ronda a todo el ancho (2 partes: Ronda arriba, Fase sólida abajo) -->
          <div class="central-round-wrapper">
            <div class="round-counter-header">
              <span class="round-counter-label">RONDA</span>
              <span class="round-counter-num" id="round-num-val">1</span>
            </div>
            <div class="phase-tag-banner phase-placement" id="round-drawer-badge">
              <span id="round-drawer-text">COLOCAR</span>
            </div>
          </div>

          <!-- Contador de Tiempo Compartido -->
          <div class="central-timer-wrapper" id="shared-big-countdown">
            <span class="central-timer-label">TIEMPO</span>
            <span class="countdown-big-num" id="shared-countdown-num">3</span>
          </div>

          <!-- Barras Verticales de Combate pegadas a los lados y abajo del todo -->
          <div class="vertical-combat-section">
            <!-- Barra Vertical Jugador 1 (Pegada a la izquierda / colores P1 / sin border radius / abajo del todo) -->
            <div class="vertical-player-bar p1-vertical-bar" id="p1-combat-strip" style="--bar-theme: ${p1Theme}; --bar-border: ${p1Border}; --bar-bg: ${p1Bg};">
              <img src="/assets/sprites/Dado_spr_1.png" alt="Dado P1" class="strip-dice-img" id="p1-central-dice-img">
              <img src="/assets/sprites/attack1.png" alt="Figura P1" class="strip-shape-img" id="p1-central-shape-img">
            </div>

            <!-- Barra Vertical Jugador 2 (Pegada a la derecha / colores P2 / sin border radius / abajo del todo) -->
            <div class="vertical-player-bar p2-vertical-bar" id="p2-combat-strip" style="--bar-theme: ${p2Theme}; --bar-border: ${p2Border}; --bar-bg: ${p2Bg};">
              <img src="/assets/sprites/Dado_spr_1.png" alt="Dado P2" class="strip-dice-img" id="p2-central-dice-img">
              <img src="/assets/sprites/attack1.png" alt="Figura P2" class="strip-shape-img" id="p2-central-shape-img">
            </div>
          </div>
        </div>

        <!-- DIV 3: PANEL DERECHO (JUGADOR 2) -->
        ${renderPlayerPanel('p2')}
      </main>
    </div>
  `;

  // Event listener para el botón de inicio/menú
  setTimeout(() => {
    const homeNavBtn = container.querySelector('#btn-game-nav-home');
    if (homeNavBtn) {
      homeNavBtn.addEventListener('click', () => {
        import('../screens.js').then(({ screens }) => {
          screens.showScreen('start');
        });
      });
    }
  }, 0);

  return container;
}


