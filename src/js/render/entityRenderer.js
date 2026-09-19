/**
 * Space Drift - Entity Rendering Pipeline
 */
import { TAU, clamp } from '../config/constants.js';
import { SHIPS } from '../config/ships.js';
import { LASER_TYPES } from '../config/weapons.js';
import { G, ship, bullets, parts, shock, pops } from '../core/state.js';
import { getShipSprite, getAsteroidSprite } from '../core/assetLoader.js';

export function shipPath(c, v) {
  c.beginPath();
  if (v === 1) {
    c.moveTo(0, -19);
    c.lineTo(3, -7);
    c.lineTo(8, 4);
    c.lineTo(6, 12);
    c.lineTo(0, 9);
    c.lineTo(-6, 12);
    c.lineTo(-8, 4);
    c.lineTo(-3, -7);
  } else if (v === 2) {
    c.moveTo(0, -15);
    c.lineTo(6, -7);
    c.lineTo(15, 2);
    c.lineTo(15, 9);
    c.lineTo(6, 7);
    c.lineTo(3, 12);
    c.lineTo(0, 10);
    c.lineTo(-3, 12);
    c.lineTo(-6, 7);
    c.lineTo(-15, 9);
    c.lineTo(-15, 2);
    c.lineTo(-6, -7);
  } else if (v === 3) {
    c.moveTo(0, -18);
    c.lineTo(5, -4);
    c.lineTo(14, 8);
    c.lineTo(2, 6);
    c.lineTo(0, 10);
    c.lineTo(-2, 6);
    c.lineTo(-14, 8);
    c.lineTo(-5, -4);
  } else {
    c.moveTo(0, -16);
    c.lineTo(4, -6);
    c.lineTo(13, 6);
    c.lineTo(11, 11);
    c.lineTo(4, 8);
    c.lineTo(0, 12);
    c.lineTo(-4, 8);
    c.lineTo(-11, 11);
    c.lineTo(-13, 6);
    c.lineTo(-4, -6);
  }
  c.closePath();
}

