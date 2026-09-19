/**
 * Space Drift - Laser Bullet Subsystem
 */
import { BULLET_GRAV, clamp, rand } from '../config/constants.js';
import { LASER_TYPES } from '../config/weapons.js';
import { G, ship, bullets, gravBodies, obs } from '../core/state.js';
import { addP, burst, popup } from './particleSystem.js';
import { sfx } from '../audio/soundEffects.js';
import { eventBus } from '../core/eventBus.js';

export function fireLaser() {
  const LT = LASER_TYPES[ship.laserType] || LASER_TYPES[0];
  for (const s of LT.shots) {
    bullets.push({
      x: ship.x + s.ox,
      y: ship.y - 18,
      vx: Math.sin(s.ang) * LT.speed + ship.vx * 0.25,
      vy: -Math.cos(s.ang) * LT.speed,
      dead: false,
      dmg: LT.dmg,
      col: LT.col,
      col2: LT.col2,
      w: LT.w,
      life: 1.4
    });
  }
  addP({
    x: ship.x,
    y: ship.y - 20,
    vx: rand(-30, 30),
    vy: -70,
    t: 0,
    life: 0.2,
    col: LT.col2,
    sz: 2.2
  });
  sfx('laserFire');
}

export function updateBullets(dt, W, H) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    // Gravitational bending by massive bodies
    for (const pl of gravBodies) {
      const dx = pl.x - b.x;
      const dy = pl.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < pl.gr * pl.gr && d2 > 25) {
        const d = Math.sqrt(d2);
        let a = pl.GM / d2;
        if (a > 1800) a = 1800;
        b.vx += (dx / d) * a * dt * BULLET_GRAV;
        b.vy += (dy / d) * a * dt * BULLET_GRAV;
      }
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (
      b.dead ||
      b.life <= 0 ||
      b.y < G.camY - H * 0.62 - 120 ||
      b.x < -60 ||
      b.x > W + 60
    ) {
      bullets.splice(i, 1);
      continue;
    }

    for (const o of obs) {
      if (o.dead) continue;
      let hit = false;

      if (o.type === 'ast') {
        if (Math.hypot(b.x - o.x, b.y - o.y) < o.r * 0.95) {
          hit = true;
          o.hp -= b.dmg || 1;
          burst(b.x, b.y, 5, b.col || '#ff9df0', 140, 0.3, 2);
          sfx('laserHit');
          if (o.hp <= 0) eventBus.emit('smashAst', o);
        }
      } else if (o.type === 'beam') {
        const c = Math.cos(o.ang) * o.len / 2;
        const s = Math.sin(o.ang) * o.len / 2;
        const ax = o.x - c;
        const ay = o.y - s;
        const dx2 = o.len * Math.cos(o.ang);
        const dy2 = o.len * Math.sin(o.ang);
        const t = clamp(((b.x - ax) * dx2 + (b.y - ay) * dy2) / (o.len * o.len), 0, 1);
        const px = ax + dx2 * t;
        const py = ay + dy2 * t;
        if (Math.hypot(b.x - px, b.y - py) < o.thick / 2 + 4) {
          hit = true;
          o.hp -= b.dmg || 1;
          burst(b.x, b.y, 5, '#ffd28a', 140, 0.3, 2);
          sfx('laserHit');
          if (o.hp <= 0) {
            o.dead = true;
            G.score += 80;
            G.smashes++;
            popup(o.x, o.y, '+80', '#ffb454');
            burst(o.x, o.y, 12, '#ffb454', 180, 0.6);
          }
        }
      } else if (o.type === 'mine') {
        if (Math.hypot(b.x - o.x, b.y - o.y) < o.r + 6) {
          hit = true;
          eventBus.emit('explodeMine', o);
        }
      } else if (o.type === 'comet') {
        if (Math.hypot(b.x - o.x, b.y - o.y) < o.r + 5) {
          hit = true;
          o.dead = true;
          G.score += 120;
          G.smashes++;
          popup(o.x, o.y, '+120', '#bff0ff');
          burst(o.x, o.y, 16, '#bff0ff', 220, 0.6);
        }
      } else if (o.type === 'planet' || o.type === 'well') {
        if (Math.hypot(b.x - o.x, b.y - o.y) < o.r) {
          hit = true;
          burst(b.x, b.y, 4, b.col || '#ff9df0', 100, 0.25, 1.6);
        }
      }

      if (hit) {
        b.dead = true;
        break;
      }
    }
  }
}
