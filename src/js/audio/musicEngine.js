/**
 * Space Drift - Hybrid Background Music (BGM) Engine
 * - Procedural Dynamic Dark Synth Engine (0 KB, Adaptive Real-time Web Audio API)
 * - External Audio Track Player (.mp3/.ogg file support)
 */
import { cfg, G, ship, obs } from '../core/state.js';
import { getAudioContext, getMasterGain } from './synth.js';

let musicGain = null;
let filterBus = null;
let isStarted = false;
let currentMode = 'synth'; // 'synth' | 'custom' | 'off'

// Procedural Synth Sequencer State
let nextNoteTime = 0;
let currentStep = 0;
let baseTempo = 120; // BPM
let currentTempo = 120;
let tensionFilterCutoff = 1000;
let padOsc1 = null;
let padOsc2 = null;
let padGain = null;
let padFilter = null;

// External Audio Player State
let audioEl = null;

// D-Minor Scale Frequencies (Hz)
const NOTES = {
  D1: 36.71,
  F1: 43.65,
  G1: 49.00,
  A1: 55.00,
  Bb1: 58.27,
  C2: 65.41,
  D2: 73.42,
  F2: 87.31,
  A2: 110.00,
  C3: 130.81,
  D3: 146.83,
  F3: 174.61,
  G3: 196.00,
  A3: 220.00,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  A4: 440.00
};

// 16-step tense dark synth arpeggio progression (4 bars, Dm -> Bb -> Gm -> A)
const ARP_PATTERNS = [
  // Bar 1: Dm
  [NOTES.D3, NOTES.A3, NOTES.F3, NOTES.D4, NOTES.F3, NOTES.D4, NOTES.A3, NOTES.D4,
   NOTES.D3, NOTES.A3, NOTES.F3, NOTES.D4, NOTES.F3, NOTES.D4, NOTES.A3, NOTES.D4],
  // Bar 2: Bb
  [NOTES.Bb3, NOTES.D4, NOTES.F3, NOTES.D4, NOTES.Bb3, NOTES.D4, NOTES.F3, NOTES.D4,
   NOTES.Bb3, NOTES.D4, NOTES.F3, NOTES.D4, NOTES.Bb3, NOTES.D4, NOTES.F3, NOTES.D4],
  // Bar 3: Gm
  [NOTES.G3, NOTES.D4, NOTES.Bb3, NOTES.D4, NOTES.G3, NOTES.D4, NOTES.Bb3, NOTES.D4,
   NOTES.G3, NOTES.D4, NOTES.Bb3, NOTES.D4, NOTES.G3, NOTES.D4, NOTES.Bb3, NOTES.D4],
  // Bar 4: A (tension resolution)
  [NOTES.A3, NOTES.E4, NOTES.C4, NOTES.E4, NOTES.A3, NOTES.E4, NOTES.C4, NOTES.E4,
   NOTES.A3, NOTES.E4, NOTES.C4, NOTES.E4, NOTES.A3, NOTES.E4, NOTES.C4, NOTES.A4]
];

const BASS_ROOTS = [NOTES.D1, NOTES.Bb1, NOTES.G1, NOTES.A1];

function initMusicBus() {
  const AC = getAudioContext();
  const master = getMasterGain();
  if (!AC || !master || musicGain) return;

  musicGain = AC.createGain();
  filterBus = AC.createBiquadFilter();
  filterBus.type = 'lowpass';
  filterBus.frequency.value = 2400;
  filterBus.Q.value = 1.2;

  filterBus.connect(musicGain);
  musicGain.connect(master);
  updateVolume();
}

function initSpacePad() {
  const AC = getAudioContext();
  if (!AC || padOsc1) return;

  padFilter = AC.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 400;

  padGain = AC.createGain();
  padGain.gain.value = 0.05;

  padOsc1 = AC.createOscillator();
  padOsc1.type = 'sawtooth';
  padOsc1.frequency.value = NOTES.D2;

  padOsc2 = AC.createOscillator();
  padOsc2.type = 'sine';
  padOsc2.frequency.value = NOTES.A2;
  padOsc2.detune.value = 8; // slight chorus beating

  padOsc1.connect(padFilter);
  padOsc2.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(filterBus);

  padOsc1.start();
  padOsc2.start();
}

