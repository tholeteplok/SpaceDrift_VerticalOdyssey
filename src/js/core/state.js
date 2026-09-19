/**
 * Space Drift - Central State Management
 */
import { store } from './storage.js';
import { clamp } from '../config/constants.js';
import { SHIPS } from '../config/ships.js';

export const cfg = {
  mute: store.get('sd_mute', '0') === '1',
  vib: store.get('sd_vib', '1') === '1',
  radar: store.get('sd_radar', '1') === '1',
  sensi: store.get('sd_sensi', '1'),
  musicMode: store.get('sd_music_mode', 'synth'), // 'synth' | 'custom' | 'off'
  musicVol: Math.min(1, Math.max(0, +store.get('sd_music_vol', 0.6) || 0.6))
};

export const stats = {
  missions: +store.get('sd_missions', 0) || 0,
  smashT: +store.get('sd_smash_t', 0) || 0,
  nearT: +store.get('sd_near_t', 0) || 0,
  bestScore: +store.get('sd_best_score', 0) || 0
};

export const G = {
  state: 'menu',
  t: 0,
  alt: 0,
  best: +store.get('sd_best', 0) || 0,
  score: 0,
  smashes: 0,
  nearMisses: 0,
  combo: 0,
  comboT: 0,
  zone: -1,
  level: 1,
  won: false,
  camY: 0,
  shake: 0,
  flash: 0,
  hurt: 0,
  slowmo: 1,
  deathT: 0,
  overReason: '',
  flightDuration: 0,
  maxSpeed: 0,
  bestPassed: false,
  boostUsed: false,
  radIn: false,
  geigerT: 0,
  bgCur: 0,
  bgPrev: 0,
  bgBlend: 1,
  boltT: 2,
  bolt: null,
  launchT: 0,
  launchV: 0,
  launchP: 0,
  clouds: [],
  pilot: (store.get('sd_pilot', 'PILOT-01') || 'PILOT-01').toUpperCase(),
  shipSel: clamp(+store.get('sd_ship', 0) || 0, 0, SHIPS.length - 1)
};

export const ship = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 13,
  hp: 3,
  maxHp: 3,
  inv: 0,
  energy: 100,
  boostT: 0,
  flame: 0,
  rad: 0,
  alive: true,
  lat: 340,
  climb: 1,
  thrustM: 1,
  boostCost: 35,
  radRes: 1,
  gravRes: 1,
  laserT: 0,
  laserCd: 0,
  laserType: 0,
  shieldPulse: 0
};

// Global entity collections
export const obs = [];
export const parts = [];
export const pops = [];
export const shock = [];
export const ripples = [];
export const slines = [];
export const gravBodies = [];
export const bullets = [];
export const starLayers = [[], [], []];
export const bgParts = [];

export let spawnY = -420;
export function setSpawnY(val) {
  spawnY = val;
}

export const sensiMult = () => (cfg.sensi === '2' ? 1.5 : 1);

export function saveBest() {
  const nb = G.alt > G.best;
  if (nb) {
    G.best = Math.floor(G.alt);
    store.set('sd_best', G.best);
  }
  return nb;
}

export function recordRun(finalScore) {
  stats.missions++;
  stats.smashT += G.smashes;
  stats.nearT += G.nearMisses;
  if (finalScore > stats.bestScore) stats.bestScore = finalScore;
  store.set('sd_missions', stats.missions);
  store.set('sd_smash_t', stats.smashT);
  store.set('sd_near_t', stats.nearT);
  store.set('sd_best_score', stats.bestScore);
}
