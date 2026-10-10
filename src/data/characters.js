// ===================================================
// REGISTRO Y CONFIGURACIÓN DE PERSONAJES (ROSTER DE 6)
// ===================================================

export const CHARACTERS = [
  {
    id: 'cyborg',
    name: 'CYBORG',
    tribeName: 'LA HUMANIDAD',
    difficulty: 'Fácil ⭐',
    style: 'Equilibrado: El más sencillo, se resuelve entorno a las mecánicas base',
    color: '#8B5CF6',
    borderColor: '#7C3AED',
    bgColor: '#110323',
    faceSprite: '/assets/sprites/CH_Icon_Cyborg.png',
    iconSprite: '/assets/sprites/CH_Icon_Cyborg.png',
    characterSprite: '/assets/sprites/CH_Sprite_Cyborg.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Cyborg.png',
    animSprite: '/assets/sprites/CH_Anim_Cyborg.png',
    melody: '/assets/audio/Melody_Pop.mp3',
    isPlayable: true,
    diceFaces: [1, 1, 1, 4, 4, 6],
    patternMapping: { 1: 1, 4: 4, 6: 6 },
    activeAbility: {
      id: 'placeholder',
      name: 'Placeholder',
      description: 'Carga activa placeholder (Doble pulsación en ataque: S para P1 / K para P2)',
      maxCharges: 1
    },
    passiveAbility: null
  },
  {
    id: 'incinerador',
    name: 'INCINERADOR',
    tribeName: 'LA ADICCIÓN',
    difficulty: 'Medio ⭐⭐',
    style: 'Ofensivo: Capacidad de delete, pero castigado por fallar',
    color: '#EF4444',
    borderColor: '#B91C1C',
    bgColor: '#230303',
    faceSprite: '/assets/sprites/CH_Icon_Furnance.png',
    iconSprite: '/assets/sprites/CH_Icon_Furnance.png',
    characterSprite: '/assets/sprites/CH_Sprite_Furnance.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Furnance.png',
    animSprite: '/assets/sprites/CH_Anim_Furnance.png',
    melody: '/assets/audio/Melody_Rock.mp3',
    isPlayable: true,
    diceFaces: [1, 1, 1, 1, 5, 6],
    patternMapping: { 1: 1, 5: '5_CROSS', 6: 6 },
    activeAbility: {
      id: 'placeholder',
      name: 'Placeholder',
      description: 'Carga activa placeholder (Doble pulsación en ataque: S para P1 / K para P2)',
      maxCharges: 1
    },
    passiveAbility: null
  },
  {
    id: 'el_brazo',
    name: 'EL BRAZO',
    tribeName: 'PÉRDIDA TOTAL DE LA HUMANIDAD',
    difficulty: 'Difícil ⭐⭐⭐',
    style: 'Equilibrado: Skill ceeling alto, mucha consistencia mecánica y mucho reward',
    color: '#9CA3AF',
    borderColor: '#4B5563',
    bgColor: '#212427',
    faceSprite: '/assets/sprites/CH_Icon_Robo-Hand.png',
    iconSprite: '/assets/sprites/CH_Icon_Robo-Hand.png',
    characterSprite: '/assets/sprites/CH_Sprite_Robo-hand.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Robo-hand.png',
    animSprite: '/assets/sprites/CH_Anim_Robo-hand.png',
    melody: '/assets/audio/Melody_Inicio.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    patternMapping: { 1: 1, 2: 2, 3: '3_L', 4: 4, 5: '5_CROSS', 6: 6 },
    activeAbility: {
      id: 'placeholder',
      name: 'Placeholder',
      description: 'Carga activa placeholder (Doble pulsación en ataque: S para P1 / K para P2)',
      maxCharges: 1
    },
    passiveAbility: null
  },
  {
    id: 'dron_enjambre',
    name: 'DRON ENJAMBRE',
    tribeName: 'MENTE DIVIDIDA',
    difficulty: 'Difícil ⭐⭐⭐',
    style: 'Caótico: Vive por y para el RNG, capacidad destructiva alta e impredecible',
    color: '#EAB308',
    borderColor: '#CA8A04',
    bgColor: '#231c03',
    faceSprite: '/assets/sprites/CH_Icon_Swarm-drone.png',
    iconSprite: '/assets/sprites/CH_Icon_Swarm-drone.png',
    characterSprite: '/assets/sprites/CH_Sprite_Swarm-drone.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Swarm-drone.png',
    animSprite: '/assets/sprites/CH_Anim_Swarm-drone.png',
    melody: '/assets/audio/Melody_Inicio.mp3',
    isPlayable: true,
    diceFaces: [1, 1, 1, 2, 2, 6],
    patternMapping: { 1: 1, 2: 2, 6: 6 },
    activeAbility: {
      id: 'placeholder',
      name: 'Placeholder',
      description: 'Carga activa placeholder (Doble pulsación en ataque: S para P1 / K para P2)',
      maxCharges: 1
    },
    passiveAbility: null
  },
  {
    id: 'holo',
    name: 'HOLO',
    tribeName: 'DISMORFIA CORPORAL',
    difficulty: 'Medio ⭐⭐',
    style: 'Defensivo: Gira entorno a evadir daño mientras carga poco a poco',
    color: '#06B6D4',
    borderColor: '#0891B2',
    bgColor: '#032319',
    faceSprite: '/assets/sprites/CH_Icon_Holo.png',
    iconSprite: '/assets/sprites/CH_Icon_Holo.png',
    characterSprite: '/assets/sprites/CH_Sprite_Holo.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Holo.png',
    animSprite: '/assets/sprites/CH_Anim_Holo.png',
    melody: '/assets/audio/Melody_Pop.mp3',
    isPlayable: true,
    diceFaces: [1, 1, 1, 4, 4, 6],
    patternMapping: { 1: 1, 4: 4, 6: 6 },
    activeAbility: {
      id: 'placeholder',
      name: 'Placeholder',
      description: 'Carga activa placeholder (Doble pulsación en ataque: S para P1 / K para P2)',
      maxCharges: 1
    },
    passiveAbility: null
  },
  {
    id: 'taladro',
    name: 'TALADRO',
    tribeName: 'DEPENDENCIA',
    difficulty: 'Fácil ⭐',
    style: 'Ofensivo: El mayor rango de ataque, a costa de daño',
    color: '#92400E',
    borderColor: '#78350F',
    bgColor: '#231103',
    faceSprite: '/assets/sprites/CH_Icon_Drill.png',
    iconSprite: '/assets/sprites/CH_Icon_Drill.png',
    characterSprite: '/assets/sprites/CH_Sprite_Drill.png',
    fullPortrait: '/assets/sprites/CH_Sprite_Drill.png',
    animSprite: '/assets/sprites/CH_Anim_Drill.png',
    melody: '/assets/audio/Melody_Rock.mp3',
    isPlayable: true,
    diceFaces: [3, 4, 4, 5, 5, 6],
    patternMapping: { 3: '3_LONG', 4: 4, 5: '5_WAVE', 6: 6 },
    activeAbility: {
      id: 'placeholder',
      name: 'Placeholder',
      description: 'Carga activa placeholder (Doble pulsación en ataque: S para P1 / K para P2)',
      maxCharges: 1
    },
    passiveAbility: null
  }
];

export function getPlayableCharacters() {
  return CHARACTERS.filter(c => c.isPlayable);
}

export function getCharacterById(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}

