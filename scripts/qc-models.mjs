// qc-models.mjs
// QC für public/models/: prüft meta.json <-> Dateisystem-Konsistenz und die
// strukturelle Validität jeder ausgelieferten draco-GLB (1 Mesh, 1 Material,
// Dreieckszahl > 0). Deckt Phase 6 aus docs/tasks/model-pipeline-bp3d.md ab,
// ohne den noch ausstehenden hifi-Komplett-Tausch als Fehler zu werten —
// fehlende hifi-Dateien werden separat ausgewiesen (bekannter offener Punkt).
//
//   node scripts/qc-models.mjs                 # voller Lauf, schreibt Report
//   node scripts/qc-models.mjs --group=teeth    # nur eine Gruppe (schneller)

import fs from 'fs';
import path from 'path';
import { NodeIO, Logger, Verbosity } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const ROOT = process.cwd();
const META_PATH = path.join(ROOT, 'public/data/meta.json');
const MODELS = path.join(ROOT, 'public/models');
const REPORT_PATH = path.join(ROOT, 'NEW MODELS/qc-report.json');

const onlyGroup = process.argv.find(a => a.startsWith('--group='))?.split('=')[1];

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
const io = new NodeIO()
  .setLogger(new Logger(Verbosity.SILENT))
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

const errors = [];   // harte Fehler (Exit-Code != 0)
const warnings = []; // bekannte/erwartete Lücken (Swap/Review noch offen)

// ---- 1) meta.json: erwartete Dateien je Tier sammeln ----------------------
const expectedDraco = new Map(); // "group/file.glb" -> fj
const expectedHifi = new Map();
for (const e of meta) {
  const fj = e.model?.root_name;
  const group = e.classification?.group;
  if (!fj || !group) { errors.push({ type: 'meta_incomplete', id: e.id, detail: 'fehlt root_name oder classification.group' }); continue; }

  const draco = e.model?.variants?.draco;
  if (draco?.path && draco?.filename) expectedDraco.set(`${draco.path}/${draco.filename}`, { fj, id: e.id, group });

  const hifi = e.model?.variants?.hifi;
  if (hifi?.path && hifi?.filename) expectedHifi.set(`${hifi.path}/${hifi.filename}`, { fj, id: e.id, group });

  // FJ/FMA-Konsistenz
  if (draco?.filename && draco.filename.replace(/\.glb$/i, '').toUpperCase() !== fj.toUpperCase()) {
    errors.push({ type: 'fj_mismatch', id: e.id, detail: `root_name=${fj} aber draco.filename=${draco.filename}` });
  }
  if (draco?.path && draco.path !== group) {
    errors.push({ type: 'group_path_mismatch', id: e.id, fj, detail: `classification.group=${group} aber draco.path=${draco.path}` });
  }
}

// ---- 2) Existenz prüfen (draco hart, hifi als bekannte Lücke) -------------
let missingDraco = 0, missingHifi = 0;
for (const [rel, info] of expectedDraco) {
  if (onlyGroup && info.group !== onlyGroup) continue;
  if (!fs.existsSync(path.join(MODELS, rel))) {
    errors.push({ type: 'missing_draco', id: info.id, fj: info.fj, detail: rel });
    missingDraco++;
  }
}
for (const [rel, info] of expectedHifi) {
  if (onlyGroup && info.group !== onlyGroup) continue;
  if (!fs.existsSync(path.join(MODELS, rel))) {
    warnings.push({ type: 'missing_hifi', id: info.id, fj: info.fj, detail: rel });
    missingHifi++;
  }
}

// ---- 3) Waisen auf der Platte: Datei ohne meta-Eintrag ---------------------
function listGroupDirs(base) {
  return fs.readdirSync(base).filter(g => g !== 'hifi' && g !== 'lofi' && fs.statSync(path.join(base, g)).isDirectory());
}
let orphanDraco = 0, orphanHifi = 0;
for (const group of listGroupDirs(MODELS)) {
  if (onlyGroup && group !== onlyGroup) continue;
  for (const f of fs.readdirSync(path.join(MODELS, group))) {
    if (!f.toLowerCase().endsWith('.glb')) continue;
    if (!expectedDraco.has(`${group}/${f}`)) { warnings.push({ type: 'orphan_draco', detail: `${group}/${f}` }); orphanDraco++; }
  }
}
const hifiRoot = path.join(MODELS, 'hifi');
if (fs.existsSync(hifiRoot)) {
  for (const group of listGroupDirs(hifiRoot)) {
    if (onlyGroup && group !== onlyGroup) continue;
    for (const f of fs.readdirSync(path.join(hifiRoot, group))) {
      if (!f.toLowerCase().endsWith('.glb')) continue;
      if (!expectedHifi.has(`hifi/${group}/${f}`)) { warnings.push({ type: 'orphan_hifi', detail: `hifi/${group}/${f}` }); orphanHifi++; }
    }
  }
}