export function drawShield(ctx, sx, sy) {
  if (!ship.alive) return;
  const sel = SHIPS[G.shipSel];
  const maxHp = ship.maxHp || 3;
  const baseCol = ship.hp <= 1 ? '#ff8fa5' : sel.acc;
  const sp = ship.shieldPulse || 0;

  for (let i = 0; i < maxHp; i++) {
    const active = i < ship.hp;
    const r = 16 + i * 6;
    const dir = i % 2 ? -1 : 1;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(G.t * 0.9 * dir + i);

    if (active) {
      ctx.strokeStyle = ship.inv > 0 ? '#ffffff' : baseCol;
      ctx.globalAlpha =
        (ship.inv > 0
          ? 0.55 + 0.35 * Math.sin(G.t * 24)
          : 0.30 + 0.12 * Math.sin(G.t * 2 + i)) +
        sp * 0.5;
      ctx.shadowColor = baseCol;
      ctx.shadowBlur = 9;
      ctx.lineWidth = 1.8;
    } else {
      ctx.strokeStyle = '#4a5a72';
      ctx.globalAlpha = 0.16;
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
    }
    ctx.setLineDash([r * 0.55, r * 0.30]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (ship.hp > 0) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-G.t * 0.5);
    ctx.globalAlpha =
      0.10 + sp * 0.45 + (ship.inv > 0 ? 0.25 * Math.abs(Math.sin(G.t * 20)) : 0);
    ctx.strokeStyle = ship.inv > 0 ? '#ffffff' : baseCol;
    ctx.lineWidth = 1.2;
    const hr = 13 + ship.hp * 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const x = Math.cos(a) * hr;
      const y = Math.sin(a) * hr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

export function drawShip(ctx, SY) {
  if (!ship.alive) return;
  const sel = SHIPS[G.shipSel];
  const sx = ship.x;
  const sy = SY(ship.y);
  const blink = ship.inv > 0 && Math.floor(G.t * 14) % 2 === 0;

  ctx.save();
  if (blink) ctx.globalAlpha = 0.4;
  ctx.translate(sx, sy);

  if (ship.laserT > 0) {
    const LT = LASER_TYPES[ship.laserType] || LASER_TYPES[0];
    const lg = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    lg.addColorStop(0, LT.col + '66');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.fill();
  }

  if (ship.boostT > 0) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 36);
    g.addColorStop(0, 'rgba(255,214,120,.5)');
    g.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, TAU);
    ctx.fill();
  }

  ctx.rotate(clamp(ship.vx * 0.00045, -0.2, 0.2));

  const fl = ship.flame * (ship.boostT > 0 ? 30 : 16) * (0.75 + Math.random() * 0.5);
  if (fl > 1) {
    const fg = ctx.createLinearGradient(0, 10, 0, 12 + fl + 8);
    fg.addColorStop(0, ship.boostT > 0 ? '#ffd28a' : '#9ef2ff');
    fg.addColorStop(0.5, ship.boostT > 0 ? '#ff9d3c' : '#3ec9ff');
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-4.5, 9);
    ctx.lineTo(0, 12 + fl + 6);
    ctx.lineTo(4.5, 9);
    ctx.closePath();
    ctx.fill();
  }

  const sprite = getShipSprite(sel.spriteKey);
  if (sprite) {
    const sz = 38;
    ctx.drawImage(sprite, -sz / 2, -sz / 2 - 2, sz, sz);
  } else {
    // Fallback vektor prosedural
    const hg = ctx.createLinearGradient(0, -19, 0, 12);
    hg.addColorStop(0, sel.hull[0]);
    hg.addColorStop(0.45, sel.hull[1]);
    hg.addColorStop(1, sel.hull[2]);
    ctx.fillStyle = hg;
    ctx.strokeStyle = sel.acc;
    ctx.lineWidth = 1.2;
    shipPath(ctx, sel.vr);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = sel.acc;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f4ffff';
    ctx.beginPath();
    ctx.ellipse(0, -4, 2.6, 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = sel.acc;
    ctx.fillRect(-13, 5, 3, 4);
    ctx.fillRect(10, 5, 3, 4);
  }
  ctx.restore();
}

export function drawBullets(ctx, H, SY) {
  for (const b of bullets) {
    const sy = SY(b.y);
    if (sy < -40 || sy > H + 40) continue;
    const col = b.col || '#ff7ae0';
    const w = b.w || 4;
    const g = ctx.createLinearGradient(b.x, sy - 8, b.x, sy + 12);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(b.x - w / 2, sy - 8, w, 20);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = col;
    ctx.fillRect(b.x - w / 2 - 2.5, sy - 8, w + 5, 20);
    ctx.globalAlpha = 1;
  }
}

export function drawAstTrail(ctx, o, H, SY) {
  if (!o.trail || o.trail.length < 4) return;
  if (Math.hypot(o.vx, o.vy) < 50) return;
  ctx.strokeStyle = 'rgba(160,190,220,.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < o.trail.length; i += 2) {
    const x = o.trail[i];
    const sy = SY(o.trail[i + 1]);
    if (sy < -40 || sy > H + 40) continue;
    if (i === 0) ctx.moveTo(x, sy);
    else ctx.lineTo(x, sy);
  }
  ctx.stroke();
}

