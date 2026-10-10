# 📝 Notas del Parche — Versión 0.1.3

## 🚀 Resumen del Lanzamiento
Esta actualización documenta la gran **reestructuración temática, narrativa y de interfaz de usuario (UI)** del juego: la transición desde el concepto inicial de duelo musical hacia una **distopía robótica y cibernética**, incorporando un roster de personajes biomecánicos/androides con habilidades pasivas y activas, selección de personajes, rediseño completo de UI/UX, integración de efectos de sonido y música temática, y solución general de errores.

---

## ✨ Novedades y Mejoras Principales

### 🤖 1. Rework Temático: De Duelo Musical a Distopía Robótica
- **Nueva Temática & Lore**: Rediseño completo de la ambientación. Ahora las facciones/tribus representan entidades robóticas y cibernéticas (*La Humanidad*, *La Adicción*, *La Colmena*, etc.).
- **Roster de 6 Personajes Únicos**:
  - **CYBORG**: Equilibrado. Habilidad activa *Biocarga* y pasiva *Melodía del Pueblo*.
  - **INCINERADOR**: Ofensivo. Alta capacidad de daño pero penalizado al fallar.
  - **SWARM DRONE / HOLO / DRILL / ROBO-HAND**: Incorporación de 6 androides/máquinas con sprites, iconos y retratos totalmente renovados.
- **Pantalla de Selección de Personajes (`CharacterSelectScreen`)**: Nueva pantalla interactiva pre-partida con visualización de atributos, dificultad, habilidades pasivas/activas, y selección individual para P1 y P2 (o IA).

---

### 🎨 2. Rework Completo de UI/UX y Sistema de Pantallas
- **Interfaz Distópica/Cyberpunk**: Nuevos paneles visuales, paleta de colores neon-cibernéticos y estética retrogaming en pixel art.
- **Flujo de Pantallas Modular**:
  - Pantalla Principal (`HomeScreen`) con selección de modo (1P vs IA / 2P Local).
  - Pantalla de Selección de Personaje (`CharacterSelectScreen`).
  - Pantalla de Combate (`GameScreen`).
  - Pantalla de Resultado y Fin de Juego (`GameOverScreen`).
- **Navegación**: Botones con iconos de retorno (`Icon_back.png`) e inicio (`Icon_home.png`).

---

### 🎵 3. Sistema de Audio y Efectos Sonoros (`SoundManager`)
- **Música Temática Dinámica**: Pistas de audio independientes por personaje/facción (`Melody_Pop.mp3`, `Melody_Rock.mp3`, `Melody_Inicio.mp3`).
- **Efectos de Sonido Integrados**: Retroalimentación sonora para pulsaciones de botones, inicio de fase, ataques, impactos y habilidades.

---

### 🎯 4. Marcador de Ronda y Desplegable Estático
- **Layout Fijo Central**: Se rediseñó el encabezado global (`.round-counter-pill`) para que permanezca **100% estático y centrado** durante la animación del desplegable de fases (`COLOCAR` / `BAILE`).
- **Plegado Independiente**: El distintivo de fase (`.round-drawer-badge`) se despliega hacia la derecha desde detrás del marcador central sin desplazar la caja de la ronda.
- **Micro-animaciones**: Animación `val-pop` para dar un pulso visual al número de ronda al incrementar.

---

### 🕹️ 5. Control de Movimiento y Permanencia en Casilla
- **Permanencia por Defecto**: Si el jugador no selecciona una casilla a la que desplazarse antes de que expire el temporizador de la fase de elección, el personaje **permanece en su casilla actual** (`lastPawnCell`) en lugar de realizar un movimiento aleatorio forzado.

---

### 🤖 6. Modo 1 Jugador vs IA Totalmente Funcional
- **Bloqueo Estricto de Teclas P2**: En el modo `vs-ai`, los controles humanos de P2 (`U, I, O, J, K, L, M, ,, .`) e interacciones manuales quedan deshabilitados.
- **Ocultación Inteligente de Leyendas (`.key-tag`)**:
  - **Fase de Colocación**: El tablero de P2 no muestra ninguna tecla de control.
  - **Fase de Ataque**: El tablero de P2 muestra las teclas de P1 (`Q, W, E...`) para indicar al jugador humano dónde dirigir su ataque.
- **IA Instantánea**: Confirmación instantánea de `¡LISTO!`, elección de posición adyacente válida y ataque automático sobre P1.

---

### 💖 7. Gráficos y Animaciones de Barra de Salud (`Healthbar`)
- **Textura Repetida (`healthbar_bar.png`)**: Sustitución del degradado plano por la textura pixelated de 8 píxeles en repetición horizontal continua (`repeat-x`).
- **Brillos y Estrellas Continuos**: Efectos deslizantes de luz y estrellas animadas en las barras de vida.
- **Estética Retrogaming Arcade**: Eliminación completa de bordes redondeados (`border-radius: 0`) para un estilo visual retro cuadrado.

---

### 🐛 8. Corrección de Bugs y Estabilidad
- Solución de errores en el ciclo del game loop (`game-controller.js`).
- Ajustes en el cálculo de patrones de dados (`patterns.js`).
- Corrección de sincronización de eventos de UI y temporizadores de fase.
