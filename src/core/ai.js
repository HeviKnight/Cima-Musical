// ===================================================
// RUTINAS DE COMPORTAMIENTO PARA BOTS / AUTO (AI)
// ===================================================

import { calculateAttackArea, isAdjacentCell } from './grid.js';

/**
 * Elige una casilla para colocar el peón respetando adyacencia (o centro por defecto).
 * @param {Array<string>} keyList - Lista de teclas del jugador
 * @param {Map<string, object>} boardButtons - Mapa de teclas a celdas
 * @param {object|null} lastPawnCell - Posición previa del peón
 * @returns {object} Celda elegida
 */
export function chooseBotPawnPosition(keyList, boardButtons, lastPawnCell = null) {
  // Si no hay posición previa (Ronda 1), seleccionar por defecto el Centro (1,1)
  if (!lastPawnCell) {
    for (const info of boardButtons.values()) {
      if (info.row === 1 && info.col === 1) {
        return info;
      }
    }
  }

  // Filtrar casillas válidas adyacentes a lastPawnCell
  const validCells = [];
  for (const info of boardButtons.values()) {
    if (isAdjacentCell(lastPawnCell, info)) {
      validCells.push(info);
    }
  }

  if (validCells.length > 0) {
    return validCells[Math.floor(Math.random() * validCells.length)];
  }

  // Fallback si no hay adyacente válido (ej. primera ronda fallback)
  const randKey = keyList[Math.floor(Math.random() * keyList.length)];
  return boardButtons.get(randKey);
}

/**
 * Elige una casilla de ataque basada en el tipo de ataque.
 * Para ataques de área, suele priorizar zonas centrales o esquinas.
 * @param {number} attackTypeId - 1 (Single), 2 (Area), 3 (Full)
 * @param {Array<string>} keyList 
 * @param {Map<string, object>} boardButtons 
 * @param {number} gridSize 
 * @returns {{ cellInfo: object, targetedCells: Array<{row: number, col: number}> }}
 */
export function chooseBotAttackTarget(attackTypeId, keyList, boardButtons, gridSize = 3) {
  let row = Math.floor(Math.random() * gridSize);
  let col = Math.floor(Math.random() * gridSize);

  // Si es tipo 2 (área 2x2), anclar entre 0 y 1 para máxima cobertura
  if (attackTypeId === 2) {
    row = Math.min(row, gridSize - 2);
    col = Math.min(col, gridSize - 2);
  }

  // Buscar celda correspondiente al ancla
  let chosenCell = null;
  for (const info of boardButtons.values()) {
    if (info.row === row && info.col === col) {
      chosenCell = info;
      break;
    }
  }

  // Fallback si no se encontró
  if (!chosenCell) {
    const randKey = keyList[Math.floor(Math.random() * keyList.length)];
    chosenCell = boardButtons.get(randKey);
    row = chosenCell.row;
    col = chosenCell.col;
  }

  const targetedCells = calculateAttackArea(attackTypeId, row, col, gridSize);
  return { cellInfo: chosenCell, targetedCells, row, col };
}
