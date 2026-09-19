/**
 * Space Drift - Procedural Obstacle Spawner & Lifecycle
 */
import { altAt, zoneIdx, levelMult, levelOf, rand } from '../config/constants.js';
import { astR } from '../config/obstacles.js';
import { G, obs, gravBodies, spawnY, setSpawnY } from '../core/state.js';
import { mkAst, mkBeam, mkMine, mkLaser, mkWell, mkPlanet } from '../entities/obstacleFactory.js';
import { mkPick, pickUpd } from '../entities/pickup.js';
import { addP } from '../entities/particleSystem.js';
import { wrapX } from './physicsSystem.js';
import { collideAst, beamCollide, mineUpd, laserUpd, cometCollide } from './collisionSystem.js';
import { wellUpd, planetUpd } from './gravitySystem.js';
import { checkNearMiss } from './nearMissSystem.js';

export function pickKind(zi) {
  const w = [['ast', 10]];
  if (zi >= 1) w.push(['beam', 5]);
  if (zi >= 2) w.push(['mine', 6]);
  if (zi >= 2) w.push(['planet', zi >= 4 ? 4.5 : zi >= 3 ? 2 : 1.3]);
  if (zi >= 3) w.push(['laser', 3.2]);
  if (zi >= 3) w.push(['well', zi >= 4 ? 2.4 : 1.0]);
  if (zi >= 5) w.push(['comet', 4.2]);

  let tot = 0;
  for (const e of w) tot += e[1];
  let r = Math.random() * tot;
  for (const e of w) {
    if ((r -= e[1]) <= 0) return e[0];
  }
  return 'ast';
}

export function spawnLine(y, W) {
  const alt = altAt(y);
  let zi, diff;

  if (G.state === 'menu') {
    zi = Math.random() < 0.75 ? 0 : 1;
    diff = 0.8;
  } else {
    zi = zoneIdx(alt);
    diff = levelMult(levelOf(alt));
  }

  const kind = pickKind(zi);
  const curLevel = levelOf(alt);
  const randX = () => 60 + Math.random() * (W - 120);

  if (kind === 'laser') {
    if (
      obs.some(o => o.type === 'laser' && Math.abs(o.y - y) < 430) ||
      obs.some(o => o.type === 'planet' && Math.abs(o.y - y) < o.gr + 140) ||
      obs.some(o => o.type === 'well' && Math.abs(o.y - y) < o.R + 120)
    ) {
      obs.push(mkAst(randX(), y, astR(diff), diff, curLevel));
    } else {
      obs.push(mkLaser(y, diff, W));
      if (Math.random() < 0.4) obs.push(mkPick(y, W));
    }
    return;
  }

  if (kind === 'well') {
    if (
      obs.some(o => o.type === 'well' && Math.abs(o.y - y) < o.R + 320) ||
      obs.some(o => o.type === 'laser' && Math.abs(o.y - y) < 430) ||
      obs.some(o => o.type === 'planet' && Math.abs(o.y - y) < o.gr + 150)
    ) {
      obs.push(mkAst(randX(), y, astR(diff), diff, curLevel));
    } else {
      obs.push(mkWell(y, W));
    }
    return;
  }

  if (kind === 'planet') {
    const blocked = obs.some(
      o =>
        (o.type === 'planet' && Math.abs(o.y - y) < o.gr + 280) ||
        (o.type === 'laser' && Math.abs(o.y - y) < 500) ||
        (o.type === 'well' && Math.abs(o.y - y) < o.R + 200)
    );
    if (blocked) {
      obs.push(mkAst(randX(), y, astR(diff), diff, curLevel));
      return;
    }
    obs.push(mkPlanet(y, W));
    if (Math.random() < 0.5) obs.push(mkPick(y, W));
    return;
  }

  if (kind === 'comet') {
    obs.push({
      type: 'warn',
      side: Math.random() < 0.5 ? 'L' : 'R',
      y,
      t: 1.25,
      nm: true,
      hit: true
    });
    if (Math.random() < 0.4) obs.push(mkPick(y, W));
    return;
  }

  let n = kind === 'ast' && Math.random() < 0.5 ? 2 : Math.random() < 0.35 ? 2 : 1;
  if (Math.random() < (diff - 1) * 0.55) n++;
  n = Math.min(n, 3);

  for (let i = 0; i < n; i++) {
    const x = randX();
    if (kind === 'beam' && i === 0) obs.push(mkBeam(x, y, diff));
    else if (kind === 'mine' && i === 0) obs.push(mkMine(x, y));
    else obs.push(mkAst(x, y + rand(-26, 26), astR(diff) * (i > 0 ? 0.75 : 1), diff, curLevel));
  }
  if (Math.random() < 0.45) obs.push(mkPick(y, W));
}

