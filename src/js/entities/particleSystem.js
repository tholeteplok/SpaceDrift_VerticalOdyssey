/**
 * Space Drift - Particle Engine, FX & Environment Ambience
 */
import { TAU, rand, clamp } from '../config/constants.js';
import { G, parts, shock, pops, starLayers, bgParts, gravBodies } from '../core/state.js';
import { THEMES } from '../config/themes.js';

export function addP(p) {
  if (parts.length < 420) parts.push(p);
}

export function burst(x, y, n, col, spd, life, sz = 2.4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const s = spd * (0.3 + Math.random() * 0.9);
    addP({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      t: 0,
      life: life * (0.6 + Math.random() * 0.7),
      col,
      sz: sz * (0.6 + Math.random() * 0.9)
    });
  }
}

export function explosion(x, y, col, R) {
  shock.push({ x, y, R, col, t: 1 });
  burst(x, y, 26, col, R * 2.2, 0.9, 3);
  burst(x, y, 10, '#ffffff', R * 1.4, 0.4, 2);
}

export function popup(x, y, txt, col) {
  pops.push({ x, y, txt, col, t: 1 });
}

export function shake(v) {
  G.shake = Math.max(G.shake, v);
}

export function buildStars(W, H) {
  const sz = [1.1, 1.5, 2.1];
  const cnt = [110, 70, 40];
  for (let l = 0; l < 3; l++) {
    starLayers[l] = [];
    const n = clamp(Math.round(cnt[l] * (W * H) / (390 * 844)), 20, 200);
    for (let i = 0; i < n; i++) {
      starLayers[l].push({
        x: Math.random() * W,
        y: Math.random() * H,
        sz: sz[l] * (0.6 + Math.random() * 0.8),
        sp: 0.5 + Math.random() * 2.5,
        ph: Math.random() * TAU,
        ci: (Math.random() * 4) | 0
      });
    }
  }
  seedAmbient(THEMES[G.bgCur], W, H);
}

export function seedAmbient(th, W, H) {
  bgParts.length = 0;
  const amb = th.amb;
  const n = amb.n || 0;
  for (let i = 0; i < n; i++) {
    const sp = (amb.spd || 10) * (0.5 + Math.random());
    let vx = 0, vy = 0;
    if (amb.type === 'ember') {
      vy = -sp;
      vx = rand(-6, 6);
    } else if (amb.type === 'snow') {
      vy = sp;
      vx = rand(-9, 9);
    } else if (amb.type === 'dust') {
      vy = rand(-4, 4);
      vx = rand(-7, 7);
    } else {
      vy = rand(-2, 2);
      vx = rand(-2, 2);
    }
    bgParts.push({
      x: rand(0, W),
      y: rand(0, H),
      r: (amb.size || 1.5) * (0.6 + Math.random() * 0.8),
      ph: rand(0, TAU),
      vx,
      vy
    });
  }
}

export function updateAmbient(dt, W, H) {
  for (const p of bgParts) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < -12) p.y = H + 12;
    if (p.y > H + 12) p.y = -12;
    if (p.x < -12) p.x = W + 12;
    if (p.x > W + 12) p.x = -12;
  }
}

export function buildClouds(W) {
  G.clouds = [];
  for (let i = 0; i < 7; i++) {
    G.clouds.push({
      x: rand(30, W - 30),
      wy: -180 - rand(0, 1300),
      par: rand(0.45, 0.85),
      s: rand(0.7, 1.5)
    });
  }
}

export function updateFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t > p.life) {
      parts.splice(i, 1);
      continue;
    }
    for (const pl of gravBodies) {
      const dx = pl.x - p.x;
      const dy = pl.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < pl.gr * pl.gr && d2 > 25) {
        const d = Math.sqrt(d2);
        let a = pl.GM / d2;
        if (a > 1800) a = 1800;
        p.vx += (dx / d) * a * dt;
        p.vy += (dy / d) * a * dt;
      }
    }
    const dr = Math.pow(0.35, dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= dr;
    p.vy *= dr;
  }

  for (let i = shock.length - 1; i >= 0; i--) {
    shock[i].t -= dt * 1.7;
    if (shock[i].t <= 0) shock.splice(i, 1);
  }

  for (let i = pops.length - 1; i >= 0; i--) {
    pops[i].t -= dt * 0.85;
    if (pops[i].t <= 0) pops.splice(i, 1);
  }
}
