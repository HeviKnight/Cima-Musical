// ===================================================
// PATRONES Y FORMAS DE ATAQUE / DADOS (DATA)
// ===================================================

export const ATTACK_PATTERNS = {
  1: {
    id: 1,
    key: 'SINGLE_SHOT',
    name: 'Single Shot',
    diceFace: 1,
    tension: 39,
    coverage: 1,
    coverageText: '1 casilla',
    sprite: '/assets/sprites/attack1.png'
  },
  2: {
    id: 2,
    key: 'COLUMN_SHOOT',
    name: 'Column Shoot',
    diceFace: 2,
    tension: 22,
    coverage: 2,
    coverageText: '2 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  '3_L': {
    id: '3_L',
    key: 'L_SHOOT',
    name: 'L Shoot (Relative position)',
    diceFace: 3,
    tension: 25,
    coverage: 3,
    coverageText: '3 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  '3_LONG': {
    id: '3_LONG',
    key: 'LONG_COLUMN',
    name: 'Long Column',
    diceFace: 3,
    tension: 25,
    coverage: 3,
    coverageText: '3 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  4: {
    id: 4,
    key: 'SQUARE_STOMP',
    name: 'Square Stomp',
    diceFace: 4,
    tension: 17,
    coverage: 4,
    coverageText: '4 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  '5_CROSS': {
    id: '5_CROSS',
    key: 'CROSS_SLASH',
    name: 'Cross Slash',
    diceFace: 5,
    tension: 17,
    coverage: 5,
    coverageText: '5 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  '5_XBOW': {
    id: '5_XBOW',
    key: 'X_BOW_SHOOT',
    name: 'X-Bow Shoot',
    diceFace: 5,
    tension: 17,
    coverage: 5,
    coverageText: '5 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  '5_WAVE': {
    id: '5_WAVE',
    key: 'WAVE_CRASH',
    name: 'Wave Crash',
    diceFace: 5,
    tension: 15,
    coverage: 6,
    coverageText: '6 casillas',
    sprite: '/assets/sprites/attack2.png'
  },
  6: {
    id: 6,
    key: 'FULL_ATTACK',
    name: 'Full Attack',
    diceFace: 6,
    tension: 30,
    coverage: 9,
    coverageText: '9 casillas',
    sprite: '/assets/sprites/attack3.png'
  }
};

export const DEFAULT_PATTERNS_BY_FACE = {
  1: ATTACK_PATTERNS[1],
  2: ATTACK_PATTERNS[2],
  3: ATTACK_PATTERNS['3_L'],
  4: ATTACK_PATTERNS[4],
  5: ATTACK_PATTERNS['5_CROSS'],
  6: ATTACK_PATTERNS[6]
};

export const ATTACK_TYPES = ATTACK_PATTERNS;

/**
 * Obtiene el tipo de ataque correspondiente para una tirada de dado.
 * Respeta la asignación de patrón específica de un personaje por cada cara de dado.
 */
export function getAttackTypeForRoll(diceValue, character = null) {
  const d = parseInt(diceValue, 10) || 1;
  if (character && character.patternMapping && character.patternMapping[d]) {
    const patternKey = character.patternMapping[d];
    if (ATTACK_PATTERNS[patternKey]) {
      return ATTACK_PATTERNS[patternKey];
    }
  }
  return DEFAULT_PATTERNS_BY_FACE[d] || ATTACK_PATTERNS[1];
}

export function getDiceSprite(diceValue) {
  const val = Math.min(Math.max(parseInt(diceValue, 10) || 1, 1), 6);
  return `/assets/sprites/Dado_spr_${val}.png`;
}

