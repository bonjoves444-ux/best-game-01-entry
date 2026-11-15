// Mothlight — the hand-in program for best-game-01.
//
// What it does, and nothing else: it gathers the entry's own files
// (game/ and screenshots/ from this repository) into the output folder
// the grader reads, then asks the kit's dossier builder to describe
// that folder in dossier.json. The output folder itself is never
// removed — on the grader it is a mount point — only created when it
// is missing, and only the entry's files are written into it.
//
// Run it locally the same way the grader does:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// (without the variable it writes to /output).

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const name of ['game', 'screenshots']) {
  cpSync(join(repoRoot, name), join(outDir, name), { recursive: true });
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, caps));

// Read the dossier back and say how big it is: a silent hand-in that
// wrote a truncated file would be worse than a loud failure.
const dossierBytes = readFileSync(join(outDir, 'dossier.json')).length;
console.log(`Mothlight handed in to ${outDir} (dossier.json ${dossierBytes} bytes)`);
