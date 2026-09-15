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
    gameOver: 0.8
  }
};

const HIT_SFXR_CODE = "11111J2LXvFsbav3ZioKnEjgoR8M48MxVeS4qfPZEEEEughZBZtidcoSA36vu749BSmdfHEckWyUujT8bqH8TCYjDukbzib4hu2ucSS5BNZPzz2F8dAoPiu5";
const PAWN_SFXR_CODE = "4DXe5v4QcA8vJsXLTfqstjrahiqa4nvmrntpdMbcpEibL3acpcn17nptrRgmYZc2aHksRhWDDCfP8vt3xDTuXJhKFJYL3zs3391rvDNHzYTnMqCpYFgxXm5aP";
const MISS_BOTH_SFXR_CODE = "111116x8fB2q9mYrADpaPCAYmb1pCrd7buucZHdE4oTEakAC9hgkwLWzY7m6fvbq8qbSFqPd7xY61cW3NTk8YxGhnD3nCFkHn11esahFhpGQRbTVmPFUadg3";
const GAME_OVER_SFXR_CODE = "12sF8HRL5TadVgapRXoxxWeud1GgnJ43YAUMHugAapxapTPMbLSp4SAjDoS6YRpJSRrCv8ruAvW4svvAummf37Q5zzqPAQn72FWrtNmqafyUu6C1PoC94D76Bv";

const COUNTDOWN_SFXR = {
  3: "11111GneoSLWuDVAHov7b7xBKUdw4EigursMKfYVSF7b6cKptCHm5LCrTyFNYNJ6Yt7W9jcT79tXcdLAZmKmsib5RUn1xLvqWCXYtuqytqopx2AKBKPe94Ws",
  2: "11111GneoSLWuDVAHov7b9ygKEpkotfCJTrnEmq5tEKacbdia13tkXp3syjYB8dtu69r7Am2zxuwLM32biSJDkNFXAG49BGJswaGRhhuY3Qnv9Fh2Q588hEf",
  1: "11111GneoSLWuDVAHov7b9YYvm4iRA5WDPPPXSMkBuTRpsBheBTJQR3ium24V89RdwznGhLMUqQPhHBhyJv3xQvCNV5B9ntw32vq9YvYN5XYwAdwuTNvGNDD",
  go: "11111GneoSLWuDVACs4kWLQ21DBFM5dQTa9rtmeES73PPjVft8S1fn8jpFoYyJ4e7K2dJthWnHo7TuPW6VNKHhNYfW82sNGcswJnw1Ruc9csTAbWLNo6uYMm"
};

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.musicBuffer = null;
    this.musicSource = null;
    this.musicGain = null;
    this.musicStarted = false;
    this.musicLoading = false;
    this.rawMusicArrayBuffer = null;
    this.fallbackAudio = null;

    this._preFetchMusic();
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

  _preFetchMusic() {
    fetch('/assets/audio/music.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => {
        this.rawMusicArrayBuffer = buf;
      })
      .catch(() => { });
  }

  async loadBackgroundMusic() {
    if (this.musicBuffer || this.musicLoading) return;
    this.musicLoading = true;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (!this.rawMusicArrayBuffer) {
        const response = await fetch('/assets/audio/music.mp3');
        this.rawMusicArrayBuffer = await response.arrayBuffer();
      }

      this.musicBuffer = await ctx.decodeAudioData(this.rawMusicArrayBuffer.slice(0));
      this.musicLoading = false;

      if (this.musicStarted && !this.musicSource) {
        this._playWebAudioMusic();
      }
    } catch (err) {
      console.warn('Error decodificando música con Web Audio API, usando fallback:', err);
      this.musicLoading = false;
      if (this.musicStarted) {
        this._playFallbackMusic();
      }
    }
  }

  _playWebAudioMusic() {
    if (!this.musicBuffer) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (this.musicSource) {
      try { this.musicSource.stop(); } catch (e) { }
    }

    this.musicSource = ctx.createBufferSource();
    this.musicSource.buffer = this.musicBuffer;
    this.musicSource.loop = true;

    if (!this.musicGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.85, ctx.currentTime);
      this.musicGain.connect(ctx.destination);
    }

    this.musicSource.connect(this.musicGain);
    this.musicSource.start(0);
  }

  _playFallbackMusic() {
    if (!this.fallbackAudio) {
      this.fallbackAudio = new Audio('/assets/audio/music.mp3');
      this.fallbackAudio.loop = true;
      this.fallbackAudio.volume = 0.85;
    }
    this.fallbackAudio.play().catch(() => { });
  }

  startBackgroundMusic() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    if (this.musicStarted) return;
    this.musicStarted = true;

    if (this.musicBuffer) {
      this._playWebAudioMusic();
    } else {
      this.loadBackgroundMusic().then(() => {
        if (this.musicBuffer && !this.musicSource) {
          this._playWebAudioMusic();
        }
      });
    }
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
