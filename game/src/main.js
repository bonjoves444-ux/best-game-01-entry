// Mothlight — the entry point: canvas setup, the game loop, and the
// state machine (title / playing / blessing / paused / victory / gameover).
// Shot mode (?shot=<name>&seed=<n>) stages one frozen scene and never
// advances the simulation, so a screenshot is exactly the staged frame.

import { VIEW_W, VIEW_H } from './config.js';
import { createWorld, startRun, updateWorld, offerBlessings, applyBlessing } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const audio = createAudio();
let world;
let shotMode = false;

if (shotName) {
  // A staged, frozen scene for screenshots.
  shotMode = true;
  world = stageShot(seed, shotName);
} else {
  world = createWorld(seed);
}

// A read-only handle for live verification harnesses: play-tests read
// score, hearts, wave and boss health through it. It never drives the
// game — the loop above is the only thing that changes the world.
window.__mothlight = world;

const input = createInput(canvas);

function pressStart() {
  audio.unlock();
  if (world.status === 'title' || world.status === 'gameover' || world.status === 'victory') {
    startRun(world);
  }
}

function clickPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

// Blessing cards are laid out in render.js: three 300-wide cards
// centred with a 36px gap, starting at y=210. A click inside one
// picks it, mirroring the 1/2/3 keys.
function blessingAt(point) {
  const cards = world.blessingChoices;
  if (cards.length === 0) return -1;
  const cw = 300;
  const gap = 36;
  const total = cards.length * cw + (cards.length - 1) * gap;
  const x0 = VIEW_W / 2 - total / 2;
  const y0 = 210;
  const ch = 250;
  if (point.y < y0 || point.y > y0 + ch) return -1;
  for (let i = 0; i < cards.length; i++) {
    if (point.x >= x0 + i * (cw + gap) && point.x <= x0 + i * (cw + gap) + cw) return i;
  }
  return -1;
}

canvas.addEventListener('click', (event) => {
  audio.unlock();
  if (world.status === 'title' || world.status === 'gameover' || world.status === 'victory') {
    pressStart();
    return;
  }
  if (world.status === 'blessing') {
    const i = blessingAt(clickPoint(event));
    if (i >= 0) {
      audio.blessing();
      applyBlessing(world, world.blessingChoices[i].id);
    }
  }
});

function handleKeys(pressed) {
  if (pressed.has('Enter')) {
    if (world.status === 'title' || world.status === 'gameover' || world.status === 'victory') pressStart();
  }
  if (pressed.has('KeyR')) {
    if (world.status !== 'title') startRun(world);
  }
  if (pressed.has('KeyP')) {
    if (world.status === 'playing') world.status = 'paused';
    else if (world.status === 'paused') world.status = 'playing';
  }
  if (pressed.has('KeyM')) {
    audio.toggleMute();
  }
  if (world.status === 'blessing') {
    for (const code of ['Digit1', 'Digit2', 'Digit3']) {
      if (pressed.has(code)) {
        const i = Number(code.slice(-1)) - 1;
        if (world.blessingChoices[i]) {
          audio.blessing();
          applyBlessing(world, world.blessingChoices[i].id);
        }
      }
    }
  }
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (!shotMode) {
    handleKeys(input.takePressed());
    if (world.status === 'playing') {
      updateWorld(world, input, dt, audio);
    } else {
      // Menus still breathe: stars twinkle behind the panels.
      world.time += dt;
      for (const star of world.garden.stars) star.tw += dt * star.sp;
      input.takePressed();
      input.takeDash();
    }
  }
  drawGame(ctx, world);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// The shoot harness waits for this flag, then captures the frame.
if (shotMode) {
  requestAnimationFrame(() => {
    window.__shotReady = true;
  });
}
