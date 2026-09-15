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

    this.p1 = this._createPlayerState();
    this.p2 = this._createPlayerState();

    this.listeners = new Set();
  }

  _createPlayerState() {
    return {
      lives: 3,
      pawnCell: null,       // { row, col, key }
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

  resetRound() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.p1.pawnCell = null;
    this.p1.attackAnchor = null;
    this.p1.targetedCells = [];

    this.p2.pawnCell = null;
    this.p2.attackAnchor = null;
    this.p2.targetedCells = [];

    this.notify('roundReset');
  }

  resetMatch() {
    this.resetRound();
    this.p1.lives = 3;
    this.p2.lives = 3;
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
