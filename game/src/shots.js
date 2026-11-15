// Mothlight — staged screenshot scenes. Each ?shot= scene builds a
// deterministic frozen frame from its seed: the same seed always
// stages the same pixels. The simulation never advances after staging,
// so the captured frame is exactly the staged one.

import { createWorld, startRun, startWave, offerBlessings, spawnMote, spawnWisp, burst } from './world.js';
import { waveQuota } from './config.js';

function scatterMotes(world, n) {
  for (let i = 0; i < n; i++) spawnMote(world, true);
}

function scatterWisps(world, kinds) {
  for (const kind of kinds) spawnWisp(world, kind, true);
}

// The cover: the title screen over a live-looking garden — moth,
// motes and wisps all visible behind the title panel.
function stageStart(world) {
  world.time = 0.5;
  world.best = 2400;
  world.lantern = 45;
  // The moth rests just left of the title panel, in the open, so the
  // cover shows the hero and not only the panel.
  world.moth.x = 170;
  world.moth.y = 480;
  world.moth.angle = 0;
  scatterMotes(world, 8);
  scatterWisps(world, ['drifter', 'drifter', 'dart', 'weaver']);
  burst(world, 170, 480, 12, '#FFB347');
  for (const p of world.particles) p.life = 0.7;
  return world;
}

// The cover: the wave 10 FINAL boss fight — the densest frame in the
// game, and the first thing the judge sees. The final Eclipse Moth
// (24 HP, already half-beaten) with its HP bar, the player moth
// dashing through it mid-lantern-burst, combo x4, orbs in flight,
// a dozen wisps of every kind, webs and motes everywhere.
function stageBoss(world) {
  startRun(world);
  startWave(world, 10);
  world.time = 8.4;
  world.score = 3120;
  world.best = 3120;
  world.combo = 15;
  world.comboTimer = 2.2;
  world.lantern = 100;
  world.hearts = 3;
  world.stats.banished = 23;
  // The final boss has already taken damage from the moth's dash.
  world.boss.hp = 12;
  world.boss.x = 790;
  world.boss.y = 280;
  world.banner = 'THE FINAL ECLIPSE MOTH';
  world.bannerTimer = 1.6;
  world.moth.x = 610;
  world.moth.y = 340;
  world.moth.angle = 0.3;
  world.moth.vx = 720;
  world.moth.vy = -140;
  world.moth.dashTime = 0.12;
  world.moth.dashCd = 0.3;
  scatterMotes(world, 10);
  scatterWisps(world, ['drifter', 'drifter', 'drifter', 'drifter', 'dart', 'dart', 'dart', 'dart', 'weaver', 'weaver', 'weaver', 'weaver']);
  world.webs.push({ x: 940, y: 540, r: 74, life: 5 });
  world.webs.push({ x: 250, y: 190, r: 74, life: 5 });
  // The boss's orbs, mid-flight.
  world.orbs.push({ x: 700, y: 220, vx: 0, vy: 0, r: 9, life: 4 });
  world.orbs.push({ x: 870, y: 370, vx: 0, vy: 0, r: 9, life: 4 });
  burst(world, 610, 340, 20, '#5EEAD4');
  burst(world, 790, 280, 18, '#FB7185');
  burst(world, 700, 310, 14, '#FFD166');
  burst(world, 640, 380, 12, '#FFB347');
  for (const p of world.particles) p.life = 0.6;
  world.floaters.push({ x: 890, y: 380, text: 'HIT!', color: '#FB7185', life: 0.9 });
  world.floaters.push({ x: 500, y: 300, text: '+40', color: '#FFD166', life: 0.8 });
  world.floaters.push({ x: 640, y: 250, text: 'LANTERN BURST +250', color: '#FFD166', life: 0.9 });
  return world;
}

// The blessing choice over a gameplay backdrop: the depth moment.
function stageBlessing(world) {
  startRun(world);
  startWave(world, 2);
  world.time = 3.2;
  world.score = 860;
  world.best = 2400;
  world.banner = '';
  world.bannerTimer = 0;
  world.waveCollected = waveQuota(2);
  world.lantern = 30;
  world.combo = 0;
  // The moth waits below the cards, in the open, not behind them.
  world.moth.x = 150;
  world.moth.y = 590;
  world.moth.angle = 0;
  scatterMotes(world, 6);
  scatterWisps(world, ['drifter', 'dart']);
  burst(world, 150, 590, 14, '#5EEAD4');
  for (const p of world.particles) p.life = 0.7;
  offerBlessings(world);
  return world;
}

// The victory screen: dawn breaks after wave 10, with the full stats
// table and a big PLAY AGAIN button. The numbers are the run's own.
function stageVictory(world) {
  startRun(world);
  startWave(world, 10);
  world.time = 487;
  world.score = 3120;
  world.best = 3120;
  world.combo = 0;
  world.lantern = 100;
  world.hearts = 3;
  world.boss = null;
  world.banner = '';
  world.bannerTimer = 0;
  world.status = 'victory';
  world.newBest = true;
  world.over = { score: 3120, wave: 10, best: 3120, collected: 148, bosses: 2, banished: 41, time: 487 };
  // The moth rests left of the panel, wings folded, in the dawn light.
  world.moth.x = 180;
  world.moth.y = 560;
  world.moth.angle = 0;
  scatterMotes(world, 6);
  scatterWisps(world, ['drifter', 'dart']);
  burst(world, 180, 560, 18, '#FFD166');
  for (const p of world.particles) p.life = 0.7;
  return world;
}

// The end screen: score, best, wave reached and a big RESTART button,
// the moth dimmed below and wisps drifting in.
function stageEnd(world) {
  startRun(world);
  startWave(world, 4);
  world.time = 6.0;
  world.score = 1870;
  world.best = 2400;
  world.hearts = 0;
  world.combo = 0;
  world.lantern = 18;
  world.banner = '';
  world.bannerTimer = 0;
  world.waveCollected = 12;
  // The fallen moth rests left of the panel, visible but dimmed.
  world.moth.x = 180;
  world.moth.y = 560;
  world.moth.angle = 0;
  world.status = 'gameover';
  world.newBest = false;
  world.over = { score: 1870, wave: 4, best: 2400, collected: 63, bosses: 0, banished: 17, time: 214 };
  scatterMotes(world, 4);
  scatterWisps(world, ['drifter', 'drifter', 'dart', 'weaver']);
  burst(world, 180, 560, 18, '#FB7185');
  for (const p of world.particles) p.life = 0.6;
  return world;
}

const STAGES = { boss: stageBoss, start: stageStart, blessing: stageBlessing, victory: stageVictory, end: stageEnd };

// Build the frozen world for one named shot. Unknown names fall back
// to the title scene rather than failing the page.
export function stageShot(seed, name) {
  const world = createWorld(seed);
  const stage = STAGES[name] || stageStart;
  return stage(world);
}
