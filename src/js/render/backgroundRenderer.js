/**
 * Space Drift - Parallax Background, Nebulae, Weather & Launch Sequence Renderer
 */
import { TAU, rand, clamp, ss, lerpColor, lerpHue } from '../config/constants.js';
import { THEMES, getNeb, skyColors } from '../config/themes.js';
import { G, ship, starLayers, bgParts } from '../core/state.js';

export function drawNebLayer(ctx, cnv, par, alpha, mirror, W, H) {
  if (alpha <= 0.002 || !cnv) return;
  const off = ((G.camY * par) % H + H) % H;
  ctx.globalAlpha = alpha;
  if (mirror) {
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(cnv, -W * 0.1, off - H, W * 1.2, H * 1.2);
    ctx.drawImage(cnv, -W * 0.1, off, W * 1.2, H * 1.2);
    ctx.restore();
  } else {
    ctx.drawImage(cnv, 0, off - H, W, H);
    ctx.drawImage(cnv, 0, off, W, H);
  }
  ctx.globalAlpha = 1;
}

export function drawStarsPal(ctx, pal, master = 1, W, H) {
  if (master <= 0.01) return;
  const boost = G.state === 'play' && ship.boostT > 0;
  const pars = [0.12, 0.3, 0.55];
  const alph = [0.5, 0.7, 1];

  for (let l = 0; l < 3; l++) {
    const p = pars[l];
    for (const s of starLayers[l]) {
      const sy = ((s.y - G.camY * p) % H + H) % H;
      ctx.globalAlpha =
        (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(G.t * s.sp + s.ph))) *
        alph[l] *
        master;
      ctx.fillStyle = pal[s.ci];
      if (boost) ctx.fillRect(s.x, sy, s.sz * 0.7, s.sz * 7);
      else ctx.fillRect(s.x, sy, s.sz, s.sz);
    }
  }
  ctx.globalAlpha = 1;
}

export function drawAurora(ctx, fade, W, H) {
  const bands = [
    ['120,255,180', 0.22],
    ['80,220,255', 0.5],
    ['170,255,210', 0.78]
  ];
  for (let i = 0; i < 3; i++) {
    const bx = W * bands[i][1] + Math.sin(G.t * 0.25 + i * 2.1) * W * 0.07;
    const g = ctx.createLinearGradient(bx - 90, 0, bx + 90, 0);
    const a = (0.11 * fade).toFixed(3);
    g.addColorStop(0, 'rgba(' + bands[i][0] + ',0)');
    g.addColorStop(0.5, 'rgba(' + bands[i][0] + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + bands[i][0] + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 90, 0, 180, H);
  }
}

