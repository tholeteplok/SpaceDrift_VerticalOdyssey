/**
 * Space Drift - Web Audio API Synthesizer & Haptics
 */
import { cfg, G, ship } from '../core/state.js';

let AC = null;
let master = null;
let thrGain = null;
let thrSrc = null;

export function initAudio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain();
      master.gain.value = cfg.mute ? 0 : 0.5;
      master.connect(AC.destination);
    }
    if (AC.state === 'suspended') {
      AC.resume();
    }
  } catch (e) {
    console.warn('AudioContext init failed:', e);
  }
  return AC;
}

export function getAudioContext() {
  return initAudio();
}

export function getMasterGain() {
  initAudio();
  return master;
}

export function updateMasterMute() {
  if (master) {
    master.gain.value = cfg.mute ? 0 : 0.5;
  }
}

export function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0) {
  if (!initAudio() || cfg.mute) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator();
  const g = AC.createGain();

  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);

  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function noiseBurst(dur = 0.3, vol = 0.3, fq = 800, delay = 0) {
  if (!initAudio() || cfg.mute) return;
  const t = AC.currentTime + delay;
  const n = (AC.sampleRate * dur) | 0;
  const b = AC.createBuffer(1, n, AC.sampleRate);
  const d = b.getChannelData(0);

  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  }

  const s = AC.createBufferSource();
  s.buffer = b;

  const f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = fq;

  const g = AC.createGain();
  g.gain.value = vol;

  s.connect(f);
  f.connect(g);
  g.connect(master);
  s.start(t);
}

export function thrustLoop() {
  if (!initAudio() || thrSrc) return;
  const b = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
  const d = b.getChannelData(0);

  for (let i = 0; i < d.length; i++) {
    d[i] = Math.random() * 2 - 1;
  }

  thrSrc = AC.createBufferSource();
  thrSrc.buffer = b;
  thrSrc.loop = true;

  const f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 420;

  thrGain = AC.createGain();
  thrGain.gain.value = 0;

  thrSrc.connect(f);
  f.connect(thrGain);
  thrGain.connect(master);
  thrSrc.start();
}

export function thrustLoopUpdate() {
  if (!thrGain) return;
  const tgt =
    (G.state === 'play' || G.state === 'launch') && ship.alive
      ? ship.flame * (ship.boostT > 0 ? 0.2 : 0.11)
      : 0;
  thrGain.gain.value += ((cfg.mute ? 0 : tgt) - thrGain.gain.value) * 0.2;
}

export function vib(p) {
  if (!cfg.vib) return;
  try {
    if (navigator.vibrate) navigator.vibrate(p);
  } catch (e) {}
}
