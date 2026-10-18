// ===================================================
// REGISTRO Y CONFIGURACIÓN DE PERSONAJES (ROSTER DE 6)
// ===================================================

export const CHARACTERS = [
  {
    id: 'incinerador',
    name: 'INCINERADOR',
    tribeName: 'LA ADICCIÓN',
    difficulty: 'Medio ⭐⭐',
    style: 'Control y Daño Masivo por Horno',
    quote: 'Acumula chatarra para quemarla, dañando las unidades rivales.',
    color: '#EF4444',
    borderColor: '#B91C1C',
    bgColor: '#230303',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Furnance.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Furnance.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Furnance.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Furnance.png',
    melody: '/assets/audio/Melody_Rock.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    trait: {
      name: 'Horno de Chatarra',
      description: 'Cada chatarra consumida suma 1 al contador. Al llegar a 3 → 1 de daño a todas las unidades enemigas y el contador se resetea (acumulativo y sobrevive entre detonaciones).'
    },
    passiveAbility: {
      id: 'chatarreria',
      name: 'Horno de Chatarra',
      description: 'Al final de tu turno, genera 1 chatarra y acumula el contador del horno: al llegar a 3 detonará 1 de daño AoE enemigo.'
    },
    activeAbility: {
      id: 'ignicion_horno',
      name: 'Ignición del Horno',
      cost: 1,
      maxCharges: 3,
      initialCharges: 0,
      description: 'Consume TODA tu chatarra (cada una suma al contador del horno).'
    },
    titanAbility: {
      id: 'purga_titan',
      name: 'Purga del Horno',
      description: 'Con un 6 en el dado, consume hasta 2 chatarras (cada una suma al horno). Si no es posible, +1/+1 a la unidad más fuerte.'
    },
    units: {
      titan: {
        name: 'Titán Incinerador',
        atk: 0,
        hp: 6,
        sprite: '/assets/sprites/pawns/PW_Furnance_Titan.png',
        description: 'Consume hasta 2 chatarras (cada una suma al horno).'
      },
      mediana: {
        name: 'Horno Medio',
        atk: 2,
        hp: 2,
        sprite: '/assets/sprites/pawns/PW_Furnance_Medium.png',
        description: 'Al Morir: Mejora +1 HP a una chatarra aliada.'
      },
      pequena: {
        name: 'Chatarra',
        atk: 0,
        hp: 1,
        sprite: '/assets/sprites/pawns/PW_Furnance_Small.png',
        description: 'Chatarra aliada: Combustible para el horno.'
      }
    }
  },
  {
    id: 'dron_enjambre',
    name: 'SWARM',
    tribeName: 'MENTE DIVIDIDA',
    difficulty: 'Fácil ⭐',
    style: 'Horda de Drones y Explosiones en Cadena',
    quote: 'Su enjambre de drones explota al morir: tu Titán fabrica más y tu activa los detona a todos.',
    color: '#EAB308',
    borderColor: '#CA8A04',
    bgColor: '#231c03',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Swarm-drone.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Swarm-drone.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Swarm-drone.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Swarm-drone.png',
    melody: '/assets/audio/Melody_Inicio.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    trait: {
      name: 'Despliegue Rápido',
      description: 'La primera ronda, siempre saldrá un 1 en el dado para poner una unidad pequeña.'
    },
    passiveAbility: {
      id: 'dron_kamikaze',
      name: 'Carga Explosiva',
      description: 'Al morir un dron (unidad pequeña o mediana), hace 1 de daño a una unidad enemiga aleatoria.'
    },
    activeAbility: {
      id: 'sacrificio_enjambre',
      name: 'Sacrificio de Drones',
      cost: 1,
      maxCharges: 2,
      initialCharges: 0,
      description: 'Sacrifica todas tus unidades pequeñas (activando la explosión de cada una).'
    },
    titanAbility: {
      id: 'reina_colmena',
      name: 'Replicador Titán',
      description: 'Con un 6 en el dado, genera dos unidades pequeñas. Si no es posible, +1/+1 a la unidad más fuerte.'
    },
    units: {
      titan: {
        name: 'Reina Enjambre',
        atk: 0,
        hp: 6,
        sprite: '/assets/sprites/pawns/PW_Swarm_Titan.png',
        description: 'Genera dos unidades pequeñas.'
      },
      mediana: {
        name: 'Dron Nodriza',
        atk: 0,
        hp: 2,
        sprite: '/assets/sprites/pawns/PW_Swarm_Medium.png',
        description: 'Cada ronda, añade 1 de daño a un dron adyacente.'
      },
      pequena: {
        name: 'Dron Pequeño',
        atk: 1,
        hp: 1,
        sprite: '/assets/sprites/pawns/PW_Swarm_Small.png',
        description: 'Explota al morir haciendo 1 de daño aleatorio.'
      }
    }
  },
  {
    id: 'cyborg',
    name: 'CYBORG',
    tribeName: 'LA HUMANIDAD',
    difficulty: 'Fácil ⭐',
    style: 'Tensión Pasiva y Finisher Devastador',
    quote: 'La tensión es tu arma, generas mucha tensión pasiva que hace aumentar tu daño.',
    color: '#8B5CF6',
    borderColor: '#7C3AED',
    bgColor: '#110323',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Cyborg.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Cyborg.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Cyborg.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Cyborg.png',
    melody: '/assets/audio/Melody_Pop.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    passiveAbility: {
      id: 'bateria_humana',
      name: 'Batería Humana',
      description: 'Al final de tu turno, +1 de tensión por aliado vivo (máx +3).'
    },
    activeAbility: {
      id: 'finisher_sobrecarga',
      name: 'Finisher Cibernético',
      cost: 1,
      maxCharges: 1,
      initialCharges: 0,
      description: 'Por cada 20 de tensión que tengas, tu ataque de esta ronda hace +1 de daño extra.'
    },
    titanAbility: {
      id: 'inyeccion_tension',
      name: 'Sobrecarga de Tensión',
      description: 'Con un 6 en el dado, ganas 5 de tensión. Si no es posible, +1/+1 a la unidad más fuerte.'
    },
    units: {
      titan: {
        name: 'Titán Cyborg',
        atk: 0,
        hp: 6,
        sprite: '/assets/sprites/pawns/PW_Cyborg_Titan.png',
        description: 'Ganas 5 de tensión.'
      },
      mediana: {
        name: 'Centinela Blindado',
        atk: 1,
        hp: 2,
        sprite: '/assets/sprites/pawns/PW_Cyborg_Medium.png',
        description: 'Cada ronda, otorga escudo a una unidad adyacente.'
      },
      pequena: {
        name: 'Cibermuñeco',
        atk: 1,
        hp: 1,
        sprite: '/assets/sprites/pawns/PW_Cyborg_Small.png',
        description: 'Si tiene unidades adyacentes, gana 1 de ataque.'
      }
    }
  },
  {
    id: 'el_brazo',
    name: 'ROBOHAND',
    tribeName: 'PÉRDIDA TOTAL DE LA HUMANIDAD',
    difficulty: 'Difícil ⭐⭐⭐',
    style: 'Control Posicional, Escudos y Negación',
    quote: 'La mano que coloca todo donde quiere.',
    color: '#9CA3AF',
    borderColor: '#4B5563',
    bgColor: '#212427',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Robo-Hand.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Robo-hand.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Robo-hand.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Robo-hand.png',
    melody: '/assets/audio/Melody_Inicio.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    passiveAbility: {
      id: 'mano_desplazamiento',
      name: 'Impulso Vertical',
      description: 'Los ataques mueven a las unidades hacia una casilla superior; si no hay superior, la manda abajo del todo.'
    },
    activeAbility: {
      id: 'agarre_cibernetico',
      name: 'Reubicación Forzada',
      cost: 1,
      maxCharges: 3,
      initialCharges: 0,
      description: 'Mueve 1 unidad enemiga a una casilla aleatoria libre y hazle 1 de daño. Si no se puede mover, hazle 2 de daño.'
    },
    titanAbility: {
      id: 'enroque_titan',
      name: 'Enroque Titánico',
      description: 'Con un 6 en el dado, intercambia la posición con otra unidad y les otorga a ambos 1 de ataque extra. Si no es posible, +1/+1 a la unidad más fuerte.'
    },
    units: {
      titan: {
        name: 'Titán RoboHand',
        atk: 0,
        hp: 5,
        sprite: '/assets/sprites/pawns/PW_RoboHand_Titan.png',
        description: 'Intercambia posición con otra unidad y otorga a ambos +1 de ataque.'
      },
      mediana: {
        name: 'Manipulador Pesado',
        atk: 0,
        hp: 2,
        sprite: '/assets/sprites/pawns/PW_RoboHand_Medium.png',
        description: 'Cada ronda que se mueve una unidad enemiga, gana 1 de ataque.'
      },
      pequena: {
        name: 'Dedo Mecánico',
        atk: 1,
        hp: 1,
        sprite: '/assets/sprites/pawns/PW_RoboHand_Small.png',
        description: 'Peón estándar (1/1).'
      }
    }
  },
  {
    id: 'taladro',
    name: 'TALADRO',
    tribeName: 'DEPENDENCIA',
    difficulty: 'Medio ⭐⭐',
    style: 'Disrupción, Camuflaje y Recompensa de Bajas',
    quote: 'Excavar te rompe poco a poco, el Taladro ha hecho de esto algo útil.',
    color: '#92400E',
    borderColor: '#78350F',
    bgColor: '#231103',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Drill.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Drill.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Drill.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Drill.png',
    melody: '/assets/audio/Melody_Rock.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    passiveAbility: {
      id: 'resiliencia_sismica',
      name: 'Resiliencia Sísmica',
      description: 'Cuando un aliado recibe daño, gana 1 de ataque extra.'
    },
    activeAbility: {
      id: 'falla_tectonica',
      name: 'Falla Tectónica',
      cost: 1,
      maxCharges: 2,
      initialCharges: 0,
      description: 'Hace 1 de daño a todas las unidades de ambos tableros.'
    },
    titanAbility: {
      id: 'reparacion_profunda',
      name: 'Reparación Profunda',
      description: 'Con un 6 en el dado, cura completamente a la unidad con menos vida. Si no es posible, +1/+1 a la unidad más fuerte.'
    },
    units: {
      titan: {
        name: 'Excavadora Titán',
        atk: 0,
        hp: 6,
        sprite: '/assets/sprites/pawns/PW_Drill_Titan.png',
        description: 'Cura completamente a la unidad con menos vida.'
      },
      mediana: {
        name: 'Perforadora de Asalto',
        atk: 3,
        hp: 2,
        sprite: '/assets/sprites/pawns/PW_Drill_Medium.png',
        description: 'Al morir, otorga 1 de daño a una unidad aliada aleatoria.'
      },
      pequena: {
        name: 'Carga Sísmica',
        atk: 0,
        hp: 3,
        sprite: '/assets/sprites/pawns/PW_Drill_Small.png',
        description: 'Al morir, realiza 1 de daño en su casilla homóloga contraria.'
      }
    }
  },
  {
    id: 'holo',
    name: 'HOLO',
    tribeName: 'DISMORFIA CORPORAL',
    difficulty: 'Medio ⭐⭐',
    style: 'Engaño, Desvío de Daño y Clonación',
    quote: 'Sabes que es lo mejor de un holograma? Que no lo puedes tocar.',
    color: '#06B6D4',
    borderColor: '#0891B2',
    bgColor: '#032319',
    iconSprite: '/assets/sprites/heroes/CH_Icon_Holo.png',
    characterSprite: '/assets/sprites/heroes/CH_Sprite_Holo.png',
    fullPortrait: '/assets/sprites/heroes/CH_Sprite_Holo.png',
    animSprite: '/assets/sprites/heroes/CH_Anim_Holo.png',
    melody: '/assets/audio/Melody_Pop.mp3',
    isPlayable: true,
    diceFaces: [1, 2, 3, 4, 5, 6],
    passiveAbility: {
      id: 'escudo_holografico',
      name: 'Escudo Holográfico',
      description: 'Otorga escudo a una unidad aleatoria.'
    },
    activeAbility: {
      id: 'sobrecarga_escudos',
      name: 'Sobrecarga de Escudos',
      cost: 1,
      maxCharges: 1,
      initialCharges: 0,
      description: 'Convierte los escudos en +1/+1 de daño y vida.'
    },
    titanAbility: {
      id: 'dano_por_vida',
      name: 'Reflejo Vital',
      description: 'Su daño se iguala a su vida. Con un 6 en el dado, si no es posible otra acción, +1/+1 a la unidad más fuerte.'
    },
    units: {
      titan: {
        name: 'Titán Holo',
        atk: 5,
        hp: 5,
        sprite: '/assets/sprites/pawns/PW_Holo_Titan.png',
        description: 'Su daño se iguala a su vida (inicialmente 5/5).'
      },
      mediana: {
        name: 'Prisma Holográfico',
        atk: 1,
        hp: 2,
        sprite: '/assets/sprites/pawns/PW_Holo_Medium.png',
        description: 'Cada vez que el enemigo recibe daño, esta unidad recibe un escudo.'
      },
      pequena: {
        name: 'Espejo Frágil',
        atk: 0,
        hp: 1,
        sprite: '/assets/sprites/pawns/PW_Holo_Small.png',
        description: 'Si fuese a recibir un escudo, en su lugar, consigue 1 de daño extra.'
      }
    }
  }
];

export function getPlayableCharacters() {
  return CHARACTERS.filter(c => c.isPlayable);
}

export function getCharacterById(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
