/**
 * Space Drift - Main Application Bootstrap & Subsystems Orchestrator
 */
import { clamp, levelOf, WIN_ALT, ZONES, zoneIdx } from './config/constants.js';
import { THEMES } from './config/themes.js';
import { SHIPS } from './config/ships.js';
import { LASER_TYPES } from './config/weapons.js';
import {
  G,
  ship,
  obs,
  parts,
  pops,
  shock,
  slines,
  gravBodies,
  bullets,
  setSpawnY,
  saveBest,
  recordRun
} from './core/state.js';
import { eventBus } from './core/eventBus.js';
import { initAudio, thrustLoop, thrustLoopUpdate, vib } from './audio/synth.js';
import { musicEngine } from './audio/musicEngine.js';
import { sfx } from './audio/soundEffects.js';
import { input, pointers, updateInput, initTouch } from './input/touchController.js';
import { initKeyboard } from './input/keyboardController.js';
import {
  addP,
  burst,
  explosion,
  popup,
  buildStars,
  seedAmbient,
  buildClouds,
  updateFx
} from './entities/particleSystem.js';
import { doBoost, smashAst } from './entities/ship.js';
import { fireLaser, updateBullets } from './entities/bullet.js';
import { explodeMine } from './systems/collisionSystem.js';
import { shipControls } from './systems/physicsSystem.js';
import { ensureSpawns, updateObstacles } from './systems/spawnerSystem.js';
import { createViewport, render } from './render/canvasRenderer.js';
import { createHudController } from './ui/hudController.js';
import { createProfileController } from './ui/profileController.js';
import { createMenuController } from './ui/menuController.js';
import { createGameLoop } from './core/loop.js';
import { loadGameAssets } from './core/assetLoader.js';

// Global error banner helper
const errBox = document.getElementById('errBox');
function showError(err) {
  if (errBox) {
    errBox.style.display = 'block';
    errBox.textContent = 'ERROR: ' + (err && err.message ? err.message : err);
  }
}
window.addEventListener('error', e => {
  showError(e && e.message ? e.message : 'tidak diketahui');
});
eventBus.on('error', showError);

// Canvas & Viewport
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const viewport = createViewport();

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  cv.width = w * dpr;
  cv.height = h * dpr;
  cv.style.width = w + 'px';
  cv.style.height = h + 'px';
  viewport.updateDimensions(w, h, dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStars(w, h);
}
window.addEventListener('resize', resize);

// UI Controllers
const hud = createHudController();
const profile = createProfileController();
const menu = createMenuController(profile);

profile.initProfileEvents();
menu.initMenuEvents();

eventBus.on('pilotChanged', name => hud.setPilot(name));
eventBus.on('setHudVisible', on => hud.setVisible(on));
eventBus.on('smashAst', ast => smashAst(ast));
eventBus.on('explodeMine', mine => explodeMine(mine));
eventBus.on('doBoost', () => doBoost());

function setBg(level) {
  const idx = clamp(level - 1, 0, THEMES.length - 1);
  if (idx === G.bgCur) return;
  G.bgPrev = G.bgCur;
  G.bgCur = idx;
  G.bgBlend = 0;
  seedAmbient(THEMES[idx], viewport.W, viewport.H);
}

function reset() {
  obs.length = 0;
  parts.length = 0;
  pops.length = 0;
  shock.length = 0;
  slines.length = 0;
  gravBodies.length = 0;
  bullets.length = 0;

  const sel = SHIPS[G.shipSel];
  Object.assign(ship, {
    x: viewport.W / 2,
    y: 0,
    vx: 0,
    vy: -120,
    hp: sel.hp,
    maxHp: sel.hp,
    inv: 2,
    energy: 100,
    boostT: 0,
    flame: 0,
    rad: 0,
    alive: true,
    lat: sel.lat,
    climb: sel.climb,
    thrustM: sel.thrust,
    boostCost: sel.boostCost,
    radRes: sel.radRes,
    gravRes: sel.gravRes,
    laserT: 0,
    laserCd: 0,
    laserType: 0,
    shieldPulse: 0
  });

  Object.assign(G, {
    camY: 0,
    alt: 0,
    score: 0,
    smashes: 0,
    nearMisses: 0,
    combo: 0,
    comboT: 0,
    zone: -1,
    level: 1,
    won: false,
    deathT: 0,
    slowmo: 1,
    t: 0,
    shake: 0,
    hurt: 0,
    flash: 0,
    flightDuration: 0,
    maxSpeed: 0,
    bestPassed: false,
    boostUsed: false,
    radIn: false,
    geigerT: 0,
    bgCur: 0,
    bgPrev: 0,
    bgBlend: 1,
    boltT: 2,
    bolt: null
  });

  seedAmbient(THEMES[0], viewport.W, viewport.H);
  setSpawnY(-420);
  hud.setPilot(G.pilot);
  hud.updateHearts();
  ensureSpawns(viewport.W, viewport.H);
}

