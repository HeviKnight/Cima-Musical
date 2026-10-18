# 📝 Notas del Parche — Versión 0.4.2: Flujo Sincronizado de Acción y Sistema de Cargas Unitario

## 🚀 Resumen del Lanzamiento
Esta versión soluciona dos aspectos esenciales del flujo de combate:
1. **Selector de Acción Independiente y Sincronizado**: La selección entre Ataque básico (`[A]`) y Habilidad activa (`[D]`) ahora es una sub-fase independiente. Al elegir opción, la cortinilla del jugador cambia a estado verde **"¡LISTO!"** y permanece a la espera hasta que ambos jugadores han confirmado su elección. Una vez que ambos están listos, las cortinillas se retiran simultáneamente y comienza la ronda de combate con la opción seleccionada.
2. **Cargas de Habilidad Unitarias (1 Carga por Uso)**: Todas las habilidades activas se ejecutan gastando **1 sola carga por turno**, en lugar de requerir consumir la totalidad de la reserva acumulada. Cada personaje puede acumular hasta su capacidad máxima de cargas (`maxCharges`, ej. 1, 2 o 3 cargas), pero cualquier activación sólo exige y descuenta 1 carga.

---

# 📝 Notas del Parche — Versión 0.4.1: Mejoras de Calidad de Vida (QoL Overlays & Control Simplificado)

## 🚀 Resumen del Lanzamiento
Esta versión implementa una reestructuración de calidad de vida (QoL) en los overlays tácticos y la interfaz de usuario: reubica el overlay de preparación justo antes de la tirada de dados con la indicación **"TIRAR DADO"** (`[S]` / `[K]`), introduce un nuevo overlay interactivo de selección de acción previo a la ronda de ataque (**"ELIGE TU ACCIÓN"** con `[A]` / `[J]` para Ataque Normal y `[D]` / `[L]` para Habilidad Activa con contador de cargas), y limpia los paneles superiores de héroes eliminando los botones y slots redundantes de habilidades.

---

## ✨ Novedades y Cambios Principales (v0.4.1)

### 🎲 1. Overlay "TIRAR DADO" Antes de Cada Lanzamiento
- **Ubicación Canónica**: El overlay de cortinilla con confirmación por tecla `[S]` (P1) o `[K]` (P2) ahora aparece de forma precisa **antes de la tirada de dados** en cada ronda de juego (`PHASE_DICE_ROLL`), bajo el título explícito **"TIRAR DADO"**.
- **Flujo Fluido**: Al pulsar la tecla o hacer clic en la cortinilla, el juego procede a la animación de giro de dados y posterior colocación de tropas. La Ronda 0 arranca directamente con la colocación del Titán.

### ⚔️ 2. Overlay Táctico de Acción: Ataque Normal vs Habilidad
- **Selector en Pantalla**: Al inicio de la fase de acción (`PHASE_2_ATTACK`), sobre el tablero del jugador se despliega un overlay interactivo que muestra:
  - **Ataque Normal**: Tecla `[A]` (P1) / `[J]` (P2) -> *1 Casilla (1 Daño)*.
  - **Habilidad Activa**: Tecla `[D]` (P1) / `[L]` (P2) -> *Nombre de Habilidad* y medidor de cargas actuales (`⚡ X/Coste Cargas`).
- **Activación por Teclado o Clic**: El jugador puede pulsar `[A]` o `[D]` (o hacer clic sobre la tarjeta deseada) para seleccionar su modo de acción. Una vez seleccionada la opción, la cortinilla se retira para permitir seleccionar la casilla objetivo en el tablero o confirmar el turno con `[ESPACIO]`.

### 🧹 3. Limpieza de Interfaz Superior (Cabecera de Jugador)
- **Eliminación de Elementos Redundantes**: Se eliminaron el botón de habilidad (`.active-ability-btn`) y las ranuras cuadradas de cargas (`.charges-slots-wrapper`) de los paneles superiores de personaje.
- **Enfoque Visual**: Los paneles superiores conservan limpiamente el avatar animado, los efectos reactivos, el contador del Horno para el Incinerador (`🔥 X/3`) y la barra de tensión (0 a 100).

