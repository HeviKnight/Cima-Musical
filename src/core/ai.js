// ===================================================
// RUTINAS DE COMPORTAMIENTO PARA BOTS / AUTO (AI)
// ===================================================

import { calculateAttackArea } from './grid.js';
import { gameState } from './state.js';

/**
 * Elige una casilla para colocar una nueva unidad o mejorar si el tablero está lleno.
 * @param {Array<string>} keyList - Lista de teclas del bot
 * @param {Map<string, object>} boardButtons - Mapa de teclas a celdas
 * @param {Array<object>} existingPawns - Peones ya presentes en el tablero
 * @param {Function|null} isCellBlocked - Filtro de celdas bloqueadas
 * @returns {object} Celda elegida ({ row, col, key, isUpgrade })
 */
export function chooseBotPawnPosition(keyList, boardButtons, existingPawns = [], isCellBlocked = null) {
  const pawnsList = Array.isArray(existingPawns) ? existingPawns.filter(p => p && p.hp > 0) : [];
  const freeCells = [];
  const occupiedCells = [];

  for (const info of boardButtons.values()) {
    const isOccupied = pawnsList.some(p => p.row === info.row && p.col === info.col);
    const isBlocked = isCellBlocked ? isCellBlocked(info.row, info.col) : false;
    if (!isOccupied && !isBlocked) {
      freeCells.push(info);
    } else if (isOccupied) {
      occupiedCells.push(info);
    }
  }

  // 1. Si hay casillas libres disponibles, colocar en una libre
  if (freeCells.length > 0) {
    const chosen = freeCells[Math.floor(Math.random() * freeCells.length)];
    return { ...chosen, isUpgrade: false };
  }

  // 2. Si el tablero está lleno (9 casillas ocupadas), se MEJORA una unidad existente
  if (occupiedCells.length > 0) {
    // Priorizar mejorar al Titán o a la unidad de mayor HP para hacerla tanque
    const titanPawn = pawnsList.find(p => p.isTitan);
    if (titanPawn) {
      const titanCell = occupiedCells.find(c => c.row === titanPawn.row && c.col === titanPawn.col);
      if (titanCell) return { ...titanCell, isUpgrade: true };
    }
    const chosen = occupiedCells[Math.floor(Math.random() * occupiedCells.length)];
    return { ...chosen, isUpgrade: true };
  }

  const allCells = Array.from(boardButtons.values());
  const fallback = allCells[Math.floor(Math.random() * allCells.length)] || { row: 1, col: 1 };
  return { ...fallback, isUpgrade: false };
}

/**
 * Elige 1 casilla para disparar en el tablero rival.
 * Prioriza peones rivales de menor vida para conseguir eliminaciones (+8 pequeña, +16 mediana, +50 titán).
 * @param {Map<string, object>} enemyBoardButtons - Mapa de teclas a celdas del rival
 * @param {Array<object>} enemyPawns - Peones enemigos vivos
 * @param {number} [gridSize=3]
 * @returns {{ cellInfo: object, targetedCells: Array<{row: number, col: number}>, row: number, col: number }}
 */
export function chooseBotAttackTarget(enemyBoardButtons, enemyPawns = [], gridSize = 3) {
  const aliveEnemies = Array.isArray(enemyPawns) ? enemyPawns.filter(p => p && p.hp > 0) : [];
  const allCells = Array.from(enemyBoardButtons?.values() || []);

  if (aliveEnemies.length > 0 && Math.random() < 0.75) {
    // Ordenar enemigos por HP ascendente (matar a los de menor vida primero para sumar tensión)
    const sorted = [...aliveEnemies].sort((a, b) => a.hp - b.hp);
    const targetPawn = sorted[0];
    const cellInfo = allCells.find(c => c.row === targetPawn.row && c.col === targetPawn.col) || { row: targetPawn.row, col: targetPawn.col };
    return {
      cellInfo,
      targetedCells: calculateAttackArea(targetPawn.row, targetPawn.col, gridSize),
      row: targetPawn.row,
      col: targetPawn.col
    };
  }

  const chosenCell = allCells[Math.floor(Math.random() * allCells.length)] || { row: 1, col: 1 };
  const { row, col } = chosenCell;
  const targetedCells = calculateAttackArea(row, col, gridSize);
  return { cellInfo: chosenCell, targetedCells, row, col };
}

/**
 * Decide si el bot utiliza su habilidad activa en lugar del ataque regular.
 * @param {string} botKey - 'p2' (o 'p1')
 * @returns {{ useAbility: boolean, target?: { row: number, col: number } }}
 */
export function decideBotAction(botKey = 'p2') {
  const botState = gameState[botKey];
  if (!botState || !botState.character) return { useAbility: false };

  const char = botState.character;
  if (botState.activeAbilityCharges < 1) {
    return { useAbility: false };
  }

  const enemyKey = botKey === 'p1' ? 'p2' : 'p1';
  const enemyState = gameState[enemyKey] || {};
  const aliveEnemies = (enemyState.pawns || []).filter(p => p && p.hp > 0);
  const myPawns = (botState.pawns || []).filter(p => p && p.hp > 0);

  switch (char.id) {
    case 'cyborg':
      // Cyborg activa su Finisher si tiene al menos 20 de tensión y hay enemigos visibles
      if (botState.prestige >= 20 && aliveEnemies.length > 0) {
        return { useAbility: true };
      }
      return { useAbility: false };

    case 'dron_enjambre': {
      // Swarm sacrifica drones si tiene al menos 2 drones vivos
      const drones = myPawns.filter(p => !p.isTitan && p.hp === 1);
      if (drones.length >= 2) {
        return { useAbility: true };
      }
      return { useAbility: false };
    }

    case 'incinerador': {
      // Incinerador activa horno si tiene chatarra y puede detonar (horno + chatarra >= 3)
      const chatarra = myPawns.filter(p => !p.isTitan && p.hp === 1);
      if (chatarra.length >= 1 && (botState.hornoCount + chatarra.length) >= 3) {
        return { useAbility: true };
      }
      return { useAbility: false };
    }

    case 'el_brazo':
      // RoboHand usa reubicación forzada si el rival tiene al menos una unidad
      if (aliveEnemies.length > 0) {
        const randEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        return { useAbility: true, target: { row: randEnemy.row, col: randEnemy.col } };
      }
      return { useAbility: false };

    case 'taladro':
      // Taladro intercambia si tiene al menos 2 tropas y ha recibido disparos
      if (myPawns.length >= 2 && Math.random() < 0.6) {
        return { useAbility: true };
      }
      return { useAbility: false };

    case 'holo': {
      // Holo clona si tiene tropas no titánicas y hueco en su tablero
      const nonTitans = myPawns.filter(p => !p.isTitan);
      if (nonTitans.length >= 1 && myPawns.length < 9) {
        return { useAbility: true };
      }
      return { useAbility: false };
    }

    default:
      return { useAbility: false };
  }
}
