/**
 * Space Drift - Gravity & Singularity Fields System
 */
import { TAU, rand } from '../config/constants.js';
import { G, ship, obs } from '../core/state.js';
import { addP, burst, shake } from '../entities/particleSystem.js';
import { damageShip, radiationHit } from '../entities/ship.js';

export function wellUpd(o, dt) {
  o.spin += dt * 1.6;
  if (Math.random() < 0.85) {
    const an = Math.random() * TAU;
    const rr2 = o.R * (0.7 + Math.random() * 0.3);
    const tv = rand(-70, 70);
    addP({
      x: o.x + Math.cos(an) * rr2,
      y: o.y + Math.sin(an) * rr2,
      vx: -Math.sin(an) * tv,
      vy: Math.cos(an) * tv,
      t: 0,
      life: 1.8,
      col: 'rgba(200,160,255,.6)',
      sz: 1.6
    });
  }

  // Affect other obstacles
  for (const b of obs) {
    if (b === o || b.dead) continue;
    if (b.type === 'laser' || b.type === 'warn' || b.type === 'planet' || b.type === 'well') continue;
    const dx = o.x - b.x;
    const dy = o.y - b.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > o.R * o.R) continue;
    const d = Math.sqrt(d2) || 1;
    const er = b.type === 'beam' ? 10 : b.r || 10;
    if (d < o.r + er) {
      burst(b.x, b.y, 12, '#a06bff', 170, 0.6);
      b.dead = true;
      continue;
    }
    let a = o.GM / d2;
    if (a > 1700) a = 1700;
    b.vx += (dx / d * a - dy / d * a * 0.25) * dt;
    b.vy += (dy / d * a + dx / d * a * 0.25) * dt;
  }

  // Affect player ship
  if (ship.alive && G.state === 'play') {
    const dx = o.x - ship.x;
    const dy = o.y - ship.y;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2) || 1;
    if (d2 < o.R * o.R) {
      let a = (o.GM / d2) * 1.2 * ship.gravRes;
      if (a > 2000) a = 2000;
      ship.vx += (dx / d * a - dy / d * a * 0.25) * dt;
      ship.vy += (dy / d * a + dx / d * a * 0.25) * dt;
      if (a > 700) shake(1.2);
    }
    if (d < o.r + ship.r + 4 && ship.inv <= 0) {
      damageShip('Tersedot singularitas', -dx / d, -dy / d);
      ship.vx += (-dx / d) * 380;
      ship.vy += (-dy / d) * 380;
    }
  }
}

export function planetUpd(o, dt) {
  o.spin += o.spinV * dt;
  if (Math.random() < 0.7) {
    const an = Math.random() * TAU;
    const rr2 = o.gr * (0.8 + Math.random() * 0.2);
    const tv = rand(-50, 50);
    addP({
      x: o.x + Math.cos(an) * rr2,
      y: o.y + Math.sin(an) * rr2,
      vx: -Math.sin(an) * tv,
      vy: Math.cos(an) * tv,
      t: 0,
      life: 1.6,
      col: 'rgba(160,200,255,.5)',
      sz: 1.4
    });
  }

  for (const b of obs) {
    if (b === o || b.dead) continue;
    if (b.type === 'laser' || b.type === 'warn' || b.type === 'planet') continue;
    const dx = o.x - b.x;
    const dy = o.y - b.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > o.gr * o.gr) continue;
    const d = Math.sqrt(d2) || 1;
    const er = b.type === 'beam' ? 10 : b.r || 10;
    if (d < o.r + er) {
      if (b.type === 'pick') burst(b.x, b.y, 6, '#8dff5a', 80, 0.4);
      else if (b.type === 'comet') burst(b.x, b.y, 14, '#bff0ff', 200, 0.6);
      else burst(b.x, b.y, 10, o.c2, 120, 0.5);
      b.dead = true;
      continue;
    }
    let a = o.GM / d2;
    if (a > 1700) a = 1700;
    if (b.type === 'comet') a *= 0.8;
    b.vx += (dx / d) * a * dt;
    b.vy += (dy / d) * a * dt;
  }

  if (ship.alive && G.state === 'play') {
    const dx = o.x - ship.x;
    const dy = o.y - ship.y;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2) || 1;
    if (d2 < o.gr * o.gr) {
      let a = (o.GM / d2) * 1.3 * ship.gravRes;
      if (a > 2000) a = 2000;
      ship.vx += (dx / d) * a * dt;
      ship.vy += (dy / d) * a * dt;
    }
    if (d < o.r + ship.r) {
      const nx = (ship.x - o.x) / d;
      const ny = (ship.y - o.y) / d;
      const vn = ship.vx * nx + ship.vy * ny;
      if (vn < 0) {
        ship.vx -= 1.7 * vn * nx;
        ship.vy -= 1.7 * vn * ny;
      }
      ship.x = o.x + nx * (o.r + ship.r + 1);
      ship.y = o.y + ny * (o.r + ship.r + 1);
      if (ship.inv <= 0) damageShip('Menghantam permukaan planet', nx, ny);
    }
    if (o.rad > 0 && d < o.radR) {
      G.radIn = true;
      ship.rad += o.rad * dt * ship.radRes;
      if (ship.rad >= 1) {
        ship.rad -= 1;
        radiationHit();
      }
    }
  }
}