function playSubBass(freq, time, dur) {
  const AC = getAudioContext();
  if (!AC || !filterBus) return;

  const osc = AC.createOscillator();
  const g = AC.createGain();
  const f = AC.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  f.type = 'lowpass';
  f.frequency.setValueAtTime(140, time);

  const vol = 0.38;
  g.gain.setValueAtTime(0.001, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(f);
  f.connect(g);
  g.connect(filterBus);

  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function playArpNote(freq, time, dur, cutoff) {
  const AC = getAudioContext();
  if (!AC || !filterBus) return;

  const osc = AC.createOscillator();
  const f = AC.createBiquadFilter();
  const g = AC.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  f.type = 'lowpass';
  f.Q.value = 3.5; // analog resonant bite
  f.frequency.setValueAtTime(cutoff * 1.5, time);
  f.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.3), time + dur);

  const vol = 0.16;
  g.gain.setValueAtTime(0.001, time);
  g.gain.linearRampToValueAtTime(vol, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  osc.connect(f);
  f.connect(g);
  g.connect(filterBus);

  osc.start(time);
  osc.stop(time + dur + 0.04);
}

function scheduleStep(stepIndex, time) {
  const barIndex = Math.floor(stepIndex / 16) % 4;
  const noteInBar = stepIndex % 16;
  const isQuarter = noteInBar % 4 === 0;

  // Sub-bass heartbeat on quarter beats
  if (isQuarter) {
    const root = BASS_ROOTS[barIndex];
    playSubBass(root, time, 0.45);
  }

  // Suspense arpeggio notes (only in active flight, suppressed in menu)
  if (G.state === 'play' || G.state === 'launch') {
    const pattern = ARP_PATTERNS[barIndex];
    const noteFreq = pattern[noteInBar];
    const dur = (60 / currentTempo) * 0.24;
    playArpNote(noteFreq, time, dur, tensionFilterCutoff);
  }
}

function updateAdaptiveDynamics(dt) {
  const AC = getAudioContext();
  if (!AC) return;

  // Detect critical flight status
  const isCritical = G.state === 'play' && ship.alive && ship.hp === 1;
  const isHazardClose = G.state === 'play' && obs.some(
    o => (o.type === 'comet' || o.type === 'well' || o.type === 'laser') && Math.abs(o.y - ship.y) < 320
  );

  if (G.state === 'menu') {
    baseTempo = 94;
    tensionFilterCutoff = 500;
    if (filterBus) filterBus.frequency.setTargetAtTime(700, AC.currentTime, 0.5);
    if (padGain) padGain.gain.setTargetAtTime(0.07, AC.currentTime, 0.5);
  } else if (G.state === 'launch') {
    baseTempo = 114;
    tensionFilterCutoff = 900;
    if (filterBus) filterBus.frequency.setTargetAtTime(1600, AC.currentTime, 0.4);
    if (padGain) padGain.gain.setTargetAtTime(0.05, AC.currentTime, 0.4);
  } else if (G.state === 'play') {
    if (isCritical || isHazardClose) {
      // High-octane adrenaline spike
      baseTempo = 142;
      tensionFilterCutoff = 2600;
      if (filterBus) filterBus.frequency.setTargetAtTime(3200, AC.currentTime, 0.2);
    } else {
      // Normal tense cosmic cruising
      baseTempo = 122;
      tensionFilterCutoff = 1300;
      if (filterBus) filterBus.frequency.setTargetAtTime(2200, AC.currentTime, 0.4);
    }
    if (padGain) padGain.gain.setTargetAtTime(0.04, AC.currentTime, 0.4);
  } else if (G.state === 'over') {
    // Deep space vacuum suffocation
    baseTempo = 70;
    tensionFilterCutoff = 120;
    if (filterBus) filterBus.frequency.setTargetAtTime(80, AC.currentTime, 0.6);
    if (padGain) padGain.gain.setTargetAtTime(0.02, AC.currentTime, 0.6);
  }

  currentTempo += (baseTempo - currentTempo) * Math.min(1, dt * 2.5);
}

// External Audio Track Loader
function initAudioElement() {
  if (audioEl) return;
  audioEl = new Audio();
  audioEl.src = 'assets/audio/bgm_space.wav';
  audioEl.loop = true;
  audioEl.preload = 'auto';
  audioEl.volume = cfg.mute ? 0 : cfg.musicVol * 0.45;
}

export function updateVolume() {
  if (musicGain) {
    const isMuted = cfg.mute || cfg.musicMode === 'off';
    musicGain.gain.value = isMuted ? 0 : cfg.musicVol * 0.4;
  }
  if (audioEl) {
    const isMuted = cfg.mute || cfg.musicMode !== 'custom';
    audioEl.volume = isMuted ? 0 : Math.min(1, cfg.musicVol * 0.5);
  }
}

export function setMusicMode(mode) {
  cfg.musicMode = mode;
  currentMode = mode;

  if (mode === 'custom') {
    initAudioElement();
    if (audioEl && isStarted && !cfg.mute) {
      audioEl.play().catch(() => {});
    }
  } else {
    if (audioEl) audioEl.pause();
  }

  updateVolume();
}

export function startMusic() {
  initMusicBus();
  initSpacePad();
  isStarted = true;

  const AC = getAudioContext();
  if (AC && nextNoteTime < AC.currentTime) {
    nextNoteTime = AC.currentTime + 0.05;
  }

  if (cfg.musicMode === 'custom') {
    initAudioElement();
    if (audioEl && !cfg.mute) {
      audioEl.play().catch(() => {});
    }
  }

  updateVolume();
}

export function stopMusic() {
  isStarted = false;
  if (audioEl) audioEl.pause();
  if (musicGain) musicGain.gain.value = 0;
}

export function updateMusic(dt) {
  if (!isStarted || cfg.mute || cfg.musicMode === 'off') return;

  if (cfg.musicMode === 'synth') {
    const AC = getAudioContext();
    if (!AC) return;

    updateAdaptiveDynamics(dt);

    // Lookahead Web Audio scheduler (schedules notes up to 100ms in advance)
    const secondsPer16th = 60 / currentTempo / 4;
    while (nextNoteTime < AC.currentTime + 0.1) {
      scheduleStep(currentStep, nextNoteTime);
      nextNoteTime += secondsPer16th;
      currentStep = (currentStep + 1) % 64;
    }
  }
}

export const musicEngine = {
  startMusic,
  stopMusic,
  updateMusic,
  setMusicMode,
  updateVolume,
  isPlaying: () => isStarted && !cfg.mute && cfg.musicMode !== 'off'
};
