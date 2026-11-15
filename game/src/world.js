// Mothlight — the world: entities, waves, the boss, collisions,
// blessings and scoring. Rendering lives in render.js; this file only
// decides what exists and what happens to it.

import {
  VIEW_W,
  VIEW_H,
  MOTH,
  MOTE,
  LANTERN,
  COMBO,
  HEARTS_START,
  HEARTS_MAX,
  TOTAL_WAVES,
  BLESSINGS,
  waveQuota,
  wispInterval,
  wispCap,
  wispSpeed,
  kindsForWave,
  isBossWave,
  bossHealth,
} from './config.js';
import { makeRng } from './random.js';

export function loadBest() {
  try {
    return Number(window.localStorage.getItem('mothlight.best') || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(value) {
  try {
    window.localStorage.setItem('mothlight.best', String(value));
  } catch {
    // Best score is a nicety; a blocked store never breaks play.
  }
}

// The night garden behind the action: stars and fireflies that drift
// for the whole run, drawn from the same seeded stream.
export function makeGarden(rng) {
  const stars = [];
  for (let i = 0; i < 130; i++) {
    stars.push({
      x: rng.range(0, VIEW_W),
      y: rng.range(0, VIEW_H),
      r: rng.range(0.6, 2.2),
      tw: rng.range(0, Math.PI * 2),
      sp: rng.range(0.4, 1.6),
    });
  }
  const fireflies = [];
  for (let i = 0; i < 26; i++) {
    fireflies.push({
      x: rng.range(0, VIEW_W),
      y: rng.range(0, VIEW_H),
      ph: rng.range(0, Math.PI * 2),
      sp: rng.range(0.3, 0.9),
      dx: rng.range(-14, 14),
      dy: rng.range(-10, 10),
    });
  }
  return { stars, fireflies };
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  const garden = makeGarden(rng);
  const world = {
    seed,
    rng,
    garden,
    time: 0,
    status: 'title',
    score: 0,
    best: loadBest(),
    combo: 0,
    comboTimer: 0,
    lantern: 0,
    wave: 1,
    waveCollected: 0,
    hearts: HEARTS_START,
    maxHearts: HEARTS_START,
    shield: false,
    speedMul: 1,
    moteMul: 1,
    magnetMul: 1,
    dashCdMul: 1,
    lanternMul: 1,
    chosen: [],
    blessingChoices: [],
    motes: [],
    wisps: [],
    orbs: [],
    webs: [],
    particles: [],
    floaters: [],
    boss: null,
    spawnTimer: 0,
    wispTimer: 0,
    shake: 0,
    flash: 0,
    banner: '',
    bannerTimer: 0,
    stats: { collected: 0, dashed: 0, hits: 0, bosses: 0, banished: 0 },
    over: null,
    newBest: false,
    moth: {
      x: VIEW_W / 2,
      y: VIEW_H / 2 + 60,
      vx: 0,
      vy: 0,
      r: MOTH.radius,
      angle: -Math.PI / 2,
      flap: 0,
      invuln: 0,
      dashTime: 0,
      dashCd: 0,
      dashX: 0,
      dashY: 0,
      slowed: 0,
    },
  };
  seedField(world, 9, 3);
  return world;
}

function seedField(world, moteCount, wispCount) {
  for (let i = 0; i < moteCount; i++) spawnMote(world, true);
  for (let i = 0; i < wispCount; i++) spawnWisp(world, 'drifter', true);
}

function edgePoint(rng) {
  const side = rng.int(0, 3);
  if (side === 0) return { x: rng.range(0, VIEW_W), y: -30 };
  if (side === 1) return { x: rng.range(0, VIEW_W), y: VIEW_H + 30 };
  if (side === 2) return { x: -30, y: rng.range(0, VIEW_H) };
  return { x: VIEW_W + 30, y: rng.range(0, VIEW_H) };
}

export function spawnMote(world, anywhere) {
  const { rng } = world;
  const m = anywhere
    ? { x: rng.range(70, VIEW_W - 70), y: rng.range(90, VIEW_H - 70) }
    : edgePoint(rng);
  world.motes.push({
    x: m.x,
    y: m.y,
    r: MOTE.radius,
    ph: rng.range(0, Math.PI * 2),
    pulse: rng.range(0.8, 1.6),
    drift: rng.range(-12, 12),
    golden: rng.chance(0.12),
  });
}

export function spawnWisp(world, kind, anywhere) {
  const { rng } = world;
  const p = anywhere
    ? { x: rng.range(80, VIEW_W - 80), y: rng.range(100, VIEW_H - 80) }
    : edgePoint(rng);
  const speed = wispSpeed(kind, world.wave);
  world.wisps.push({
    kind,
    x: p.x,
    y: p.y,
    r: kind === 'weaver' ? 24 : kind === 'dart' ? 20 : 23,
    vx: 0,
    vy: 0,
    speed,
    ph: rng.range(0, Math.PI * 2),
    lunge: rng.range(1.5, 3),
    lungeCd: rng.range(1.5, 3),
    webCd: rng.range(2.5, 4.5),
    wob: rng.range(0.5, 1.4),
  });
}

export function spawnBoss(world) {
  const { rng } = world;
  world.boss = {
    x: VIEW_W / 2,
    y: 150,
    vx: 0,
    vy: 0,
    r: 64,
    hp: bossHealth(world.wave),
    maxHp: bossHealth(world.wave),
    timer: 2,
    orbCd: 2.4,
    dashCd: 5,
    dashing: 0,
    ph: 0,
  };
  world.banner = 'THE ECLIPSE MOTH';
  world.bannerTimer = 2.4;
}

// A fresh run: same garden, everything else reset.
export function startRun(world) {
  const { rng, garden, best } = world;
  const fresh = createWorld(world.seed);
  fresh.rng = rng;
  fresh.garden = garden;
  fresh.best = best;
  fresh.status = 'playing';
  fresh.banner = 'WAVE 1 — GATHER THE LIGHT';
  fresh.bannerTimer = 2.2;
  Object.assign(world, fresh);
}

export function startWave(world, wave) {
  world.wave = wave;
  world.waveCollected = 0;
  world.wispTimer = 0;
  world.spawnTimer = 0;
  world.shield = world.chosen.includes('aegis');
  if (isBossWave(wave)) {
    spawnBoss(world);
  } else {
    world.banner = `WAVE ${wave}`;
    world.bannerTimer = 1.8;
  }
  // Top the field back up so a new wave never starts empty.
  while (world.motes.length < 7) spawnMote(world, true);
}

export function offerBlessings(world) {
  const pool = [...BLESSINGS];
  const picks = [];
  while (picks.length < 3 && pool.length > 0) {
    const i = Math.floor(world.rng.next() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  world.blessingChoices = picks;
  world.status = 'blessing';
}

export function applyBlessing(world, id) {
  const b = BLESSINGS.find((x) => x.id === id);
  if (!b) return;
  world.chosen.push(id);
  if (id === 'swift') world.speedMul *= 1.18;
  if (id === 'twin') world.moteMul *= 2;
  if (id === 'magnet') world.magnetMul *= 2.2;
  if (id === 'dash') world.dashCdMul *= 0.65;
  if (id === 'oil') world.lanternMul *= 1.5;
  if (id === 'heart') {
    world.maxHearts = Math.min(HEARTS_MAX, world.maxHearts + 1);
    world.hearts = Math.min(world.maxHearts, world.hearts + 1);
  }
  if (id === 'aegis') world.shield = true;
  burst(world, world.moth.x, world.moth.y, 26, '#5EEAD4');
  startWave(world, world.wave + 1);
  world.status = 'playing';
}

export function comboMultiplier(world) {
  return Math.min(COMBO.cap, 1 + Math.floor(world.combo / COMBO.step));
}

export function burst(world, x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = world.rng.range(0, Math.PI * 2);
    const sp = world.rng.range(40, 260);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: world.rng.range(0.35, 0.9),
      max: 0.9,
      r: world.rng.range(2, 5),
      color,
    });
  }
}

export function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, life: 1 });
}

