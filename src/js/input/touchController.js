/**
 * Space Drift - Touch & Pointer Controller
 */
import { G, ship, ripples, sensiMult } from '../core/state.js';
import { initAudio } from '../audio/synth.js';
import { eventBus } from '../core/eventBus.js';

export const input = { left: false, right: false, thrust: false };
export const keys = { left: 0, right: 0, thrust: 0 };
export const pointers = new Map();

let lastTapT = 0;

export function updateInput() {
  input.left = !!keys.left;
  input.right = !!keys.right;
  input.thrust = !!keys.thrust;

  for (const p of pointers.values()) {
    if (p.zone === 'L') input.left = true;
    else if (p.zone === 'R') input.right = true;
    else input.thrust = true;
  }
}

export const zoneOf = (x, width) => (x < width / 3 ? 'L' : x > (width * 2) / 3 ? 'R' : 'C');

export function initTouch(canvas, getWidth) {
  canvas.addEventListener('pointerdown', e => {
    if (e.cancelable) e.preventDefault();
    if (G.state === 'launch') {
      eventBus.emit('endLaunch');
      return;
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    initAudio();

    const w = getWidth();
    const p = {
      zone: zoneOf(e.clientX, w),
      x: e.clientX,
      y: e.clientY,
      y0: e.clientY,
      t0: performance.now()
    };
    pointers.set(e.pointerId, p);
    ripples.push({ x: e.clientX, y: e.clientY, t: 1 });
    updateInput();
  });

  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
  });

  function endPointer(e) {
    const p = pointers.get(e.pointerId);
    if (p) {
      const now = performance.now();
      const dur = now - p.t0;

      if (p.zone === 'C' && dur < 250 && Math.abs(p.y - p.y0) < 20) {
        if (now - lastTapT < 300) {
          eventBus.emit('doBoost');
        }
        lastTapT = now;
      } else if (
        G.state === 'play' &&
        ship.alive &&
        (p.zone === 'L' || p.zone === 'R') &&
        dur < 220
      ) {
        ship.vx += (p.zone === 'L' ? -1 : 1) * 210 * sensiMult();
        eventBus.emit('spawnBurst', {
          x: ship.x,
          y: ship.y,
          n: 6,
          col: '#5eeaff',
          spd: 120,
          life: 0.35,
          sz: 2
        });
      }
      pointers.delete(e.pointerId);
    }
    updateInput();
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  window.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('gesturestart', e => e.preventDefault());
}
