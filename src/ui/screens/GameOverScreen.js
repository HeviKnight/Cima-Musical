// ===================================================
// PANTALLA DINÁMICA: FIN DE PARTIDA (GameOverScreen.js)
// ===================================================

export function renderGameOverScreen() {
  const container = document.createElement('div');
  container.className = 'game-screen active-screen';
  container.id = 'screen-gameover';

  container.innerHTML = `
    <div class="screen-card gameover-card arcade-gameover-card">
        <!-- Sprite del Ganador -->
        <div class="gameover-winner-avatar" id="go-face-wrapper"></div>

        <!-- Título / Anuncio del Ganador -->
        <h2 class="gameover-winner-announcement" id="go-winner-title">¡P1 GANA!</h2>

        <!-- Botones de Acción Estilo Pantalla de Inicio -->
        <div class="gameover-actions-box">
            <button class="arcade-menu-btn" id="btn-restart-game">REVANCHA INMEDIATA</button>
            <button class="arcade-menu-btn" id="btn-menu-game">MENÚ PRINCIPAL</button>
        </div>
    </div>
  `;

  return container;
}