function startGame() {
  if (G.state === 'play' || G.state === 'launch') return;
  try {
    initAudio();
    musicEngine.startMusic();
    thrustLoop();
    sfx('ui');
    reset();
    buildClouds(viewport.W);
    Object.assign(G, { launchT: 0, launchV: 0, launchP: 0 });
    ship.x = viewport.W / 2;
    ship.y = -14;
    ship.vx = 0;
    ship.vy = 0;
    ship.flame = 0;
    G.state = 'launch';
  } catch (err) {
    showError(err);
    return;
  }
  menu.hideAllOverlays();
  hud.setVisible(false);
}

function endLaunch() {
  if (G.state !== 'launch') return;
  G.state = 'play';
  Object.assign(ship, {
    x: viewport.W / 2,
    y: 0,
    vx: 0,
    vy: -120,
    flame: 0.6,
    inv: 2,
    boostT: 0,
    laserCd: 0
  });
  G.camY = 0;
  G.launchV = 0;
  G.launchT = 0;
  G.launchP = 0;
  G.t = 0;
  G.shake = 0;
  parts.length = 0;
  G.flash = 0.3;
  ensureSpawns(viewport.W, viewport.H);
  hud.setVisible(true);
  const touchGuide = document.getElementById('touchZonesGuide');
  if (touchGuide) {
    touchGuide.classList.remove('fade-out');
    setTimeout(() => {
      touchGuide.classList.add('fade-out');
    }, 5500);
  }
  sfx('boost');
}

function launchStep(dt) {
  G.t += dt;
  G.launchT += dt;
  const t = G.launchT;

  if (t < 1.15) {
    ship.flame = Math.min(1, Math.max(0, (t - 0.25) / 0.8));
    G.shake = Math.max(G.shake, 1.5 + 3.5 * Math.max(0, t - 0.4));
    if (
      Math.abs(t - 0.38) < dt ||
      Math.abs(t - 0.76) < dt ||
      Math.abs(t - 1.14) < dt
    ) {
      sfx('count');
    }
    if (t > 0.3) {
      for (let i = 0; i < 3; i++) {
        addP({
          x: ship.x + (Math.random() * 44 - 22),
          y: 8 + (Math.random() * 10 - 4),
          vx: Math.random() * 320 - 160,
          vy: Math.random() * 60 + 10,
          t: 0,
          life: Math.random() * 0.7 + 0.9,
          col: Math.random() < 0.5 ? 'rgba(212,217,227,.55)' : 'rgba(178,188,205,.4)',
          sz: Math.random() * 4 + 4
        });
      }
    }
  } else {
    if (t - dt < 1.15) {
      sfx('liftoff');
      vib([80, 40, 160]);
      G.shake = Math.max(G.shake, 9);
    }
    ship.flame = 1;
    G.launchV = Math.min(1080, G.launchV + (230 + G.launchV * 0.35) * dt);
    G.camY -= G.launchV * dt;
    G.shake = Math.max(G.shake, 1.1);

    if (G.launchV < 520 && Math.random() < 0.7) {
      addP({
        x: ship.x + (Math.random() * 20 - 10),
        y: ship.y + 16,
        vx: Math.random() * 90 - 45,
        vy: Math.random() * 90 + 60,
        t: 0,
        life: Math.random() * 0.6 + 0.6,
        col: 'rgba(205,212,225,.4)',
        sz: Math.random() * 3 + 3
      });
    }
  }

  ship.x = viewport.W / 2;
  ship.y = G.camY - 14;
  ship.vx = 0;
  ship.vy = -G.launchV;
  G.launchP = clamp(-G.camY / 2600, 0, 1);

  const n = ship.flame > 0.5 ? 3 : 1;
  for (let i = 0; i < n; i++) {
    addP({
      x: ship.x + (Math.random() * 6 - 3),
      y: ship.y + 14 + (Math.random() * 4 - 2),
      vx: Math.random() * 50 - 25,
      vy: Math.random() * 110 + 150,
      t: 0,
      life: 0.35,
      col: Math.random() < 0.5 ? '#9ef2ff' : '#3ec9ff',
      sz: 2.6
    });
  }

  updateFx(dt);
  G.shake *= Math.pow(0.02, dt);
  if (G.shake < 0.2) G.shake = 0;
  thrustLoopUpdate();
  musicEngine.updateMusic(dt);

  if (G.launchP >= 1) endLaunch();
}