export function drawStorm(ctx, fade, dtG, W, H) {
  G.boltT -= dtG;
  if (G.boltT <= 0) {
    G.boltT = rand(1.8, 4.5);
    const seg = [];
    let x = rand(W * 0.15, W * 0.85);
    let y = -10;
    seg.push([x, y]);
    while (y < H * 0.75) {
      y += rand(22, 52);
      x += rand(-34, 34);
      seg.push([x, y]);
    }
    G.bolt = { seg, life: 0.22, max: 0.22 };
  }
  if (G.bolt && G.bolt.life > 0) {
    G.bolt.life -= dtG;
    const k = Math.max(0, G.bolt.life / G.bolt.max);
    ctx.strokeStyle = 'rgba(200,220,255,' + (0.7 * fade * k) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < G.bolt.seg.length; i++) {
      const p = G.bolt.seg[i];
      if (i) ctx.lineTo(p[0], p[1]);
      else ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(170,190,255,' + (0.06 * fade * k) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

export function drawAmbient(ctx, W, H) {
  const th = THEMES[G.bgCur];
  const amb = th.amb;
  const fade = G.bgBlend;
  if (amb.type === 'aurora') {
    drawAurora(ctx, fade, W, H);
    return;
  }
  if (amb.type === 'storm') {
    return; // Handled separately in drawBackground with dtG
  }
  if (!bgParts.length) return;
  ctx.fillStyle = amb.col;
  for (const p of bgParts) {
    let a = fade * 0.75;
    if (amb.type === 'sparkle') {
      a = fade * (0.25 + 0.75 * Math.abs(Math.sin(G.t * 2 + p.ph)));
    }
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBackground(ctx, W, H, dtG) {
  const cur = THEMES[G.bgCur];
  const prev = THEMES[G.bgPrev];
  const b = G.bgBlend;

  ctx.fillStyle = b >= 1 ? cur.base : lerpColor(prev.base, cur.base, b);
  ctx.fillRect(0, 0, W, H);

  drawNebLayer(ctx, getNeb(prev), 0.05, (1 - b) * 0.55, false, W, H);
  drawNebLayer(ctx, getNeb(cur), 0.05, b * 0.55, false, W, H);
  drawNebLayer(ctx, getNeb(prev), 0.11, (1 - b) * 0.28, true, W, H);
  drawNebLayer(ctx, getNeb(cur), 0.11, b * 0.28, true, W, H);

  const pal = [];
  for (let i = 0; i < 4; i++) {
    pal.push(b >= 1 ? cur.star[i] : lerpColor(prev.star[i], cur.star[i], b));
  }
  drawStarsPal(ctx, pal, 1, W, H);

  if (cur.amb.type === 'storm') {
    drawStorm(ctx, b, dtG, W, H);
  } else {
    drawAmbient(ctx, W, H);
  }

  const h = b >= 1 ? cur.washHue : lerpHue(prev.washHue, cur.washHue, b);
  ctx.fillStyle = 'hsla(' + h + ',80%,55%,.045)';
  ctx.fillRect(0, 0, W, H);
}

export function drawLaunchScene(ctx, W, H, drawShipFn, drawShieldFn, drawPartsFn, SY) {
  const p = G.launchP;
  const sky = skyColors(p);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.55, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const sa = ss(0.3, 0.85, p);
  if (sa > 0.01) drawStarsPal(ctx, THEMES[0].star, sa, W, H);

  const sunA = 1 - ss(0.55, 0.92, p);
  if (sunA > 0.02) {
    const sy = -260 - G.camY * 0.3 + H * 0.62;
    if (sy > -140 && sy < H + 140) {
      const gg = ctx.createRadialGradient(W * 0.72, sy, 4, W * 0.72, sy, 95);
      gg.addColorStop(0, 'rgba(255,232,175,' + (0.9 * sunA) + ')');
      gg.addColorStop(0.3, 'rgba(255,190,110,' + (0.4 * sunA) + ')');
      gg.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(W * 0.72, sy, 95, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,242,214,' + sunA + ')';
      ctx.beginPath();
      ctx.arc(W * 0.72, sy, 20, 0, TAU);
      ctx.fill();
    }
  }

  ctx.save();
  if (G.shake > 0) {
    ctx.translate((Math.random() * 2 - 1) * G.shake, (Math.random() * 2 - 1) * G.shake);
  }

  const ca = 1 - ss(0.45, 0.82, p);
  if (ca > 0.02 && G.clouds) {
    for (const c of G.clouds) {
      const sy = c.wy - G.camY * c.par + H * 0.62;
      if (sy < -70 || sy > H + 90) continue;
      ctx.fillStyle = 'rgba(232,239,250,' + (0.16 * ca) + ')';
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(
          c.x + (k - 1.5) * 26 * c.s,
          sy + Math.sin(k * 2.3 + c.x) * 5,
          34 * c.s,
          13 * c.s,
          0,
          0,
          TAU
        );
        ctx.fill();
      }
    }
  }

  const dk = ss(0.25, 0.85, p);
  const mix = hex => lerpColor(hex, '#02040c', dk);

  const ridge = (base, amp, seed, par, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-20, H + 60);
    for (let x = -20; x <= W + 20; x += 14) {
      const wy =
        base +
        Math.sin(x * 0.008 + seed) * amp +
        Math.sin(x * 0.021 + seed * 2.3) * amp * 0.5 +
        Math.sin(x * 0.045 + seed * 4.1) * amp * 0.25;
      ctx.lineTo(x, wy - G.camY * par + H * 0.62);
    }
    ctx.lineTo(W + 20, H + 60);
    ctx.closePath();
    ctx.fill();
  };

  ridge(-120, 58, 3.1, 0.3, mix('#27406e'));
  ridge(-70, 46, 7.7, 0.55, mix('#1a2c50'));
  ridge(-28, 32, 12.3, 0.8, mix('#0e1a35'));

  const gy = 10 - G.camY + H * 0.62;
  if (gy < H + 80) {
    ctx.fillStyle = mix('#0a1226');
    ctx.fillRect(0, gy, W, H + 100 - gy);
    ctx.fillStyle = mix('#1c2a4a');
    ctx.fillRect(W / 2 - 70, gy - 6, 140, 10);
    ctx.fillStyle = mix('#111d38');
    ctx.fillRect(W / 2 - 54, gy + 4, 10, 26);
    ctx.fillRect(W / 2 + 44, gy + 4, 10, 26);

    const tx = W / 2 - 108;
    ctx.strokeStyle = mix('#25375e');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, gy - 4);
    ctx.lineTo(tx, gy - 100);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const yy = gy - 8 - i * 16;
      ctx.beginPath();
      ctx.moveTo(tx, yy);
      ctx.lineTo(tx + 16, yy - 8);
      ctx.moveTo(tx, yy - 8);
      ctx.lineTo(tx + 16, yy);
      ctx.stroke();
    }
    const bl = Math.sin(G.t * 5) > 0 ? 1 : 0.2;
    ctx.fillStyle = 'rgba(255,84,112,' + bl + ')';
    ctx.beginPath();
    ctx.arc(tx, gy - 104, 3.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = mix('#131f3c');
    ctx.fillRect(W / 2 + 95, gy - 22, 46, 22);
    ctx.fillRect(W / 2 + 150, gy - 14, 30, 14);
    ctx.fillStyle = 'rgba(255,200,120,.7)';
    ctx.fillRect(W / 2 + 102, gy - 16, 5, 4);
    ctx.fillRect(W / 2 + 112, gy - 16, 5, 4);
    ctx.fillRect(W / 2 + 158, gy - 9, 4, 3);
  }

  drawPartsFn();
  drawShieldFn(ship.x, SY(ship.y));
  drawShipFn();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const t = G.launchT;
  if (t < 1.15) {
    const n2 = t < 0.38 ? '3' : t < 0.76 ? '2' : '1';
    ctx.font = '900 64px Orbitron, sans-serif';
    ctx.shadowColor = '#5eeaff';
    ctx.shadowBlur = 26;
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.fillText(n2, W / 2, H * 0.3);
    ctx.shadowBlur = 0;
    ctx.font = '700 12px Orbitron, sans-serif';
    ctx.fillStyle = 'rgba(223,234,255,.6)';
    ctx.fillText('P E L U N C U R A N', W / 2, H * 0.3 + 54);
  } else if (t < 2.7) {
    const k = clamp((t - 1.15) / 0.35, 0, 1);
    const f = 1 - clamp((t - 2.0) / 0.7, 0, 1);
    ctx.globalAlpha = f;
    ctx.font = '900 ' + (40 + k * 12) + 'px Orbitron, sans-serif';
    ctx.fillStyle = '#ffd28a';
    ctx.shadowColor = '#ff9d3c';
    ctx.shadowBlur = 28;
    ctx.fillText('MELUNCUR!', W / 2, H * 0.28 - (t - 1.15) * 16);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  ctx.font = '500 11px Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(223,234,255,.45)';
  ctx.fillText('ketuk layar untuk melewati \u25B6', W / 2, H * 0.93);
}
