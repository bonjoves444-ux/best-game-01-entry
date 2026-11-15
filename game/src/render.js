// Mothlight — everything the player sees: the night garden, the
// moth, the motes and wisps, the particles, the HUD and every menu.
// Drawing reads the world; it never changes it (except a shake offset
// taken from Math.random, which is purely visual).

import { VIEW_W, VIEW_H, PALETTE, LANTERN, waveQuota, isBossWave } from './config.js';
import { comboMultiplier } from './world.js';

const FONT = 'Arial, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlowOrb(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawMote(ctx, mote, time) {
  const pulse = 0.75 + 0.25 * Math.sin(mote.ph * 2);
  const color = mote.golden ? PALETTE.gold : PALETTE.amber;
  drawGlowOrb(ctx, mote.x, mote.y, mote.r, color, 0.55 * pulse);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(mote.x, mote.y, mote.r * (mote.golden ? 1.35 : 1) * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFBEA';
  ctx.beginPath();
  ctx.arc(mote.x, mote.y, mote.r * 0.42 * pulse, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisp(ctx, wisp) {
  const wob = Math.sin(wisp.ph * 2) * 3;
  const color = wisp.kind === 'dart' ? '#F43F5E' : wisp.kind === 'weaver' ? '#A78BFA' : '#7C6FF0';
  ctx.save();
  ctx.translate(wisp.x + wob, wisp.y);
  drawGlowOrb(ctx, 0, 0, wisp.r, color, 0.4);
  // Each kind has its own silhouette, so variety reads at a glance:
  // Drifter is a soft round blob, Dart a sharp angular kite,
  // Weaver a round body carrying a pale web sac.
  ctx.fillStyle = 'rgba(20,16,48,0.92)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (wisp.kind === 'dart') {
    ctx.beginPath();
    ctx.moveTo(0, -wisp.r * 1.35);
    ctx.lineTo(wisp.r * 0.85, 0);
    ctx.lineTo(0, wisp.r * 0.85);
    ctx.lineTo(-wisp.r * 0.85, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Swept-back fins on the dart's flanks.
    ctx.beginPath();
    ctx.moveTo(-wisp.r * 0.6, wisp.r * 0.2);
    ctx.lineTo(-wisp.r * 1.25, wisp.r * 0.75);
    ctx.lineTo(-wisp.r * 0.35, wisp.r * 0.6);
    ctx.closePath();
    ctx.moveTo(wisp.r * 0.6, wisp.r * 0.2);
    ctx.lineTo(wisp.r * 1.25, wisp.r * 0.75);
    ctx.lineTo(wisp.r * 0.35, wisp.r * 0.6);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, wisp.r, 0, Math.PI * 2);
    ctx.arc(-wisp.r * 0.55, wisp.r * 0.3, wisp.r * 0.6, 0, Math.PI * 2);
    ctx.arc(wisp.r * 0.55, wisp.r * 0.3, wisp.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, wisp.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(-wisp.r * 0.32, -wisp.r * 0.15, 3.4, 0, Math.PI * 2);
  ctx.arc(wisp.r * 0.32, -wisp.r * 0.15, 3.4, 0, Math.PI * 2);
  ctx.fill();
  if (wisp.kind === 'weaver') {
    // The web sac: a pale sac on a thread below the body.
    ctx.strokeStyle = 'rgba(167,139,250,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, wisp.r * 0.55);
    ctx.lineTo(0, wisp.r + 12);
    ctx.stroke();
    ctx.fillStyle = 'rgba(221,214,254,0.95)';
    ctx.beginPath();
    ctx.arc(0, wisp.r + 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(167,139,250,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, wisp.r + 18, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoss(ctx, boss, time) {
  const flap = Math.sin(time * 5) * 0.35;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  drawGlowOrb(ctx, 0, 0, boss.r, '#FB7185', 0.5);
  ctx.rotate(Math.sin(time * 0.8) * 0.12);
  // Huge dark wings with a red eclipse ring.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(-0.5 - flap * 0.4);
    const g = ctx.createLinearGradient(0, 0, 90, 0);
    g.addColorStop(0, '#2A1740');
    g.addColorStop(1, '#12081F');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(52, -6, 58, 34, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#1A0B2E';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FB7185';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(-8, -8, 4.5, 0, Math.PI * 2);
  ctx.arc(8, -8, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMoth(ctx, moth, time, dimmed) {
  const flap = Math.sin(moth.flap) * 0.55;
  // Wings fold at rest and spread in flight: a resting moth reads as a
  // moth, not a butterfly, and the fold shows in every menu shot.
  const speed = Math.hypot(moth.vx || 0, moth.vy || 0);
  const fold = Math.max(0.2, Math.min(0.8, 1 - speed / 320));
  ctx.save();
  ctx.translate(moth.x, moth.y);
  // The moth is drawn ~1.5x its collision radius: the hitbox stays
  // forgiving while the sprite reads clearly at 300px.
  ctx.scale(1.5, 1.5);
  if (moth.invuln > 0 && Math.floor(time * 14) % 2 === 0 && !dimmed) {
    ctx.globalAlpha = 0.35;
  }
  if (dimmed) ctx.globalAlpha = 0.45;
  // Lantern light spilling under the moth.
  drawGlowOrb(ctx, 0, 10, 60, PALETTE.amber, dimmed ? 0.25 : 0.55);
  ctx.rotate(moth.angle + Math.PI / 2);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(-0.35 - flap * 0.45 - fold * 0.5);
    const g = ctx.createLinearGradient(0, 0, 46, -10);
    g.addColorStop(0, '#FFE9A8');
    g.addColorStop(0.55, '#FFB347');
    g.addColorStop(1, '#F97316');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(24, -14, 26, 15, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,247,230,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Wing spots, like lantern glass.
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(30, -18, 4, 0, Math.PI * 2);
    ctx.arc(18, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Lower wing, teal-edged, tucked in when the wings fold.
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(0.5 + flap * 0.35 - fold * 0.9);
    ctx.fillStyle = '#E8823A';
    ctx.beginPath();
    ctx.ellipse(20, 14, 18, 10, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  // Fuzzy body: a wide thorax with short fur strokes on both flanks.
  ctx.fillStyle = '#3A2417';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,120,60,0.95)';
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const a = (i / 3) * 1.05;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * 10, -6 + Math.cos(a) * 8);
    ctx.lineTo(Math.sin(a) * 15, -6 + Math.cos(a) * 13);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFD166';
  ctx.beginPath();
  ctx.arc(0, -20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1F2937';
  ctx.beginPath();
  ctx.arc(-2.6, -21, 1.6, 0, Math.PI * 2);
  ctx.arc(2.6, -21, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Feathery antennae: a shaft with short barbs, the clearest
  // moth-vs-butterfly tell at small size.
  for (const side of [-1, 1]) {
    const bx = side * 4;
    const by = -26;
    const tx = side * 16;
    const ty = -42;
    ctx.strokeStyle = '#3A2417';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(side * 12, -38, tx, ty);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const px = bx + (tx - bx) * t;
      const py = by + (ty - by) * t;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + side * 5, py - 3);
      ctx.stroke();
    }
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(-16, -42, 2.6, 0, Math.PI * 2);
  ctx.arc(16, -42, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGarden(ctx, world) {
  const { stars, fireflies } = world.garden;
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // A glowing pale-gold moon with a soft halo: the garden's big light.
  drawGlowOrb(ctx, 1080, 110, 92, '#FFE9A8', 0.65);
  drawGlowOrb(ctx, 1080, 110, 52, '#FFF3C4', 0.5);
  const moon = ctx.createRadialGradient(1070, 100, 6, 1080, 110, 46);
  moon.addColorStop(0, '#FFFBEA');
  moon.addColorStop(0.55, '#FFE9A8');
  moon.addColorStop(1, '#F2C94C');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(1080, 110, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,251,234,0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(214,164,64,0.4)';
  ctx.beginPath();
  ctx.arc(1066, 100, 8, 0, Math.PI * 2);
  ctx.arc(1092, 122, 6, 0, Math.PI * 2);
  ctx.arc(1088, 96, 4.5, 0, Math.PI * 2);
  ctx.fill();

  for (const s of stars) {
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.tw));
    ctx.fillStyle = '#E0E7FF';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Distant flower silhouettes along the bottom, swaying gently.
  ctx.strokeStyle = 'rgba(46,58,125,0.9)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const x = i * 52 + 10;
    const sway = Math.sin(world.time * 0.7 + i) * 6;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.quadraticCurveTo(x + sway, VIEW_H - 40, x + sway * 1.6, VIEW_H - 62 - (i % 3) * 14);
    ctx.stroke();
    ctx.fillStyle = 'rgba(94,234,212,0.28)';
    ctx.beginPath();
    ctx.arc(x + sway * 1.6, VIEW_H - 62 - (i % 3) * 14, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const f of fireflies) {
    const glow = 0.4 + 0.6 * Math.abs(Math.sin(f.ph));
    drawGlowOrb(ctx, f.x, f.y, 7, PALETTE.mint, 0.5 * glow);
    ctx.fillStyle = '#D1FAE5';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, world) {
  // Hearts, top left.
  for (let i = 0; i < world.maxHearts; i++) {
    drawHeart(ctx, 44 + i * 36, 40, 26, PALETTE.rose, i < world.hearts);
  }
  if (world.shield) {
    ctx.fillStyle = PALETTE.teal;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('◈ SHIELD', 30, 72);
  }

  // Score, big and top-centre-left where it survives shrinking.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(String(world.score), 30, 116);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText(`BEST ${world.best}`, 32, 140);

  // Wave, top centre.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(`WAVE ${world.wave}`, VIEW_W / 2, 44);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 14px ${FONT}`;
  const quota = waveQuota(world.wave);
  if (world.boss) {
    ctx.fillText('BEAT THE ECLIPSE MOTH', VIEW_W / 2, 66);
  } else {
    ctx.fillText(`MOTES ${world.waveCollected} / ${quota}`, VIEW_W / 2, 66);
  }

  // Boss health bar.
  if (world.boss) {
    const b = world.boss;
    const w = 420;
    const x = VIEW_W / 2 - w / 2;
    const y = 76;
    ctx.fillStyle = 'rgba(10,14,39,0.8)';
    roundRect(ctx, x, y, w, 16, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.rose;
    roundRect(ctx, x + 2, y + 2, (w - 4) * Math.max(0, b.hp / b.maxHp), 12, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText('ECLIPSE MOTH', VIEW_W / 2, 106);
  }

  // Lantern meter, top right.
  const lx = VIEW_W - 270;
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 15px ${FONT}`;
  ctx.fillText('✦ LANTERN', lx, 36);
  ctx.fillStyle = 'rgba(10,14,39,0.8)';
  roundRect(ctx, lx, 46, 240, 16, 8);
  ctx.fill();
  const fill = world.lantern / LANTERN.max;
  const lg = ctx.createLinearGradient(lx, 0, lx + 240, 0);
  lg.addColorStop(0, PALETTE.amber);
  lg.addColorStop(1, PALETTE.gold);
  ctx.fillStyle = lg;
  if (fill > 0.02) {
    roundRect(ctx, lx + 2, 48, (240 - 4) * fill, 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(fill >= 1 ? 'BURST READY — full!' : 'fills as you gather light', lx, 80);

  // Combo badge.
  const mult = comboMultiplier(world);
  if (world.combo >= 3) {
    ctx.textAlign = 'center';
    ctx.fillStyle = mult >= 3 ? PALETTE.gold : PALETTE.amber;
    ctx.font = `800 24px ${FONT}`;
    ctx.fillText(`COMBO x${mult}  (${world.combo})`, VIEW_W / 2, 140);
  }

  // Dash cooldown, bottom centre.
  const moth = world.moth;
  const cdMax = 1.5 * world.dashCdMul;
  const ready = moth.dashCd <= 0;
  const dw = 180;
  ctx.fillStyle = 'rgba(10,14,39,0.8)';
  roundRect(ctx, VIEW_W / 2 - dw / 2, VIEW_H - 34, dw, 12, 6);
  ctx.fill();
  ctx.fillStyle = ready ? PALETTE.teal : '#3B4A8F';
  roundRect(ctx, VIEW_W / 2 - dw / 2 + 2, VIEW_H - 32, (dw - 4) * (ready ? 1 : 1 - moth.dashCd / cdMax), 8, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'DASH READY — SPACE / CLICK' : 'DASH…', VIEW_W / 2, VIEW_H - 42);

  // Mute + pause hints, bottom right.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(185,194,242,0.75)';
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('P pause · M sound · R restart', VIEW_W - 24, VIEW_H - 16);
}

function drawBanner(ctx, world) {
  if (world.bannerTimer <= 0 || !world.banner) return;
  const a = Math.min(1, world.bannerTimer);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 44px ${FONT}`;
  ctx.shadowColor = 'rgba(255,179,71,0.8)';
  ctx.shadowBlur = 24;
  ctx.fillText(world.banner, VIEW_W / 2, 210);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(11,16,48,0.88)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(8,10,32,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 290, 96, 700, 500);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 76px ${FONT}`;
  ctx.shadowColor = 'rgba(255,179,71,0.9)';
  ctx.shadowBlur = 30;
  ctx.fillText('MOTHLIGHT', VIEW_W / 2, 196);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.teal;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText('— Night of the Lanterns —', VIEW_W / 2, 236);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText('You are a lantern moth. Gather the light,', VIEW_W / 2, 292);
  ctx.fillText('dodge the shadow wisps, and beat the Eclipse Moth.', VIEW_W / 2, 320);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText('MOUSE or WASD / ARROWS to fly  ·  SPACE / CLICK to dash', VIEW_W / 2, 372);
  ctx.fillText('Dash through wisps to banish them — and through the boss to hurt it.', VIEW_W / 2, 400);
  ctx.fillText('Fill your lantern to burst the dark away. Choose a blessing each wave.', VIEW_W / 2, 428);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 24px ${FONT}`;
  const blink = 0.8 + 0.2 * Math.sin(world.time * 3);
  ctx.globalAlpha = blink;
  ctx.fillText('▶  PRESS ENTER OR CLICK TO BEGIN', VIEW_W / 2, 492);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText(`BEST SCORE  ${world.best}`, VIEW_W / 2, 540);
  ctx.fillText('P pause · M sound · R restart', VIEW_W / 2, 566);
}

function drawBlessing(ctx, world) {
  ctx.fillStyle = 'rgba(8,10,32,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(`WAVE ${world.wave} CLEARED!`, VIEW_W / 2, 120);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText('Choose a blessing — click a card or press 1, 2 or 3', VIEW_W / 2, 160);
  const cards = world.blessingChoices;
  const cw = 300;
  const ch = 250;
  const gap = 36;
  const total = cards.length * cw + (cards.length - 1) * gap;
  let x = VIEW_W / 2 - total / 2;
  const y = 210;
  cards.forEach((b, i) => {
    panel(ctx, x, y, cw, ch, 16);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(x + cw / 2, y + 62, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `800 34px ${FONT}`;
    ctx.fillText(b.glyph, x + cw / 2, y + 75);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 24px ${FONT}`;
    ctx.fillText(b.name, x + cw / 2, y + 138);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = `600 17px ${FONT}`;
    const words = b.desc.split(' ');
    let line = '';
    let ly = y + 176;
    for (const word of words) {
      if ((line + ' ' + word).trim().length > 26) {
        ctx.fillText(line.trim(), x + cw / 2, ly);
        ly += 24;
        line = word;
      } else {
        line += ' ' + word;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x + cw / 2, ly);
    ctx.fillStyle = PALETTE.teal;
    ctx.font = `800 18px ${FONT}`;
    ctx.fillText(`[ ${i + 1} ]`, x + cw / 2, y + ch - 22);
    x += cw + gap;
  });
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText(`Score ${world.score}  ·  Wave ${world.wave}  ·  Hearts ${world.hearts}/${world.maxHearts}`, VIEW_W / 2, 520);
}

function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(8,10,32,0.65)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 440, 250, 400, 220);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText('PAUSED', VIEW_W / 2, 330);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 19px ${FONT}`;
  ctx.fillText('Press P to keep flying', VIEW_W / 2, 380);
  ctx.fillText('R restarts the run', VIEW_W / 2, 412);
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(8,10,32,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 330, 110, 620, 500);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.rose;
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText('THE LIGHT FADES', VIEW_W / 2, 190);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 19px ${FONT}`;
  ctx.fillText('The wisps close in — but the lantern can be relit.', VIEW_W / 2, 226);
  const over = world.over || { score: world.score, wave: world.wave, best: world.best, collected: 0, bosses: 0 };
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(`SCORE  ${over.score}`, VIEW_W / 2, 300);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(`BEST  ${over.best}${world.newBest ? '  ★ NEW BEST!' : ''}`, VIEW_W / 2, 342);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(`Reached wave ${over.wave}  ·  ${over.collected} motes gathered  ·  ${over.bosses} boss${over.bosses === 1 ? '' : 'es'} banished`, VIEW_W / 2, 382);
  // A big RESTART button, drawn as part of the scene.
  ctx.fillStyle = PALETTE.amber;
  roundRect(ctx, VIEW_W / 2 - 170, 420, 340, 64, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `800 28px ${FONT}`;
  ctx.fillText('↻  RESTART', VIEW_W / 2, 462);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 17px ${FONT}`;
  ctx.fillText('Press R or Enter — or click anywhere to fly again', VIEW_W / 2, 540);
}

// The one entry point: draw the whole frame for the world's state.
export function drawGame(ctx, world) {
  ctx.save();
  if (world.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawGarden(ctx, world);

  for (const web of world.webs) {
    ctx.strokeStyle = 'rgba(167,139,250,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(web.x, web.y, web.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(167,139,250,0.25)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(web.x, web.y, web.r * (0.33 + i * 0.33), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  for (const mote of world.motes) drawMote(ctx, mote, world.time);
  for (const wisp of world.wisps) drawWisp(ctx, wisp);
  if (world.boss) drawBoss(ctx, world.boss, world.time);
  for (const orb of world.orbs) {
    drawGlowOrb(ctx, orb.x, orb.y, orb.r, '#FB7185', 0.7);
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (world.status !== 'gameover') {
    drawMoth(ctx, world.moth, world.time, false);
  } else {
    // The fallen moth, dimmed, wings folded at the bottom of the scene.
    const fallen = { ...world.moth, y: Math.min(world.moth.y, VIEW_H - 120), flap: 0 };
    drawMoth(ctx, fallen, 0, true);
  }

  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.font = `800 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  if (world.flash > 0) {
    ctx.fillStyle = `rgba(251,113,133,${world.flash * 0.55})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // A soft vignette so the night feels deep at the edges.
  const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  vg.addColorStop(0, 'rgba(5,8,25,0)');
  vg.addColorStop(1, 'rgba(5,8,25,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (world.status === 'playing' || world.status === 'paused' || world.status === 'blessing') {
    drawHud(ctx, world);
  }
  drawBanner(ctx, world);

  if (world.status === 'title') drawTitle(ctx, world);
  if (world.status === 'blessing') drawBlessing(ctx, world);
  if (world.status === 'paused') drawPaused(ctx, world);
  if (world.status === 'gameover') drawGameOver(ctx, world);
  ctx.restore();
}
