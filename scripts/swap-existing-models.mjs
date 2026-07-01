// swap-existing-models.mjs
// Ersetzt die Meshes der Bestandsteile (Strukturen, die schon vor der BP3D-
// Neuaufbereitung in der App waren) durch die neu prozessierten Versionen aus
// NEW MODELS/processed/{draco,hifi}/ — gleicher Maßstab/Transform wie die 766
// bereits integrierten neuen Teile (siehe integrate-new-models.mjs), nur diesmal
// für FJ-IDs, die in meta.json schon einen Eintrag haben (kein neuer Eintrag,
// nur Datei-Austausch + hifi-Pfad ergänzen).
//
// Matching über FJ-Root-Name (eindeutig), nicht über die aktuelle Gruppen-
// Zuordnung — vermeidet Fehlzuordnungen, falls classification.group und der
// processed/-Ordner mal auseinanderlaufen.
//
//   node scripts/swap-existing-models.mjs --dry-run         # nur zählen
//   node scripts/swap-existing-models.mjs --fj=FJ136,FJ1451 # nur bestimmte FJ (Pilot)
//   node scripts/swap-existing-models.mjs                   # voller Lauf

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const onlyFj = process.argv.find(a => a.startsWith('--fj='))?.split('=')[1]?.split(',').map(s => s.toUpperCase());
const META_PATH = path.join(ROOT, 'public/data/meta.json');
const MODELS = path.join(ROOT, 'public/models');
const PROC = path.join(ROOT, 'NEW MODELS/processed');
const AUTO_MARK = 'Auto-generiert aus BodyParts3D';

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));

function indexProcessed(tier) {
  const idx = new Map();
  const base = path.join(PROC, tier);
  for (const group of fs.readdirSync(base)) {
    const gp = path.join(base, group);
    if (!fs.statSync(gp).isDirectory()) continue;
    for (const f of fs.readdirSync(gp)) {
      if (f.toLowerCase().endsWith('.glb')) idx.set(f.replace(/\.glb$/i, '').toUpperCase(), path.join(gp, f));
    }
  }
  return idx;
}

const procDraco = indexProcessed('draco');
const procHifi = indexProcessed('hifi');

let swapped = 0, swappedHifiOnly = 0, skippedNew = 0, skippedNoProc = 0, skippedNotSelected = 0;
const log = [];

for (const e of meta) {
  const isAuto = (e.meta?.notes || '').startsWith(AUTO_MARK);
  if (isAuto) { skippedNew++; continue; } // 766 neue Teile sind schon auf dem neuen Stand

  const fj = e.model?.root_name;
  const group = e.classification?.group;
  if (!fj || !group) continue;
  if (onlyFj && !onlyFj.includes(fj.toUpperCase())) { skippedNotSelected++; continue; }

  const dracoSrc = procDraco.get(fj.toUpperCase());
  const hifiSrc = procHifi.get(fj.toUpperCase());
  if (!dracoSrc) { skippedNoProc++; continue; }

  const draco = e.model.variants.draco;
  const dracoDst = path.join(MODELS, draco.path || group, draco.filename || `${fj}.glb`);

  log.push(`${fj} (${group}): draco ersetzt${hifiSrc ? ' + hifi ergänzt' : ''}`);
  if (!DRY) {
    fs.mkdirSync(path.dirname(dracoDst), { recursive: true });
    fs.copyFileSync(dracoSrc, dracoDst);
  }
  swapped++;

  if (hifiSrc) {
    const hifi = e.model.variants.hifi;
    const hifiDst = path.join(MODELS, hifi?.path || `hifi/${group}`, hifi?.filename || `${fj}.glb`);
    if (!DRY) {
      fs.mkdirSync(path.dirname(hifiDst), { recursive: true });
      fs.copyFileSync(hifiSrc, hifiDst);
    }
    swappedHifiOnly++;
  }
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}draco ersetzt: ${swapped} | davon auch hifi ergänzt: ${swappedHifiOnly}`);
console.log(`übersprungen — schon neu (Auto-generiert): ${skippedNew}`);
console.log(`übersprungen — keine processed-Datei: ${skippedNoProc}`);
if (onlyFj) console.log(`übersprungen — nicht in --fj-Auswahl: ${skippedNotSelected}`);
if (log.length && log.length <= 50) console.log('\n' + log.join('\n'));
