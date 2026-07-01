// integrate-new-models.mjs
// Pflegt die NEUEN BodyParts3D-Teile in die App ein:
//   1) generiert schema-konforme meta.json-Einträge (Latein erzeugt die App aus labels.en)
//   2) kopiert draco -> public/models/<g>/  und hifi -> public/models/hifi/<g>/
// Additiv & idempotent: nur FJ, die noch keinen meta-Eintrag haben.
//
//   node scripts/integrate-new-models.mjs           # ausführen
//   node scripts/integrate-new-models.mjs --dry-run # nur zählen, nichts schreiben

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');

// Unerwünschte Teile (FMA-ID) — werden NICHT eingepflegt; bereits eingepflegte
// Auto-Einträge + ihre Dateien werden beim Lauf wieder entfernt. Einzelne Zeile = ein Teil.
const EXCLUDE = new Set([
  'fma236884', // "Bony part of left hip bone" — redundante Hüll-Geometrie, überlappt Becken
]);
const PROC = path.join(ROOT, 'NEW MODELS/processed');
const META_PATH = path.join(ROOT, 'public/data/meta.json');
const MODELS = path.join(ROOT, 'public/models');

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'NEW MODELS/sorted/_manifest.json'), 'utf8'));
const byFj = {};
for (const m of manifest) byFj[m.fj] = m;

const existingFj = new Set(), existingFma = new Set();
for (const e of meta) {
  if (e.model?.root_name) existingFj.add(e.model.root_name.toUpperCase());
  if (e.info?.links?.fma) existingFma.add(e.info.links.fma.toLowerCase());
}

function makeEntry({ fj, fma, label, group }) {
  return {
    id: fma,
    labels: { en: label, de: '', la: '' },
    synonyms: { en: [], de: [] },
    classification: { group, subgroup: null, side: '', system: '', region: '' },
    relations: { is_a: [], part_of: [], has_parts: [], adjacent_to: [], cross_references: {} },
    model: {
      current: 'draco',
      variants: {
        draco: { path: group, filename: `${fj}.glb`, format: 'glb' },
        hifi: { path: `hifi/${group}`, filename: `${fj}.glb`, format: 'glb' },
        lofi: { path: `lofi/${group}`, filename: `${fj}.glb`, format: 'glb' },
      },
      default_color: '#cccccc',
      visible_by_default: true,
      highlight_color: '',
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      bounding_box: [[], []],
      checksum: '',
      root_name: fj,
      asset: { path: group, file: `${fj}.glb`, url: `${group}/${fj}.glb`, fileKey: `${fj}.glb` },
    },
    info: {
      description: { en: '', de: '' },
      keywords: { en: [], de: [] },
      links: { wikipedia_en: '', fma, wikipedia_de: '', uberon: '' },
      images: [],
    },
    meta: {
      sources: ['BodyParts3D'],
      license: 'CC BY 4.0',
      attribution: 'BodyParts3D, © DBCLS, licensed under CC BY 4.0',
      version: '1.0.0',
      last_updated: new Date().toISOString().slice(0, 10),
      reliability_score: null,
      notes: 'Auto-generiert aus BodyParts3D-Dateinamen (Pipeline-Neuaufbereitung).',
      validation_status: '',
      purpose: '',
    },
  };
}

function copy(src, dst) {
  if (DRY) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

// --- bereits eingepflegte, jetzt ausgeschlossene Auto-Einträge wieder entfernen ---
let removed = 0;
const AUTO_MARK = 'Auto-generiert aus BodyParts3D';
const kept = [];
for (const e of meta) {
  const isAuto = (e.meta?.notes || '').startsWith(AUTO_MARK);
  const fma = (e.info?.links?.fma || '').toLowerCase();
  if (isAuto && EXCLUDE.has(fma)) {
    removed++;
    if (!DRY) {
      const g = e.classification?.group, fj = e.model?.root_name;
      for (const p of [path.join(MODELS, g, `${fj}.glb`), path.join(MODELS, 'hifi', g, `${fj}.glb`)]) {
        if (fs.existsSync(p)) fs.rmSync(p);
      }
    }
    continue;
  }
  kept.push(e);
}
meta.length = 0; meta.push(...kept);
// Sets nach dem Entfernen neu aufbauen
existingFj.clear(); existingFma.clear();
for (const e of meta) {
  if (e.model?.root_name) existingFj.add(e.model.root_name.toUpperCase());
  if (e.info?.links?.fma) existingFma.add(e.info.links.fma.toLowerCase());
}

const dracoRoot = path.join(PROC, 'draco');
let added = 0, copiedDraco = 0, copiedHifi = 0, skippedNoFile = 0;
const newEntries = [];

for (const group of fs.readdirSync(dracoRoot)) {
  const gp = path.join(dracoRoot, group);
  if (!fs.statSync(gp).isDirectory()) continue;
  for (const file of fs.readdirSync(gp)) {
    if (!file.toLowerCase().endsWith('.glb')) continue;
    const fj = file.replace(/\.glb$/i, '').toUpperCase();
    const info = byFj[fj];
    const fma = info?.fma;
    const isNew = !existingFj.has(fj) && !(fma && existingFma.has(fma));
    if (!isNew) continue;
    if (!info || !fma) { skippedNoFile++; continue; }
    if (EXCLUDE.has(fma)) continue;   // ausgeschlossen

    newEntries.push(makeEntry({ fj, fma, label: info.label, group }));
    added++;

    // Dateien übernehmen (draco + hifi)
    const dracoSrc = path.join(PROC, 'draco', group, file);
    const hifiSrc = path.join(PROC, 'hifi', group, file);
    if (fs.existsSync(dracoSrc)) { copy(dracoSrc, path.join(MODELS, group, file)); copiedDraco++; }
    if (fs.existsSync(hifiSrc)) { copy(hifiSrc, path.join(MODELS, 'hifi', group, file)); copiedHifi++; }
  }
}

if (!DRY) {
  fs.writeFileSync(META_PATH, JSON.stringify([...meta, ...newEntries], null, 2));
}

console.log(`${DRY ? '[DRY-RUN] ' : ''}neue Einträge: ${added} | entfernt (Ausschluss): ${removed} | draco kopiert: ${copiedDraco} | hifi kopiert: ${copiedHifi} | übersprungen(ohne Info): ${skippedNoFile}`);
console.log(`meta.json: ${meta.length + added} Einträge (Ausschlussliste: ${EXCLUDE.size})`);
