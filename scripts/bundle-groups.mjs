// bundle-groups.mjs
// Bündelt alle einzelnen Draco-GLB einer Gruppe zu EINER gepackten
// `<group>.bundle.glb` + `<group>.bundle.json` (Manifest der Teil-IDs in
// Node-Reihenfolge). Ziel: aus N Einzel-Requests pro Gruppe wird 1 Request.
//
// Der Szenegraph bleibt äquivalent zum Einzel-Laden: jede Quell-Datei wird zu
// EINEM benannten Wrapper-Node (Name = Datei-Basename = Teil-ID), unter dem die
// Original-Root-Nodes hängen. Materialien werden NICHT dedupliziert → jedes Teil
// behält sein eigenes Material (per-Teil-Farbe/Deckkraft im Legacy-Pfad bleibt).
//
//   node scripts/bundle-groups.mjs ligaments            # eine Gruppe
//   node scripts/bundle-groups.mjs bones muscles teeth  # mehrere
//
// Voraussetzung: @gltf-transform/* + draco3dgltf (devDependencies).

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { NodeIO, Logger, Verbosity, Document } from '@gltf-transform/core';
import { KHRDracoMeshCompression, KHRMaterialsSpecular } from '@gltf-transform/extensions';
import { unpartition, mergeDocuments } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

const ROOT = process.cwd();
const MODELS = path.join(ROOT, 'public/models');

const groups = process.argv.slice(2).filter((a) => !a.startsWith('-'));
if (!groups.length) {
  console.error('Usage: node scripts/bundle-groups.mjs <group> [group...]');
  process.exit(1);
}

const io = new NodeIO()
  .setLogger(new Logger(Verbosity.ERROR))
  .registerExtensions([KHRDracoMeshCompression, KHRMaterialsSpecular])
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

const kb = (n) => (n / 1024).toFixed(0);

for (const group of groups) {
  const dir = path.join(MODELS, group);
  if (!fs.existsSync(dir)) {
    console.warn(`skip ${group}: Verzeichnis fehlt`);
    continue;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.glb') && !f.endsWith('.bundle.glb') && !f.endsWith('.tmp.glb'))
    .sort();

  if (!files.length) {
    console.warn(`skip ${group}: keine GLB`);
    continue;
  }

  const bundle = new Document();
  const bundleScene = bundle.createScene(group);
  const manifest = [];
  let srcBytes = 0;

  for (const file of files) {
    const base = path.basename(file, path.extname(file));
    const full = path.join(dir, file);
    srcBytes += fs.statSync(full).size;

    const src = await io.read(full);
    const before = bundle.getRoot().listScenes().length;
    mergeDocuments(bundle, src);
    const newScenes = bundle.getRoot().listScenes().slice(before);

    // Alle Root-Nodes der frisch gemergten Szene(n) unter einen benannten
    // Wrapper hängen → genau ein identifizierbarer Node pro Quell-Datei.
    const wrap = bundle.createNode(base);
    for (const sc of newScenes) {
      for (const node of [...sc.listChildren()]) wrap.addChild(node);
      sc.dispose();
    }
    bundleScene.addChild(wrap);
    manifest.push(base);
  }

  bundle.getRoot().setDefaultScene(bundleScene);
  await bundle.transform(unpartition()); // GLB braucht genau einen Buffer

  const outTmp = path.join(dir, `${group}.bundle.tmp.glb`);
  const out = path.join(dir, `${group}.bundle.glb`);
  await io.write(outTmp, bundle); // unkomprimiert

  // Draco über die bewährte CLI (wie draco-compress.mjs)
  const r = spawnSync('npx', ['gltf-transform', 'draco', outTmp, out], { stdio: 'ignore' });
  fs.rmSync(outTmp, { force: true });
  if (r.status !== 0) {
    console.error(`FEHLER (draco) bei Gruppe ${group}`);
    continue;
  }

  fs.writeFileSync(path.join(dir, `${group}.bundle.json`), JSON.stringify(manifest));

  const outBytes = fs.statSync(out).size;
  console.log(
    `${group}: ${files.length} Dateien (${kb(srcBytes)} KB) → 1 Bundle (${kb(outBytes)} KB) · ` +
      `${manifest.length} Teile im Manifest`,
  );
}
