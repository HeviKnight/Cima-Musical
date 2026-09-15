// ===================================================
// PATRONES Y FORMAS DE ATAQUE / DADOS (DATA)
// ===================================================

export const ATTACK_TYPES = {
  SINGLE: {
    id: 1,
    name: '1 Casilla',
    sprite: '/assets/sprites/attack1.png',
    diceValues: [1, 2, 3],
    offsets: [[0, 0]]
  },
  AREA: {
    id: 2,
    name: '4 Casillas (2x2)',
    sprite: '/assets/sprites/attack2.png',
    diceValues: [4, 5],
    offsets: [
      [0, 0], [0, 1],
      [1, 0], [1, 1]
    ]
  },
  FULL: {
    id: 3,
    name: '¡Todas las Casillas!',
    sprite: '/assets/sprites/attack3.png',
    diceValues: [6],
    offsets: null // Cubre 3x3 completo
  }
};

export function getAttackTypeForRoll(diceValue) {
  const d = parseInt(diceValue, 10) || 1;
  if (d <= 3) return ATTACK_TYPES.SINGLE;
  if (d <= 5) return ATTACK_TYPES.AREA;
  return ATTACK_TYPES.FULL;
}

export function getDiceSprite(diceValue) {
  const val = Math.min(Math.max(parseInt(diceValue, 10) || 1, 1), 6);
  return `/assets/sprites/Dado_spr_${val}.png`;
}
