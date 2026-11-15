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

// The wave 5 boss fight: the Eclipse Moth with a visible HP bar, the
// player moth dashing through it, the lantern nearly full, motes,
// wisps of every kind and webs still on the field — depth in one shot.
function stagePlay(world) {
  startRun(world);
  startWave(world, 5);
  world.time = 6.2;
  world.score = 2340;
  world.best = 2400;
  world.combo = 9;
  world.comboTimer = 2.0;
  world.lantern = 88;
  world.hearts = 3;
  // The boss has already taken damage from the moth's dash.
  world.boss.hp = 11;
  world.boss.x = 780;
  world.boss.y = 290;
  world.banner = 'THE ECLIPSE MOTH';
  world.bannerTimer = 1.4;
  world.moth.x = 620;
  world.moth.y = 330;
  world.moth.angle = 0.3;
  world.moth.vx = 700;
  world.moth.vy = -160;
  world.moth.dashTime = 0.12;
  world.moth.dashCd = 0.3;
  scatterMotes(world, 8);
  scatterWisps(world, ['drifter', 'drifter', 'dart', 'dart', 'weaver']);
  world.webs.push({ x: 920, y: 520, r: 74, life: 5 });
  world.webs.push({ x: 260, y: 200, r: 74, life: 5 });
  burst(world, 620, 330, 18, '#5EEAD4');
  burst(world, 780, 290, 16, '#FB7185');
  burst(world, 700, 310, 10, '#FFB347');
  for (const p of world.particles) p.life = 0.6;
  world.floaters.push({ x: 880, y: 390, text: 'HIT!', color: '#FB7185', life: 0.9 });
  world.floaters.push({ x: 520, y: 300, text: '+40', color: '#FFD166', life: 0.8 });
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
  world.over = { score: 1870, wave: 4, best: 2400, collected: 63, bosses: 0 };
  scatterMotes(world, 4);
  scatterWisps(world, ['drifter', 'drifter', 'dart', 'weaver']);
  burst(world, 180, 560, 18, '#FB7185');
  for (const p of world.particles) p.life = 0.6;
  return world;
}

const STAGES = { start: stageStart, play: stagePlay, blessing: stageBlessing, end: stageEnd };

// Build the frozen world for one named shot. Unknown names fall back
// to the title scene rather than failing the page.
export function stageShot(seed, name) {
  const world = createWorld(seed);
  const stage = STAGES[name] || stageStart;
  return stage(world);
}
