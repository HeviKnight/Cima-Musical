---
name: game-development
description: Procedimientos y flujos de trabajo recomendados para añadir personajes, balancear habilidades activas/pasivas, modificar la interfaz y depurar partidas en Cima Musical.
---

# Guía de Desarrollo y Expansión: Cima Musical

Usa esta habilidad para realizar tareas habituales de programación y diseño en el proyecto.

---

## 1. Cómo Añadir un Nuevo Personaje

1. Abre `src/data/characters.js`.
2. Define una nueva clave dentro del objeto `CHARACTERS` siguiendo el esquema:
   ```javascript
   NUEVO_ID: {
     id: 'nuevo_id',
     name: 'Nombre del Personaje',
     tribe: 'Tribu Perteneciente',
     color: '#HEXCOLOR',
     borderColor: '#HEXBORDER',
     quote: 'Frase característica para la pantalla de selección.',
     description: 'Descripción breve de su estilo de combate.',
     difficulty: 'Media', // 'Fácil', 'Media', 'Difícil'
     sprites: {
       idle: '/assets/sprites/CH_Sprite_Nuevo.png',
       anim: '/assets/sprites/CH_Anim_Nuevo.png',
       icon: '/assets/sprites/CH_Icon_Nuevo.png'
     },
     passive: {
       name: 'Nombre de la Pasiva',
       description: 'Explicación del efecto pasivo.',
       trigger: 'attack' // o 'placement', 'round_start', 'kill'
     },
     activeAbility: {
       id: 'identificador_habilidad',
       name: 'Nombre de la Habilidad',
       maxCharges: 1,
       initialCharges: 1,
       cooldownRounds: 0,
       description: 'Efecto al activarse manualmente o con dado 6.'
     }
   }
   ```
3. Registra el efecto en `src/core/game-controller.js` dentro del método `activateCharacterAbility(player)` si tiene efecto activo, o en los hooks correspondientes (`checkPassive`, `executeResolution`, etc.) si es pasiva.

---

## 2. Ajuste y Balance de Peones y Tiradas

- **Valores de vida según el dado**: Se configuran en `src/core/state.js` en la función `getHpForDiceRoll(roll)`:
  - 1 a 3: Pequeña / 1 HP (`♟`).
  - 4 a 5: Mediana / 2 HP (`🗼`).
  - 6: Habilidad del Titán (si el Titán está vivo); si ha muerto, 1 HP (`♟`).
- **Emojis identificativos**: Configurados en `getPawnEmoji(hp)` en `src/core/state.js` (1: `♟`, 2..5: `🗼`, 6+: `👑`).
- **Puntuación de Tensión por peón eliminado**: Ubicado en `src/core/state.js` (`KILL_TENSION`):
  - Pequeña: +8
  - Mediana: +16
  - Titán: +50

---

## 3. Depuración de la IA (Bot)

- El comportamiento del bot se encuentra centralizado en `src/core/ai.js`.
- Para depurar o afinar la inteligencia del bot:
  - **Ataque**: `chooseBotAttackTarget` prioriza peones enemigos de menor vida para conseguir eliminaciones rápidas (+8 / +16 / +50 de tensión).
  - **Colocación**: `chooseBotPawnPosition` busca casillas libres, o si el tablero está lleno, selecciona una unidad para mejorar (+HP).

---

## 4. Estilos y Animaciones de Feedback

- Los efectos visuales se implementan en `src/ui/feedback.js`.
- Utiliza la clase estándar `.ability-activation-banner` para mostrar alertas de texto dinámico y emojis en pantalla.
- Mantén siempre las clases CSS sincronizadas en `src/style.css` usando las variables temáticas:
  - `--player-theme-color`
  - `--p1-primary` y `--p2-primary`
  - `--accent-gold` y `--font-pixel`

---

## 5. Verificación de Compilación

Tras cualquier cambio en el código:
```powershell
npm run build
```
Asegúrate de que Vite compile sin errores ni advertencias de dependencias circulares.
