/**
 * Space Drift - Obstacles & Celestial Bodies Configuration
 */
import { rand, clamp } from './constants.js';

export const AST_COLS = [
  ['#a3b0c2', '#39434f'],
  ['#b09a86', '#453a30'],
  ['#8fa8ad', '#2e4147'],
  ['#9d8fb5', '#3a3050']
];

export const PLANET_TYPES = [
  {
    id: 'rock',
    w: 3,
    rMin: 52,
    rMax: 72,
    gm: 1300,
    grM: 4.6,
    rad: 0,
    radM: 0,
    c1: '#b8a894',
    c2: '#4a3f36',
    glow: 'rgba(255,200,150,.3)'
  },
  {
    id: 'toxic',
    w: 3,
    rMin: 46,
    rMax: 64,
    gm: 1000,
    grM: 4.2,
    rad: 0.55,
    radM: 2.4,
    c1: '#9fd86a',
    c2: '#274d1e',
    glow: 'rgba(141,255,90,.45)'
  },
  {
    id: 'gas',
    w: 2.4,
    rMin: 88,
    rMax: 115,
    gm: 2400,
    grM: 5.6,
    rad: 0,
    radM: 0,
    c1: '#e8b06a',
    c2: '#6a3d2e',
    glow: 'rgba(255,170,90,.35)'
  },
  {
    id: 'magma',
    w: 2.2,
    rMin: 56,
    rMax: 78,
    gm: 1700,
    grM: 4.8,
    rad: 0.32,
    radM: 1.9,
    c1: '#ff9d5c',
    c2: '#5c1e14',
    glow: 'rgba(255,120,60,.45)'
  }
];

export const astR = diff => clamp(rand(11, 26) * (0.7 + diff * 0.35), 10, 54);

export const BIOME_ASTEROIDS = {
  default: ['ast_0', 'ast_3'],
  purple: ['ast_4', 'ast_0'],
  toxic: ['ast_5', 'ast_0'],
  ice: ['ast_2', 'ast_0'],
  magma: ['ast_1', 'ast_0']
};

export function pickAsteroidSprite(level) {
  let list = BIOME_ASTEROIDS.default;
  if (level === 3 || level === 10) list = BIOME_ASTEROIDS.purple;
  else if (level === 5) list = BIOME_ASTEROIDS.toxic;
  else if (level === 6) list = BIOME_ASTEROIDS.ice;
  else if (level === 8) list = BIOME_ASTEROIDS.magma;

  return list[Math.floor(Math.random() * list.length)];
}

