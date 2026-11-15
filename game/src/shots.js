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

// Dense mid-game: wave 3, a combo running, the lantern two-thirds
// full, wisps of every kind closing in, a web on the field.
function stagePlay(world) {
  startRun(world);
  startWave(world, 3);
  world.time = 4.5;
  world.score = 1240;
  world.best = 2400;
  world.combo = 7;
  world.comboTimer = 2.0;
  world.lantern = 62;
  world.waveCollected = 7;
  world.banner = '';
  world.bannerTimer = 0;
  world.moth.x = 560;
  world.moth.y = 360;
  world.moth.angle = 0.4;
  world.moth.dashTime = 0.1;
  world.moth.dashCd = 0.5;
  scatterMotes(world, 10);
  scatterWisps(world, ['drifter', 'drifter', 'drifter', 'dart', 'dart', 'weaver', 'weaver', 'drifter']);
  world.webs.push({ x: 860, y: 480, r: 74, life: 5 });
  world.webs.push({ x: 300, y: 180, r: 74, life: 5 });
  burst(world, 560, 360, 16, '#5EEAD4');
  burst(world, 700, 300, 10, '#FFB347');
  for (const p of world.particles) p.life = 0.6;
  world.floaters.push({ x: 700, y: 280, text: '+20', color: '#FFF7E6', life: 0.9 });
  world.floaters.push({ x: 480, y: 300, text: '+40', color: '#FFD166', life: 0.8 });
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
