// Mothlight: Night of the Lanterns — tuning, palette and wave table.
// One job only: every number the game balances on lives here, so tuning
// never means hunting through the simulation or the drawing code.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PALETTE = {
  skyTop: '#0B1030',
  skyMid: '#141B4D',
  skyLow: '#1E2A6B',
  amber: '#FFB347',
  gold: '#FFD166',
  ember: '#FF8A3D',
  teal: '#5EEAD4',
  mint: '#A7F3D0',
  rose: '#FB7185',
  roseDeep: '#E11D48',
  violet: '#A78BFA',
  ink: '#0A0E27',
  panel: '#131A45',
  panelEdge: '#2E3A7D',
  text: '#FFF7E6',
  dim: '#B9C2F2',
};

export const MOTH = {
  radius: 26,
  speed: 350,
  accel: 14,
  dashSpeed: 980,
  dashTime: 0.22,
  dashCooldown: 1.5,
  dashInvuln: 0.38,
  hitInvuln: 1.3,
  knockback: 520,
};

export const MOTE = {
  radius: 10,
  value: 10,
  lanternGain: 9,
  magnetBase: 150,
  collectRadius: 34,
};

export const LANTERN = {
  max: 100,
  burstRadius: 260,
  burstScore: 150,
};

export const COMBO = {
  window: 2.6,
  step: 5,
  cap: 5,
};

export const HEARTS_START = 3;
export const HEARTS_MAX = 5;

// The night is finite: survive all ten waves and the dawn breaks.
// Wave 10 is the final Eclipse Moth; clearing it wins the run.
export const TOTAL_WAVES = 10;

// A wave is won by gathering its mote quota. Wisps keep arriving while
// the player gathers, so later waves are a race against a thicker dark.
export function waveQuota(wave) {
  return 10 + wave * 3;
}

export function wispInterval(wave) {
  return Math.max(0.55, 2.1 - wave * 0.13);
}

export function wispCap(wave) {
  return Math.min(24, 4 + wave * 2);
}

export function wispSpeed(kind, wave) {
  if (kind === 'dart') return 95 + wave * 7;
  if (kind === 'weaver') return 48 + wave * 4;
  return 62 + wave * 6;
}

// Which wisp kinds may appear from this wave on.
export function kindsForWave(wave) {
  if (wave >= 4) return ['drifter', 'dart', 'weaver'];
  if (wave >= 2) return ['drifter', 'dart'];
  return ['drifter'];
}

export function isBossWave(wave) {
  return wave === 5 || wave === TOTAL_WAVES;
}

export function bossHealth(wave) {
  if (wave >= TOTAL_WAVES) return 24;
  return 8 + wave * 2;
}

// Blessings offered between waves. Each one changes one number the
// player can feel at once; none of them is a trap choice.
export const BLESSINGS = [
  {
    id: 'swift',
    name: 'Swift Wings',
    glyph: '»',
    desc: 'Fly 18% faster. Outrun every wisp.',
  },
  {
    id: 'twin',
    name: 'Twin Glow',
    glyph: '✦',
    desc: 'Every mote is worth double points.',
  },
  {
    id: 'aegis',
    name: 'Aegis Lantern',
    glyph: '◈',
    desc: 'A shield that blocks one hit, each wave.',
  },
  {
    id: 'magnet',
    name: 'Moth Magnet',
    glyph: '◎',
    desc: 'Motes drift toward you from far away.',
  },
  {
    id: 'dash',
    name: 'Swift Dash',
    glyph: '➤',
    desc: 'Dash recharges 35% faster.',
  },
  {
    id: 'heart',
    name: 'Heartbloom',
    glyph: '♥',
    desc: 'Grow one extra wing-heart (max 5).',
  },
  {
    id: 'oil',
    name: 'Lantern Oil',
    glyph: '●',
    desc: 'Your lantern fills 50% faster.',
  },
];