function showGameOver() {
  G.state = 'over';
  G.slowmo = 1;
  const final = Math.floor(G.score + G.alt * 2);
  recordRun(final);
  const isNewBest = saveBest();
  hud.setVisible(false);
  menu.showGameOver(
    G.overReason,
    G.alt,
    final,
    G.smashes,
    G.nearMisses,
    isNewBest,
    G.flightDuration,
    G.maxSpeed
  );
}

function winGame() {
  G.won = true;
  G.state = 'win';
  const final = Math.floor(G.score + G.alt * 2);
  recordRun(final);
  explosion(ship.x, ship.y - 20, '#ffd28a', 160);
  explosion(ship.x - 70, ship.y + 30, '#5eeaff', 120);
  explosion(ship.x + 70, ship.y - 60, '#8dff5a', 120);
  G.shake = 10;
  sfx('zone');
  vib([40, 60, 100]);
  const isNewBest = saveBest();
  hud.setVisible(false);
  menu.showWin(G.alt, final, isNewBest);
}

function step(dt) {
  G.t += dt;
  G.radIn = false;

  if (ship.alive) {
    G.flightDuration += dt;
    const curSpeed = Math.round(Math.abs(ship.vy) / 10);
    if (curSpeed > G.maxSpeed) G.maxSpeed = curSpeed;

    shipControls(dt, viewport.W, input);

    if (ship.laserT > 0) {
      ship.laserT -= dt;
      ship.laserCd -= dt;
      if (ship.laserCd <= 0) {
        ship.laserCd = (LASER_TYPES[ship.laserType] || LASER_TYPES[0]).rate;
        fireLaser();
      }
    }

    G.alt = Math.max(G.alt, -ship.y / 10);

    // Goal gradient effect - passing personal best
    if (G.best > 50 && !G.bestPassed && G.alt > G.best) {
      G.bestPassed = true;
      burst(ship.x, ship.y, 24, '#ffb454', 190, 0.7, 3.2);
      popup(ship.x, ship.y - 30, '⭐ REKOR PRIBADI DILAMPAUI!', '#ffb454');
      sfx('zone');
      vib([50, 100]);
    }

    const lv = levelOf(G.alt);
    if (lv > G.level) {
      G.level = lv;
      setBg(lv);
      hud.showLevel(lv);
    } else {
      const zi = zoneIdx(G.alt);
      if (zi !== G.zone) {
        G.zone = zi;
        hud.showZone(ZONES[zi]);
      }
    }

    if (!G.won && G.alt >= WIN_ALT) {
      winGame();
      return;
    }

    const tgt = clamp(ship.y + ship.vy * 0.18, ship.y - 150, ship.y + 90);
    G.camY += (tgt - G.camY) * Math.min(1, dt * 6);
  } else {
    G.deathT -= dt;
    if (G.deathT <= 0) {
      showGameOver();
    }
  }

  ensureSpawns(viewport.W, viewport.H);
  updateObstacles(dt, viewport.W, viewport.H);

  if (G.state === 'play') {
    updateBullets(dt, viewport.W, viewport.H);
  }

  updateFx(dt);
  ship.inv -= dt;
  ship.boostT -= dt;
  ship.shieldPulse = Math.max(0, ship.shieldPulse - dt * 2);

  if (ship.alive) ship.energy = Math.min(100, ship.energy + 5 * dt);
  if (!G.radIn) ship.rad = Math.max(0, ship.rad - 0.22 * dt);

  if (G.radIn && ship.alive) {
    G.geigerT -= dt;
    if (G.geigerT <= 0) {
      sfx('geiger');
      G.geigerT = 0.05 + Math.random() * 0.14;
    }
  } else {
    G.geigerT = 0;
  }

  G.comboT -= dt;
  if (G.comboT <= 0) G.combo = 0;

  G.hurt = Math.max(0, G.hurt - dt * 1.6);
  G.flash = Math.max(0, G.flash - dt * 2.2);
  G.shake *= Math.pow(0.002, dt);
  if (G.shake < 0.3) G.shake = 0;

  thrustLoopUpdate();
  musicEngine.updateMusic(dt);
}

