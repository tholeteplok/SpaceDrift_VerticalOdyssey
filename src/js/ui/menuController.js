/**
 * Space Drift - Menu & Overlay Navigation Controller
 */
import { TAU, fmt } from '../config/constants.js';
import { SHIPS } from '../config/ships.js';
import { G } from '../core/state.js';
import { store } from '../core/storage.js';
import { sfx } from '../audio/soundEffects.js';
import { initAudio } from '../audio/synth.js';
import { eventBus } from '../core/eventBus.js';
import { shipPath } from '../render/entityRenderer.js';
import { getShipSprite } from '../core/assetLoader.js';

export function createMenuController(profileController) {
  const $ = id => document.getElementById(id);

  const menuEl = $('menu');
  const pauseOv = $('pauseOv');
  const overOv = $('overOv');
  const winOv = $('winOv');
  const shipRow = $('shipRow');
  const shipPerk = $('shipPerk');
  const bestLabel = $('bestLabel');
  const floatingBackBtn = $('floatingBackBtn');

  let activePage = 'pgMain';

  function show(el, on) {
    if (el) el.classList.toggle('hidden', !on);
  }

  function showPage(id, silent = false) {
    activePage = id;
    show($('pgMain'), id === 'pgMain');
    show($('pgHangar'), id === 'pgHangar');
    show($('pgTut'), id === 'pgTut');
    show($('pgProfile'), id === 'pgProfile');
    show(floatingBackBtn, id !== 'pgMain');
    if (menuEl) menuEl.scrollTop = 0;
    if (id === 'pgProfile' && profileController) {
      profileController.refreshProfile();
    }
    if (!silent) sfx('ui');
  }

  function handleBackPress() {
    if (activePage !== 'pgMain') {
      showPage('pgMain');
      return true;
    }
    return false;
  }

  function drawShipPreview(cnv, s) {
    const c = cnv.getContext('2d');
    c.clearRect(0, 0, 56, 64);
    c.save();
    c.translate(28, 34);

    const sprite = getShipSprite(s.spriteKey);
    if (sprite) {
      const sz = 46;
      c.drawImage(sprite, -sz / 2, -sz / 2 - 2, sz, sz);
    } else {
      c.scale(1.5, 1.5);
      const hg = c.createLinearGradient(0, -19, 0, 12);
      hg.addColorStop(0, s.hull[0]);
      hg.addColorStop(0.45, s.hull[1]);
      hg.addColorStop(1, s.hull[2]);
      c.fillStyle = hg;
      c.strokeStyle = s.acc;
      c.lineWidth = 1.1;
      shipPath(c, s.vr);
      c.fill();
      c.stroke();
      c.fillStyle = '#f4ffff';
      c.beginPath();
      c.ellipse(0, -4, 2.3, 4.4, 0, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function updatePerk() {
    const s = SHIPS[G.shipSel];
    if (shipPerk) {
      shipPerk.innerHTML = '<b>' + s.name + '</b> \u2014 ' + s.perk;
    }
  }

  function buildShipSel() {
    if (!shipRow) return;
    shipRow.innerHTML = '';
    SHIPS.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'shipCard' + (i === G.shipSel ? ' sel' : '');
      d.innerHTML = '<canvas width="56" height="64"></canvas><b>' + s.name + '</b><i>' + s.tag + '</i>';
      const stats2 = [['SPD', s.spd], ['SHD', s.shd], ['CTL', s.ctl], ['BST', s.bst]];
      for (const st of stats2) {
        const row = document.createElement('div');
        row.className = 'pips';
        let h = '<span class="pl">' + st[0] + '</span>';
        for (let k = 0; k < 5; k++) {
          h += '<span class="pip' + (k < st[1] ? ' on' : '') + '"></span>';
        }
        row.innerHTML = h;
        d.appendChild(row);
      }

      const pick = e => {
        e.preventDefault();
        e.stopPropagation();
        G.shipSel = i;
        store.set('sd_ship', String(i));
        const cards = shipRow.querySelectorAll('.shipCard');
        for (let j = 0; j < cards.length; j++) cards[j].classList.toggle('sel', j === i);
        updatePerk();
        try {
          initAudio();
          sfx('ui');
        } catch (err) {}
        eventBus.emit('shipSelected', i);
      };

      d.addEventListener('pointerdown', pick);
      d.addEventListener('click', e => e.stopPropagation());
      shipRow.appendChild(d);
      drawShipPreview(d.querySelector('canvas'), s);
    });
    updatePerk();
  }

  function bindTap(el, fn) {
    if (!el) return;
    let lastT = 0;
    const h = e => {
      if (e.cancelable) e.preventDefault();
      const n = performance.now();
      if (n - lastT < 400) return;
      lastT = n;
      try {
        fn();
      } catch (err) {
        eventBus.emit('error', err);
      }
    };
    el.addEventListener('pointerdown', h);
    el.addEventListener('click', h);
  }

  function initMenuEvents() {
    bindTap($('btnStart'), () => eventBus.emit('startGame'));
    bindTap($('btnHangar'), () => showPage('pgHangar'));
    bindTap($('btnTut'), () => showPage('pgTut'));
    bindTap($('btnProfile'), () => showPage('pgProfile'));
    bindTap(floatingBackBtn, () => showPage('pgMain'));
    bindTap($('btnRetry'), () => eventBus.emit('startGame'));
    bindTap($('btnRestart2'), () => eventBus.emit('startGame'));
    bindTap($('btnRetry2'), () => eventBus.emit('startGame'));
    bindTap($('btnMenu'), () => eventBus.emit('toMenu'));
    bindTap($('btnPause'), () => eventBus.emit('togglePause'));
    bindTap($('btnResume'), () => eventBus.emit('togglePause'));
    bindTap($('btnEndless'), () => {
      if (G.state === 'win') {
        G.state = 'play';
        show(winOv, false);
        eventBus.emit('setHudVisible', true);
        sfx('ui');
      }
    });

    if (menuEl) {
      menuEl.addEventListener('pointerdown', e => {
        if (e.target && e.target.tagName === 'BUTTON') return;
        if (e.target && e.target.tagName === 'INPUT') return;
        if (e.target && e.target.closest && e.target.closest('.shipCard')) return;
        if ($('pgMain').classList.contains('hidden')) return;
        try {
          eventBus.emit('startGame');
        } catch (err) {
          eventBus.emit('error', err);
        }
      });
    }

    if (overOv) {
      overOv.addEventListener('pointerdown', e => {
        if (e.target && e.target.closest && e.target.closest('#btnMenu')) return;
        try {
          eventBus.emit('startGame');
        } catch (err) {
          eventBus.emit('error', err);
        }
      });
    }

    buildShipSel();
    if (bestLabel) bestLabel.textContent = 'REKOR: ' + fmt(G.best) + ' m';
  }

  function showGameOver(
    reason,
    alt,
    score,
    smashes,
    nearMisses,
    isNewBest,
    flightDuration = 0,
    maxSpeed = 0
  ) {
    show(overOv, true);
    const sel = SHIPS[G.shipSel] || SHIPS[0];
    if ($('bbShipTag')) $('bbShipTag').textContent = sel.name;
    if ($('goReason')) $('goReason').textContent = reason || 'HANCUR MENGHANTAM RINTANGAN';

    if ($('stAlt')) $('stAlt').textContent = fmt(alt) + ' m';
    if ($('stScore')) $('stScore').textContent = fmt(score);
    if ($('stSmash')) $('stSmash').textContent = smashes;
    if ($('stNear')) $('stNear').textContent = nearMisses;
    if ($('stMaxSpeed')) $('stMaxSpeed').textContent = fmt(maxSpeed) + ' m/s';

    const durStr = flightDuration < 60
      ? flightDuration.toFixed(1) + ' d'
      : Math.floor(flightDuration / 60) + 'm ' + Math.floor(flightDuration % 60) + 'd';
    if ($('stDuration')) $('stDuration').textContent = durStr;

    // Visual Flight Progress Bar
    const bestTarget = Math.max(50, G.best);
    const pct = Math.min(100, Math.round((alt / bestTarget) * 100));
    if ($('fpCurAlt')) $('fpCurAlt').textContent = fmt(alt) + ' m';
    if ($('fpTarget')) $('fpTarget').textContent = (isNewBest ? 'REKOR BARU // ' : 'REKOR: ') + fmt(G.best) + ' m';
    if ($('fpFill')) {
      $('fpFill').style.width = '0%';
      requestAnimationFrame(() => {
        $('fpFill').style.width = pct + '%';
      });
    }

    show($('newBest'), isNewBest);
    sfx('ui');
  }

  function showWin(alt, score, isNewBest) {
    show(winOv, true);
    $('stAltW').textContent = fmt(alt) + ' m';
    $('stScoreW').textContent = fmt(score);
    show($('newBestW'), isNewBest);
  }

  function hideAllOverlays() {
    show(menuEl, false);
    show(overOv, false);
    show(winOv, false);
    show(pauseOv, false);
    show(floatingBackBtn, false);
  }

  function showMenuOverlay() {
    show(overOv, false);
    show(winOv, false);
    show(pauseOv, false);
    show(menuEl, true);
    showPage('pgMain', true);
    if (bestLabel) bestLabel.textContent = 'REKOR: ' + fmt(G.best) + ' m';
  }

  function setPauseOverlay(on) {
    show(pauseOv, on);
  }

  // Subscribe to navigation events
  eventBus.on('showPage', ({ id, silent }) => showPage(id, silent));

  return {
    showPage,
    buildShipSel,
    initMenuEvents,
    showGameOver,
    showWin,
    hideAllOverlays,
    showMenuOverlay,
    setPauseOverlay,
    handleBackPress,
    getActivePage: () => activePage
  };
}