---

# 📝 Notas del Parche — Versión 0.4.0: Adaptación Completa del Roster, Tensión por Daño y Nuevos Sprites

## 🚀 Resumen del Lanzamiento
Esta versión completa la adaptación del documento de diseño (PDF) de **"Duelo 3x3 — Roster y Reglas"**, introduciendo estadísticas completas de **Daño y Vida (atk / hp)** para cada unidad, la mecánica de **Tensión por Daño al final de la ronda**, el sistema visual de **partículas cuadradas** que vuelan desde las unidades hacia el héroe, la reestructuración completa de los sprites en subcarpetas (`pawns/`, `heroes/`, `UI/`, `legacy/`), y la implementación detallada de los kits y efectos de las unidades para los 6 personajes.

---

## ✨ Novedades y Cambios Principales (v0.4.0)

### 📊 1. Estadísticas de Unidades (Daño / Vida) y Tensión por Daño
- **Doble Estadística por Unidad**: Cada unidad del juego cuenta con estadísticas explícitas de ataque (daño) y vida: `(daño / vida)`.
- **Tensión por Daño al Final de Ronda**: Al finalizar cada ronda, cada unidad viva en el tablero genera tensión equivalente a su estadística de daño.
- **Insignias Tácticas en el Tablero**: Se visualizan insignias de Ataque (`⚔️ X`) y Vida (`🩸 Y`) en cada peón, junto con indicadores de escudo (`🛡️`) y corona titánica (`👑`).

### ✨ 2. Efecto Visual de Partículas Cuadradas hacia el Héroe
- **Efecto de Partículas Retro**: Cada vez que una unidad o evento genera tensión (daño por unidad al final de ronda, bajas de peones o habilidades), se genera un flujo de partículas cuadradas estilizadas pixeladas.
- **Origen y Levitación Claros**: La unidad emisora se resalta con un aura brillante (`tension-source-active`) y las partículas cuadradas emergen justo por encima de su cabeza, suspendidas unos instantes para clarificar visualmente el origen.
- **Lanzamiento Escalonado (No Simultáneo)**: Las partículas ya no salen todas a la vez; se lanzan en secuencia continua una tras otra con una cadencia marcada, permitiendo que si varias unidades generan tensión en la ronda, cada unidad lo haga de forma distinguible y legible.
- **Impacto y Pulso en el Héroe**: Al impactar de forma continua en el panel superior, el sprite del héroe realiza pulsos reactivos de brillo temático y se actualiza la barra de tensión con retroalimentación numérica flotante (`+X`).

### 📁 3. Reorganización de Sprites y Nuevos Peones
- **Subcarpetas Integradas**:
  - `public/assets/sprites/pawns/`: Se integran todos los sprites de peones específicos para cada personaje y nivel (`PW_Cyborg_*.png`, `PW_Drill_*.png`, `PW_Furnance_*.png`, `PW_Holo_*.png`, `PW_RoboHand_*.png`, `PW_Swarm_*.png`).
  - `public/assets/sprites/heroes/`: Iconos, sprites y animaciones de los 6 personajes sintéticos.
  - `public/assets/sprites/UI/`: Caras del dado (`Dado_spr_*.png`), barra de salud y botones de navegación.
  - `public/assets/sprites/legacy/`: Recursos históricos de vidas y retratos previos.

### 🎲 4. Regla Canónica del Dado 6 (Titán / +1/+1 a la Unidad más Fuerte)
- Con un **6** en el dado:
  - Si el Titán está vivo, activa su habilidad especial.
  - Si la habilidad no puede ejecutarse o el Titán ha sido eliminado, añade **+1/+1 de daño y vida a la unidad más fuerte** del tablero (definida por la mayor suma de daño y vida, desempatada por mayor ataque o aleatoriamente).

### 🤖 5. Kits de Héroes y Unidades 100% Canónicos
- **Incinerador**:
  - Titán (0/6): Consume hasta 2 chatarras hacia el horno.
  - Medio (2/2): Al morir, mejora +1 HP a una chatarra aliada.
  - Pequeño (0/1): Chatarra aliada (combustible).
  - Activa [3]: Consume toda la chatarra (detona a 3 en el horno con 1 de daño AoE).