// ---- 4) Strukturelle Validität jeder ausgelieferten draco-GLB --------------
const triStats = {}; // group -> { count, min, max, sum }
let checked = 0, parseFailed = 0, badMeshCount = 0, badMaterialCount = 0, zeroTris = 0;

for (const [rel, info] of expectedDraco) {
  if (onlyGroup && info.group !== onlyGroup) continue;
  const abs = path.join(MODELS, rel);
  if (!fs.existsSync(abs)) continue; // schon oben als missing_draco erfasst

  let doc;
  try {
    doc = await io.read(abs);
  } catch (ex) {
    errors.push({ type: 'parse_failed', id: info.id, fj: info.fj, detail: String(ex.message || ex) });
    parseFailed++;
    continue;
  }

  const meshes = doc.getRoot().listMeshes();
  const materials = doc.getRoot().listMaterials();
  let tris = 0;
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      const posCount = prim.getAttribute('POSITION')?.getCount() ?? 0;
      tris += indices ? indices.getCount() / 3 : posCount / 3;
    }
  }

  if (meshes.length !== 1) { errors.push({ type: 'mesh_count', id: info.id, fj: info.fj, detail: `${meshes.length} Meshes` }); badMeshCount++; }
  if (materials.length !== 1) { errors.push({ type: 'material_count', id: info.id, fj: info.fj, detail: `${materials.length} Materialien` }); badMaterialCount++; }
  if (tris === 0) { errors.push({ type: 'zero_triangles', id: info.id, fj: info.fj, detail: rel }); zeroTris++; }

  const g = info.group;
  triStats[g] ??= { count: 0, min: Infinity, max: 0, sum: 0 };
  triStats[g].count++; triStats[g].sum += tris;
  triStats[g].min = Math.min(triStats[g].min, tris);
  triStats[g].max = Math.max(triStats[g].max, tris);

  checked++;
  if (checked % 500 === 0) console.log(`  ... ${checked} geprüft`);
}

for (const g of Object.keys(triStats)) {
  triStats[g].avg = Math.round(triStats[g].sum / triStats[g].count);
  triStats[g].min = Math.round(triStats[g].min);
  triStats[g].max = Math.round(triStats[g].max);
  delete triStats[g].sum;
}

// ---- 5) Report --------------------------------------------------------------
const report = {
  generated: new Date().toISOString(),
  metaEntries: meta.length,
  checkedDraco: checked,
  errors,
  warnings,
  triStatsByGroup: triStats,
};
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

console.log(`\nmeta.json-Einträge: ${meta.length} | geprüfte draco-GLBs: ${checked}`);
console.log(`\n-- harte Fehler (${errors.length}) --`);
console.log(`  fehlende draco-Dateien:     ${missingDraco}`);
console.log(`  Parse-Fehler:               ${parseFailed}`);
console.log(`  != 1 Mesh:                  ${badMeshCount}`);
console.log(`  != 1 Material:              ${badMaterialCount}`);
console.log(`  0 Dreiecke:                 ${zeroTris}`);
console.log(`\n-- bekannte/erwartete Lücken (${warnings.length}, kein Fehler-Exit) --`);
console.log(`  fehlende hifi-Dateien:      ${missingHifi}  (Komplett-Tausch noch offen)`);
console.log(`  Waisen draco (Datei ohne meta-Eintrag): ${orphanDraco}`);
console.log(`  Waisen hifi:                ${orphanHifi}`);
console.log(`\nDreieckszahlen je Gruppe (draco, aktuell ausgeliefert):`);
for (const [g, s] of Object.entries(triStats).sort()) {
  console.log(`  ${g.padEnd(12)} n=${String(s.count).padEnd(5)} min=${String(s.min).padEnd(6)} avg=${String(s.avg).padEnd(6)} max=${s.max}`);
}
console.log(`\n→ Report: ${path.relative(ROOT, REPORT_PATH)}`);

if (errors.length > 0) {
  console.error(`\nQC FEHLGESCHLAGEN: ${errors.length} harte Fehler.`);
  process.exit(1);
}
console.log('\nQC grün (bekannte Lücken s.o. bleiben bestehen, kein Fehler).');
