/**
 * Space Drift - Master Canvas Compositor & Screen Post-Processing
 */
import { TAU, rand } from '../config/constants.js';
import { G, ship, ripples, slines, obs } from '../core/state.js';
import { drawBackground, drawLaunchScene } from './backgroundRenderer.js';
import {
  drawShip,
  drawShield,
  drawBullets,
  drawAstTrail,
  drawAst,
  drawBeam,
  drawMine,
  drawLaser,
  drawWell,
  drawPlanet,
  drawWarn,
  drawComet,
  drawPick,
  drawParts,
  drawShock,
  drawPops,
  drawBestMarker
} from './entityRenderer.js';
import { drawMinimap } from './minimapRenderer.js';

export function createViewport() {
  let W = 0, H = 0, DPR = 1;
  const SY = y => y - G.camY + H * 0.62;

  function updateDimensions(width, height, dpr) {
    W = width;
    H = height;
    DPR = dpr;
  }

  return {
    get W() { return W; },
    get H() { return H; },
    get DPR() { return DPR; },
    SY,
    updateDimensions
  };
}

export function drawScreenFx(ctx, dtG, W, H, pointers) {
  if (G.state === 'play') {
    ctx.strokeStyle = 'rgba(94,234,255,.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 16]);
    ctx.beginPath();
    ctx.moveTo(W / 3, 0);
    ctx.lineTo(W / 3, H);
    ctx.moveTo((W * 2) / 3, 0);
    ctx.lineTo((W * 2) / 3, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Touch ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.t -= dtG * 2.4;
    if (r.t <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    ctx.strokeStyle = 'rgba(94,234,255,' + (r.t * 0.7) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, (1 - r.t) * 46 + 8, 0, TAU);
    ctx.stroke();
  }

  // Pointer indicators
  if (G.state === 'play') {
    for (const p of pointers.values()) {
      const g = p.zone === 'L' ? '\u25C0' : p.zone === 'R' ? '\u25B6' : '\u25B2';
      ctx.strokeStyle = 'rgba(94,234,255,.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(94,234,255,.9)';
      ctx.font = '900 20px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g, p.x, p.y - 46);
    }
  }

  // Boost speed lines
  if (G.state === 'play' && ship.boostT > 0) {
    if (Math.random() < 0.8) {
      slines.push({
        x: Math.random() * W,
        y: -30,
        len: rand(60, 200),
        v: rand(900, 1500),
        t: 0.35,
        life: 0.35
      });
    }
    for (let i = slines.length - 1; i >= 0; i--) {
      const l = slines[i];
      l.y += l.v * dtG;
      l.t -= dtG;
      if (l.t <= 0 || l.y > H + l.len) {
        slines.splice(i, 1);
        continue;
      }
      const g = ctx.createLinearGradient(l.x, l.y, l.x, l.y + l.len);
      g.addColorStop(0, 'rgba(190,240,255,0)');
      g.addColorStop(0.5, 'rgba(190,240,255,' + (l.t / l.life * 0.5) + ')');
      g.addColorStop(1, 'rgba(190,240,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, l.y + l.len);
      ctx.stroke();
    }
  }

  if (G.flash > 0) {
    ctx.fillStyle = 'rgba(160,240,255,' + (G.flash * 0.4) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  let red = G.hurt * 0.24;
  if (G.state === 'play' && ship.hp === 1 && ship.alive) {
    red += 0.06 + 0.05 * Math.sin(G.t * 6);
  }
  if (red > 0) {
    ctx.fillStyle = 'rgba(255,60,80,' + red + ')';
    ctx.fillRect(0, 0, W, H);
  }

  let green = ship.rad * 0.2;
  if (G.state === 'play' && G.radIn) {
    green += 0.04 + 0.03 * Math.sin(G.t * 9);
  }
  if (green > 0) {
    ctx.fillStyle = 'rgba(120,255,70,' + green + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

export function render(ctx, dtG, viewport, pointers) {
  const { W, H, DPR, SY } = viewport;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  if (G.state === 'launch') {
    drawLaunchScene(
      ctx,
      W,
      H,
      () => drawShip(ctx, SY),
      (sx, sy) => drawShield(ctx, sx, sy),
      () => drawParts(ctx, H, SY),
      SY
    );
    return;
  }

  drawBackground(ctx, W, H, dtG);

  ctx.save();
  if (G.shake > 0) {
    ctx.translate((Math.random() * 2 - 1) * G.shake, (Math.random() * 2 - 1) * G.shake);
  }

  // Draw personal best marker line
  if (G.state !== 'menu') {
    drawBestMarker(ctx, W, H, SY, G.best);
  }

  // Draw planetary bodies first
  for (const o of obs) if (o.type === 'planet') drawPlanet(ctx, o, H, SY);
  for (const o of obs) if (o.type === 'well') drawWell(ctx, o, H, SY);
  for (const o of obs) if (o.type === 'laser') drawLaser(ctx, o, W, H, SY);

  // Draw midground obstacles & items
  for (const o of obs) {
    if (o.type === 'ast') {
      drawAstTrail(ctx, o, H, SY);
      drawAst(ctx, o, H, SY);
    } else if (o.type === 'beam') drawBeam(ctx, o, H, SY);
    else if (o.type === 'mine') drawMine(ctx, o, H, SY);
    else if (o.type === 'warn') drawWarn(ctx, o, W, H, SY);
    else if (o.type === 'comet') drawComet(ctx, o, H, SY);
    else if (o.type === 'pick') drawPick(ctx, o, H, SY);
  }

  drawBullets(ctx, H, SY);
  drawShock(ctx, SY);
  drawParts(ctx, H, SY);

  if (G.state !== 'menu') {
    drawShield(ctx, ship.x, SY(ship.y));
    drawShip(ctx, SY);
  }

  drawPops(ctx, SY);
  ctx.restore();

  drawMinimap(ctx, W, H);
  drawScreenFx(ctx, dtG, W, H, pointers);
}