- **Swarm (Horda de drones)**:
  - Trait de equilibrio: Ronda 1 siempre obtiene un 1 en el dado.
  - Titán (0/6): Genera dos unidades pequeñas (1/1).
  - Medio (0/2): Cada ronda, añade +1 de daño a un dron adyacente.
  - Pequeño (1/1): Dron kamikaze (hace 1 daño a enemigo aleatorio al morir).
  - Activa [2]: Sacrifica todas las unidades pequeñas.
- **Cyborg**:
  - Titán (0/6): Otorga 5 de tensión con partículas cuadradas.
  - Medio (1/2): Cada ronda otorga escudo a una unidad adyacente.
  - Pequeño (1/1): Gana 1 de ataque si tiene aliados adyacentes.
  - Pasiva: +1 tensión por aliado vivo (máx +3).
  - Activa [1]: +1 daño de ataque por cada 20 de tensión.
- **RoboHand**:
  - Pasiva: Los ataques mueven a las unidades hacia una casilla superior (con envoltura inferior en fila 0).
  - Activa [3]: Mueve 1 unidad enemiga y le hace 1 de daño (2 si no puede moverse).
  - Titán (0/5): Intercambia posición con otra unidad y otorga +1 de ataque a ambos.
  - Medio (0/2): Cada ronda que se mueve una unidad enemiga, gana 1 de ataque.
  - Pequeño (1/1): Unidad básica.
- **Taladro**:
  - Pasiva: Cuando un aliado recibe daño, gana 1 de ataque extra.
  - Activa [2]: Hace 1 de daño a todas las unidades de ambos tableros.
  - Titán (0/6): Cura completamente a la unidad aliada con menos vida.
  - Medio (3/2): Al morir, otorga 1 de ataque a un aliado aleatorio.
  - Pequeño (0/3): Al morir, realiza 1 de daño en su casilla homóloga contraria.
- **Holo**:
  - Pasiva: Otorga escudo a una unidad aleatoria.
  - Activa [1]: Convierte los escudos en +1/+1 de daño y vida.
  - Titán (0/5): Su daño se iguala a su vida (inicia en 5/5).
  - Medio (1/2): Cada vez que el enemigo recibe daño, esta unidad recibe un escudo.
  - Pequeño (0/1): Si fuese a recibir un escudo, en su lugar consigue 1 de daño extra.

---

# 📝 Notas del Parche — Versión 0.3.0: Roster y Reglas Canónicas Duelo 3x3

## 🚀 Resumen del Lanzamiento
Esta versión implementa de forma íntegra las **nuevas reglas y mecánicas canónicas de "Duelo 3x3 — Roster y Reglas"**, reestructurando el balance del juego, la tensión por eliminación, el dado d6 con habilidades de Titán, el sistema de mejora en tablero lleno, la disyuntiva táctica de **Ataque o Habilidad**, y los kits completos con tres intensidades para los 6 sintéticos del roster.

---

## ✨ Novedades y Cambios Principales (v0.3.0)

### 👑 1. Ronda 0 Universal: Despliegue de Titanes
- Se sustituye el despliegue anterior de 3 peones por la regla canónica: **cada jugador coloca obligatoriamente su Titán (6 HP `👑`)** en una casilla de su cuadrícula 3x3.
- Al colocarse ambos titanes, la partida avanza a la Ronda 1.

### 🎯 2. Tensión por Eliminación y Victoria a 100
- **Tensión por Kill calibrada**:
  - Pequeña (1 HP `♟`): **+8 de tensión**
  - Mediana (2 HP `🗼`): **+16 de tensión**
  - Titán (6 HP `👑`): **+50 de tensión**
- **Daño sin kill**: No otorga tensión.
- **Objetivo**: El primer jugador en alcanzar **100 de tensión** gana la partida.

