# Directrices de Agentes: Cima Musical

Bienvenido al proyecto Cima Musical. Este archivo y el directorio `.agents/` contienen toda la información necesaria para comprender, mantener y expandir el juego.

## Enlaces Rápidos
- [Reglas y Mecánicas del Juego](file:///d:/Trabajos%20Personales/WIP-PP/AtiBit_Jam/Cima-musical/.agents/rules/game-rules.md)
- [Arquitectura Técnica](file:///d:/Trabajos%20Personales/WIP-PP/AtiBit_Jam/Cima-musical/.agents/rules/architecture.md)
- [Habilidad de Desarrollo (Skill)](file:///d:/Trabajos%20Personales/WIP-PP/AtiBit_Jam/Cima-musical/.agents/skills/game-development/SKILL.md)

## Principios Clave
1. **Mecánica de Ronda 0**: Se coloca únicamente el **Titán** en una casilla del tablero al inicio para ambos jugadores con sus estadísticas de kit.
2. **Tipos de Unidades y Estadísticas**: Pequeña, Mediana y Titán con estadísticas específicas de `(daño / vida)` y sprites en `pawns/`.
3. **Ganancia de Tensión**:
   - **Por Kill**: Pequeña (+8), Mediana (+16), Titán (+50). Dañar sin matar no otorga tensión directa por kill.
   - **Por Daño**: Cada unidad genera tensión igual a su daño (ataque) al final de la ronda.
   - **Partículas Cuadradas**: Cada vez que algo añade tensión, viajan partículas cuadradas desde la unidad hasta el sprite del héroe.
   - **Objetivo**: 100 de tensión para ganar.
4. **Dado (d6)**: 1-3 = pequeña, 4-5 = mediana, 6 = Habilidad del Titán (si no es posible usarla o el Titán ha muerto, añade **+1/+1 a la unidad más fuerte**).
5. **Colocación y Tablero Lleno**: Si el tablero 3x3 está lleno, la nueva unidad mejora a una ya existente sumando sus estadísticas.
6. **Planificación de Acción**: En la fase de acción, se elige **Ataque o Habilidad** (no ambas cosas a la vez).
7. **Resolución Orgánica**: Los efectos caen sobre casillas `(row, col)`. Mover niega efectos: si una tropa se desplaza antes de la resolución, los ataques o efectos caen al vacío ("agua").
8. **Avance de Fases por Confirmación de Jugadores**: Cada jugador dispone de una checkbox de "Listo". El Jugador 1 confirma con `[ESPACIO]` y el Jugador 2 con `[ENTER]` (o clic en su respectiva checkbox). Ambos jugadores deben estar listos para que la fase avance.
