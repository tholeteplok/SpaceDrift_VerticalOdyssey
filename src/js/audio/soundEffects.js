/**
 * Space Drift - Sound Effects Registry
 */
import { tone, noiseBurst } from './synth.js';

export const sfxTable = {
  boost() {
    tone(180, 720, 0.5, 'sawtooth', 0.22);
    noiseBurst(0.4, 0.18, 1600);
  },
  hit() {
    tone(220, 60, 0.25, 'square', 0.28);
    noiseBurst(0.2, 0.22, 500);
  },
  explode() {
    noiseBurst(0.7, 0.45, 320);
    tone(120, 40, 0.6, 'triangle', 0.3);
  },
  smash() {
    noiseBurst(0.22, 0.28, 900);
    tone(300, 120, 0.18, 'square', 0.18);
  },
  pick() {
    tone(660, 660, 0.09, 'sine', 0.18);
    tone(990, 990, 0.12, 'sine', 0.18, 0.09);
  },
  near() {
    tone(520, 780, 0.12, 'sine', 0.13);
  },
  deny() {
    tone(140, 90, 0.15, 'square', 0.18);
  },
  arm() {
    tone(880, 880, 0.06, 'square', 0.1);
    tone(880, 880, 0.06, 'square', 0.1, 0.13);
  },
  zone() {
    tone(392, 392, 0.12, 'sine', 0.16);
    tone(523, 523, 0.12, 'sine', 0.16, 0.12);
    tone(784, 784, 0.22, 'sine', 0.16, 0.24);
  },
  geiger() {
    tone(2600, 2400, 0.018, 'square', 0.045);
  },
  laserFire() {
    tone(920, 280, 0.07, 'square', 0.06);
  },
  laserHit() {
    tone(480, 180, 0.06, 'square', 0.09);
    noiseBurst(0.06, 0.08, 2000);
  },
  count() {
    tone(660, 660, 0.1, 'square', 0.15);
  },
  liftoff() {
    tone(90, 420, 1.2, 'sawtooth', 0.25);
    noiseBurst(1.4, 0.3, 600);
  },
  ui() {
    tone(440, 540, 0.08, 'sine', 0.14);
  }
};

export function sfx(name) {
  try {
    if (sfxTable[name]) sfxTable[name]();
  } catch (e) {
    console.warn(`SFX trigger error (${name}):`, e);
  }
}
