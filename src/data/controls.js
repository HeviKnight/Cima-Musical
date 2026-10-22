// ===================================================
// DEFINICIÓN DE TRIBUS Y PERSONAJES (DATA)
// ===================================================

// Esquemas de visualización disponibles
export const CONTROL_SCHEMES = {
  KEYBOARD: 'keyboard',
  DANCE_MAT: 'dance_mat'
};

// Iconos e indicadores para el modo alfombra de baile (matriz 3x3)
// Fila 0: [X, Arriba, O]
// Fila 1: [Izquierda, Centro / Stay Cool, Derecha]
// Fila 2: [Triángulo, Abajo, Cuadrado]
export const DANCE_MAT_MATRIX = [
  [
    { symbol: '✖', label: 'Cruz', iconClass: 'mat-cross', color: '#60a5fa' },
    { symbol: '⬆', label: 'Arriba', iconClass: 'mat-up', color: '#38bdf8' },
    { symbol: '⭕', label: 'Círculo', iconClass: 'mat-circle', color: '#60a5fa' }
  ],
  [
    { symbol: '⬅', label: 'Izquierda', iconClass: 'mat-left', color: '#f43f5e' },
    { symbol: '★', label: 'Centro', iconClass: 'mat-center', color: '#e2e8f0' },
    { symbol: '➡', label: 'Derecha', iconClass: 'mat-right', color: '#f43f5e' }
  ],
  [
    { symbol: '▲', label: 'Triángulo', iconClass: 'mat-triangle', color: '#60a5fa' },
    { symbol: '⬇', label: 'Abajo', iconClass: 'mat-down', color: '#38bdf8' },
    { symbol: '■', label: 'Cuadrado', iconClass: 'mat-square', color: '#60a5fa' }
  ]
];

let currentControlScheme = localStorage.getItem('cima_control_scheme') || CONTROL_SCHEMES.KEYBOARD;

export function getControlScheme() {
  return currentControlScheme;
}

export function setControlScheme(scheme) {
  if (scheme === CONTROL_SCHEMES.KEYBOARD || scheme === CONTROL_SCHEMES.DANCE_MAT) {
    currentControlScheme = scheme;
    try {
      localStorage.setItem('cima_control_scheme', scheme);
    } catch (e) {
      // Ignorar errores de localStorage si está bloqueado
    }
  }
}

export function toggleControlScheme() {
  const next = currentControlScheme === CONTROL_SCHEMES.KEYBOARD
    ? CONTROL_SCHEMES.DANCE_MAT
    : CONTROL_SCHEMES.KEYBOARD;
  setControlScheme(next);
  return next;
}

export function getCellDisplay(row, col, key = '') {
  if (currentControlScheme === CONTROL_SCHEMES.DANCE_MAT) {
    const item = DANCE_MAT_MATRIX[row]?.[col];
    if (item) {
      return {
        isDanceMat: true,
        symbol: item.symbol,
        label: item.label,
        iconClass: item.iconClass,
        color: item.color
      };
    }
  }
  return {
    isDanceMat: false,
    symbol: key.toUpperCase(),
    label: key.toUpperCase(),
    iconClass: 'key-text',
    color: '#ffffff'
  };
}

export const CONTROLS = {
  p1: {
    id: 'p1',
    name: 'JUGADOR 1',
    tribeName: 'LA HUMANIDAD',
    color: '#8B5CF6',
    colorTextClass: 'p1-color-text',
    borderColor: '#7C3AED',
    faceSprite: '/assets/sprites/heroes/CH_Icon_Cyborg.png',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Cyborg.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Cyborg.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Cyborg.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Cyborg.png',
    melody: '/assets/audio/Melody_Pop.mp3',
    keyList: ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'],
    keyMatrix: [
      ['q', 'w', 'e'],
      ['a', 's', 'd'],
      ['z', 'x', 'c']
    ],
    victoryHeadline: 'LA HUMANIDAD DOMINA LA PISTA',
    victoryFlavor: 'El Cyborg demuestra la máxima eficiencia en el campo de batalla.'
  },
  p2: {
    id: 'p2',
    name: 'JUGADOR 2',
    tribeName: 'LA ADICCIÓN',
    color: '#EF4444',
    colorTextClass: 'p2-color-text',
    borderColor: '#B91C1C',
    faceSprite: '/assets/sprites/heroes/CH_Icon_Furnance.png',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Furnance.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Furnance.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Furnance.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Furnance.png',
    melody: '/assets/audio/Melody_Rock.mp3',
    keyList: ['u', 'i', 'o', 'j', 'k', 'l', 'm', ',', '.'],
    keyMatrix: [
      ['u', 'i', 'o'],
      ['j', 'k', 'l'],
      ['m', ',', '.']
    ],
    victoryHeadline: 'EL INCINERADOR CONSUME LA PISTA',
    victoryFlavor: 'El fuego del Incinerador arrasa con toda la competencia.'
  }
};

export const DRAW_RESULT = {
  headline: 'EMPATE EN LAS LISTAS',
  color: '#ffbe0b',
  borderColor: '#ffbe0b',
  flavor: 'Ambos contendientes han agotado su tensión en un duelo histórico.',
  faceSprite: '/assets/sprites/heroes/CH_Icon_Cyborg.png'
};
