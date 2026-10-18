// ===================================================
// PANTALLA DINÁMICA: FIN DE PARTIDA (GameOverScreen.js)
// ===================================================

export function renderGameOverScreen() {
  const container = document.createElement('div');
  container.className = 'game-screen active-screen';
  container.id = 'screen-gameover';

  container.innerHTML = `
    <div class="screen-card gameover-card arcade-gameover-card">
        <!-- Luces y brillo decorativo de fondo -->
        <div class="gameover-glow-bg"></div>

        <!-- Encabezado con corona y título arcade -->
        <header class="gameover-header">
            <span class="gameover-crown-icon" id="go-crown">👑</span>
            <h2 class="gameover-main-title" id="go-title">CLÍMAX MUSICAL</h2>
            <div class="gameover-subtitle" id="go-subtitle">SESIÓN FINALIZADA</div>
        </header>

        <!-- Banner de Ganador -->
        <div class="gameover-winner-banner" id="go-winner-badge">
            <span class="winner-banner-tag" id="go-winner-tag">CAMPEÓN</span>
            <span class="winner-banner-text" id="go-winner-name">---</span>
        </div>

        <!-- Contenedor central: Escenario del ganador y marcador -->
        <div class="gameover-center-stage">
            <!-- Escenario / Podio del Héroe Ganador -->
            <div class="gameover-podium-wrap" id="go-podium">
                <div class="gameover-spotlight"></div>
                <div class="gameover-avatar-frame" id="go-face-wrapper"></div>
                <div class="gameover-podium-base">
                    <span class="podium-number">#1</span>
                </div>
            </div>

            <!-- Resumen de puntuación y tensión final -->
            <div class="gameover-stats-panel">
                <div class="stats-panel-header">
                    <span class="stats-icon">⚡</span>
                    <span class="stats-title">TENSIÓN FINAL</span>
                </div>
                <div class="stats-versus-row">
                    <div class="stats-player-col" id="go-p1-col">
                        <span class="player-col-tag" id="go-p1-tag">1P</span>
                        <span class="player-col-name" id="go-p1-name">P1</span>
                        <div class="player-tension-pill" id="go-p1-tension-pill">
                            <span class="tension-val" id="go-p1-prestige">0</span>
                            <span class="tension-max">/100</span>
                        </div>
                    </div>

                    <div class="stats-vs-divider">VS</div>

                    <div class="stats-player-col" id="go-p2-col">
                        <span class="player-col-tag" id="go-p2-tag">2P</span>
                        <span class="player-col-name" id="go-p2-name">P2</span>
                        <div class="player-tension-pill" id="go-p2-tension-pill">
                            <span class="tension-val" id="go-p2-prestige">0</span>
                            <span class="tension-max">/100</span>
                        </div>
                    </div>
                </div>

                <!-- Cita o mensaje del clímax -->
                <div class="gameover-flavor-quote" id="go-flavor-box">
                    <span class="quote-mark">“</span>
                    <span class="quote-text" id="go-flavor"></span>
                    <span class="quote-mark">”</span>
                </div>
            </div>
        </div>

        <!-- Botones de Acción -->
        <div class="gameover-actions-box">
            <button class="arcade-main-btn go-btn" id="btn-restart-game">
                <span class="btn-text">REVANCHA INMEDIATA</span>
            </button>
            <button class="arcade-secondary-btn go-btn" id="btn-menu-game">
                <span class="btn-text">MENÚ PRINCIPAL</span>
            </button>
        </div>
    </div>
  `;

  return container;
}
