/**
 * Space Drift - Galaxy Themes, Nebulae, & Sky Colors
 */
import { clamp, lerpColor } from './constants.js';

export const THEMES = [
  {
    id: 't1', name: 'ORBIT BIRU', base: '#030612', washHue: 205,
    neb: ['rgba(64,140,255,.22)', 'rgba(120,90,255,.16)', 'rgba(40,220,220,.14)', 'rgba(90,160,255,.10)'],
    star: ['#ffffff', '#bfe9ff', '#cfe4ff', '#9fd0ff'],
    amb: { type: 'dust', col: 'rgba(150,200,255,.55)', n: 40, spd: 8, size: 1.4 }
  },
  {
    id: 't2', name: 'SABUK DEBU', base: '#04120f', washHue: 160,
    neb: ['rgba(60,200,160,.18)', 'rgba(120,180,90,.14)', 'rgba(40,160,180,.14)', 'rgba(90,200,140,.10)'],
    star: ['#eafff4', '#bfe9d8', '#dff6e8', '#a9e6cf'],
    amb: { type: 'dust', col: 'rgba(150,230,200,.55)', n: 55, spd: 16, size: 1.6 }
  },
  {
    id: 't3', name: 'NEBULA UNGU', base: '#0a0418', washHue: 280,
    neb: ['rgba(170,80,255,.20)', 'rgba(255,80,200,.14)', 'rgba(120,80,255,.16)', 'rgba(200,120,255,.10)'],
    star: ['#f3e6ff', '#e0c9ff', '#ffffff', '#d9b3ff'],
    amb: { type: 'sparkle', col: 'rgba(225,185,255,.75)', n: 38, spd: 6, size: 1.6 }
  },
  {
    id: 't4', name: 'MEDAN MERAH', base: '#140408', washHue: 355,
    neb: ['rgba(255,80,90,.18)', 'rgba(255,140,60,.14)', 'rgba(200,40,80,.14)', 'rgba(255,100,80,.10)'],
    star: ['#ffe6e6', '#ffc9c9', '#ffffff', '#ffb3b3'],
    amb: { type: 'ember', col: 'rgba(255,140,90,.65)', n: 45, spd: 26, size: 1.8 }
  },
  {
    id: 't5', name: 'AURORA HIJAU', base: '#04140c', washHue: 150,
    neb: ['rgba(80,255,160,.16)', 'rgba(60,220,255,.12)', 'rgba(120,255,180,.12)', 'rgba(80,255,200,.10)'],
    star: ['#e6fff2', '#c9ffe6', '#ffffff', '#b3ffd9'],
    amb: { type: 'aurora', col: '', n: 0, spd: 0, size: 0 }
  },
  {
    id: 't6', name: 'KRISTAL ES', base: '#061020', washHue: 200,
    neb: ['rgba(150,210,255,.18)', 'rgba(200,240,255,.14)', 'rgba(120,180,255,.12)', 'rgba(180,230,255,.10)'],
    star: ['#ffffff', '#e6f4ff', '#d0ecff', '#bfe4ff'],
    amb: { type: 'snow', col: 'rgba(225,242,255,.75)', n: 60, spd: 30, size: 1.8 }
  },
  {
    id: 't7', name: 'BADAI PETIR', base: '#050510', washHue: 240,
    neb: ['rgba(90,90,220,.18)', 'rgba(150,120,255,.14)', 'rgba(60,60,160,.14)', 'rgba(120,140,255,.10)'],
    star: ['#e6e6ff', '#ccccff', '#ffffff', '#b3b3ff'],
    amb: { type: 'storm', col: '', n: 0, spd: 0, size: 0 }
  },
  {
    id: 't8', name: 'MEDAN MAGMA', base: '#160803', washHue: 25,
    neb: ['rgba(255,120,40,.20)', 'rgba(255,60,30,.16)', 'rgba(200,80,20,.14)', 'rgba(255,160,60,.12)'],
    star: ['#ffe6cc', '#ffd0a3', '#fff2e6', '#ffbb88'],
    amb: { type: 'ember', col: 'rgba(255,120,50,.75)', n: 60, spd: 42, size: 2.0 }
  },
  {
    id: 't9', name: 'VOID GELAP', base: '#020206', washHue: 265,
    neb: ['rgba(70,40,120,.12)', 'rgba(40,30,80,.10)', 'rgba(90,50,140,.10)', 'rgba(50,30,90,.08)'],
    star: ['#cfcfe6', '#9a9ac0', '#e6e6f5', '#7d7da8'],
    amb: { type: 'dust', col: 'rgba(140,120,200,.4)', n: 24, spd: 5, size: 1.2 }
  },
  {
    id: 't10', name: 'INTI GALAKSI', base: '#0d0818', washHue: 45,
    neb: ['rgba(255,200,80,.18)', 'rgba(255,90,200,.16)', 'rgba(90,200,255,.14)', 'rgba(255,150,120,.12)'],
    star: ['#fff6e0', '#ffe6b3', '#ffffff', '#ffd9f0'],
    amb: { type: 'sparkle', col: 'rgba(255,230,160,.85)', n: 52, spd: 12, size: 1.8 }
  }
];

export const SKY_KEYS = [
  { p: 0,    c: ['#20366e', '#5d7fc7', '#ff9d5c'] },
  { p: 0.35, c: ['#101d47', '#2c4a8f', '#c96a4a'] },
  { p: 0.7,  c: ['#060c24', '#101d47', '#2c4a8f'] },
  { p: 1,    c: ['#030612', '#030612', '#050a18'] }
];

export function skyColors(p) {
  let i = 0;
  while (i < SKY_KEYS.length - 2 && p > SKY_KEYS[i + 1].p) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
  const t = clamp((p - a.p) / (b.p - a.p), 0, 1);
  return [
    lerpColor(a.c[0], b.c[0], t),
    lerpColor(a.c[1], b.c[1], t),
    lerpColor(a.c[2], b.c[2], t)
  ];
}

const nebCache = {};
export function getNeb(theme) {
  if (nebCache[theme.id]) return nebCache[theme.id];
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const blob = (x, y, r, col) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 512);
  };
  blob(140, 180, 190, theme.neb[0]);
  blob(360, 120, 150, theme.neb[1]);
  blob(300, 360, 200, theme.neb[2]);
  blob(120, 430, 130, theme.neb[3]);
  nebCache[theme.id] = c;
  return c;
}
