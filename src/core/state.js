// ===================================================
// MÁQUINA DE ESTADOS Y CONTROL DE PARTIDA (CORE)
// ===================================================

import { CHARACTERS, getCharacterById } from '../data/characters.js';

export const PHASES = {
  IDLE: 'IDLE',
  WARNING_PLACEMENT: 'WARNING_PLACEMENT',
  ROUND_0_PLACEMENT: 'ROUND_0_PLACEMENT', // Ronda 0: Colocar 1 Titán inicial
  PHASE_DICE_ROLL: 'PHASE_DICE_ROLL',     // Tirada con overlay sobre casillas
  PHASE_1_PLACEMENT: 'PHASE_1_PLACEMENT', // Colocación de unidad o mejora si tablero lleno
  PHASE_ACTION_SELECT: 'PHASE_ACTION_SELECT', // Selección de Acción previa: Ataque o Habilidad
  PHASE_2_ATTACK: 'PHASE_2_ATTACK',       // Período de Ataque: Apuntado en tablero y resolución
  RESOLUTION: 'RESOLUTION',               // Movimiento, habilidades, impactos y daño
  GAME_OVER: 'GAME_OVER'
};

export const KILL_TENSION = {
  PEQUENA: 8,
  MEDIANA: 16,
  TITAN: 50
};

export function getHpForDiceRoll(roll) {
  const r = parseInt(roll, 10) || 1;
  if (r === 6) return 6; // Habilidad de Titán / Titán
  if (r <= 3) return 1; // 1, 2 y 3: Pequeña
  return 2;             // 4 y 5: Mediana
}

export function getUnitTypeForDiceRoll(roll) {
  const r = parseInt(roll, 10) || 1;
  if (r === 6) return 'titan';
  if (r <= 3) return 'pequena';
  return 'mediana';
}

export function getUnitTypeForHp(hp, isTitan = false) {
  if (isTitan || hp >= 5) return 'titan';
  if (hp >= 2) return 'mediana';
  return 'pequena';
}

export function getPawnEmoji(hp, isTitan = false) {
  if (isTitan || hp >= 5) return '👑'; // Titán
  if (hp >= 2) return '🗼';            // Mediana
  return '♟';                          // Pequeña
}

export function getHeroSpriteName(characterId) {
  const norm = (characterId || '').toLowerCase();
  if (norm.includes('incinerador') || norm.includes('furnance')) return 'Furnance';
  if (norm.includes('dron') || norm.includes('swarm')) return 'Swarm';
  if (norm.includes('cyborg')) return 'Cyborg';
  if (norm.includes('brazo') || norm.includes('robo')) return 'RoboHand';
  if (norm.includes('taladro') || norm.includes('drill')) return 'Drill';
  if (norm.includes('holo')) return 'Holo';
  return 'Cyborg';
}

export function getPawnSprite(unitOrTypeOrHp, playerKey = 'p1', characterId = null) {
  // Si ya es un objeto unidad con sprite definido
  if (unitOrTypeOrHp && typeof unitOrTypeOrHp === 'object') {
    if (unitOrTypeOrHp.sprite) return unitOrTypeOrHp.sprite;
    const heroId = characterId || unitOrTypeOrHp.characterId || gameState[playerKey]?.character?.id;
    const heroName = getHeroSpriteName(heroId);
    let tier = 'Small';
    if (unitOrTypeOrHp.isTitan || unitOrTypeOrHp.unitType === 'titan') tier = 'Titan';
    else if (unitOrTypeOrHp.unitType === 'mediana' || unitOrTypeOrHp.hp >= 2) tier = 'Medium';
    return `/assets/sprites/pawns/PW_${heroName}_${tier}.png`;
  }

  const heroId = characterId || gameState[playerKey]?.character?.id;
  const heroName = getHeroSpriteName(heroId);

  let tier = 'Small';
  if (typeof unitOrTypeOrHp === 'string') {
    const s = unitOrTypeOrHp.toLowerCase();
    if (s.includes('titan')) tier = 'Titan';
    else if (s.includes('mediana') || s.includes('medium')) tier = 'Medium';
    else tier = 'Small';
  } else {
    const val = parseInt(unitOrTypeOrHp, 10) || 1;
    if (val >= 5) tier = 'Titan';
    else if (val >= 2) tier = 'Medium';
    else tier = 'Small';
  }

  return `/assets/sprites/pawns/PW_${heroName}_${tier}.png`;
}

