/**
 * Space Drift - Profile & Game Configuration Controller
 */
import { fmt } from '../config/constants.js';
import { SHIPS } from '../config/ships.js';
import { G, cfg, stats } from '../core/state.js';
import { store } from '../core/storage.js';
import { sfx } from '../audio/soundEffects.js';
import { updateMasterMute } from '../audio/synth.js';
import { musicEngine } from '../audio/musicEngine.js';
import { eventBus } from '../core/eventBus.js';

export function createProfileController() {
  const $ = id => document.getElementById(id);

  const pfAlt = $('pfAlt');
  const pfScore = $('pfScore');
  const pfMissions = $('pfMissions');
  const pfSmash = $('pfSmash');
  const pfNear = $('pfNear');
  const pfShip = $('pfShip');
  const inName = $('inName');
  const cfgSound = $('cfgSound');
  const cfgSoundV = $('cfgSoundV');
  const cfgMusic = $('cfgMusic');
  const cfgMusicV = $('cfgMusicV');
  const cfgMusicVol = $('cfgMusicVol');
  const cfgMusicVolV = $('cfgMusicVolV');
  const cfgVib = $('cfgVib');
  const cfgVibV = $('cfgVibV');
  const cfgRadar = $('cfgRadar');
  const cfgRadarV = $('cfgRadarV');
  const cfgSensi = $('cfgSensi');
  const cfgSensiV = $('cfgSensiV');
  const btnWipe = $('btnWipe');
  const btnMute = $('btnMute');
  const btnMute2 = $('btnMute2');

  function setMuteUI() {
    const ic = cfg.mute ? '🔇' : '🔊';
    if (btnMute) btnMute.textContent = ic;
    if (btnMute2) btnMute2.textContent = ic + ' SUARA';
  }

  function toggleMute() {
    cfg.mute = !cfg.mute;
    store.set('sd_mute', cfg.mute ? '1' : '0');
    updateMasterMute();
    musicEngine.updateVolume();
    setMuteUI();
  }

  function setCfgState() {
    if (cfgSoundV) cfgSoundV.textContent = cfg.mute ? 'MATI' : 'AKTIF';
    const modeLabels = { synth: 'SYNTH DINAMIS', custom: 'TREK AUDIO', off: 'MATI' };
    if (cfgMusicV) cfgMusicV.textContent = modeLabels[cfg.musicMode] || 'SYNTH DINAMIS';
    if (cfgMusicVolV) cfgMusicVolV.textContent = Math.round(cfg.musicVol * 100) + '%';
    if (cfgVibV) cfgVibV.textContent = cfg.vib ? 'AKTIF' : 'MATI';
    if (cfgRadarV) cfgRadarV.textContent = cfg.radar ? 'AKTIF' : 'MATI';
    if (cfgSensiV) cfgSensiV.textContent = cfg.sensi === '2' ? 'TINGGI' : 'NORMAL';
  }

  function refreshProfile() {
    if (pfAlt) pfAlt.textContent = fmt(G.best) + ' m';
    if (pfScore) pfScore.textContent = fmt(stats.bestScore);
    if (pfMissions) pfMissions.textContent = fmt(stats.missions);
    if (pfSmash) pfSmash.textContent = fmt(stats.smashT);
    if (pfNear) pfNear.textContent = fmt(stats.nearT);
    if (pfShip) pfShip.textContent = SHIPS[G.shipSel].name;
    setCfgState();
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

  function initProfileEvents() {
    bindTap(btnMute, toggleMute);
    bindTap(btnMute2, toggleMute);

    bindTap(cfgSound, () => {
      toggleMute();
      setCfgState();
    });

    bindTap(cfgMusic, () => {
      const modes = ['synth', 'custom', 'off'];
      const next = modes[(modes.indexOf(cfg.musicMode) + 1) % modes.length];
      cfg.musicMode = next;
      store.set('sd_music_mode', next);
      musicEngine.setMusicMode(next);
      setCfgState();
      sfx('ui');
    });

    bindTap(cfgMusicVol, () => {
      const vols = [0.2, 0.4, 0.6, 0.8, 1.0];
      let idx = vols.findIndex(v => Math.abs(v - cfg.musicVol) < 0.05);
      if (idx < 0) idx = 2;
      const nextVol = vols[(idx + 1) % vols.length];
      cfg.musicVol = nextVol;
      store.set('sd_music_vol', nextVol);
      musicEngine.updateVolume();
      setCfgState();
      sfx('ui');
    });

    bindTap(cfgVib, () => {
      cfg.vib = !cfg.vib;
      store.set('sd_vib', cfg.vib ? '1' : '0');
      setCfgState();
      sfx('ui');
    });

    bindTap(cfgRadar, () => {
      cfg.radar = !cfg.radar;
      store.set('sd_radar', cfg.radar ? '1' : '0');
      setCfgState();
      sfx('ui');
    });

    bindTap(cfgSensi, () => {
      cfg.sensi = cfg.sensi === '2' ? '1' : '2';
      store.set('sd_sensi', cfg.sensi);
      setCfgState();
      sfx('ui');
    });

    if (inName) {
      inName.value = G.pilot === 'PILOT-01' ? '' : G.pilot;
      inName.addEventListener('input', () => {
        const v = inName.value.toUpperCase().replace(/[^\w\s\-]/g, '').slice(0, 12);
        if (v !== inName.value) inName.value = v;
        G.pilot = v.trim() || 'PILOT-01';
        store.set('sd_pilot', G.pilot);
        eventBus.emit('pilotChanged', G.pilot);
      });
      inName.addEventListener('pointerdown', e => e.stopPropagation());
    }

    let wipeArmed = false;
    let wipeTimer = 0;
    bindTap(btnWipe, () => {
      if (!wipeArmed) {
        wipeArmed = true;
        btnWipe.textContent = '⚠ YAKIN? KETUK LAGI';
        sfx('deny');
        clearTimeout(wipeTimer);
        wipeTimer = setTimeout(() => {
          wipeArmed = false;
          btnWipe.textContent = '🗑 HAPUS SEMUA DATA';
        }, 3000);
      } else {
        [
          'sd_best', 'sd_ship', 'sd_mute', 'sd_vib', 'sd_radar',
          'sd_sensi', 'sd_pilot', 'sd_missions', 'sd_smash_t',
          'sd_near_t', 'sd_best_score'
        ].forEach(k => store.del(k));
        try {
          location.reload();
        } catch (e) {}
      }
    });

    setMuteUI();
    setCfgState();
  }

  return {
    refreshProfile,
    setCfgState,
    setMuteUI,
    toggleMute,
    initProfileEvents
  };
}
