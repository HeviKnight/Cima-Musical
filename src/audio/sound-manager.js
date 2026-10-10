// ===================================================
// GESTOR DE AUDIO: MÚSICA Y SFX (AUDIO)
// ===================================================

const AUDIO_CONFIG = {
  masterSFX: 0.5,
  volumes: {
    hit: 0.8,
    miss: 0.4,
    pawn: 0.5,
    countdown: {
      3: 0.15,
      2: 0.35,
      1: 0.60,
      go: 0.90
    },
    diceRoll: 1.0,
    gameOver: 0.8,
    gridIntro: 0.5
  }
};

const HIT_SFXR_CODE = "11111J2LXvFsbav3ZioKnEjgoR8M48MxVeS4qfPZEEEEughZBZtidcoSA36vu749BSmdfHEckWyUujT8bqH8TCYjDukbzib4hu2ucSS5BNZPzz2F8dAoPiu5";
const PAWN_SFXR_CODE = "4DXe5v4QcA8vJsXLTfqstjrahiqa4nvmrntpdMbcpEibL3acpcn17nptrRgmYZc2aHksRhWDDCfP8vt3xDTuXJhKFJYL3zs3391rvDNHzYTnMqCpYFgxXm5aP";
const MISS_BOTH_SFXR_CODE = "111116x8fB2q9mYrADpaPCAYmb1pCrd7buucZHdE4oTEakAC9hgkwLWzY7m6fvbq8qbSFqPd7xY61cW3NTk8YxGhnD3nCFkHn11esahFhpGQRbTVmPFUadg3";
const GAME_OVER_SFXR_CODE = "12sF8HRL5TadVgapRXoxxWeud1GgnJ43YAUMHugAapxapTPMbLSp4SAjDoS6YRpJSRrCv8ruAvW4svvAummf37Q5zzqPAQn72FWrtNmqafyUu6C1PoC94D76Bv";
const GAME_START_ANIMATION_CODE = "34T6PkuprVUgR5ikjjDzeXVUvgWsybHfTjcgSMeoaNJwkn7o1RwpRwBtg1yTwaftyD5hSC32cvshymndpx3BnTKvPKFxGYueVfUDnFC7kBeGA5miw1sWA922s";

const COUNTDOWN_SFXR = {
  3: "11111GneoSLWuDVAHov7b7xBKUdw4EigursMKfYVSF7b6cKptCHm5LCrTyFNYNJ6Yt7W9jcT79tXcdLAZmKmsib5RUn1xLvqWCXYtuqytqopx2AKBKPe94Ws",
  2: "11111GneoSLWuDVAHov7b9ygKEpkotfCJTrnEmq5tEKacbdia13tkXp3syjYB8dtu69r7Am2zxuwLM32biSJDkNFXAG49BGJswaGRhhuY3Qnv9Fh2Q588hEf",
  1: "11111GneoSLWuDVAHov7b9YYvm4iRA5WDPPPXSMkBuTRpsBheBTJQR3ium24V89RdwznGhLMUqQPhHBhyJv3xQvCNV5B9ntw32vq9YvYN5XYwAdwuTNvGNDD",
  go: "11111GneoSLWuDVACs4kWLQ21DBFM5dQTa9rtmeES73PPjVft8S1fn8jpFoYyJ4e7K2dJthWnHo7TuPW6VNKHhNYfW82sNGcswJnw1Ruc9csTAbWLNo6uYMm"
};

