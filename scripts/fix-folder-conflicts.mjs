// fix-folder-conflicts.mjs
// Behebt Ordner-Konflikte: Bestandsteile, deren draco-GLB noch in einem anderen
// Gruppen-Ordner liegt, als meta.json (classification.group) angibt. Scannt
// meta.json direkt (lebender Stand) statt der statischen Momentaufnahme aus
// NEW MODELS/sorted/_conflicts.json — deckt damit auch Fälle ab, die nicht aus
// dem Sortier-Lauf stammen (z. B. spätere manuelle Korrekturen). Verschiebt nur,
// wenn die Quelle existiert und am Ziel noch keine Datei liegt (nie überschreiben).
//
//   node scripts/fix-folder-conflicts.mjs           # ausführen
//   node scripts/fix-folder-conflicts.mjs --dry-run # nur zählen, nichts schreiben

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const META_PATH = path.join(ROOT, 'public/data/meta.json');
const MODELS = path.join(ROOT, 'public/models');

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));

let moved = 0, skippedNoFile = 0, skippedTargetExists = 0, skippedIncomplete = 0;
const log = [];

for (const e of meta) {
  const fj = e.model?.root_name;
  const group = e.classification?.group;
  const draco = e.model?.variants?.draco;
  if (!fj || !group || !draco?.path || !draco?.filename) { skippedIncomplete++; continue; }
  if (draco.path === group) continue; // schon konsistent

  const oldPath = path.join(MODELS, draco.path, draco.filename);
  const newDir = path.join(MODELS, group);
  const newPath = path.join(newDir, draco.filename);

  if (!fs.existsSync(oldPath)) { skippedNoFile++; continue; }
  if (fs.existsSync(newPath)) { skippedTargetExists++; continue; }

  log.push(`${fj}: ${draco.path}/ -> ${group}/`);
  if (!DRY) {
    fs.mkdirSync(newDir, { recursive: true });
    fs.renameSync(oldPath, newPath);
    draco.path = group;
    e.model.asset.path = group;
    e.model.asset.url = `${group}/${draco.filename}`;
  }
  moved++;
}

if (!DRY && moved > 0) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}verschoben: ${moved}`);
console.log(`übersprungen — Quelle fehlt: ${skippedNoFile}`);
console.log(`übersprungen — Ziel existiert bereits: ${skippedTargetExists}`);
console.log(`übersprungen — Eintrag unvollständig: ${skippedIncomplete}`);
if (log.length) console.log('\n' + log.join('\n'));