### 🎲 3. El Dado (d6) y Habilidad del Titán
- **Caras 1 a 3**: Genera una unidad **Pequeña (1 HP)**.
- **Caras 4 y 5**: Genera una unidad **Mediana (2 HP)**.
- **Cara 6**: **Habilidad del Titán**.
  - Si el jugador tiene a su Titán con vida, activa el efecto especial de Titán de su héroe (sustituyendo a la colocación de unidad en esa ronda).
  - Si su Titán fue eliminado previamente, invoca una unidad pequeña (1 HP) de reemplazo.

### 🧱 4. Colocación y Regla de Mejora en Tablero Lleno
- Las nuevas unidades se despliegan en cualquier casilla libre.
- Si el tablero está lleno (9 casillas ocupadas), la unidad obtenida **mejora** a una unidad ya existente sumando sus puntos de vida (`pawn.hp += pending.hp`).

### ⚔️ 5. Planificación de Acción: Ataque o Habilidad Activa
- En la fase de acción, ambos jugadores eligen simultáneamente: **o atacan a 1 casilla rival, o activan su habilidad activa consumiendo cargas** (no pueden suceder ambas cosas a la vez).
- Nuevo botón interactivo en HUD (`.active-ability-btn`) para alternar fluidamente entre el disparo y la habilidad.

### 🌀 6. Resolución Orgánica: "Mover Niega Efectos"
- Todos los efectos se dirigen a coordenadas `(fila, columna)`. Si una tropa se desplaza (por pasivas o activas de RoboHand / Taladro) antes de la resolución, los ataques caen al vacío ("agua").

### 🤖 7. Kits Completos de los 6 Héroes
- **Incinerador**: Trait *Horno* (acumula chatarra consumida; cada 3 detona 1 de daño AoE a todos los rivales), Pasiva *Chatarrería* (genera 1 chatarra al final del turno), Activa [3] *Ignición del Horno* (consume toda la chatarra), Titán (6) *Purga* (consume hasta 2 chatarras).
- **Swarm (Horda de drones)**: Trait *Despliegue Rápido* (dado 1 forzado en ronda 1), Pasiva *Autodestrucción* (al morir un dron hace 1 de daño a un enemigo aleatorio), Activa [2] *Sacrificio de Drones* (sacrifica todos los drones en cadena), Titán (6) *Replicador* (genera 2 drones).
- **Cyborg**: Pasiva *Batería Humana* (+1 tensión por aliado vivo, máx +3), Activa [1] *Finisher Cibernético* (+1 daño extra por cada 20 de tensión acumulada, rango 1 a 5 de daño), Titán (6) *Sobrecarga* (+4 de tensión).
- **RoboHand**: Pasiva *Mano Protectora* (da 1 escudo a un aliado y lo traslada a casilla libre), Activa [3] *Reubicación Forzada* (mueve enemigo a casilla libre y le hace 1 daño; si no hay espacio, 2 daño), Titán (6) *Enroque Titánico* (intercambia posición con aliado y da 1 escudo a ambos).
- **Taladro**: Pasiva *Cobro de Bajas* (+2 tensión al morir un aliado), Activa [2] *Intercambio Sísmico* (permuta todas las posiciones aliadas de forma impredecible), Titán (6) *Nube de Polvo* (invisibilidad para todas sus tropas esa ronda).
- **Holo**: Pasiva *Refracción* (1 vez por ronda desvía el daño recibido a otro aliado vivo), Activa [1] *Clon Ilusorio* (clona una tropa no titánica en casilla libre), Titán (6) *Robo de Foco* (roba 8 de tensión al rival).

---

# 📝 Notas del Parche — Versión 0.2.3

## ✨ Novedades y Refactorizaciones (v0.2.3)

### 🧹 1. Eliminación de Código Muerto y Obsoleto
- **`patterns.js`**: Eliminación completa de `ATTACK_PATTERNS`, `DEFAULT_PATTERNS_BY_FACE` y funciones de formas geométricas; el archivo ahora se enfoca puramente en la obtención de sprites de dados.
- **`grid.js`**: Eliminación de `isAdjacentCell` y simplificación de validaciones matemáticas al nuevo esquema de ataques a una celda única.
- **`feedback.js`**: Eliminación de métodos no utilizados (`highlightValidPawnMoves`, `clearMoveHighlights`, `renderMines`, `renderFog`, `revealPawn`, etc.) y propiedades antiguas (`p1RollShapeImg`, `p2RollShapeImg`).
- **`style.css`**: Limpieza de clases huérfanas (`.pawn-reveal-marker`, `.casilla-btn.pawn-revealed`, `.roll-shape-sprite`, `.standing-pawn-face`, `.state-mine`, etc.).