export const MUSIC_TRACKS = {
  INICIO: '/assets/audio/Melody_Inicio.mp3',
  POP: '/assets/audio/Melody_Pop.mp3',
  ROCK: '/assets/audio/Melody_Rock.mp3'
};

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.audioBuffers = new Map(); // url -> AudioBuffer
    this.rawBuffers = new Map();   // url -> ArrayBuffer
    this.musicSource = null;
    this.musicGain = null;
    this.musicStarted = false;
    this.currentTrackUrl = MUSIC_TRACKS.INICIO;
    this.fallbackAudio = null;

    this._preFetchAllMusic();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  _preFetchAllMusic() {
    Object.values(MUSIC_TRACKS).forEach(url => {
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => {
          this.rawBuffers.set(url, buf);
        })
        .catch(() => {});
    });
  }

  async _decodeTrack(url) {
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url);
    }
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    let arrayBuffer = this.rawBuffers.get(url);
    if (!arrayBuffer) {
      const response = await fetch(url);
      arrayBuffer = await response.arrayBuffer();
      this.rawBuffers.set(url, arrayBuffer);
    }

    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    this.audioBuffers.set(url, decoded);
    return decoded;
  }

  _stopCurrentMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch (e) {}
      this.musicSource = null;
    }
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
      } catch (e) {}
      this.fallbackAudio = null;
    }
  }

  async playTrack(url) {
    if (this.currentTrackUrl === url && (this.musicSource || this.fallbackAudio) && this.musicStarted) {
      return;
    }

    this.currentTrackUrl = url;

    if (!this.musicStarted) return;

    this._stopCurrentMusic();

    try {
      const buffer = await this._decodeTrack(url);
      if (this.currentTrackUrl !== url) return;

      if (buffer) {
        this._playWebAudioBuffer(buffer);
      } else {
        this._playFallbackMusic(url);
      }
    } catch (err) {
      console.warn('Error decodificando pista de música con Web Audio API, usando fallback:', err);
      this._playFallbackMusic(url);
    }
  }

  _playWebAudioBuffer(buffer) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this._stopCurrentMusic();

    this.musicSource = ctx.createBufferSource();
    this.musicSource.buffer = buffer;
    this.musicSource.loop = true;

    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.85, ctx.currentTime);
      this.musicGain.connect(ctx.destination);
    }

    this.musicSource.connect(this.musicGain);
    this.musicSource.start(0);
  }

  _playFallbackMusic(url) {
    this._stopCurrentMusic();
    this.fallbackAudio = new Audio(url);
    this.fallbackAudio.loop = true;
    this.fallbackAudio.volume = 0.85;
    this.fallbackAudio.play().catch(() => {});
  }

  startBackgroundMusic(url = null) {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    const targetUrl = url || this.currentTrackUrl || MUSIC_TRACKS.INICIO;
    this.musicStarted = true;
    this.playTrack(targetUrl);
  }

  playMenuMusic() {
    this.playTrack(MUSIC_TRACKS.INICIO);
  }

  playRoundMusic(roundNumber) {
    const track = (roundNumber % 2 === 1) ? MUSIC_TRACKS.POP : MUSIC_TRACKS.ROCK;
    this.playTrack(track);
  }

  playSFX(code, volumeLevel = 1.0) {
    const finalVolume = Math.max(0, Math.min(1, AUDIO_CONFIG.masterSFX * volumeLevel));
    if (finalVolume <= 0) return;

    try {
      if (typeof window.sfxr !== 'undefined' && window.sfxr.toAudio) {
        const sfx = window.sfxr.toAudio(code);
        if (sfx) {
          if (typeof sfx.setVolume === 'function') {
            sfx.setVolume(finalVolume);
          } else {
            sfx.volume = finalVolume;
          }
          sfx.play();
        }
      }
    } catch (e) {
      console.warn('Error reproduciendo SFX:', e);
    }
  }

  playHitSound() {
    this.playSFX(HIT_SFXR_CODE, AUDIO_CONFIG.volumes.hit);
  }

  playMissBothSound() {
    this.playSFX(MISS_BOTH_SFXR_CODE, AUDIO_CONFIG.volumes.miss);
  }

  playPawnPlaceSound() {
    this.playSFX(PAWN_SFXR_CODE, AUDIO_CONFIG.volumes.pawn);
  }

  playGameOverSound() {
    this.playSFX(GAME_OVER_SFXR_CODE, AUDIO_CONFIG.volumes.gameOver);
  }

  playGridIntroSound() {
    this.playSFX(GAME_START_ANIMATION_CODE, AUDIO_CONFIG.volumes.gridIntro);
  }

  playCountdownSound(step) {
    if (COUNTDOWN_SFXR[step]) {
      const vol = typeof AUDIO_CONFIG.volumes.countdown === 'object'
        ? (AUDIO_CONFIG.volumes.countdown[step] || 0.5)
        : AUDIO_CONFIG.volumes.countdown;
      this.playSFX(COUNTDOWN_SFXR[step], vol);
    }
  }

  playDiceRollTick(tick) {
    if (AUDIO_CONFIG.masterSFX <= 0 || AUDIO_CONFIG.volumes.diceRoll <= 0) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = 260 + (tick % 6) * 45;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const tickVol = AUDIO_CONFIG.masterSFX * AUDIO_CONFIG.volumes.diceRoll;
      gain.gain.setValueAtTime(tickVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (e) { }
  }
}

export const soundManager = new SoundManager();
