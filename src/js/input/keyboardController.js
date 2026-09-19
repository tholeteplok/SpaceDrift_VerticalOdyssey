/**
 * Space Drift - Keyboard Input Controller
 */
import { G } from '../core/state.js';
import { keys, updateInput } from './touchController.js';
import { eventBus } from '../core/eventBus.js';

export function initKeyboard() {
  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.repeat) return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = 1;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = 1;
        break;
      case 'ArrowUp':
      case 'KeyW':
        keys.thrust = 1;
        break;
      case 'Space':
        if (G.state === 'play') eventBus.emit('doBoost');
        else if (G.state === 'launch') eventBus.emit('endLaunch');
        else if (G.state === 'menu' || G.state === 'over' || G.state === 'win') {
          eventBus.emit('startGame');
        }
        e.preventDefault();
        break;
      case 'KeyP':
        eventBus.emit('togglePause');
        break;
      case 'KeyR':
        if (G.state === 'over' || G.state === 'win') eventBus.emit('startGame');
        break;
      case 'Enter':
        if (G.state === 'launch') eventBus.emit('endLaunch');
        else if (G.state === 'menu' || G.state === 'over' || G.state === 'win') {
          eventBus.emit('startGame');
        }
        break;
      case 'Escape':
        if (G.state === 'menu') eventBus.emit('showPage', { id: 'pgMain', silent: true });
        break;
    }
    updateInput();
  });

  window.addEventListener('keyup', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        keys.left = 0;
        break;
      case 'ArrowRight':
      case 'KeyD':
        keys.right = 0;
        break;
      case 'ArrowUp':
      case 'KeyW':
        keys.thrust = 0;
        break;
    }
    updateInput();
  });
}
