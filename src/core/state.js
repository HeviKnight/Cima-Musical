// ===================================================
// MÁQUINA DE ESTADOS Y CONTROL DE PARTIDA (CORE)
// ===================================================

export const PHASES = {
  IDLE: 'IDLE',
  WARNING_PLACEMENT: 'WARNING_PLACEMENT',
  PHASE_1_PLACEMENT: 'PHASE_1_PLACEMENT', // 3s: Peón secreto, capa verde al fijar
  PHASE_DICE_ROLL: 'PHASE_DICE_ROLL',     // Tirada con overlay sobre casillas
  PHASE_2_ATTACK: 'PHASE_2_ATTACK',       // 3s: Selección de ataque con contador gigante
  RESOLUTION: 'RESOLUTION',               // Impactos y daño
  GAME_OVER: 'GAME_OVER'
};

export class GameState {
  constructor() {
    this.currentPhase = PHASES.IDLE;
    this.timer = 3;
    this.timerInterval = null;
    this.roundNumber = 1;

    this.p1 = this._createPlayerState('p1');
    this.p2 = this._createPlayerState('p2');

    this.listeners = new Set();
  }

  _createPlayerState(playerKey) {
    const centerKey = playerKey === 'p2' ? 'k' : 's';
    return {
      character: null,      // Objeto CHARACTERS
      maxAbilityCharges: 1, // Cargas totales según personaje (placeholder: 1)
      activeAbilityCharges: 1, // Cargas de habilidad disponibles por partida
      prestige: 0,          // 0 a 100 puntos
      pawnCell: null,       // { row, col, key }
      lastPawnCell: { row: 1, col: 1, key: centerKey },   // Posición inicial en el centro (1,1)
      diceRoll: null,       // 1..6
      attackType: null,     // Objeto de ATTACK_TYPES
      attackAnchor: null,   // { row, col }
      targetedCells: []     // Array de { row, col }
    };
  }

  setPhase(newPhase) {
    this.currentPhase = newPhase;
    this.notify('phaseChange', newPhase);
  }

  addPrestige(playerKey, delta) {
    if (!this[playerKey]) return;
    const current = this[playerKey].prestige || 0;
    this[playerKey].prestige = Math.max(0, Math.min(100, current + delta));
    this.notify('prestigeChange', { player: playerKey, prestige: this[playerKey].prestige, delta });
  }

  resetRound() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.p1.pawnCell) this.p1.lastPawnCell = this.p1.pawnCell;
    if (this.p2.pawnCell) this.p2.lastPawnCell = this.p2.pawnCell;
    this.roundNumber++;

    this.p1.pawnCell = null;
    this.p1.attackAnchor = null;
    this.p1.targetedCells = [];

    this.p2.pawnCell = null;
    this.p2.attackAnchor = null;
    this.p2.targetedCells = [];

    this.notify('roundReset');
  }

  resetMatch() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.roundNumber = 0;
    this.p1.prestige = 0;
    this.p2.prestige = 0;
    const p1Max = this.p1.character?.activeAbility?.maxCharges ?? 1;
    const p2Max = this.p2.character?.activeAbility?.maxCharges ?? 1;
    this.p1.maxAbilityCharges = p1Max;
    this.p2.maxAbilityCharges = p2Max;
    this.p1.activeAbilityCharges = p1Max;
    this.p2.activeAbilityCharges = p2Max;
    this.p1.pawnCell = null;
    this.p2.pawnCell = null;
    this.p1.lastPawnCell = { row: 1, col: 1, key: 's' };
    this.p2.lastPawnCell = { row: 1, col: 1, key: 'k' };
    this.p1.attackAnchor = null;
    this.p1.targetedCells = [];
    this.p2.attackAnchor = null;
    this.p2.targetedCells = [];
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