### 🏷️ 2. Renombrado y Clarificación de Nombres
- Sustitución de `activatePlaceholderAbility` por `activateCharacterAbility` en el controlador del juego.
- Reemplazo de `showPlaceholderActivation` y `updateAssaultChargesUI` por nombres descriptivos `showAbilityActivation` y `updateAbilityChargesUI` (manteniendo compatibilidad retroactiva).
- Sustitución de etiquetas provisionales en `CharacterSelectScreen.js`.
- Corrección de comentarios ambiguos en `main.js`.

### ⚡ 3. Optimización y Robustez
- **Prevención de bucles y dependencias circulares**: Se resolvió la importación circular entre pantallas inyectando el callback de navegación desde `screens.js`.
- **Soporte para habilidades activas específicas**: Implementación del bloqueo de esquinas en fase de colocación para la habilidad activa de Taladro (`terraformar`) con soporte tanto en UI (`highlightFreeCells`) como en IA (`chooseBotPawnPosition`).
- **Corrección de activación de habilidad en doble clic**: Corregido bug donde el doble clic de P2 invocaba erróneamente la habilidad de P1.

### 🤖 4. Carpeta de Agentes (`.agents/`)
- Incorporación de las especificaciones canónicas de Antigravity:
  - **`.agents/rules/game-rules.md`**: Reglas canónicas del juego (Ronda 0, dados, peones 1/2/6 HP, emojis ♟/🗼/👑, tensión y avance con [ESPACIO]).
  - **`.agents/rules/architecture.md`**: Diagrama de responsabilidades de cada módulo del proyecto.
  - **`.agents/skills/game-development/SKILL.md`**: Habilidad y guía paso a paso para añadir personajes, balancear habilidades y depurar la IA.
  - **`.agents/AGENTS.md`**: Punto de entrada raíz para agentes de desarrollo.

---

# 📝 Notas del Parche — Versión 0.2.1

## 🚀 Resumen del Lanzamiento
Esta actualización marca el inicio del ciclo **0.2.x enfocado en Mecánicas y Comprensibilidad**. En esta versión 0.2.1 se implementa una reestructuración espacial de la pantalla de combate (`GameScreen`) diseñada para maximizar la legibilidad táctica del combate y la presencia escénica de los contendientes.

---

## ✨ Novedades y Mejoras Principales (v0.2.1)

### 📐 1. Reestructuración Espacial del Layout de Combate
- **Contenedor Inferior Unificado de Tableros (`#battle-boards-container`)**:
  - Ambos tableros (P1 y P2) se han agrupado pegados uno junto al otro dentro de un clúster central inferior (`.boards-cluster`).
  - Se incrementó el tamaño de los tableros y sus casillas de **74px a 90px** para brindar mayor visibilidad táctica, facilitando la comprensión visual de los patrones de ataque y la posición de los personajes.
  - Se escalaron acordemente los marcadores de teclas (`.key-tag`), avatares en casilla (`.standing-pawn-face`) y overlays de resolución.

### 🎭 2. Escenario Superior de Personajes en Esquinas y Optimización de Espacio
- **Sidepanels Compactos y Ajustados**:
  - Se redujo el ancho y alto de los paneles laterales superiores (de 310px a 200px de ancho y de 220px a ~125px de alto) para eliminar espacio muerto y darle el protagonismo visual a los tableros.
  - Se optimizó el tamaño de la barra de vida/tensión, ranuras de carga de habilidad y escala de los sprites para mantener la legibilidad ocupando un espacio balanceado.
  - La sección central superior mantiene el acceso al menú principal, el marcador de ronda, el banner de fase y el temporizador compartido en proporciones estilizadas.

