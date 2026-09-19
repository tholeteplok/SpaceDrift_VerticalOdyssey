/**
 * Space Drift - Pickups & Drop Items
 */
import { TAU, rand } from '../config/constants.js';
import { pickLaserType, LASER_TYPES } from '../config/weapons.js';
import { G, ship } from '../core/state.js';
import { burst, popup } from './particleSystem.js';
import { sfx } from '../audio/soundEffects.js';
import { tone } from '../audio/synth.js';
import { eventBus } from '../core/eventBus.js';

export function mkPick(y, W) {
  const r = Math.random();
  const kind = r < 0.38 ? 'energy' : r < 0.68 ? 'star' : r < 0.84 ? 'shield' : 'weapon';
  const randX = 60 + Math.random() * (W - 120);
  return {
    type: 'pick',
    kind,
    wtype: pickLaserType(),
    x: randX,
    y: y - 70,
    ph: Math.random() * TAU,
    nm: true,
    hit: true
  };
}

export function pickUpd(o, dt) {
  if (!ship.alive) return;
  const dx = ship.x - o.x;
  const dy = ship.y - o.y;
  const d = Math.hypot(dx, dy) || 1;

  // Magnet effect
  if (d < 110) {
    o.x += (dx / d) * 320 * dt;
    o.y += (dy / d) * 320 * dt;
  }

  if (d < ship.r + 13) {
    o.dead = true;
    sfx('pick');
    burst(o.x, o.y, 10, '#5eeaff', 90, 0.5);

    if (o.kind === 'energy') {
      ship.energy = Math.min(100, ship.energy + 32);
      popup(o.x, o.y, '+ENERGI \u26A1', '#5eeaff');
    }
    if (o.kind === 'shield') {
      ship.hp = Math.min(ship.maxHp, ship.hp + 1);
      ship.shieldPulse = 1;
      popup(o.x, o.y, '+PERISAI', '#7dffcf');
      eventBus.emit('updateHearts');
    }
    if (o.kind === 'star') {
      G.score += 150;
      popup(o.x, o.y, '+150', '#ffb454');
    }
    if (o.kind === 'weapon') {
      ship.laserType = o.wtype | 0;
      ship.laserT = Math.min(12, ship.laserT + 8);
      ship.laserCd = 0;
      const LT = LASER_TYPES[ship.laserType];
      popup(o.x, o.y, LT.name + ' ONLINE!', LT.col);
      burst(o.x, o.y, 14, LT.col, 130, 0.55);
      tone(520, 1400, 0.25, 'sawtooth', 0.18);
    }
  }
}
