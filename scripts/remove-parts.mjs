// remove-parts.mjs
// Entfernt einzelne Teile KOMPLETT aus der App (meta.json-Eintrag + alle Modelldateien).
// Für „dieses Teil sieht komisch aus / brauchen wir nicht" — auch Bestandsteile.
// Die entfernten FMA-IDs bleiben hier dokumentiert (eine Zeile = ein Teil, mit Grund).
//
//   node scripts/remove-parts.mjs            # ausführen
//   node scripts/remove-parts.mjs --dry-run  # nur anzeigen
//
// Wiederherstellbar: Rohdaten + NEW MODELS/processed/ bleiben erhalten.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const META_PATH = path.join(ROOT, 'public/data/meta.json');
const MODELS = path.join(ROOT, 'public/models');

// FMA-ID : Grund
const REMOVE = {
  fma58840: 'Suspensory ligament of left lens (Zonula) — schwebt frei, sieht komisch aus, irrelevant',
  fma58839: 'Suspensory ligament of right lens (Zonula) — dito',
};

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
const removeSet = new Set(Object.keys(REMOVE).map(s => s.toLowerCase()));

const kept = [];
let removed = 0, filesDeleted = 0;
for (const e of meta) {
  const fma = (e.info?.links?.fma || '').toLowerCase();
  if (!removeSet.has(fma)) { kept.push(e); continue; }
  removed++;
  const g = e.classification?.group, fj = e.model?.root_name;
  console.log(`  entferne ${fma} · ${fj} · ${e.labels?.en || ''}`);
  if (!DRY && g && fj) {
    for (const p of [
      path.join(MODELS, g, `${fj}.glb`),
      path.join(MODELS, 'hifi', g, `${fj}.glb`),
      path.join(MODELS, 'lofi', g, `${fj}.glb`),
    ]) if (fs.existsSync(p)) { fs.rmSync(p); filesDeleted++; }
  }
}

if (!DRY) fs.writeFileSync(META_PATH, JSON.stringify(kept, null, 2));
console.log(`${DRY ? '[DRY-RUN] ' : ''}entfernt: ${removed} Einträge, ${filesDeleted} Dateien | meta.json: ${meta.length} -> ${kept.length}`);