function hurtMoth(world, fromX, fromY, audio) {
  const moth = world.moth;
  if (moth.invuln > 0 || moth.dashTime > 0) return false;
  if (world.shield) {
    world.shield = false;
    moth.invuln = 1;
    world.flash = 0.25;
    burst(world, moth.x, moth.y, 18, '#5EEAD4');
    addFloater(world, moth.x, moth.y - 34, 'SHIELD!', '#5EEAD4');
    return false;
  }
  world.hearts -= 1;
  world.stats.hits += 1;
  world.combo = 0;
  world.comboTimer = 0;
  moth.invuln = MOTH.hitInvuln;
  world.shake = 14;
  world.flash = 0.4;
  const dx = moth.x - fromX;
  const dy = moth.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  moth.vx = (dx / d) * MOTH.knockback;
  moth.vy = (dy / d) * MOTH.knockback;
  burst(world, moth.x, moth.y, 22, '#FB7185');
  if (audio) audio.hit();
  if (world.hearts <= 0) {
    endRun(world, audio);
  }
  return true;
}

function endRun(world, audio) {
  world.status = 'gameover';
  world.newBest = world.score > world.best;
  if (world.newBest) {
    world.best = world.score;
    saveBest(world.best);
  }
  world.over = {
    score: world.score,
    wave: world.wave,
    best: world.best,
    collected: world.stats.collected,
    bosses: world.stats.bosses,
    banished: world.stats.banished,
    time: world.time,
  };
  burst(world, world.moth.x, world.moth.y, 40, '#FFB347');
  if (audio) audio.gameOver();
}