export function drawAst(ctx, o, H, SY) {
  const sy = SY(o.y);
  if (sy < -120 || sy > H + 120) return;
  ctx.save();
  ctx.translate(o.x, sy);
  ctx.rotate(o.rot);

  const astImg = o.spriteKey ? getAsteroidSprite(o.spriteKey) : null;
  if (astImg) {
    const size = o.r * 2.35;
    if (o.spriteKey === 'ast_5') {
      ctx.shadowColor = '#8dff5a';
      ctx.shadowBlur = 10;
    }
    ctx.drawImage(astImg, -size / 2, -size / 2, size, size);
  } else {
    // Fallback vektor prosedural
    const g = ctx.createLinearGradient(-o.r, -o.r, o.r, o.r);
    g.addColorStop(0, o.c1);
    g.addColorStop(1, o.c2);
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    o.verts.forEach((v, i) => {
      const x = Math.cos(v.a) * v.r;
      const y = Math.sin(v.a) * v.r;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (o.r > 22) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.arc(o.r * 0.3, -o.r * 0.15, o.r * 0.22, 0, TAU);
      ctx.moveTo(-o.r * 0.1, o.r * 0.3);
      ctx.arc(-o.r * 0.25, o.r * 0.3, o.r * 0.15, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawBeam(ctx, o, H, SY) {
  const sy = SY(o.y);
  if (sy < -160 || sy > H + 160) return;
  ctx.save();
  ctx.translate(o.x, sy);
  ctx.rotate(o.ang);
  const h = o.len / 2;
  const t = o.thick / 2;
  const g = ctx.createLinearGradient(0, -t, 0, t);
  g.addColorStop(0, '#8b93a6');
  g.addColorStop(0.5, '#454f63');
  g.addColorStop(1, '#20263a');
  ctx.fillStyle = g;
  ctx.fillRect(-h, -t, o.len, o.thick);

  ctx.save();
  ctx.beginPath();
  ctx.rect(-h, -t, o.len, o.thick);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,180,84,.55)';
  ctx.lineWidth = 3;
  for (let x = -h - 10; x < h + 10; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, t + 2);
    ctx.lineTo(x + 10, -t - 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#ffb454';
  ctx.fillRect(-h - 2, -t - 1, 4, o.thick + 2);
  ctx.fillRect(h - 2, -t - 1, 4, o.thick + 2);
  ctx.restore();
}

export function drawMine(ctx, o, H, SY) {
  const sy = SY(o.y);
  if (sy < -60 || sy > H + 60) return;
  const armed = o.fuse >= 0;
  const blink = 0.3 + 0.7 * Math.abs(Math.sin(G.t * (armed ? 6 + (0.8 - o.fuse) * 26 : 2) + o.ph));

  if (armed) {
    ctx.strokeStyle = 'rgba(255,84,112,' + (0.1 + 0.08 * blink) + ')';
    ctx.beginPath();
    ctx.arc(o.x, sy, 120, 0, TAU);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(o.x, sy);
  ctx.rotate(G.t * 0.5 + o.ph);
  ctx.strokeStyle = '#5a6478';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
    ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
  g.addColorStop(0, '#6a7488');
  g.addColorStop(1, '#181d2c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,84,112,' + blink + ')';
  ctx.shadowColor = '#ff5470';
  ctx.shadowBlur = armed ? 12 : 4;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawLaser(ctx, o, W, H, SY) {
  const sy = SY(o.y);
  if (sy < -60 || sy > H + 60) return;
  const gx = o.gapX;
  const hw = o.gapW / 2;

  ctx.fillStyle = '#233250';
  ctx.fillRect(0, sy - 6, 10, 12);
  ctx.fillRect(W - 10, sy - 6, 10, 12);
  ctx.fillStyle = o.state === 2 ? '#ff5470' : 'rgba(255,84,112,.4)';
  ctx.beginPath();
  ctx.arc(10, sy, 3, 0, TAU);
  ctx.arc(W - 10, sy, 3, 0, TAU);
  ctx.fill();

  const seg = [[0, gx - hw], [gx + hw, W]];
  if (o.state === 0) {
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#ff5470';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([12, 10]);
    for (const s of seg) {
      ctx.beginPath();
      ctx.moveTo(s[0], sy);
      ctx.lineTo(s[1], sy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  if (o.state === 1) {
    const bl = 0.4 + 0.6 * Math.abs(Math.sin(G.t * 14));
    ctx.globalAlpha = 0.35 * bl;
    ctx.strokeStyle = '#ff5470';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 8]);
    for (const s of seg) {
      ctx.beginPath();
      ctx.moveTo(s[0], sy);
      ctx.lineTo(s[1], sy);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  if (o.state === 2) {
    const fl2 = 0.8 + 0.2 * Math.random();
    for (const s of seg) {
      ctx.strokeStyle = 'rgba(255,84,112,' + (0.28 * fl2) + ')';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(s[0], sy);
      ctx.lineTo(s[1], sy);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,143,165,' + (0.85 * fl2) + ')';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(s[0], sy);
      ctx.lineTo(s[1], sy);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * fl2) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s[0], sy);
      ctx.lineTo(s[1], sy);
      ctx.stroke();
    }
    for (const ex of [gx - hw, gx + hw]) {
      const g = ctx.createRadialGradient(ex, sy, 1, ex, sy, 14);
      g.addColorStop(0, 'rgba(255,143,165,.8)');
      g.addColorStop(1, 'rgba(255,84,112,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, sy, 14, 0, TAU);
      ctx.fill();
    }
  }
}

export function drawWell(ctx, o, H, SY) {
  const sy = SY(o.y);
  if (sy < -o.R - 40 || sy > H + o.R + 40) return;

  const g = ctx.createRadialGradient(o.x, sy, 2, o.x, sy, o.R);
  g.addColorStop(0, 'rgba(190,140,255,.42)');
  g.addColorStop(0.3, 'rgba(120,70,220,.14)');
  g.addColorStop(1, 'rgba(120,70,220,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.x, sy, o.R, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.translate(o.x, sy);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(o.spin * (1.2 + i * 0.5));
    ctx.strokeStyle = 'rgba(200,160,255,' + (0.5 - i * 0.13) + ')';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([22 - i * 6, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, o.r + 18 + i * 30, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.rotate(o.spin * 1.4);
  ctx.strokeStyle = 'rgba(255,180,84,.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, o.r * 2.2, o.r * 0.72, 0, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,220,150,.28)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, 0, o.r * 1.75, o.r * 0.55, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();

  const cg = ctx.createRadialGradient(o.x, sy, 1, o.x, sy, o.r);
  cg.addColorStop(0, '#000');
  cg.addColorStop(0.7, '#12061f');
  cg.addColorStop(0.92, '#3a1660');
  cg.addColorStop(1, '#c99aff');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(o.x, sy, o.r, 0, TAU);
  ctx.fill();
}

export function drawPlanet(ctx, o, H, SY) {
  const sy = SY(o.y);
  if (sy < -o.gr - 90 || sy > H + o.gr + 90) return;

  const gg = ctx.createRadialGradient(o.x, sy, o.r, o.x, sy, o.gr);
  gg.addColorStop(0, o.glow);
  gg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(o.x, sy, o.gr, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (o.rad > 0) {
    const pul = 0.5 + 0.5 * Math.sin(G.t * 3 + o.spin);
    const rg = ctx.createRadialGradient(o.x, sy, o.r, o.x, sy, o.radR);
    rg.addColorStop(0, 'rgba(141,255,90,.17)');
    rg.addColorStop(1, 'rgba(141,255,90,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(o.x, sy, o.radR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(141,255,90,' + (0.22 + 0.2 * pul) + ')';
    ctx.setLineDash([10, 12]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(o.x, sy, o.radR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(141,255,90,' + (0.5 + 0.3 * pul) + ')';
    ctx.font = '700 12px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2622', o.x, sy - o.radR + 10);
  }

  ctx.save();
  ctx.translate(o.x, sy);
  ctx.rotate(o.spin * 0.6);
  ctx.strokeStyle = o.glow;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 18]);
  ctx.beginPath();
  ctx.arc(0, 0, o.gr * 0.92, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  if (o.ring) {
    ctx.save();
    ctx.translate(o.x, sy);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(232,190,140,.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, o.r * 1.9, o.r * 0.5, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232,190,140,.22)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(0, 0, o.r * 1.65, o.r * 0.42, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  const g = ctx.createRadialGradient(o.x - o.r * 0.35, sy - o.r * 0.35, o.r * 0.1, o.x, sy, o.r);
  g.addColorStop(0, o.c1);
  g.addColorStop(1, o.c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.x, sy, o.r, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(o.x, sy, o.r, 0, TAU);
  ctx.clip();
  ctx.translate(o.x, sy);

  if (o.sub === 'gas') {
    for (let i = 0; i < 6; i++) {
      const by = -o.r + (i + 0.5) * (2 * o.r / 6) + Math.sin(o.bandSeed + i * 1.7) * 4;
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.15)';
      ctx.fillRect(-o.r, by - o.r * 0.09, o.r * 2, o.r * 0.18);
    }
  } else {
    for (const c of o.craters) {
      const a = c.a + o.spin;
      const cx2 = Math.cos(a) * c.d * o.r;
      const cy2 = Math.sin(a) * c.d * o.r;
      if (o.sub === 'magma') {
        ctx.fillStyle = 'rgba(255,190,80,.55)';
        ctx.shadowColor = '#ff9d3c';
        ctx.shadowBlur = 6;
      } else if (o.sub === 'toxic') {
        ctx.fillStyle = 'rgba(200,255,150,.30)';
      } else {
        ctx.fillStyle = 'rgba(0,0,0,.24)';
      }
      ctx.beginPath();
      ctx.arc(cx2, cy2, c.s * o.r, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();

  ctx.strokeStyle = o.glow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(o.x, sy, o.r + 1.5, 0, TAU);
  ctx.stroke();
}

export function drawWarn(ctx, o, W, H, SY) {
  const sy = SY(o.y);
  if (sy < -40 || sy > H + 40) return;
  const bl = Math.sin(G.t * 16) > 0 ? 1 : 0.25;
  ctx.globalAlpha = bl;
  ctx.fillStyle = '#ff5470';
  const x = o.side === 'L' ? 16 : W - 16;
  const dir = o.side === 'L' ? 1 : -1;
  ctx.font = '900 15px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u2604', x, sy);
  ctx.beginPath();
  ctx.moveTo(x + dir * 16, sy);
  ctx.lineTo(x + dir * 8, sy - 6);
  ctx.lineTo(x + dir * 8, sy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawComet(ctx, o, H, SY) {
  const sy = SY(o.y);
  if (sy < -60 || sy > H + 60) return;

  const sprite = o.spriteKey ? getAsteroidSprite(o.spriteKey) : null;
  if (sprite) {
    ctx.save();
    ctx.translate(o.x, sy);
    if (o.vx < 0) {
      ctx.scale(-1, 1);
    }
    ctx.rotate(0.35);
    const sz = 46;
    ctx.drawImage(sprite, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  } else {
    const tx = o.x - Math.sign(o.vx) * 95;
    const g = ctx.createLinearGradient(o.x, sy, tx, sy);
    g.addColorStop(0, 'rgba(190,240,255,.9)');
    g.addColorStop(1, 'rgba(190,240,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(o.x, sy);
    ctx.lineTo(tx, sy);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(o.x, sy);
    ctx.lineTo(o.x - Math.sign(o.vx) * 50, sy);
    ctx.stroke();

    const hg = ctx.createRadialGradient(o.x, sy, 1, o.x, sy, 16);
    hg.addColorStop(0, '#ffffff');
    hg.addColorStop(0.4, '#bff0ff');
    hg.addColorStop(1, 'rgba(190,240,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(o.x, sy, 16, 0, TAU);
    ctx.fill();
  }
}

function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

export function drawPick(ctx, o, H, SY) {
  const sy = SY(o.y) + Math.sin(G.t * 3 + o.ph) * 4;
  if (sy < -40 || sy > H + 40) return;
  ctx.save();
  ctx.translate(o.x, sy);
  ctx.shadowBlur = 10;

  if (o.kind === 'energy') {
    ctx.rotate(Math.sin(G.t * 2 + o.ph) * 0.2);
    ctx.shadowColor = '#5eeaff';
    ctx.fillStyle = 'rgba(94,234,255,.15)';
    ctx.strokeStyle = '#5eeaff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eaffff';
    ctx.beginPath();
    ctx.moveTo(1.5, -6);
    ctx.lineTo(-3, 0.5);
    ctx.lineTo(-0.5, 0.5);
    ctx.lineTo(-1.5, 6);
    ctx.lineTo(3, -0.5);
    ctx.lineTo(0.5, -0.5);
    ctx.closePath();
    ctx.fill();
  } else if (o.kind === 'shield') {
    ctx.shadowColor = '#7dffcf';
    ctx.strokeStyle = '#7dffcf';
    ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(125,255,207,.12)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      if (i) ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
      else ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7dffcf';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, TAU);
    ctx.fill();
  } else if (o.kind === 'weapon') {
    const LT = LASER_TYPES[o.wtype | 0] || LASER_TYPES[0];
    ctx.rotate(Math.sin(G.t * 2 + o.ph) * 0.2);
    ctx.shadowColor = LT.col;
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.strokeStyle = LT.col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    const n = LT.shots.length;
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * 3.2;
      ctx.fillRect(bx - 0.7, -6, 1.4, 11);
    }
    ctx.beginPath();
    ctx.arc(0, -8, 1.8, 0, TAU);
    ctx.fill();
  } else {
    ctx.shadowColor = '#ffb454';
    ctx.fillStyle = '#ffd28a';
    starPath(ctx, 0, 0, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    starPath(ctx, 0, 0, 4.5);
    ctx.fill();
  }
  ctx.restore();
}

export function drawParts(ctx, H, SY) {
  for (const p of parts) {
    const sy = SY(p.y);
    if (sy < -30 || sy > H + 30) continue;
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x, sy, p.sz * (0.5 + (1 - p.t / p.life) * 0.7), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawShock(ctx, SY) {
  for (const s of shock) {
    const sy = SY(s.y);
    ctx.globalAlpha = s.t * 0.8;
    ctx.strokeStyle = s.col;
    ctx.lineWidth = 2.5 * s.t + 0.5;
    ctx.beginPath();
    ctx.arc(s.x, sy, s.R * (1 - s.t) + 8, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawPops(ctx, SY) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of pops) {
    ctx.globalAlpha = Math.min(1, p.t * 1.6);
    ctx.font = '700 13px Orbitron, sans-serif';
    ctx.fillStyle = p.col;
    ctx.fillText(p.txt, p.x, SY(p.y) - (1 - p.t) * 34);
  }
  ctx.globalAlpha = 1;
}

export function drawBestMarker(ctx, W, H, SY, bestAlt) {
  if (!bestAlt || bestAlt < 50) return;
  const yBest = -bestAlt * 10;
  const sy = SY(yBest);
  if (sy < -40 || sy > H + 40) return;

  ctx.save();
  ctx.setLineDash([14, 8]);
  ctx.strokeStyle = 'rgba(255, 180, 84, 0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ffb454';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.moveTo(0, sy);
  ctx.lineTo(W, sy);
  ctx.stroke();

  ctx.setLineDash([]);
  const label = '⭐ REKOR PRIBADI: ' + Math.floor(bestAlt) + ' M';
  ctx.font = '700 11px Orbitron, sans-serif';
  const tw = ctx.measureText(label).width;

  ctx.fillStyle = 'rgba(10, 18, 36, 0.88)';
  ctx.strokeStyle = '#ffb454';
  ctx.lineWidth = 1;
  const bx = W / 2 - tw / 2 - 14;
  const by = sy - 12;
  const bw = tw + 28;
  const bh = 24;

  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = '#ffb454';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, sy);
  ctx.restore();
}