export function getUnitTemplate(characterId, unitType = 'pequena') {
  const char = getCharacterById(characterId);
  const typeKey = (unitType === 'titan' || unitType === 'Titan') ? 'titan' : ((unitType === 'mediana' || unitType === 'Medium') ? 'mediana' : 'pequena');
  const unitDef = char?.units?.[typeKey] || {
    name: 'Unidad',
    atk: typeKey === 'titan' ? 0 : (typeKey === 'mediana' ? 1 : 1),
    hp: typeKey === 'titan' ? 6 : (typeKey === 'mediana' ? 2 : 1),
    sprite: `/assets/sprites/pawns/PW_Cyborg_${typeKey === 'titan' ? 'Titan' : (typeKey === 'mediana' ? 'Medium' : 'Small')}.png`,
    description: ''
  };

  return {
    name: unitDef.name,
    atk: unitDef.atk ?? 0,
    hp: unitDef.hp ?? 1,
    maxHp: unitDef.hp ?? 1,
    isTitan: typeKey === 'titan',
    unitType: typeKey,
    characterId: char?.id || characterId,
    sprite: unitDef.sprite || getPawnSprite(typeKey, null, characterId),
    description: unitDef.description || ''
  };
}

/**
 * Regla PDF: La suma de su ataque y vida, en caso de haber 2 unidades iguales,
 * la que tenga mayor ataque y en caso de tener el mismo ataque, se decide aleatoriamente.
 */
export function getStrongestUnit(pawns) {
  const living = (pawns || []).filter(p => p && p.hp > 0);
  if (living.length === 0) return null;

  const scored = living.map(p => ({
    pawn: p,
    total: (p.atk || 0) + (p.hp || 0),
    atk: p.atk || 0
  }));

  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.atk !== a.atk) return b.atk - a.atk;
    return Math.random() - 0.5;
  });

  return scored[0].pawn;
}

/**
 * Regla PDF: Unidad con menor suma de ataque y vida, o menor ataque.
 */
export function getWeakestUnit(pawns) {
  const living = (pawns || []).filter(p => p && p.hp > 0);
  if (living.length === 0) return null;

  const scored = living.map(p => ({
    pawn: p,
    total: (p.atk || 0) + (p.hp || 0),
    atk: p.atk || 0
  }));

  scored.sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    if (a.atk !== b.atk) return a.atk - b.atk;
    return Math.random() - 0.5;
  });

  return scored[0].pawn;
}

export class GameState {
  constructor() {
    this.currentPhase = PHASES.IDLE;
    this.roundNumber = 0;

    this.p1 = this._createPlayerState('p1');
    this.p2 = this._createPlayerState('p2');

    this.listeners = new Set();
  }

  _createPlayerState(playerKey) {
    return {
      character: null,            // Objeto CHARACTERS
      maxAbilityCharges: 1,       // Cargas totales según personaje (coste de su activa)
      activeAbilityCharges: 0,    // Cargas de habilidad disponibles
      prestige: 0,                // 0 a 100 puntos de tensión
      pawns: [],                  // Array de { id, row, col, atk, hp, maxHp, isTitan, unitType, shield, sprite, name }
      pendingPawn: null,          // Unidad obtenida en la tirada
      diceRoll: null,             // 1..6
      selectedAction: 'attack',   // 'attack' | 'ability'
      attackTarget: null,         // { row, col } (1 sola casilla a la que dispara)
      targetedCells: [],          // Array con [{ row, col }] (1 casilla)
      abilityTarget: null,        // Objetivo de habilidad si aplica
      hornoCount: 0,              // Contador del Horno (Incinerador: detona cada 3 chatarras)
      isDustCloudActive: false,   // Nube de polvo activa
      holoRedirectUsed: false,    // Pasiva Holo usada esta ronda
      isCyborgBoosted: false      // Activa Cyborg armada para esta ronda
    };
  }