function menuStep(dt) {
  G.t += dt;
  G.camY -= 60 * dt;
  ensureSpawns(viewport.W, viewport.H);
  updateObstacles(dt, viewport.W, viewport.H);
  updateFx(dt);
  musicEngine.updateMusic(dt);
}

function togglePause() {
  if (G.state === 'play') {
    G.state = 'pause';
    pointers.clear();
    updateInput();
    menu.setPauseOverlay(true);
    musicEngine.updateVolume();
    sfx('ui');
  } else if (G.state === 'pause') {
    G.state = 'play';
    menu.setPauseOverlay(false);
    musicEngine.startMusic();
    sfx('ui');
  }
}

function toMenu() {
  G.state = 'menu';
  pointers.clear();
  updateInput();
  obs.length = 0;
  bullets.length = 0;
  setSpawnY(G.camY - 200);
  G.bgCur = 0;
  G.bgPrev = 0;
  G.bgBlend = 1;
  seedAmbient(THEMES[0], viewport.W, viewport.H);
  hud.setVisible(false);
  menu.showMenuOverlay();
}

// Event bus listeners for high-level state flow
eventBus.on('startGame', startGame);
eventBus.on('endLaunch', endLaunch);
eventBus.on('togglePause', togglePause);
eventBus.on('toMenu', toMenu);

// Page visibility listener
document.addEventListener('visibilitychange', () => {
  if (document.hidden && G.state === 'play') togglePause();
});

// Setup controllers & inputs
initTouch(cv, () => viewport.W);
initKeyboard();

// Initialize canvas size and starfields
resize();

// Preload assets asynchronously
loadGameAssets().then(() => {
  menu.buildShipSel();
  window.__assetsLoaded = true;
  console.log('Space Drift assets ready for gameplay & hangar.');
  
  // Smoothly dismiss boot splash screen
  const splash = document.getElementById('bootSplash');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 550);
  }
});

// Start Game Loop
const loop = createGameLoop({
  stepFn: step,
  launchStepFn: launchStep,
  menuStepFn: menuStep,
  renderFn: dtG => render(ctx, dtG, viewport, pointers),
  hudUpdateFn: () => hud.hudUpdate(),
  getViewport: () => viewport
});

loop.start();
window.__gameReady = true;

// Smart Back Navigation System (Android Native & Web Popstate Bridge)
window.__handleBackPress = () => {
  // 1. If pause menu is open -> return to main menu (Option A)
  if (G.state === 'pause') {
    toMenu();
    return 'handled';
  }
  // 2. If game over or win screen is open -> return to menu
  if (G.state === 'over' || G.state === 'win') {
    toMenu();
    return 'handled';
  }
  // 3. If in menu state: if inside sub-menu (hangar/tut/profile), go back to main menu; otherwise exit confirmation
  if (G.state === 'menu') {
    if (menu.handleBackPress()) {
      return 'handled';
    }
    return 'exit';
  }
  // 4. If currently playing or launching -> pause the game safely
  if (G.state === 'play' || G.state === 'launch') {
    togglePause();
    return 'handled';
  }
  return 'exit';
};

// Web browser back button integration (popstate)
try {
  window.history.pushState({ page: 'spacedrift' }, '');
  window.addEventListener('popstate', () => {
    const res = window.__handleBackPress();
    if (res !== 'exit') {
      window.history.pushState({ page: 'spacedrift' }, '');
    }
  });
} catch (e) {}

// Physical keyboard Escape/Backspace navigation fallback
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' || e.key === 'Backspace') {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    window.__handleBackPress();
  }
});

// Unlock AudioContext and start background music on first user gesture
const unlockAudioOnGesture = () => {
  initAudio();
  musicEngine.startMusic();
  window.removeEventListener('pointerdown', unlockAudioOnGesture);
  window.removeEventListener('keydown', unlockAudioOnGesture);
};
window.addEventListener('pointerdown', unlockAudioOnGesture, { once: true });
window.addEventListener('keydown', unlockAudioOnGesture, { once: true });

console.log('Space Drift Modular Engine v3.6 initialized successfully.');


