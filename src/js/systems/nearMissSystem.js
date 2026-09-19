/**
 * Space Drift - Slipstream / Near-Miss Scoring System
 */
import { G, ship } from '../core/state.js';
import { popup } from '../entities/particleSystem.js';
import { sfx } from '../audio/soundEffects.js';
import { eventBus } from '../core/eventBus.js';

export function rewardNearMiss(x, y) {
  G.combo = G.comboT > 0 ? G.combo + 1 : 1;
  G.comboT = 4;
  const pts = 40 * G.combo;
  G.score += pts;
  G.nearMisses++;
  ship.energy = Math.min(100, ship.energy + 6);

  popup(x, y, 'NEAR MISS +' + pts, '#5eeaff');
  sfx('near');

  if (G.combo >= 2) {
    eventBus.emit('showCombo', G.combo);
  }
}

export function checkNearMiss(o) {
  if (o.nm || o.hit || o.near === undefined || !ship.alive) return;
  if (o.y > ship.y + 70) {
    o.nm = true;
    const th = o.type === 'mine' ? (o.fuse >= 0 ? 1e9 : o.r + 52) : (o.r || 12) + 52;
    if (o.near < th) {
      rewardNearMiss(o.x, o.y);
    }
  }
}