// Dawn breaks: the final Eclipse Moth is beaten and all ten waves
// are cleared. The run is won, not just survived — the victory screen
// reads its table from world.over, so every number is a true one.
function winRun(world, audio) {
  world.status = 'victory';
  world.boss = null;
  world.newBest = world.score > world.best;
  if (world.newBest) {
    world.best = world.score;
    saveBest(world.best);
  }
  world.over = {
    score: world.score,
    wave: TOTAL_WAVES,
    best: world.best,
    collected: world.stats.collected,
    bosses: world.stats.bosses,
    banished: world.stats.banished,
    time: world.time,
  };
  burst(world, world.moth.x, world.moth.y, 60, '#FFD166');
  burst(world, VIEW_W / 2, 200, 40, '#FFFBEA');
  if (audio) audio.waveClear();
}

function lanternBurst(world, audio) {
  world.lantern = 0;
  let cleared = 0;
  for (const w of world.wisps) {
    const d = Math.hypot(w.x - world.moth.x, w.y - world.moth.y);
    if (d < LANTERN.burstRadius) {
      burst(world, w.x, w.y, 10, '#FFD166');
      cleared += 1;
    }
  }
  world.wisps = world.wisps.filter(
    (w) => Math.hypot(w.x - world.moth.x, w.y - world.moth.y) >= LANTERN.burstRadius,
  );
  if (world.boss) {
    const d = Math.hypot(world.boss.x - world.moth.x, world.boss.y - world.moth.y);
    if (d < LANTERN.burstRadius + world.boss.r) damageBoss(world, 1, audio);
  }
  world.score += LANTERN.burstScore + cleared * 25;
  world.stats.banished += cleared;
  addFloater(world, world.moth.x, world.moth.y - 44, `LANTERN BURST +${LANTERN.burstScore + cleared * 25}`, '#FFD166');
  world.shake = 8;
  if (audio) audio.burst();
}

function damageBoss(world, amount, audio) {
  const boss = world.boss;
  if (!boss) return;
  boss.hp -= amount;
  burst(world, boss.x, boss.y, 12, '#FB7185');
  if (boss.hp <= 0) {
    world.stats.bosses += 1;
    world.score += 500 + world.wave * 50;
    burst(world, boss.x, boss.y, 60, '#FFD166');
    addFloater(world, boss.x, boss.y - 70, 'ECLIPSE BANISHED!', '#FFD166');
    world.boss = null;
    world.shake = 10;
    if (audio) audio.burst();
    // Beating the boss clears the wave: blessings after wave 5,
    // and the dawn itself after the final boss on wave 10.
    world.motes = [];
    if (world.wave >= TOTAL_WAVES) {
      winRun(world, audio);
    } else {
      offerBlessings(world);
    }
  }
}

