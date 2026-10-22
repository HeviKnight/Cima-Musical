# Arquitectura del Proyecto: Cima Musical

Guía técnica del código fuente, responsabilidades de cada módulo y directrices de diseño.

---

## 1. Estructura de Directorios

```
src/
├── audio/
│   └── sound-manager.js     # Gestor de Web Audio API, música de fondo y SFX procedimentales (sfxr)
├── core/
│   ├── ai.js                # Lógica del bot (heurísticas de ataque y colocación de peones)
│   ├── game-controller.js   # Controlador central, máquina de fases, temporizadores y eventos de teclado
│   ├── grid.js              # Funciones puras de tablero 3x3, cálculo de impacto y validaciones
│   └── state.js             # Estado observable (GameState, HP de peones, emojis, eventos)
├── data/
│   ├── characters.js        # Configuración de personajes, habilidades activas/pasivas y sprites
│   ├── controls.js          # Mapeo de teclas de P1 y P2, temas de color y textos de victoria
│   └── patterns.js          # Mapeo de dados a sprites visuales
├── ui/
│   ├── feedback.js          # Animaciones, banners flotantes, efectos de impacto y badges
│   ├── screens.js           # Orquestador del flujo entre pantallas y cambio de vista
│   └── screens/
│       ├── CharacterSelectScreen.js  # Selección de personajes con carrusel e info
│       ├── GameOverScreen.js         # Pantalla de victoria/derrota con resumen
│       └── GameScreen.js             # Renderizado del tablero 3x3, paneles laterales e HUD
├── main.js                  # Punto de entrada principal e inicialización de la app
└── style.css                # Sistema de diseño completo (pixel art, temas de color, animaciones)
```

---

## 2. Flujo de Datos y Estado (`src/core/state.js`)
- `GameState` es la única fuente de verdad para el estado de la partida:
  - `p1` y `p2`: Tienen `pawns` (lista de `{ id, row, col, hp, maxHp }`), `prestige` (tensión 0..100), `activeAbilityCharges`, `attackTarget`, etc.
  - `currentPhase`: Fase actual según la enumeración `PHASES`.
  - Métodos canónicos: `getHpForDiceRoll(roll)` y `getPawnEmoji(hp)`.
  - Sistema de publicación/suscripción (`subscribe` / `notify`).

---

## 3. Controlador de Juego (`src/core/game-controller.js`)
- Gestiona las transiciones de fases:
  - `startRound0()` -> Colocación de los 3 peones iniciales con tecla Espacio.
  - `startDiceRollPhase()` -> Tirada de dados interactiva.
  - `startPlacementPhase()` -> Colocación en casillas libres.
  - `startAttackPhase()` -> Marcado de casilla enemiga.
  - `executeResolution()` -> Aplicación simultánea de daño, eliminación de peones y otorgamiento de tensión.
- Habilidades:
  - Manejo unificado vía `activateCharacterAbility(player)`.

---

## 4. Sistema Visual y Feedback (`src/ui/feedback.js`)
- Manejo reactivo de elementos visuales:
  - `renderStandingPawns(player, pawns)`: Dibuja los peones en las casillas con su icono y badge de HP + Emoji (`♟`, `🗼`, `👑`).
  - `showAbilityActivation(player, message)`: Notificación flotante de activación de habilidades.
  - `updateAbilityChargesUI(player, charges, max)`: Indicadores de puntos/cargas en el HUD lateral.
  - `highlightFreeCells(player, isCellBlocked)`: Resalta las casillas disponibles para colocar peones.

---

## 5. Directrices de Mantenimiento
- **No romper la compatibilidad**: Mantener los alias heredados cuando sea necesario.
- **Mantener estética pixel art**: Respetar fuentes (`Press Start 2P`, `monospace`), colores de las tribus y renderizado nítido (`image-rendering: pixelated`).
- **Control de tensión**: Ganancia por bajas: Pequeña (+8), Mediana (+16), Titán (+50). Al final de cada ronda, cada unidad viva genera tensión igual a su daño (ataque). La meta de victoria son 100 puntos de tensión.
