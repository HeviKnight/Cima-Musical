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
      </button>`
    )
  ).join('');
}

function renderPlayerStage(playerKey) {
  const isP1 = playerKey === 'p1';
  const playerNum = isP1 ? '1' : '2';
  const playerTag = isP1 ? '1P' : '2P';
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



  return `
    <section class="game-side-panel char-side-panel ${isP1 ? 'p1-side-panel' : 'p2-side-panel'}" id="player-${playerNum}-panel" style="${panelStyle}">
      <!-- Cabecera de Jugador: Badge y Nombre -->
      <header class="side-panel-header">
        <span class="side-panel-badge ${playerKey}-badge">${playerTag}</span>
        <span class="player-char-title">${charName}</span>
      </header>

      <!-- Stage del Personaje (Sprite animado) -->
      <div class="side-panel-stage combat-stage">
        <div class="character-wrapper ${playerKey}-character" id="${playerKey}-character">
          <div class="character-reaction-badge" id="${playerKey}-reaction"></div>
          ${characterAvatarHTML}
          <div class="character-shadow"></div>
        </div>
      </div>

      <!-- Contenedor conjunto de Barra de Tensión -->
      <div class="prestige-section-wrapper ${playerKey}-prestige-section">
        ${char.id === 'incinerador' ? `
          <div class="horno-counter-badge" id="${playerKey}-horno-badge" title="Contador del Horno" style="margin-bottom: 6px;">
            <span class="horno-icon">🔥</span>
            <span class="horno-text" id="${playerKey}-horno-text">0/3</span>
          </div>
        ` : ''}

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

      <!-- Control Checkbox de Listo -->
      <div class="player-ready-bar ${playerKey}-ready-bar" id="${playerKey}-ready-bar" data-player="${playerKey}" title="Marca cuando estés listo para avanzar de fase">
        <input type="checkbox" id="${playerKey}-ready-checkbox" class="player-ready-checkbox" tabindex="-1" />
        <span class="ready-checkbox-custom">
          <span class="ready-checkmark">✔</span>
        </span>
        <span class="ready-key-badge">${isP1 ? 'ESPACIO' : 'ENTER'}</span>
        <span class="ready-text-label" id="${playerKey}-ready-text-label">LISTO</span>
      </div>
    </section>
  `;
}

function renderPlayerBoard(playerKey) {
  const isP1 = playerKey === 'p1';
  const initialKey = isP1 ? 'S' : 'K';
  const char = gameState[playerKey]?.character || (isP1 ? CONTROLS.p1 : CONTROLS.p2);
  const themeColor = char.color || (isP1 ? '#8B5CF6' : '#EF4444');
  const borderColor = char.borderColor || (isP1 ? '#7C3AED' : '#B91C1C');
  const charName = char.name || (isP1 ? 'P1' : 'P2');
  const initialLetter = charName[0] || (isP1 ? '1P' : '2P');

  const curtainAvatarHTML = (char.iconSprite || char.faceSprite) ? `
    <img src="${char.iconSprite || char.faceSprite}" alt="${charName}" class="curtain-img" id="${playerKey}-curtain-img">
  ` : `
    <div class="curtain-square-avatar" id="${playerKey}-curtain-img" style="background: ${themeColor}; border: 2px solid ${borderColor}">
      <span>${initialLetter}</span>
    </div>
  `;

  return `
    <!-- Tablero 3x3 y Cortinilla (${playerKey.toUpperCase()}) -->
    <div class="grid-board-wrapper ${playerKey}-board-wrapper" style="--player-border-color: ${borderColor}; --player-glow: ${themeColor}55;">
      <div class="grid-relative-box" id="${playerKey}-grid-container">
        <div class="grid-3x3" id="${playerKey}-grid">
          ${renderGridButtons(playerKey)}
        </div>

        <!-- Overlay de Animación de Dados sobre el Grid (Reclutamiento de Peón) -->
        <div class="board-roll-overlay" id="${playerKey}-roll-overlay">
          <div class="roll-overlay-box">
            <div class="roll-number-badge">
              <img src="/assets/sprites/UI/Dado_spr_1.png" alt="Dado" class="roll-dice-sprite" id="${playerKey}-roll-dice-img">
            </div>
            <div class="roll-pawn-badge" id="${playerKey}-roll-pawn-box" style="display: none;">
              <img src="${char.iconSprite || char.faceSprite || '/assets/sprites/heroes/CH_Icon_Cyborg.png'}" alt="Peón" class="roll-pawn-sprite" id="${playerKey}-roll-pawn-img">
              <div class="roll-pawn-hp-text" id="${playerKey}-roll-pawn-hp-text">1 HP</div>
            </div>
          </div>
        </div>

        <!-- Cortinilla Overlay sobre el tablero -->
        <div class="board-curtain-overlay active-black" id="${playerKey}-curtain">
          <div class="curtain-content">
            <div class="curtain-icon-wrapper" id="${playerKey}-curtain-icon-box">
              ${curtainAvatarHTML}
            </div>
            <div class="curtain-title" id="${playerKey}-curtain-title">TIRAR DADO</div>
            <div class="curtain-key-cap" id="${playerKey}-curtain-key">${initialKey}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderGameScreen(onNavigateHome = null) {
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
        <!-- ZONA SUPERIOR: ESQUINAS CON PERSONAJES & CENTRO CON RONDA/TIMER -->
        <div class="battle-top-section">
          <!-- ESQUINA SUPERIOR IZQUIERDA: P1 -->
          ${renderPlayerStage('p1')}

          <!-- CENTRO SUPERIOR: BOTÓN HOME, RONDA Y TEMPORIZADOR -->
          <div class="game-center-section" id="battle-center-panel">
            <div class="center-top-bar">
              <button class="nav-icon-btn" id="btn-game-nav-home" title="Volver al Menú Principal">
                <span class="nav-icon"><img src="/assets/sprites/UI/Icon_home.png" alt="Home"></span>
              </button>
            </div>

            <div class="central-round-wrapper">
              <div class="round-counter-header">
                <span class="round-counter-label">RONDA</span>
                <span class="round-counter-num" id="round-num-val">1</span>
              </div>
              <div class="phase-tag-banner phase-placement" id="round-drawer-badge">
                <span id="round-drawer-text">COLOCAR</span>
              </div>
            </div>

            <div class="central-timer-wrapper" id="shared-big-countdown">
              <span class="central-timer-label">TIEMPO</span>
              <span class="countdown-big-num" id="shared-countdown-num">3</span>
            </div>
          </div>

          <!-- ESQUINA SUPERIOR DERECHA: P2 -->
          ${renderPlayerStage('p2')}
        </div>

        <!-- ZONA INFERIOR: CONTENEDOR CON AMBOS TABLEROS PEGADOS -->
        <div class="battle-bottom-boards-container" id="battle-boards-container">
          <div class="boards-cluster" id="boards-cluster">
            ${renderPlayerBoard('p1')}
            ${renderPlayerBoard('p2')}
          </div>
        </div>
      </main>
    </div>
  `;

  // Event listener para el botón de inicio/menú
  const homeNavBtn = container.querySelector('#btn-game-nav-home');
  if (homeNavBtn) {
    homeNavBtn.addEventListener('click', () => {
      if (typeof onNavigateHome === 'function') {
        onNavigateHome();
      }
    });
  }

  return container;
}