### 🔄 3. Mecánica Dinámica de Giro de Tablero 180º
- **Rotación tras la Fase de Colocación**:
  - Al concluir la fase de colocación (`PHASE_1_PLACEMENT`), el contenedor de tableros (`.boards-cluster`) rota 180º con una animación fluida (`cubic-bezier`), intercambiando de posición los tableros de ambos jugadores antes de la fase de ataque.
  - **Compensación de Orientación**: Se implementó contra-rotación interna (`rotate(-180deg)`) en los envoltorios de los tableros (`.grid-board-wrapper`) para asegurar que las etiquetas de casillas, números e iconos mantengan siempre su lectura vertical erguida y accesible.
  - **Reinicio Automático**: Al iniciarse cada nueva ronda (`iniciarCicloRonda`), los tableros regresan suavemente a su orientación inicial de 0º.

### ⚔️ 4. Rework Mecánico Profundo: Reclutamiento de Peones y Disparo Focalizado
- **Eliminación Total de Patrones de Ataque (Patterns)**:
  - Se suprimió la mecánica de dados que determinaban patrones y formas de ataque multicasilla.
  - Todos los ataques de los jugadores se efectúan ahora **directamente sobre 1 sola casilla** elegida en el tablero rival.
- **Eliminación del Movimiento del Personaje**:
  - Se eliminó la mecánica de desplazamiento del avatar del jugador por el tablero y sus restricciones de adyacencia.
- **Nueva Mecánica de Reclutamiento por Dados**:
  - Cada ronda comienza lanzando un dado que determina los puntos de vida (HP) de una nueva unidad/peón táctico reclutado:
    - **Resultado 1–3**: Peón de **1 HP**.
    - **Resultado 4–5**: Peón de **2 HP**.
    - **Resultado 6**: Peón de **3 HP**.
  - Durante la fase de colocación, el jugador sitúa su nuevo peón en cualquier casilla desocupada de su cuadrícula.
- **Combate de Unidades con Persistencia y Daño Directo**:
  - Los disparos dirigidos a casillas ocupadas por unidades rivales infligen **1 de daño** (-1 HP).
  - Los peones reflejan visualmente su salud actual mediante insignias de HP (`1 HP`, `2 HP`, `3 HP`) y animaciones de impacto.
  - Al alcanzar 0 HP, la unidad es destruida, eliminada del tablero y otorga tensión al atacante.
  - Las unidades supervivientes persisten en el tablero para las rondas posteriores.

### 👑 5. Ronda 0 Inicial y Supresión de Niebla de Guerra
- **Eliminación Total de Niebla de Guerra**:
  - Se suprimió la mecánica y capas de niebla de guerra (`.fog-shroud-overlay`), dejando las casillas y los peones de ambos jugadores siempre plenamente visibles en el tablero.
- **Nueva Ronda 0 (Despliegue de 3 Peones Iniciales)**:
  - Al iniciar la partida se activa la **Ronda 0**, donde cada bando coloca 3 peones tácticos antes de comenzar las rondas normales:
    - **1 peón de Nivel 6 (6 HP)**: Es único por jugador; no se pueden colocar más peones de nivel 6 durante el resto de la partida.
    - **2 peones aleatorios por tirada**: Obtenidos mediante lanzamientos de dados (en caso de salir un 6 en estas tiradas aleatorias, se contabiliza y coloca como un 1).
- **Activación de Habilidad por Dado 6 en Rondas Posteriores**:
  - A partir de la Ronda 1, si un jugador obtiene un **6** en la tirada de reclutamiento, **no se pueden colocar más peones de nivel 6**, sino que **activa de inmediato la habilidad de su personaje** y el peón a colocar en dicha tirada pasa a ser de nivel 1.
- **Eliminación Total de Barras Verticales de Combate**:
  - Se suprimió la sección de tiras verticales centrales (`.vertical-combat-section`, `.vertical-player-bar`) de la interfaz, CSS y controlador, dejando un diseño limpio y enfocado exclusivamente en los tableros y los contadores de ronda y tiempo.

---

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
