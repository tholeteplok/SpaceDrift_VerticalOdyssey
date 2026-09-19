/**
 * Space Drift - Radar / Minimap Scanner Renderer
 */
import { TAU, clamp } from '../config/constants.js';
import { LASER_TYPES } from '../config/weapons.js';
import { G, ship, cfg, obs } from '../core/state.js';

export function drawMinimap(ctx, W, H) {
  if (!cfg.radar) return;
  if (G.state !== 'play' && G.state !== 'pause') return;

  const mw = clamp(W * 0.11, 34, 64);
  const mh = clamp(H * 0.28, 140, 220);
  const mx = W - mw - 6;
  const my = H * 0.5 - mh / 2;
  const range = 2200;
  const kx = mw / W;
  const ky = mh / range;
  const topY = ship.y - range * 0.86;

  ctx.save();
  ctx.fillStyle = 'rgba(4,10,24,.55)';
  ctx.strokeStyle = 'rgba(94,234,255,.3)';
  ctx.lineWidth = 1;
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeRect(mx, my, mw, mh);

  ctx.font = '700 7px Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(94,234,255,.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RADAR', mx + mw / 2, my - 5);

  ctx.beginPath();
  ctx.rect(mx, my, mw, mh);
  ctx.clip();

  const MX = wx => mx + wx * kx;
  const MY = wy => my + (wy - topY) * ky;

  for (const o of obs) {
    if (o.dead) continue;
    const oy = MY(o.y);
    if (oy < my - 30 || oy > my + mh + 30) continue;

    if (o.type === 'planet') {
      ctx.strokeStyle = 'rgba(160,200,255,.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(MX(o.x), oy, o.gr * ky, 0, TAU);
      ctx.stroke();
      if (o.rad > 0) {
        ctx.strokeStyle = 'rgba(141,255,90,.5)';
        ctx.beginPath();
        ctx.arc(MX(o.x), oy, Math.max(3, o.radR * ky), 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle =
        o.rad > 0
          ? '#8dff5a'
          : o.sub === 'gas'
          ? '#e8b06a'
          : o.sub === 'magma'
          ? '#ff9d5c'
          : '#b8a894';
      ctx.beginPath();
      ctx.arc(MX(o.x), oy, Math.max(2, o.r * ky), 0, TAU);
      ctx.fill();
    } else if (o.type === 'well') {
      ctx.strokeStyle = 'rgba(160,107,255,.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(MX(o.x), oy, o.R * ky, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#a06bff';
      ctx.beginPath();
      ctx.arc(MX(o.x), oy, Math.max(2.5, o.r * ky), 0, TAU);
      ctx.fill();
    } else if (o.type === 'ast') {
      ctx.fillStyle = 'rgba(170,190,215,.8)';
      ctx.fillRect(MX(o.x) - 1, oy - 1, 2, 2);
    } else if (o.type === 'beam') {
      ctx.fillStyle = 'rgba(255,180,84,.85)';
      ctx.fillRect(MX(o.x) - 2, oy - 1, 4, 2);
    } else if (o.type === 'mine') {
      ctx.fillStyle = '#ff5470';
      ctx.fillRect(MX(o.x) - 1.5, oy - 1.5, 3, 3);
    } else if (o.type === 'laser') {
      ctx.strokeStyle = 'rgba(255,84,112,.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, oy);
      ctx.lineTo(mx + mw, oy);
      ctx.stroke();
    } else if (o.type === 'comet') {
      ctx.fillStyle = '#bff0ff';
      ctx.fillRect(MX(o.x) - 1.5, oy - 1, 3, 2);
    } else if (o.type === 'warn') {
      ctx.fillStyle = '#ff5470';
      const wx2 = o.side === 'L' ? mx + 2 : mx + mw - 2;
      ctx.fillRect(wx2 - 1, oy - 1, 3, 3);
    } else if (o.type === 'pick') {
      ctx.fillStyle =
        o.kind === 'weapon'
          ? (LASER_TYPES[o.wtype | 0] || LASER_TYPES[0]).col
          : 'rgba(255,255,255,.55)';
      ctx.fillRect(MX(o.x) - 1, oy - 1, 2, 2);
    }
  }

  const sx2 = MX(ship.x);
  const sy2 = MY(ship.y);
  ctx.fillStyle = '#5eeaff';
  ctx.beginPath();
  ctx.moveTo(sx2, sy2 - 4);
  ctx.lineTo(sx2 - 3, sy2 + 3);
  ctx.lineTo(sx2 + 3, sy2 + 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
