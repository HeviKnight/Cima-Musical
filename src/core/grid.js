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
  const typeStr = String(attackTypeId);

  if (typeStr === '1' || typeStr === 'SINGLE_SHOT') {
    affected.push({ row: anchorRow, col: anchorCol });
  } else if (typeStr === '2' || typeStr === 'COLUMN_SHOOT') {
    // 2 casillas en columna
    affected.push({ row: anchorRow, col: anchorCol });
    if (anchorRow < gridSize - 1) {
      affected.push({ row: anchorRow + 1, col: anchorCol });
    } else {
      affected.push({ row: anchorRow - 1, col: anchorCol });
    }
  } else if (typeStr === '3_L' || typeStr === 'L_SHOOT') {
    // 3 casillas en forma de L
    affected.push({ row: anchorRow, col: anchorCol });
    const r1 = anchorRow < gridSize - 1 ? anchorRow + 1 : anchorRow - 1;
    const c1 = anchorCol < gridSize - 1 ? anchorCol + 1 : anchorCol - 1;
    affected.push({ row: r1, col: anchorCol });
    affected.push({ row: anchorRow, col: c1 });
  } else if (typeStr === '3_LONG' || typeStr === 'LONG_COLUMN' || typeStr === '3') {
    // 3 casillas: Columna completa
    for (let r = 0; r < gridSize; r++) {
      affected.push({ row: r, col: anchorCol });
    }
  } else if (typeStr === '4' || typeStr === 'SQUARE_STOMP') {
    // Cuadrante 2x2
    const maxIndex = gridSize - 2;
    const startRow = anchorRow > maxIndex ? maxIndex : anchorRow;
    const startCol = anchorCol > maxIndex ? maxIndex : anchorCol;
    affected.push({ row: startRow, col: startCol });
    affected.push({ row: startRow, col: startCol + 1 });
    affected.push({ row: startRow + 1, col: startCol });
    affected.push({ row: startRow + 1, col: startCol + 1 });
  } else if (typeStr === '5_CROSS' || typeStr === 'CROSS_SLASH' || typeStr === '5') {
    // 5 casillas en cruz (+)
    affected.push({ row: anchorRow, col: anchorCol });
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
      const r = anchorRow + dr;
      const c = anchorCol + dc;
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        affected.push({ row: r, col: c });
      }
    });
  } else if (typeStr === '5_XBOW' || typeStr === 'X_BOW_SHOOT') {
    // 5 casillas en X (diagonales)
    affected.push({ row: anchorRow, col: anchorCol });
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
      const r = anchorRow + dr;
      const c = anchorCol + dc;
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        affected.push({ row: r, col: c });
      }
    });
  } else if (typeStr === '5_WAVE' || typeStr === 'WAVE_CRASH') {
    // 6 casillas (2 columnas adyacentes)
    const c1 = anchorCol < gridSize - 1 ? anchorCol : anchorCol - 1;
    for (let r = 0; r < gridSize; r++) {
      affected.push({ row: r, col: c1 });
      affected.push({ row: r, col: c1 + 1 });
    }
  } else if (typeStr === '6' || typeStr === 'FULL_ATTACK') {
    // 9 casillas (todas)
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        affected.push({ row: r, col: c });
      }
    }
  } else {
    affected.push({ row: anchorRow, col: anchorCol });
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

      let state = 'off';
      if (isTargeted && isPawn) {
        state = 'hit';
      } else if (isTargeted && !isPawn) {
        state = 'miss';
      } else if (!isTargeted && isPawn) {
        state = 'player';
      } else {
        state = 'off';
      }

      rowList.push({ row: r, col: c, state });
    }
    result.push(rowList);
  }

  return result;
}

/**
 * Comprueba si dos casillas son adyacentes (ortogonal o diagonalmente).
 * @param {{row: number, col: number}|null} cellA 
 * @param {{row: number, col: number}|null} cellB 
 * @returns {boolean}
 */
export function isAdjacentCell(cellA, cellB) {
  if (!cellA || !cellB) return true;
  const rowDiff = Math.abs(cellA.row - cellB.row);
  const colDiff = Math.abs(cellA.col - cellB.col);
  return rowDiff <= 1 && colDiff <= 1;
}
