// ===================================================
// PANTALLA DINÁMICA: JUEGO ACTIVO (GameScreen.js)
// ===================================================

export function renderGameScreen() {
    const container = document.createElement('div');
    container.className = 'game-screen active-screen';
    container.id = 'screen-game';

    container.innerHTML = `
    <div class="game-wrapper" id="game-wrapper">
        <header class="match-global-header">
            <div class="round-counter-pill" title="Número de Ronda Actual">
                <span class="round-label">RONDA</span>
                <span class="round-val" id="round-num-val">1</span>
                <div class="round-drawer-badge" id="round-drawer-badge">
                    <span class="drawer-text" id="round-drawer-text"></span>
                </div>
            </div>
        </header>

        <main class="battle-arena">
            <!-- JUGADOR 1 -->
            <section class="player-panel" id="player-1-panel">
                <div class="player-header">
                    <span class="player-badge p1-badge">P1</span>
                    <div class="prestige-widget" id="p1-prestige-widget" title="Medidor de Prestigio Jugador 1">
                        <div class="prestige-trail p1-trail" id="p1-prestige-trail" style="width: 0%;"></div>
                        <div class="prestige-fill p1-fill" id="p1-prestige-bar" style="width: 0%;">
                            <div class="prestige-sparkle"></div>
                            <div class="healthbar-shine shine-1"></div>
                            <div class="healthbar-shine shine-2"></div>
                            <div class="healthbar-star star-1"></div>
                            <div class="healthbar-star star-2"></div>
                            <div class="healthbar-star star-3"></div>
                            <div class="healthbar-star star-4"></div>
                        </div>
                        <div class="prestige-shine"></div>
                        <span class="prestige-num-text" id="p1-prestige-val">[0 / 100]</span>
                        <div class="prestige-float-container" id="p1-prestige-float"></div>
                    </div>
                </div>

                <div class="character-stage">
                    <div class="character-wrapper p1-character" id="p1-character">
                        <div class="character-reaction-badge" id="p1-reaction"></div>
                        <div class="character-sprite" id="p1-character-sprite"></div>
                        <div class="character-shadow"></div>
                    </div>
                </div>

                <div class="grid-board-wrapper">
                    <div class="grid-relative-box" id="p1-grid-container">
                        <div class="grid-3x3" id="p1-grid">
                            <button class="casilla-btn" data-key="q" data-row="0" data-col="0" data-player="p1">
                                <span class="key-tag">Q</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="w" data-row="0" data-col="1" data-player="p1">
                                <span class="key-tag">W</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="e" data-row="0" data-col="2" data-player="p1">
                                <span class="key-tag">E</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="a" data-row="1" data-col="0" data-player="p1">
                                <span class="key-tag">A</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="s" data-row="1" data-col="1" data-player="p1">
                                <span class="key-tag">S</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="d" data-row="1" data-col="2" data-player="p1">
                                <span class="key-tag">D</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="z" data-row="2" data-col="0" data-player="p1">
                                <span class="key-tag">Z</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="x" data-row="2" data-col="1" data-player="p1">
                                <span class="key-tag">X</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="c" data-row="2" data-col="2" data-player="p1">
                                <span class="key-tag">C</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                        </div>

                        <div class="board-roll-overlay" id="p1-roll-overlay">
                            <div class="roll-overlay-box">
                                <div class="roll-number-badge">
                                    <img src="/assets/sprites/Dado_spr_1.png" alt="Dado" class="roll-dice-sprite" id="p1-roll-dice-img">
                                </div>
                                <div class="roll-shape-badge">
                                    <img src="/assets/sprites/attack1.png" alt="Ataque" class="roll-shape-sprite" id="p1-roll-shape-img">
                                </div>
                            </div>
                        </div>

                        <div class="board-big-countdown" id="p1-big-countdown">
                            <span class="countdown-big-num" id="p1-countdown-num">3</span>
                        </div>
                    </div>

                    <div class="board-curtain-overlay active-black" id="p1-curtain">
                        <div class="curtain-content">
                            <div class="curtain-icon-wrapper" id="p1-curtain-icon-box">
                                <img src="/assets/sprites/pop_ch_face.png" alt="Cara Pop P1" class="curtain-img" id="p1-curtain-img">
                            </div>
                            <div class="curtain-title" id="p1-curtain-title">A LA PISTA</div>
                            <div class="curtain-key-cap" id="p1-curtain-key">S</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- JUGADOR 2 -->
            <section class="player-panel" id="player-2-panel">
                <div class="player-header">
                    <span class="player-badge p2-badge">P2</span>
                    <div class="prestige-widget" id="p2-prestige-widget" title="Medidor de Prestigio Jugador 2">
                        <div class="prestige-trail p2-trail" id="p2-prestige-trail" style="width: 0%;"></div>
                        <div class="prestige-fill p2-fill" id="p2-prestige-bar" style="width: 0%;">
                            <div class="prestige-sparkle"></div>
                            <div class="healthbar-shine shine-1"></div>
                            <div class="healthbar-shine shine-2"></div>
                            <div class="healthbar-star star-1"></div>
                            <div class="healthbar-star star-2"></div>
                            <div class="healthbar-star star-3"></div>
                            <div class="healthbar-star star-4"></div>
                        </div>
                        <div class="prestige-shine"></div>
                        <span class="prestige-num-text" id="p2-prestige-val">[0 / 100]</span>
                        <div class="prestige-float-container" id="p2-prestige-float"></div>
                    </div>
                </div>

                <div class="character-stage">
                    <div class="character-wrapper p2-character" id="p2-character">
                        <div class="character-reaction-badge" id="p2-reaction"></div>
                        <div class="character-sprite" id="p2-character-sprite"></div>
                        <div class="character-shadow"></div>
                    </div>
                </div>

                <div class="grid-board-wrapper">
                    <div class="grid-relative-box" id="p2-grid-container">
                        <div class="grid-3x3" id="p2-grid">
                            <button class="casilla-btn" data-key="u" data-row="0" data-col="0" data-player="p2">
                                <span class="key-tag">U</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="i" data-row="0" data-col="1" data-player="p2">
                                <span class="key-tag">I</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="o" data-row="0" data-col="2" data-player="p2">
                                <span class="key-tag">O</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="j" data-row="1" data-col="0" data-player="p2">
                                <span class="key-tag">J</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="k" data-row="1" data-col="1" data-player="p2">
                                <span class="key-tag">K</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="l" data-row="1" data-col="2" data-player="p2">
                                <span class="key-tag">L</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="m" data-row="2" data-col="0" data-player="p2">
                                <span class="key-tag">M</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="," data-row="2" data-col="1" data-player="p2">
                                <span class="key-tag">,</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                            <button class="casilla-btn" data-key="." data-row="2" data-col="2" data-player="p2">
                                <span class="key-tag">.</span>
                                <span class="pawn-reveal-marker"></span>
                            </button>
                        </div>

                        <div class="board-roll-overlay" id="p2-roll-overlay">
                            <div class="roll-overlay-box">
                                <div class="roll-number-badge">
                                    <img src="/assets/sprites/Dado_spr_1.png" alt="Dado" class="roll-dice-sprite" id="p2-roll-dice-img">
                                </div>
                                <div class="roll-shape-badge">
                                    <img src="/assets/sprites/attack1.png" alt="Ataque" class="roll-shape-sprite" id="p2-roll-shape-img">
                                </div>
                            </div>
                        </div>

                        <div class="board-big-countdown" id="p2-big-countdown">
                            <span class="countdown-big-num" id="p2-countdown-num">3</span>
                        </div>
                    </div>

                    <div class="board-curtain-overlay active-black" id="p2-curtain">
                        <div class="curtain-content">
                            <div class="curtain-icon-wrapper" id="p2-curtain-icon-box">
                                <img src="/assets/sprites/rock_ch_face.png" alt="Cara Rock P2" class="curtain-img" id="p2-curtain-img">
                            </div>
                            <div class="curtain-title" id="p2-curtain-title">A LA PISTA</div>
                            <div class="curtain-key-cap" id="p2-curtain-key">K</div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
  `;

    return container;
}