function updateMoth(world, input, dt, audio) {
  const moth = world.moth;
  const held = input.keysHeld();
  moth.invuln = Math.max(0, moth.invuln - dt);
  moth.dashCd = Math.max(0, moth.dashCd - dt);
  moth.slowed = Math.max(0, moth.slowed - dt);

  // Webs slow the moth while it stands in one.
  let inWeb = false;
  for (const web of world.webs) {
    if (Math.hypot(moth.x - web.x, moth.y - web.y) < web.r) inWeb = true;
  }
  if (inWeb) moth.slowed = 0.2;

  if (input.takeDash() && moth.dashCd <= 0 && moth.dashTime <= 0) {
    let dx = 0;
    let dy = 0;
    if (held.active) {
      dx = held.x;
      dy = held.y;
    } else if (input.state.mouseActive) {
      dx = input.state.mouseX - moth.x;
      dy = input.state.mouseY - moth.y;
    } else {
      dx = Math.cos(moth.angle);
      dy = Math.sin(moth.angle);
    }
    const len = Math.hypot(dx, dy) || 1;
    moth.dashX = dx / len;
    moth.dashY = dy / len;
    moth.dashTime = MOTH.dashTime;
    moth.dashCd = MOTH.dashCooldown * world.dashCdMul;
    moth.invuln = Math.max(moth.invuln, MOTH.dashInvuln);
    world.stats.dashed += 1;
    burst(world, moth.x, moth.y, 10, '#5EEAD4');
    if (audio) audio.dash();
  }

  const speed = MOTH.speed * world.speedMul * (moth.slowed > 0 ? 0.55 : 1);
  if (moth.dashTime > 0) {
    moth.dashTime -= dt;
    moth.vx = moth.dashX * MOTH.dashSpeed;
    moth.vy = moth.dashY * MOTH.dashSpeed;
  } else if (held.active) {
    const len = Math.hypot(held.x, held.y) || 1;
    const tx = (held.x / len) * speed;
    const ty = (held.y / len) * speed;
    moth.vx += (tx - moth.vx) * Math.min(1, MOTH.accel * dt);
    moth.vy += (ty - moth.vy) * Math.min(1, MOTH.accel * dt);
    moth.angle = Math.atan2(held.y, held.x);
  } else if (input.state.mouseActive) {
    const dx = input.state.mouseX - moth.x;
    const dy = input.state.mouseY - moth.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      const want = Math.min(speed, dist * 6);
      const tx = (dx / dist) * want;
      const ty = (dy / dist) * want;
      moth.vx += (tx - moth.vx) * Math.min(1, MOTH.accel * dt);
      moth.vy += (ty - moth.vy) * Math.min(1, MOTH.accel * dt);
      moth.angle = Math.atan2(dy, dx);
    } else {
      moth.vx *= Math.max(0, 1 - 8 * dt);
      moth.vy *= Math.max(0, 1 - 8 * dt);
    }
  }
  moth.x += moth.vx * dt;
  moth.y += moth.vy * dt;
  moth.x = Math.max(30, Math.min(VIEW_W - 30, moth.x));
  moth.y = Math.max(30, Math.min(VIEW_H - 30, moth.y));
  moth.flap += dt * (6 + Math.hypot(moth.vx, moth.vy) / 60);
}

