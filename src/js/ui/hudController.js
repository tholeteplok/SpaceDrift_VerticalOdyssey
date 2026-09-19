/**
 * Space Drift - In-Game HUD Controller
 */
import { fmt, clamp, levelOf, LEVELS, LEVEL_LEN } from '../config/constants.js';
import { THEMES } from '../config/themes.js';
import { LASER_TYPES } from '../config/weapons.js';
import { G, ship } from '../core/state.js';
import { sfx } from '../audio/soundEffects.js';
import { eventBus } from '../core/eventBus.js';

export function createHudController() {
  const $ = id => document.getElementById(id);

  const altEl = $('alt');
  const velEl = $('vel');
  const scoreEl = $('score');
  const bestIn = $('bestIn');
  const energyFill = $('energyFill');
  const energyTxt = $('energyTxt');
  const energyWrap = $('energyWrap');
  const hintEl = $('hint');
  const comboTag = $('comboTag');
  const zoneBanner = $('zoneBanner');
  const hudEl = $('hud');
  const radBox = $('radBox');
  const radFill = $('radFill');
  const lvlEl = $('lvl');
  const lvlFill = $('lvlFill');
  const stageName = $('stageName');
  const laserBox = $('laserBox');
  const laserFill = $('laserFill');
  const laserName = $('laserName');
  const heartsEl = $('hearts');
  const pilotTag = $('pilotTag');

  let lastAlt = -1, lastScore = -1, lastEn = -1;

  function updateHearts() {
    const need = ship.maxHp || 3;
    if (heartsEl.children.length !== need) {
      heartsEl.innerHTML = '';
      for (let i = 0; i < need; i++) {
        const s = document.createElement('span');
        s.className = 'heart';
        heartsEl.appendChild(s);
      }
    }
    for (let i = 0; i < heartsEl.children.length; i++) {
      heartsEl.children[i].classList.toggle('off', i >= ship.hp);
    }
  }

  function hudUpdate() {
    if (G.state === 'menu' || G.state === 'launch') return;

    const a = Math.floor(G.alt);
    if (a !== lastAlt) {
      lastAlt = a;
      altEl.innerHTML = fmt(a) + '<small> m</small>';
      velEl.textContent = Math.round(Math.hypot(ship.vx, ship.vy) / 10) + ' m/s';
    }

    const sc = Math.floor(G.score + G.alt * 2);
    if (sc !== lastScore) {
      lastScore = sc;
      scoreEl.textContent = fmt(sc);
    }

    const en = Math.floor(ship.energy);
    if (en !== lastEn) {
      lastEn = en;
      energyFill.style.width = en + '%';
      energyTxt.textContent = '\u26A1 ' + en;
      energyWrap.classList.toggle('ready', en >= ship.boostCost);
      energyWrap.classList.toggle('low', en < ship.boostCost);
    }

    bestIn.textContent = 'REKOR ' + fmt(G.best) + ' m';
    hintEl.style.opacity = G.t < 9 && !G.boostUsed ? 1 : 0;
    radBox.style.opacity = G.state === 'play' && (G.radIn || ship.rad > 0.03) ? 1 : 0;
    radFill.style.width = Math.min(100, ship.rad * 100) + '%';
    laserBox.style.opacity = G.state === 'play' && ship.laserT > 0 ? 1 : 0;
    laserFill.style.width = clamp((ship.laserT / 12) * 100, 0, 100) + '%';

    if (ship.laserT > 0) {
      laserName.textContent = (LASER_TYPES[ship.laserType] || LASER_TYPES[0]).name;
    }

    const lv = levelOf(G.alt);
    lvlEl.textContent = G.won ? 'LEVEL 10 \u00B7 BEBAS' : 'LEVEL ' + lv + '/' + LEVELS;
    stageName.textContent = THEMES[clamp(lv - 1, 0, THEMES.length - 1)].name;
    const prog = G.won ? 1 : clamp((G.alt - (lv - 1) * LEVEL_LEN) / LEVEL_LEN, 0, 1);
    lvlFill.style.width = prog * 100 + '%';
  }

  function showZone(z) {
    zoneBanner.querySelector('h3').textContent = z.name;
    zoneBanner.querySelector('p').textContent = z.tag;
    zoneBanner.classList.remove('show');
    void zoneBanner.offsetWidth;
    zoneBanner.classList.add('show');
    sfx('zone');
  }

  function showLevel(lv) {
    zoneBanner.querySelector('h3').textContent = 'LEVEL ' + lv;
    zoneBanner.querySelector('p').textContent =
      THEMES[clamp(lv - 1, 0, THEMES.length - 1)].name + ' · +' + ((lv - 1) * 10) + '%';
    zoneBanner.classList.remove('show');
    void zoneBanner.offsetWidth;
    zoneBanner.classList.add('show');
    sfx('zone');
  }

  function showCombo(combo) {
    comboTag.textContent = 'NEAR MISS \u00D7' + combo;
    comboTag.classList.remove('show');
    void comboTag.offsetWidth;
    comboTag.classList.add('show');
  }

  function setPilot(name) {
    pilotTag.textContent = name;
  }

  function setVisible(show) {
    hudEl.classList.toggle('hidden', !show);
  }

  // Subscribe to decoupled events
  eventBus.on('updateHearts', updateHearts);
  eventBus.on('showZone', showZone);
  eventBus.on('showLevel', showLevel);
  eventBus.on('showCombo', showCombo);

  return {
    updateHearts,
    hudUpdate,
    showZone,
    showLevel,
    showCombo,
    setPilot,
    setVisible
  };
}
