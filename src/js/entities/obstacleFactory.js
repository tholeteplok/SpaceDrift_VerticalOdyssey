/**
 * Space Drift - Obstacle & Celestial Bodies Factory
 */
import { TAU, rand, clamp } from '../config/constants.js';
import { AST_COLS, PLANET_TYPES, pickAsteroidSprite } from '../config/obstacles.js';
import { G } from '../core/state.js';

export function mkAst(x, y, r, m = 1, level = 1) {
  const n = 8 + ((Math.random() * 5) | 0);
  const verts = [];
  const c = AST_COLS[(Math.random() * AST_COLS.length) | 0];
  const spriteKey = pickAsteroidSprite(level);

  for (let i = 0; i < n; i++) {
    verts.push({
      a: (i / n) * TAU,
      r: r * (0.72 + Math.random() * 0.5)
    });
  }

  return {
    type: 'ast',
    spriteKey,
    x,
    y,
    vx: rand(-22, 22) * m,
    vy: rand(-10, 18) * m,
    r,
    verts,
    c1: c[0],
    c2: c[1],
    hp: Math.max(1, Math.round(r / 16)),
    rot: Math.random() * TAU,
    rv: rand(-1.3, 1.3) * Math.sqrt(m),
    near: 1e9,
    nm: false,
    hit: false,
    trail: null,
    tt: 0
  };
}

export function mkBeam(x, y, m = 1) {
  const len = rand(90, 180);
  return {
    type: 'beam',
    x,
    y,
    len,
    thick: 9,
    hp: 2,
    ang: Math.random() * TAU,
    rv: rand(-1.1, 1.1) * Math.sqrt(m),
    vx: rand(-16, 16) * m,
    vy: rand(-4, 10) * m,
    r: len / 2,
    near: 1e9,
    nm: false,
    hit: false
  };
}

export function mkMine(x, y) {
  return {
    type: 'mine',
    x,
    y,
    r: 11,
    fuse: -1,
    ph: Math.random() * TAU,
    near: 1e9,
    nm: false,
    hit: false
  };
}

export function mkLaser(y, m = 1, W = 400) {
  return {
    type: 'laser',
    y,
    t: Math.random() * 4.2,
    spd: m,
    gapW: Math.max(150, 215 - G.alt * 0.008),
    gapX: rand(130, W - 130),
    gapDir: Math.random() < 0.5 ? 1 : -1,
    state: 0,
    cd: 0,
    nm: false,
    hit: false
  };
}

export function mkWell(y, W = 400) {
  const R = 380;
  return {
    type: 'well',
    x: rand(100, W - 100),
    y,
    r: 30,
    R,
    gr: R,
    GM: 5500000,
    spin: Math.random() * TAU,
    nm: true,
    hit: true
  };
}

export function mkPlanet(y, W = 400) {
  let tot = 0;
  for (const t of PLANET_TYPES) tot += t.w;
  let rr = Math.random() * tot;
  let tt = PLANET_TYPES[0];
  for (const t of PLANET_TYPES) {
    if ((rr -= t.w) <= 0) {
      tt = t;
      break;
    }
  }

  const r = rand(tt.rMin, tt.rMax);
  let px = 60 + Math.random() * (W - 120);
  if (W > 2 * r + 80) px = clamp(px, r + 30, W - r - 30);
  else px = W / 2;

  const craters = [];
  const nc = 4 + ((Math.random() * 3) | 0);
  for (let i = 0; i < nc; i++) {
    craters.push({
      a: Math.random() * TAU,
      d: rand(0.15, 0.7),
      s: rand(0.08, 0.2)
    });
  }

  return {
    type: 'planet',
    sub: tt.id,
    x: px,
    y,
    r,
    gr: r * tt.grM,
    GM: tt.gm * r * r,
    rad: tt.rad,
    radR: r * tt.radM,
    c1: tt.c1,
    c2: tt.c2,
    glow: tt.glow,
    craters,
    spin: Math.random() * TAU,
    spinV: rand(-0.25, 0.25),
    ring: tt.id === 'gas' && Math.random() < 0.7,
    bandSeed: Math.random() * 10,
    nm: true,
    hit: true,
    near: undefined
  };
}