function updateMotes(world, dt, audio) {
  const moth = world.moth;
  const magnetR = MOTE.magnetBase * world.magnetMul;
  for (const mote of world.motes) {
    mote.ph += dt * mote.pulse;
    mote.y += Math.sin(mote.ph) * 6 * dt + mote.drift * 0.1 * dt;
    const dx = moth.x - mote.x;
    const dy = moth.y - mote.y;
    const d = Math.hypot(dx, dy);
    if (d < magnetR && d > 1) {
      const pull = (1 - d / magnetR) * 320;
      mote.x += (dx / d) * pull * dt;
      mote.y += (dy / d) * pull * dt;
    }
    if (d < MOTE.collectRadius + mote.r) {
      mote.dead = true;
      world.stats.collected += 1;
      world.waveCollected += 1;
      world.combo += 1;
      world.comboTimer = COMBO.window;
      const mult = comboMultiplier(world);
      const value = MOTE.value * world.moteMul * mult * (mote.golden ? 5 : 1);
      world.score += value;
      world.lantern = Math.min(LANTERN.max, world.lantern + MOTE.lanternGain * world.lanternMul * (mote.golden ? 2 : 1));
      burst(world, mote.x, mote.y, mote.golden ? 16 : 8, mote.golden ? '#FFD166' : '#FFB347');
      addFloater(world, mote.x, mote.y - 16, `+${value}`, mote.golden ? '#FFD166' : '#FFF7E6');
      if (audio) audio.collect(world.combo);
      if (world.lantern >= LANTERN.max) lanternBurst(world, audio);
    }
  }
  world.motes = world.motes.filter((m) => !m.dead);
  // Keep the garden lit: a fresh mote drifts in for every one gathered.
  while (world.motes.length < 6) spawnMote(world, false);
}

function updateWisps(world, dt, audio) {
  const moth = world.moth;
  world.wispTimer -= dt;
  if (world.wispTimer <= 0 && world.wisps.length < wispCap(world.wave)) {
    world.wispTimer = wispInterval(world.wave);
    spawnWisp(world, world.rng.pick(kindsForWave(world.wave)), false);
  }
  for (const w of world.wisps) {
    w.ph += dt * w.wob;
    const dx = moth.x - w.x;
    const dy = moth.y - w.y;
    const d = Math.hypot(dx, dy) || 1;
    if (w.kind === 'dart') {
      w.lungeCd -= dt;
      if (w.lungeCd <= 0 && d < 320) {
        w.lunge = 0.5;
        w.lungeCd = world.rng.range(2, 3.2);
        w.vx = (dx / d) * w.speed * 3.4;
        w.vy = (dy / d) * w.speed * 3.4;
      }
      if (w.lunge > 0) {
        w.lunge -= dt;
      } else {
        w.vx += ((dx / d) * w.speed - w.vx) * Math.min(1, 3 * dt);
        w.vy += ((dy / d) * w.speed - w.vy) * Math.min(1, 3 * dt);
      }
    } else {
      w.vx += ((dx / d) * w.speed - w.vx) * Math.min(1, 2 * dt);
      w.vy += ((dy / d) * w.speed - w.vy) * Math.min(1, 2 * dt);
    }
    // A slow sideways wobble so their paths never look scripted.
    w.x += (w.vx + Math.cos(w.ph * 2) * 22) * dt;
    w.y += (w.vy + Math.sin(w.ph * 2) * 22) * dt;
    if (w.kind === 'weaver') {
      w.webCd -= dt;
      if (w.webCd <= 0) {
        w.webCd = world.rng.range(3.5, 5);
        world.webs.push({ x: w.x, y: w.y, r: 74, life: 5 });
      }
    }
    // Dashing through a wisp banishes it: the dash is also a weapon.
    if (moth.dashTime > 0 && Math.hypot(w.x - moth.x, w.y - moth.y) < w.r + moth.r + 6) {
      w.dead = true;
      world.score += 25;
      world.stats.banished += 1;
      burst(world, w.x, w.y, 14, '#A78BFA');
      addFloater(world, w.x, w.y - 18, '+25', '#A78BFA');
      continue;
    }
    if (Math.hypot(w.x - moth.x, w.y - moth.y) < w.r + moth.r - 8) {
      if (hurtMoth(world, w.x, w.y, audio)) {
        w.x -= (dx / d) * 40;
        w.y -= (dy / d) * 40;
      }
    }
  }
  world.wisps = world.wisps.filter((w) => !w.dead && w.x > -80 && w.x < VIEW_W + 80 && w.y > -80 && w.y < VIEW_H + 80);
}

