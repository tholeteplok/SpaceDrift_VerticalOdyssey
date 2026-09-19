/**
 * Space Drift - Player Ship Mechanics & Health Management
 */
import { G, ship } from '../core/state.js';
import { burst, explosion, popup, shake } from './particleSystem.js';
import { sfx } from '../audio/soundEffects.js';
import { vib } from '../audio/synth.js';
import { eventBus } from '../core/eventBus.js';

export function doBoost() {
  if (G.state !== 'play' || !ship.alive || ship.boostT > 0) return;
  if (ship.energy < ship.boostCost) {
    sfx('deny');
    return;
  }
  ship.energy -= ship.boostCost;
  ship.boostT = 0.9;
  ship.inv = Math.max(ship.inv, 0.4);
  G.boostUsed = true;
  ship.vy -= 420;

  G.flash = 0.55;
  G.shake = Math.max(G.shake, 7);
  sfx('boost');
  vib(30);
  burst(ship.x, ship.y, 18, '#ffd28a', 240, 0.6, 3);
}

export function damageShip(reason, nx = 0, ny = -1) {
  if (!ship.alive || ship.inv > 0) return;
  ship.hp--;
  ship.inv = 1.7;
  G.hurt = 1;
  shake(14);
  vib(90);
  sfx('hit');
  ship.shieldPulse = 1;
  ship.vx += nx * 240;
  ship.vy += ny * 240;

  burst(ship.x, ship.y, 16, '#ff5470', 200, 0.6, 3);
  eventBus.emit('updateHearts');

  if (ship.hp <= 0) {
    die(reason);
  }
}

export function radiationHit() {
  if (!ship.alive) return;
  ship.hp--;
  G.hurt = 1;
  shake(10);
  vib(60);
  sfx('hit');
  ship.shieldPulse = 1;

  burst(ship.x, ship.y, 12, '#8dff5a', 150, 0.5, 2.5);
  popup(ship.x, ship.y, 'RADIASI!', '#8dff5a');
  eventBus.emit('updateHearts');

  if (ship.hp <= 0) {
    die('Keracunan radiasi');
  }
}

export function die(reason) {
  ship.alive = false;
  G.overReason = reason;
  G.deathT = 1.5;
  G.slowmo = 0.28;

  explosion(ship.x, ship.y, '#ffb454', 150);
  explosion(ship.x, ship.y, '#5eeaff', 90);
  G.shake = 26;
  sfx('explode');
  vib([70, 50, 140]);
}

export function smashAst(o) {
  const pts = Math.ceil(o.r * 2);
  G.score += pts;
  G.smashes++;
  burst(o.x, o.y, 14, o.c1, 160, 0.6, 2.6);
  explosion(o.x, o.y, '#ffb454', o.r * 1.4);
  popup(o.x, o.y, '+' + pts, '#ffb454');
  o.dead = true;
  shake(4);
  sfx('smash');
}
