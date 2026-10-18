// ===================================================
// LÓGICA MATEMÁTICA DE MATRICES Y COLISIONES (CORE)
// ===================================================

/**
 * Devuelve la única casilla objetivo del disparo como array de 1 elemento.
 * Todos los ataques del sistema impactan en exactamente 1 casilla.
 * @param {number} row - Fila objetivo (0-2)
 * @param {number} col - Columna objetivo (0-2)
 * @param {number} [gridSize=3] - Tamaño de la cuadrícula
 * @returns {Array<{row: number, col: number}>}
 */
export function calculateAttackArea(row, col, gridSize = 3) {
  const r = Math.max(0, Math.min(gridSize - 1, row));
  const c = Math.max(0, Math.min(gridSize - 1, col));
  return [{ row: r, col: c }];
}

/**
 * Comprueba si alguna de las casillas objetivo colisiona con algún peón vivo.
 * @param {Array<{row: number, col: number}>} targetedCells 
 * @param {Array<{row: number, col: number, hp: number}>|object|null} pawns - Array de peones o peón individual
 * @returns {object|null} Peón impactado o null
 */
export function checkCollision(targetedCells, pawns) {
  if (!pawns || !targetedCells || targetedCells.length === 0) return null;
  const pawnList = Array.isArray(pawns) ? pawns : [pawns];
  for (const t of targetedCells) {
    const hitPawn = pawnList.find(p => p && p.row === t.row && p.col === t.col && p.hp > 0);
    if (hitPawn) return hitPawn;
  }
  return null;
}

/**
 * Determina el estado dinámico de cada casilla de una cuadrícula tras un disparo.
 * Estados posibles: 'hit' | 'miss' | 'off'
 * @param {Array<{row: number, col: number}>} targetedCells 
 * @param {Array<object>|object|null} pawns 
 * @param {number} [gridSize=3] 
 * @returns {Array<Array<{row: number, col: number, state: string, pawn: object|null}>>}
 */
export function evaluateCellStates(targetedCells, pawns, gridSize = 3) {
  const result = [];
  const safeTargeted = targetedCells || [];
  const pawnList = Array.isArray(pawns) ? pawns : (pawns ? [pawns] : []);

  for (let r = 0; r < gridSize; r++) {
    const rowList = [];
    for (let c = 0; c < gridSize; c++) {
      const isTargeted = safeTargeted.some(t => t.row === r && t.col === c);
      const pawnHere = pawnList.find(p => p && p.row === r && p.col === c && p.hp > 0);

      let state = 'off';
      if (isTargeted && pawnHere) {
        state = 'hit';
      } else if (isTargeted && !pawnHere) {
        state = 'miss';
      }

      rowList.push({ row: r, col: c, state, pawn: pawnHere || null });
    }
    result.push(rowList);
  }

  return result;
}
