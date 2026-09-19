/**
 * Space Drift - RAF Heartbeat Loop Engine
 */
import { G, ship } from './state.js';
import { updateAmbient, updateFx } from '../entities/particleSystem.js';
import { eventBus } from './eventBus.js';

export function createGameLoop({
  stepFn,
  launchStepFn,
  menuStepFn,
  renderFn,
  hudUpdateFn,
  getViewport
}) {
  let last = performance.now();
  let loopErr = 0;
  let running = false;
  let rafId = null;

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.033);
    const dtG = dt;

    try {
      if (G.state === 'play') {
        stepFn(dt * G.slowmo, dtG);
        if (ship.alive) {
          G.slowmo += (1 - G.slowmo) * Math.min(1, dt * 2);
        }
      } else if (G.state === 'launch') {
        launchStepFn(dt);
      } else if (G.state === 'menu') {
        menuStepFn(dt);
      } else if (G.state === 'over' || G.state === 'win') {
        updateFx(dt);
      }

      G.bgBlend = Math.min(1, G.bgBlend + dt / 1.6);
      const vp = getViewport();
      updateAmbient(dt, vp.W, vp.H);

      renderFn(dtG);
      hudUpdateFn();
      loopErr = 0;
    } catch (err) {
      if (loopErr++ < 3) {
        console.error('Game Loop Exception:', err);
        eventBus.emit('error', err);
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  return {
    start,
    stop
  };
}
