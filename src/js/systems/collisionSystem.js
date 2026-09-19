/**
 * Space Drift - Collision Detection & Hazard System
 */
import { clamp, levelMult, levelOf } from '../config/constants.js';
import { G, ship, obs } from '../core/state.js';
import { explosion, burst, shake, popup } from '../entities/particleSystem.js';
import { damageShip, smashAst, radiationHit } from '../entities/ship.js';
import { sfx } from '../audio/soundEffects.js';
import { vib } from '../audio/synth.js';
import { rewardNearMiss } from './nearMissSystem.js';

export function collideAst(o) {
  if (!ship.alive) return;
  const dx = ship.x - o.x;
  const dy = ship.y - o.y;
  const d2 = dx * dx + dy * dy;
  const rr = o.r * 0.92 + ship.r;
  if (d2 > rr * rr) return;

  const d = Math.sqrt(d2) || 1;
  const nx = dx / d;
  const ny = dy / d;
  o.near = Math.min(o.near, d);

  if (o.spriteKey === 'ast_5') {
    G.radIn = true;
    ship.rad += 0.35 * ship.radRes;
    if (ship.rad >= 1) {
      ship.rad -= 1;
      radiationHit();
    }
  }

  if (ship.boostT > 0 && o.r < 40) {
    smashAst(o);
    return;
  }

  const m = Math.max(1, (o.r * o.r) / 160);
  const rel = (ship.vx - o.vx) * nx + (ship.vy - o.vy) * ny;
  if (rel < 0) {
    const j = (-1.55 * rel) / (1 + 1 / m);
    ship.vx += j * nx;
    ship.vy += j * ny;
    o.vx -= (j * nx) / m * 0.6;
    o.vy -= (j * ny) / m * 0.6;
  }

  const pen = rr - d;
  ship.x += nx * pen * 0.85;
  ship.y += ny * pen * 0.85;
  o.x -= nx * pen * 0.15;
  o.y -= ny * pen * 0.15;

  if (ship.inv <= 0) {
    damageShip('Hancur menghantam asteroid', nx, ny);
  }
}

export function beamCollide(o) {
  if (!ship.alive) return;
  const c = Math.cos(o.ang) * o.len / 2;
  const s = Math.sin(o.ang) * o.len / 2;
  const ax = o.x - c;
  const ay = o.y - s;
  const bx = o.x + c;
  const by = o.y + s;
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp(((ship.x - ax) * dx + (ship.y - ay) * dy) / (o.len * o.len), 0, 1);
  const px = ax + dx * t;
  const py = ay + dy * t;
  const ddx = ship.x - px;
  const ddy = ship.y - py;
  const d = Math.hypot(ddx, ddy) || 1;
  o.near = Math.min(o.near, d);

  const rr = o.thick / 2 + ship.r;
  if (d < rr) {
    const nx = ddx / d;
    const ny = ddy / d;
    const pen = rr - d;
    ship.x += nx * pen;
    ship.y += ny * pen;
    const rel = ship.vx * nx + ship.vy * ny;
    if (rel < 0) {
      ship.vx -= 1.6 * rel * nx;
      ship.vy -= 1.6 * rel * ny;
    }
    if (ship.inv <= 0) {
      damageShip('Terpotong puing orbital', nx, ny);
    }
  }
}

export function explodeMine(o) {
  o.dead = true;
  o.hit = true;
  explosion(o.x, o.y, '#ff5470', 130);
  shake(11);
  sfx('explode');
  vib(60);

  if (ship.alive) {
    const d = Math.hypot(ship.x - o.x, ship.y - o.y) || 1;
    if (d < 130) {
      const nx = (ship.x - o.x) / d;
      const ny = (ship.y - o.y) / d;
      const k = 380 * (1.3 - d / 130);
      ship.vx += nx * k;
      ship.vy += ny * k;
      if (ship.inv <= 0) {
        damageShip('Ledakan ranjau', nx, ny);
      }
    }
  }

  // Chain reactions with nearby mines and asteroids
  for (const m of obs) {
    if (m === o || m.dead) continue;
    const dd = Math.hypot(m.x - o.x, m.y - o.y);
    if (m.type === 'mine' && dd < 150 && m.fuse < 0) {
      m.fuse = 0.12 + Math.random() * 0.18;
      sfx('arm');
    }
    if (m.type === 'ast' && m.r < 26 && dd < 140) {
      burst(m.x, m.y, 8, '#ffb454', 120, 0.5);
      m.dead = true;
      G.score += Math.ceil(m.r);
      G.smashes++;
    }
  }
}

export function laserUpd(o, dt, W) {
  o.t += dt * o.spd;
  const ph = o.t % 4.2;
  o.state = ph < 1.1 ? 0 : ph < 2.2 ? 1 : 2;
  o.gapX += o.gapDir * 46 * o.spd * dt;

  if (o.gapX < o.gapW / 2 + 60) {
    o.gapX = o.gapW / 2 + 60;
    o.gapDir = 1;
  }
  if (o.gapX > W - o.gapW / 2 - 60) {
    o.gapX = W - o.gapW / 2 - 60;
    o.gapDir = -1;
  }

  o.cd -= dt;
  if (!ship.alive) return;

  if (
    o.state === 2 &&
    Math.abs(ship.y - o.y) < ship.r + 5 &&
    (ship.x < o.gapX - o.gapW / 2 || ship.x > o.gapX + o.gapW / 2) &&
    o.cd <= 0
  ) {
    damageShip('Terpanggang gerbang laser', 0, 1);
    o.cd = 1;
  }

  if (!o.nm && ship.y < o.y - 50) {
    o.nm = true;
    if (!o.hit) rewardNearMiss(ship.x, o.y);
  }
}

export function mineUpd(o, dt) {
  const mult = levelMult(levelOf(G.alt));
  o.x += Math.sin(G.t * 1.2 + o.ph) * 8 * mult * dt;
  if (!ship.alive) return;
  const d = Math.hypot(ship.x - o.x, ship.y - o.y);
  o.near = Math.min(o.near, d);
  if (o.fuse < 0 && d < 120) {
    o.fuse = 0.8;
    sfx('arm');
  }
  if (d < o.r + ship.r) o.fuse = 0;
  if (o.fuse >= 0) {
    o.fuse -= dt;
    if (o.fuse <= 0) explodeMine(o);
  }
}

export function cometCollide(o) {
  if (!ship.alive) return;
  const d = Math.hypot(ship.x - o.x, ship.y - o.y);
  o.near = Math.min(o.near, d);
  if (d < o.r + ship.r) {
    if (ship.boostT > 0) {
      G.score += 120;
      G.smashes++;
      popup(o.x, o.y, '+120', '#ffb454');
      burst(o.x, o.y, 20, '#bff0ff', 260, 0.7, 3);
      o.dead = true;
      sfx('smash');
    } else {
      damageShip('Tabrakan komet', (ship.x - o.x) / (d || 1), (ship.y - o.y) / (d || 1));
      burst(o.x, o.y, 14, '#bff0ff', 200, 0.6);
      o.dead = true;
    }
  }
}
