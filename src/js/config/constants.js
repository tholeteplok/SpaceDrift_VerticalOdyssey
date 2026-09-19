/**
 * Space Drift - Constants & Math Utilities
 */

export const TAU = Math.PI * 2;
export const LEVELS = 10;
export const LEVEL_LEN = 1200;
export const WIN_ALT = LEVELS * LEVEL_LEN;
export const BULLET_GRAV = 1.6;

export const levelOf = alt => Math.min(LEVELS, Math.floor(alt / LEVEL_LEN) + 1);
export const levelMult = lv => 1 + 0.10 * (lv - 1);
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const fmt = n => Math.floor(n).toLocaleString('id-ID');
export const ss = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const altAt = wy => Math.max(0, -wy / 10);

export const ZONES = [
  { a: 0,    hue: 205, name: 'MEDAN ASTEROID',  tag: 'batuan purba melayang bebas' },
  { a: 800,  hue: 28,  name: 'PUING ORBITAL',   tag: 'reruntuhan stasiun mengintai' },
  { a: 1800, hue: 355, name: 'SABUK RANJAU',    tag: 'jangan sentuh — jangan terlalu dekat' },
  { a: 3000, hue: 160, name: 'GERBANG LASER',   tag: 'lewati celahnya, ikuti iramanya' },
  { a: 4500, hue: 272, name: 'MEDAN PLANET',    tag: 'planet raksasa & lubang hitam menanti' },
  { a: 6500, hue: 320, name: 'BADAI KOMET',     tag: 'kecepatan adalah kunci' }
];

export const zoneIdx = a => {
  let z = 0;
  for (let i = 0; i < ZONES.length; i++) {
    if (a >= ZONES[i].a) z = i;
  }
  return z;
};

export function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [
    parseInt(h.substr(0, 2), 16),
    parseInt(h.substr(2, 2), 16),
    parseInt(h.substr(4, 2), 16)
  ];
}

export function lerpColor(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return 'rgb(' +
    Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
    Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
    Math.round(A[2] + (B[2] - A[2]) * t) + ')';
}

export function lerpHue(a, b, t) {
  let d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
}
