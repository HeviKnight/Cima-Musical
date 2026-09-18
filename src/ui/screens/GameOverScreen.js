// ===================================================
// PANTALLA DINÁMICA: FIN DE PARTIDA (GameOverScreen.js)
// ===================================================

export function renderGameOverScreen() {
  const container = document.createElement('div');
  container.className = 'game-screen active-screen';
  container.id = 'screen-gameover';

  container.innerHTML = `
    <div class="screen-card gameover-card">
        <h2 class="gameover-title" id="go-title">FIN DE LA SESION</h2>
        <div class="gameover-winner-badge" id="go-winner-badge">EL POP CONQUISTA LAS PLAYLISTS</div>

        <div class="gameover-hero-box" id="go-hero-box">
            <div class="winner-face-wrapper" id="go-face-wrapper">
                <img src="/assets/sprites/pop_ch_face.png" alt="Ganador" class="go-winner-face" id="go-winner-img">
            </div>
            <p class="gameover-flavor" id="go-flavor">Los ritmos pegadizos y la estetica pop dominan las listas y la escena urbana.</p>
        </div>

        <div class="gameover-actions-box">
            <button class="arcade-main-btn" id="btn-restart-game">
                <span class="btn-text">REINICIAR PARTIDA</span>
            </button>
            <button class="arcade-secondary-btn" id="btn-menu-game">
                <span class="btn-text">MENU PRINCIPAL</span>
            </button>
        </div>
    </div>
  `;

  return container;
}
