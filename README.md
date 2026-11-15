# Mothlight — Night of the Lanterns

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/bonjoves444-ux/best-game-01-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/bonjoves444-ux/best-game-01-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A complete 2D canvas arcade game for [make.fun's best-game-01](https://make.fun/bounty/best-game-01). You are a
lantern moth in a deep-indigo night garden: gather glowing light motes
to fill your lantern, chain combos, dodge shadow wisps, and dash through
the Eclipse Moth — the boss that arrives every fifth wave.

## How it plays

- **Goal:** gather each wave's mote quota to clear it; survive, beat the
  boss waves, and chase the best score (kept in localStorage).
- **Move:** mouse or WASD / arrow keys. **Dash:** Space or click — a
  burst of speed with brief invulnerability. Dashing through a wisp
  banishes it; dashing through the boss is how the boss is hurt.
- **Lantern meter:** fills as you gather motes. When full it bursts,
  clearing nearby wisps.
- **Blessings:** after every wave, choose 1 of 3 (click, or keys 1/2/3):
  faster wings, double motes, a shield, a mote magnet, a faster dash,
  an extra heart, or faster lantern fill.
- **Wisps:** Drifters chase, Darts lunge, Weavers lay slowing webs.
- **Lose:** three wing-hearts; a hit costs one. **Keys:** P pause,
  M mute, R restart, Enter start.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
```

No build step, no network, no external assets: plain static files,
WebAudio synth for sound, seeded RNG (`?seed=`).

## Screenshots

The four shots in `shots.json` are staged deterministically with
`?shot=<name>&seed=1` — title over a live garden, the wave 5 boss
fight, the blessing choice, and the game-over screen. Each scene freezes
after staging and sets `window.__shotReady` for capture.

## Files

- `game/src/config.js` — palette, tuning, wave table, blessings
- `game/src/random.js` — seeded RNG (mulberry32)
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — WebAudio synth, no audio files
- `game/src/world.js` — entities, waves, boss, collisions, scoring
- `game/src/render.js` — all canvas drawing, HUD and menus
- `game/src/shots.js` — staged `?shot=` scenes
- `game/src/main.js` — game loop and state machine
