// ===================================================
// DEFINICIÓN DE TRIBUS Y PERSONAJES (DATA)
// ===================================================

export const TRIBES = {
  p1: {
    id: 'p1',
    name: 'JUGADOR 1',
    tribeName: 'ESTILO POP',
    color: '#22D3EE',
    colorTextClass: 'p1-color-text',
    borderColor: '#7C3AED',
    faceSprite: '/assets/sprites/pop_ch_face.png',
    characterSprite: '/assets/sprites/Anim1.png',
    fullPortrait: '/assets/sprites/pop_ch.png',
    initialLives: 3,
    keyList: ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'],
    keyMatrix: [
      ['q', 'w', 'e'],
      ['a', 's', 'd'],
      ['z', 'x', 'c']
    ],
    victoryHeadline: 'EL POP CONQUISTA LAS PLAYLISTS',
    victoryFlavor: 'Los ritmos pegadizos y la estetica pop dominan las listas y la escena urbana.'
  },
  p2: {
    id: 'p2',
    name: 'JUGADOR 2',
    tribeName: 'ESTILO ROCK',
    color: '#FF6F59',
    colorTextClass: 'p2-color-text',
    borderColor: '#EF233C',
    faceSprite: '/assets/sprites/rock_ch_face.png',
    characterSprite: '/assets/sprites/Anim2.png',
    fullPortrait: '/assets/sprites/rock_ch.png',
    initialLives: 3,
    keyList: ['u', 'i', 'o', 'j', 'k', 'l', 'm', ',', '.'],
    keyMatrix: [
      ['u', 'i', 'o'],
      ['j', 'k', 'l'],
      ['m', ',', '.']
    ],
    victoryHeadline: 'EL ROCK SE ANTEPONE EN LAS PLAYLISTS',
    victoryFlavor: 'La contundencia de las guitarras y la actitud rockera arrasan con la pista.'
  }
};

export const DRAW_RESULT = {
  headline: 'EMPATE EN LAS LISTAS',
  color: '#ffbe0b',
  borderColor: '#ffbe0b',
  flavor: 'Ambas tribus urbanas han agotado su prestigio en un duelo historico.',
  faceSprite: '/assets/sprites/pop_ch_face.png'
};
