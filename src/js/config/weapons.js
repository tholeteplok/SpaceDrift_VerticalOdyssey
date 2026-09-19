/**
 * Space Drift - Laser Weapons Configuration
 */

export const LASER_TYPES = [
  {
    id: 'pulse',
    name: 'PULSE',
    col: '#ff7ae0',
    col2: '#ffd0f2',
    rate: 0.20,
    dmg: 1,
    speed: 980,
    w: 4,
    shots: [{ ox: 0, ang: 0 }]
  },
  {
    id: 'twin',
    name: 'TWIN',
    col: '#5eeaff',
    col2: '#bff0ff',
    rate: 0.17,
    dmg: 1,
    speed: 1000,
    w: 3.5,
    shots: [{ ox: -8, ang: 0 }, { ox: 8, ang: 0 }]
  },
  {
    id: 'spread',
    name: 'SPREAD',
    col: '#ffb454',
    col2: '#ffe0a0',
    rate: 0.24,
    dmg: 1,
    speed: 950,
    w: 3.5,
    shots: [{ ox: -4, ang: -0.24 }, { ox: 0, ang: 0 }, { ox: 4, ang: 0.24 }]
  },
  {
    id: 'plasma',
    name: 'PLASMA',
    col: '#8dff5a',
    col2: '#d0ff9a',
    rate: 0.32,
    dmg: 3,
    speed: 820,
    w: 8,
    shots: [{ ox: 0, ang: 0 }]
  }
];

export function pickLaserType() {
  const r = Math.random();
  return r < 0.40 ? 0 : r < 0.65 ? 1 : r < 0.85 ? 2 : 3;
}