export function ensureSpawns(W, H) {
  const topW = G.camY - H * 0.62 - 320;
  let guard = 0;
  let curSpawnY = spawnY;
  while (curSpawnY > topW && guard++ < 40) {
    spawnLine(curSpawnY, W);
    const mult = G.state === 'menu' ? 1 : levelMult(levelOf(altAt(curSpawnY)));
    curSpawnY -= (150 + Math.random() * 120) / (0.85 + (mult - 1) * 0.55);
  }
  setSpawnY(curSpawnY);
}

export function updateObstacles(dt, W, H) {
  gravBodies.length = 0;
  for (const o of obs) {
    if ((o.type === 'planet' || o.type === 'well') && !o.dead) {
      gravBodies.push(o);
    }
  }

  for (const o of obs) {
    switch (o.type) {
      case 'ast':
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.rot += o.rv * dt;
        wrapX(o, W);
        o.tt += dt;
        if (o.tt > 0.045) {
          o.tt = 0;
          if (!o.trail) o.trail = [];
          o.trail.push(o.x, o.y);
          if (o.trail.length > 14) o.trail.splice(0, 2);
        }
        if (G.state === 'play') collideAst(o);
        break;
      case 'beam':
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.ang += o.rv * dt;
        wrapX(o, W);
        if (G.state === 'play') beamCollide(o);
        break;
      case 'mine':
        if (G.state === 'play') mineUpd(o, dt);
        break;
      case 'laser':
        if (G.state === 'play') laserUpd(o, dt, W);
        break;
      case 'well':
        wellUpd(o, dt);
        break;
      case 'planet':
        planetUpd(o, dt);
        break;
      case 'warn':
        o.t -= dt;
        if (o.t <= 0) {
          o.type = 'comet';
          o.spriteKey = 'ast_1';
          o.x = o.side === 'L' ? -40 : W + 40;
          o.r = 14;
          const m = levelMult(levelOf(G.alt));
          o.vx = (o.side === 'L' ? 1 : -1) * (520 + Math.min(340, G.alt * 0.04)) * m;
          o.near = 1e9;
          o.nm = false;
          o.hit = false;
        }
        break;
      case 'comet':
        o.x += o.vx * dt;
        if (Math.random() < 0.8) {
          addP({
            x: o.x - Math.sign(o.vx) * 10,
            y: o.y + rand(-4, 4),
            vx: -Math.sign(o.vx) * rand(30, 90),
            vy: rand(-15, 15),
            t: 0,
            life: 0.4,
            col: Math.random() < 0.5 ? '#bff0ff' : '#7ad4ff',
            sz: 2.2
          });
        }
        if (G.state === 'play') cometCollide(o);
        break;
      case 'pick':
        pickUpd(o, dt);
        break;
    }
    if (G.state === 'play') checkNearMiss(o);
  }

  // Culling
  const cullY = G.camY + H * 0.38 + 300;
  for (let i = obs.length - 1; i >= 0; i--) {
    const o = obs[i];
    if (o.dead) {
      obs.splice(i, 1);
      continue;
    }
    if (o.type === 'comet') {
      if (o.x < -140 || o.x > W + 140) {
        obs.splice(i, 1);
        continue;
      }
    }
    const margin = o.type === 'planet' || o.type === 'well' ? o.gr + 100 : 0;
    if (o.y > cullY + margin) {
      obs.splice(i, 1);
    }
  }
}