function updateBoss(world, dt, audio) {
  const boss = world.boss;
  if (!boss) return;
  const moth = world.moth;
  boss.ph += dt;
  boss.timer -= dt;
  boss.orbCd -= dt;
  boss.dashCd -= dt;
  const dx = moth.x - boss.x;
  const dy = moth.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  if (boss.dashing > 0) {
    boss.dashing -= dt;
    boss.x += boss.vx * dt;
    boss.y += boss.vy * dt;
  } else {
    boss.vx += ((dx / d) * 70 - boss.vx) * Math.min(1, 2 * dt);
    boss.vy += ((dy / d) * 70 - boss.vy) * Math.min(1, 2 * dt);
    boss.x += (boss.vx + Math.cos(boss.ph) * 30) * dt;
    boss.y += (boss.vy + Math.sin(boss.ph * 1.3) * 30) * dt;
    if (boss.dashCd <= 0 && d < 420) {
      boss.dashCd = 5;
      boss.dashing = 0.5;
      boss.vx = (dx / d) * 520;
      boss.vy = (dy / d) * 520;
    }
  }
  boss.x = Math.max(80, Math.min(VIEW_W - 80, boss.x));
  boss.y = Math.max(80, Math.min(VIEW_H - 80, boss.y));
  if (boss.orbCd <= 0) {
    boss.orbCd = 2.2;
    const spread = 3;
    for (let i = 0; i < spread; i++) {
      const a = Math.atan2(dy, dx) + (i - 1) * 0.35;
      world.orbs.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(a) * 210,
        vy: Math.sin(a) * 210,
        r: 9,
        life: 4,
      });
    }
  }
  // Dashing through the boss is how it is beaten.
  if (moth.dashTime > 0 && d < boss.r + moth.r) {
    damageBoss(world, 1, audio);
    moth.dashTime = 0;
    moth.vx = -(dx / d) * 420;
    moth.vy = -(dy / d) * 420;
  } else if (d < boss.r + moth.r - 14) {
    hurtMoth(world, boss.x, boss.y, audio);
  }
  // The boss also drinks the dark: while it lives, motes still count.
}

function updateOrbs(world, dt, audio) {
  const moth = world.moth;
  for (const orb of world.orbs) {
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
    orb.life -= dt;
    if (Math.hypot(orb.x - moth.x, orb.y - moth.y) < orb.r + moth.r - 6) {
      orb.dead = true;
      hurtMoth(world, orb.x, orb.y, audio);
    }
  }
  world.orbs = world.orbs.filter((o) => !o.dead && o.life > 0 && o.x > -40 && o.x < VIEW_W + 40 && o.y > -40 && o.y < VIEW_H + 40);
}

function updateParticles(world, dt) {
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - 2.4 * dt);
    p.vy *= Math.max(0, 1 - 2.4 * dt);
    p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floaters) {
    f.y -= 42 * dt;
    f.life -= dt * 0.9;
  }
  world.floaters = world.floaters.filter((f) => f.life > 0);
  for (const web of world.webs) web.life -= dt;
  world.webs = world.webs.filter((w) => w.life > 0);
}

// One simulation step while playing. Returns nothing; the world is
// mutated in place and render.js draws whatever it holds.
export function updateWorld(world, input, dt, audio) {
  world.time += dt;
  world.shake = Math.max(0, world.shake - dt * 30);
  world.flash = Math.max(0, world.flash - dt);
  world.bannerTimer = Math.max(0, world.bannerTimer - dt);
  world.comboTimer -= dt;
  if (world.comboTimer <= 0) world.combo = 0;

  for (const star of world.garden.stars) star.tw += dt * star.sp;
  for (const f of world.garden.fireflies) {
    f.ph += dt * f.sp;
    f.x += Math.cos(f.ph) * f.dx * 0.08;
    f.y += Math.sin(f.ph * 1.4) * f.dy * 0.08;
  }

  updateMoth(world, input, dt, audio);
  updateMotes(world, dt, audio);
  updateWisps(world, dt, audio);
  updateBoss(world, dt, audio);
  updateOrbs(world, dt, audio);
  updateParticles(world, dt);

  // Wave complete: enough motes gathered and no boss to beat.
  // Wave 10 never offers blessings — clearing it wins the night.
  if (!world.boss && world.waveCollected >= waveQuota(world.wave) && world.status === 'playing') {
    if (world.wave >= TOTAL_WAVES) {
      winRun(world, audio);
    } else {
      world.score += 100 + world.wave * 25;
      if (audio) audio.waveClear();
      offerBlessings(world);
    }
  }
}
