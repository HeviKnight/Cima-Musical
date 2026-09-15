// ===================================================
// LÓGICA MATEMÁTICA DE MATRICES Y COLISIONES (CORE)
// ===================================================

/**
 * Calcula el conjunto de casillas afectadas por un ataque dado un ancla y tipo.
 * @param {number} attackTypeId - 1 (Single), 2 (Area 2x2), 3 (Full 3x3)
 * @param {number} anchorRow - Fila del ancla (0..2)
 * @param {number} anchorCol - Columna del ancla (0..2)
 * @param {number} gridSize - Tamaño de la matriz (default 3)
 * @returns {Array<{row: number, col: number}>}
 */
export function calculateAttackArea(attackTypeId, anchorRow, anchorCol, gridSize = 3) {
  const affected = [];

  if (attackTypeId === 1) {
    // 1 Casilla exacta
    affected.push({ row: anchorRow, col: anchorCol });
  } else if (attackTypeId === 2) {
    // Cuadrante 2x2 ajustado a los bordes
    const maxIndex = gridSize - 2;
    const startRow = anchorRow > maxIndex ? maxIndex : anchorRow;
    const startCol = anchorCol > maxIndex ? maxIndex : anchorCol;

    affected.push({ row: startRow, col: startCol });
    affected.push({ row: startRow, col: startCol + 1 });
    affected.push({ row: startRow + 1, col: startCol });
    affected.push({ row: startRow + 1, col: startCol + 1 });
  } else if (attackTypeId === 3) {
    // Todas las casillas del tablero
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        affected.push({ row: r, col: c });
      }
    }
  }

  return affected;
}

/**
 * Comprueba si el peón rival se encuentra dentro del área de ataque.
 * @param {Array<{row: number, col: number}>} targetedCells 
 * @param {{row: number, col: number}|null} pawnCell 
 * @returns {boolean}
 */
export function checkCollision(targetedCells, pawnCell) {
  if (!pawnCell || !targetedCells || targetedCells.length === 0) return false;
  return targetedCells.some(
    cell => cell.row === pawnCell.row && cell.col === pawnCell.col
  );
}

/**
 * Determina el estado dinámico de cada casilla de una cuadrícula de tamaño gridSize.
 * Estados posibles: 'hit' | 'fail' | 'dodge' | 'empty'
 * @param {Array<{row: number, col: number}>} targetedCells 
 * @param {{row: number, col: number}|null} pawnCell 
 * @param {number} gridSize 
 * @returns {Array<Array<{row: number, col: number, state: string}>>}
 */
export function evaluateCellStates(targetedCells, pawnCell, gridSize = 3) {
  const result = [];
  const safeTargeted = targetedCells || [];

  for (let r = 0; r < gridSize; r++) {
    const rowList = [];
    for (let c = 0; c < gridSize; c++) {
      const isTargeted = safeTargeted.some(t => t.row === r && t.col === c);
      const isPawn = Boolean(pawnCell && pawnCell.row === r && pawnCell.col === c);

      let state = 'empty';
      if (isTargeted && isPawn) {
        state = 'hit';
      } else if (isTargeted && !isPawn) {
        state = 'fail';
      } else if (!isTargeted && isPawn) {
        state = 'dodge';
      } else {
        state = 'empty';
      }

      rowList.push({ row: r, col: c, state });
    }
    result.push(rowList);
  }

  return result;
}
