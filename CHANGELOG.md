# 📝 Notas del Parche — Versión 0.1.2 (Commit `f37dc30`)

## 🚀 Resumen del Lanzamiento
Esta actualización introduce mejoras fundamentales en la jugabilidad, mecánicas de control, comportamiento de la Inteligencia Artificial, animaciones pixel art y la estructuración del sistema de pantallas y estados de fin de juego.

---

## ✨ Novedades y Mejoras Principales

### 🎯 1. Marcador de Ronda y Desplegable Estático
- **Layout Fijo Central**: Se rediseñó el encabezado global (`.round-counter-pill`) para que permanezca **100% estático y centrado** durante la animación del desplegable de fases (`COLOCAR` / `BAILE`).
- **Plegado Independiente**: El distintivo de fase (`.round-drawer-badge`) se despliega hacia la derecha desde detrás del marcador central sin desplazar la caja de la ronda.
- **Micro-animaciones**: Se añadió la animación `val-pop` para dar un pulso visual al número de ronda al incrementar.

---

### 🕹️ 2. Control de Movimiento y Permanencia en Casilla
- **Permanencia por Defecto**: Si el jugador no selecciona una casilla a la que desplazarse antes de que expire el temporizador de la fase de elección, el personaje **permanece en su casilla actual** (`lastPawnCell`) en lugar de realizar un movimiento aleatorio forzado.

---

### 🤖 3. Modo 1 Jugador vs IA Totalmente Funcional
- **Bloqueo Estricto de Teclas P2**: En el modo `vs-ai`, los controles humanos de P2 (`U, I, O, J, K, L, M, ,, .`) y las interacciones manuales quedan completamente deshabilitados.
- **Ocultación Inteligente de Leyendas (`.key-tag`)**:
  - **Fase de Colocación**: El tablero de P2 no muestra ninguna tecla de control.
  - **Fase de Ataque**: El tablero de P2 muestra las teclas de P1 (`Q, W, E...`) para indicar al jugador humano dónde dirigir su ataque.
- **IA Instantánea**:
  - **Preparación**: Confirma `¡LISTO!` al instante sin demoras.
  - **Elección de Posición**: Determina inmediatamente su posición adyacente válida respetando las reglas del tablero.
  - **Ataque**: Fija su objetivo de ataque aleatorio de forma instantánea sobre el tablero de P1.

---

### 💖 4. Gráficos y Animaciones de Barra de Salud (`Healthbar`)
- **Textura Repetida (`healthbar_bar.png`)**: Sustitución del degradado plano por la textura pixelated de 8 píxeles en repetición horizontal continua (`repeat-x`).
- **Brillos Continuos (`healthbar_shine.png`)**: Dos destellos deslizándose suavemente de izquierda a derecha a la altura del 2º píxel superior.
- **Estrellas Rápidas (`healthbar_star.png`)**: Múltiples destellos animados a mayor velocidad (`1.8s` por ciclo).
- **Estética Retrogaming**: Eliminación completa de bordes redondeados (`border-radius: 0`) en toda la interfaz para un estilo arcade cuadrado.

---

### 🏆 5. Pantalla de Fin de Partida y Estados de Resultado
- **Cálculo Basado en Prestigio**: Corrección del algoritmo de victoria al alcanzar los 100 puntos de prestigio.
- **3 Estados de Resultado**:
  - **Victoria Jugador 1 (Pop)**: Emblema, titulares y avatar de Pop (`pop_ch_face.png`).
  - **Victoria Jugador 2 (Rock)**: Emblema, titulares y avatar de Rock (`rock_ch_face.png`).
  - **Empate**: Titular *"EMPATE EN LAS LISTAS"* y **despliegue simultáneo de ambos sprites** en el recuadro central separados por el símbolo `⚡`.

---

### 🎨 6. Paleta Base Neutra de la Interfaz
- **Especificación HEX Integrada**:
  - **Fondo Global (Arena)**: `#0D0F14`
  - **Panel Base Inactivo**: `#161922`
  - **Casillas Neutras Apagadas**: `#1E2330`
  - **Bordes Estructurales / Contornos**: `#2B3245`
  - **Texto Secundario / Labels**: `#7A8499`
  - **Texto Principal**: `#E6ECF5`
  - **Cabecera de Ronda**: Fondo `#1A162B` con borde `#3D3559`
- **Protección de Paneles**: Los interiores de los paneles de Pop (`#player-1-panel`) y Rock (`#player-2-panel`) mantienen sus esquemas de color distintivos.

---

## 📂 Archivos Modificados en la Versión 0.1.1
- `package.json` (Bump versión a `0.1.1`)
- `src/main.js` (Lógica principal de loop, fases, IA e inputs)
- `src/style.css` (Estilos visuales, layout estático y animaciones pixel)
- `src/ui/feedback.js` (Actualizaciones DOM, etiquetas de teclas y animaciones UI)
- `src/ui/screens.js` (Gestor de pantallas dinámicas y datos de fin de juego)
- `src/ui/screens/GameOverScreen.js` (Componente de pantalla de juego activa y fin de partida)
- `src/ui/screens/GameScreen.js` (Componente de pantalla de juego activa)
- `src/core/state.js` & `src/core/ai.js` (Controlador de estado e Inteligencia Artificial)
