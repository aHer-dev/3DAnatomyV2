// draco-compress.mjs
// Draco-komprimiert alle GLB unter einem Verzeichnis IN PLACE.
// Nachschritt zur Blender-Aufbereitung (Blender hier ohne Draco-Lib).
//
// Nutzung:
//   node scripts/draco-compress.mjs "NEW MODELS/processed/draco"
//
// Voraussetzung: @gltf-transform/cli ist als devDependency installiert.

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const target = process.argv[2] || 'NEW MODELS/processed/draco';
if (!fs.existsSync(target)) {
  console.error(`Verzeichnis nicht gefunden: ${target}`);
  process.exit(1);
}

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.toLowerCase().endsWith('.glb')) out.push(p);
  }
  return out;
}

const files = walk(target);
console.log(`Draco-Kompression: ${files.length} GLB in ${target}`);
let before = 0, after = 0, fail = 0;
for (const f of files) {
  const b = fs.statSync(f).size;
  const r = spawnSync('npx', ['gltf-transform', 'draco', f, f], { stdio: 'ignore' });
  if (r.status !== 0) { console.error('  FEHLER:', path.basename(f)); fail++; continue; }
  const a = fs.statSync(f).size;
  before += b; after += a;
}
const kb = n => (n / 1024).toFixed(0);
console.log(`Fertig: ${files.length - fail} ok, ${fail} Fehler | ${kb(before)} KB -> ${kb(after)} KB ` +
  `(${before ? (100 - (after / before) * 100).toFixed(0) : 0}% kleiner)`);