  setPhase(newPhase) {
    this.currentPhase = newPhase;
    this.notify('phaseChange', newPhase);
  }

  addPrestige(playerKey, delta) {
    if (!this[playerKey]) return;
    const p = this[playerKey];
    const current = p.prestige || 0;
    p.prestige = Math.max(0, Math.min(100, current + delta));
    this.notify('prestigeChange', { player: playerKey, prestige: p.prestige, delta });
  }

  drainPrestige(fromPlayer, toPlayer, amount) {
    if (!this[fromPlayer] || !this[toPlayer]) return 0;
    const fromP = this[fromPlayer];
    const toP = this[toPlayer];
    const drained = Math.max(0, Math.min(amount, fromP.prestige || 0));
    fromP.prestige = Math.max(0, (fromP.prestige || 0) - drained);
    toP.prestige = Math.min(100, (toP.prestige || 0) + drained);
    this.notify('prestigeChange', { player: fromPlayer, prestige: fromP.prestige, delta: -drained });
    this.notify('prestigeChange', { player: toPlayer, prestige: toP.prestige, delta: drained });
    return drained;
  }

  addAbilityCharge(playerKey, amount = 1) {
    const p = this[playerKey];
    if (!p) return;
    const max = p.maxAbilityCharges || 1;
    if (p.activeAbilityCharges < max) {
      p.activeAbilityCharges = Math.min(max, p.activeAbilityCharges + amount);
      this.notify('chargeGained', { player: playerKey, charges: p.activeAbilityCharges });
    }
  }

  resetRound() {
    this.roundNumber++;

    ['p1', 'p2'].forEach(key => {
      const p = this[key];
      p.pendingPawn = null;
      p.selectedAction = 'attack';
      p.attackTarget = null;
      p.targetedCells = [];
      p.abilityTarget = null;
      p.isDustCloudActive = false;
      p.holoRedirectUsed = false;
      p.isCyborgBoosted = false;

      // Caducar escudos al final de cada ronda
      if (p.pawns) {
        p.pawns.forEach(pawn => {
          if (pawn) {
            pawn.shield = 0;
            // Holo Titán: su daño se iguala a su vida
            if (pawn.isTitan && p.character?.id === 'holo') {
              pawn.atk = pawn.hp;
            }
          }
        });
      }

      // Recarga de habilidad: +1 carga por ronda hasta el máximo
      this.addAbilityCharge(key, 1);
    });

    this.notify('roundReset');
  }

  resetMatch() {
    this.roundNumber = 0;
    ['p1', 'p2'].forEach(key => {
      const p = this[key];
      p.prestige = 0;
      const char = p.character;
      const max = char?.activeAbility?.maxCharges || 1;
      const init = char?.activeAbility?.initialCharges ?? 0;
      p.maxAbilityCharges = max;
      p.activeAbilityCharges = init;
      p.pawns = [];
      p.pendingPawn = null;
      p.selectedAction = 'attack';
      p.attackTarget = null;
      p.targetedCells = [];
      p.abilityTarget = null;
      p.hornoCount = 0;
      p.isDustCloudActive = false;
      p.holoRedirectUsed = false;
      p.isCyborgBoosted = false;
    });

    this.notify('matchReset');
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      listener(event, payload, this);
    }
  }
}

export const gameState = new GameState();
