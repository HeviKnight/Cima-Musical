// ===================================================
// DEFINICIÓN DE TRIBUS Y PERSONAJES (DATA)
// ===================================================

export const CONTROLS = {
  p1: {
    id: 'p1',
    name: 'JUGADOR 1',
    tribeName: 'LA HUMANIDAD',
    color: '#8B5CF6',
    colorTextClass: 'p1-color-text',
    borderColor: '#7C3AED',
    faceSprite: '/assets/sprites/CH_Icon_Cyborg.png',
    iconSprite: '/assets/sprites/CH_Icon_Cyborg.png',
    characterSprite: '/assets/sprites/CH_Sprite_Cyborg.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Cyborg.png',
    animSprite: '/assets/sprites/CH_Anim_Cyborg.png',
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
    faceSprite: '/assets/sprites/CH_Icon_Furnance.png',
    iconSprite: '/assets/sprites/CH_Icon_Furnance.png',
    characterSprite: '/assets/sprites/CH_Sprite_Furnance.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Furnance.png',
    animSprite: '/assets/sprites/CH_Anim_Furnance.png',
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
  faceSprite: '/assets/sprites/CH_Icon_Cyborg.png'
};
