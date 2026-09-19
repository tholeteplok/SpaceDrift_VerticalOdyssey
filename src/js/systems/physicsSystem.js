/**
 * Space Drift - Flight Physics & Boundaries
 */
import { levelMult, levelOf, rand } from '../config/constants.js';
import { G, ship, sensiMult } from '../core/state.js';
import { addP } from '../entities/particleSystem.js';

export function shipControls(dt, W, input) {
  const mult = levelMult(levelOf(G.alt));
  const sensi = sensiMult();

  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;

  if (dir !== 0) {
    ship.vx += dir * 950 * sensi * dt;
    if (ship.vx > ship.lat) ship.vx = ship.lat;
    if (ship.vx < -ship.lat) ship.vx = -ship.lat;
  } else {
    ship.vx *= Math.pow(0.03, dt);
    if (Math.abs(ship.vx) < 2) ship.vx = 0;
  }

  const baseV = 120 * mult * ship.climb;
  let targetV = -baseV;
  const bm = ship.boostT > 0 ? 1.5 : 1;
  if (input.thrust) targetV = -(baseV + 280 * mult * ship.thrustM) * bm;
  ship.vy += (targetV - ship.vy) * Math.min(1, dt * 4);
  if (ship.vy > 0) ship.vy = 0;

  const bs = ship.boostT > 0;
  const burning = input.thrust || bs;
  ship.flame += ((burning ? 1 : 0.45) - ship.flame) * Math.min(1, dt * 8);

  const n = bs ? 3 : input.thrust ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const bx = ship.x + rand(-3, 3);
    const by = ship.y + 14 + rand(-2, 2);
    addP({
      x: bx,
      y: by,
      vx: ship.vx * 0.3 + rand(-25, 25),
      vy: ship.vy * 0.3 + rand(140, 230),
      t: 0,
      life: bs ? 0.55 : input.thrust ? 0.4 : 0.25,
      col: bs
        ? Math.random() < 0.5 ? '#ffd28a' : '#ff9d3c'
        : Math.random() < 0.5 ? '#9ef2ff' : '#3ec9ff',
      sz: bs ? 3.4 : input.thrust ? 2.8 : 2
    });
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  if (ship.x < -30) ship.x += W + 60;
  if (ship.x > W + 30) ship.x -= W + 60;
}

export function wrapX(o, W) {
  if (o.x < -90) o.x += W + 180;
  if (o.x > W + 90) o.x -= W + 180;
}
