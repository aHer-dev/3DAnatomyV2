// Browser review against a detached baseline worktree. No model files are written.
// Usage: node scripts/review-muscle-rendering.mjs <playwright-module> <output-dir> [CDP endpoint]
// Baseline/current Vite servers must run at localhost:4173 / localhost:4174.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [playwrightModule, outputDir, cdpEndpoint] = process.argv.slice(2);
if (!playwrightModule || !outputDir) throw new Error('Expected Playwright module path and output directory');
const { chromium } = await import(pathToFileURL(playwrightModule).href);
const boundaryData = JSON.parse(await fs.readFile(new URL('../public/data/muskelgrenzen.json', import.meta.url), 'utf8'));
const comparisonMuscles = Object.entries(boundaryData.muskeln).flatMap(([file, entry]) => entry.links ? [file, entry.links] : [file]);
await fs.mkdir(outputDir, { recursive: true });
const browser = cdpEndpoint ? await chromium.connectOverCDP(cdpEndpoint) : await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = { date: '2026-10-12', baseline: 'd100a58', viewport: [1000, 900], runs: [], checks: [], captures: [] };
const regions = [
  { id: 'arm', title: 'Arm', center: [-0.245, 1.13, 0.08], radius: 1.0, min: [-0.44, 0.72, -0.12], max: [-0.11, 1.49, 0.28], sheets: ['teil1a_oberarm_ellenbogen.jpg', 'teil1b_unterarm.jpg', 'teil2_hand.jpg'] },
  { id: 'bein', title: 'Bein', center: [-0.10, 0.52, 0.08], radius: 1.34, min: [-0.25, -0.02, -0.12], max: [0.0, 1.02, 0.32], sheets: ['teil5b_oberschenkel.jpg', 'teil6a_unterschenkel.jpg', 'teil6b_fuss.jpg'] },
  { id: 'rumpf', title: 'Rumpf', center: [0, 1.16, 0.02], radius: 1.0, min: [-0.21, 0.80, -0.20], max: [0.21, 1.51, 0.26], sheets: ['teil4a_ruecken_lateral.jpg', 'teil4b_ruecken_medial_nacken.jpg', 'teil4c_brust_zwerchfell_bauch.jpg'] },
  { id: 'kopf', title: 'Kopf', center: [0, 1.64, 0.01], radius: 0.53, min: [-0.15, 1.49, -0.16], max: [0.15, 1.80, 0.23], sheets: ['teil8a_mimik.jpg', 'teil8b_kau_augenmuskeln.jpg', 'teil9_zunge_rachen_kehlkopf.jpg'] },
];
const comparisonRegions = new Map(Object.entries(boundaryData.muskeln).flatMap(([file, entry]) => entry.links ? [[file, entry.teil], [entry.links, entry.teil]] : [[file, entry.teil]]));

try {
  for (const [version, port] of [['vorher', 4173], ['nachher', 4174]]) {
    const context = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    const responseSizes = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => {
      const url = response.url();
      if (/^\/(models|data|draco)\//.test(new URL(url).pathname) && response.request().method() === 'GET' && response.ok()) {
        responseSizes.push(response.body().then(buffer => ({ url, bytes: buffer.byteLength })).catch(() => ({ url, bytes: 0 })));
      }
    });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle', timeout: 120000 });
    const moduleUrls = await page.evaluate(() => Object.fromEntries(performance.getEntriesByType('resource').map(entry => [new URL(entry.name).pathname, entry.name])));
    await page.evaluate(async ({ version, moduleUrls }) => {
      const appModule = url => import(moduleUrls[url] ?? url);
      const { loadGroupByName, loadModels } = await appModule('/js/features/modelLoader-core.js');
      const { getStore } = await appModule('/js/store/useStore.ts');
      const { scene: initialScene } = await appModule('/js/core/scene.js');
      if (!getStore().groups.bones?.length || getStore().groups.bones[0].parent !== initialScene) {
        throw new Error('Review imported a different Store/Scene; measurement aborted');
      }
      for (const group of ['muscles', 'eyes']) {
        if (version === 'vorher' && group === 'eyes') {
          // Baseline's HEAD probe accepts SPA HTML as a bundle. Use its existing
          // single-file loader so both versions compare exactly the same models.
          const { scene } = await appModule('/js/core/scene.js');
          const { createGLTFLoader } = await appModule('/js/loaders/gltfLoaderFactory.js');
          const { updateModelColors } = await appModule('/js/modelLoader/color.js');
          await loadModels(getStore().groupedMeta.eyes, 'eyes', false, scene, createGLTFLoader());
          updateModelColors('eyes', 0xcccccc);
        } else await loadGroupByName(group);
        getStore().setGroupVisible(group, true);
      }
    }, { version, moduleUrls });
    await page.waitForTimeout(500);
    const network = await Promise.all(responseSizes);
    const run = { version, network,
      dataBytes: network.filter(entry => /^\/(models|data)\//.test(new URL(entry.url).pathname)).reduce((sum, entry) => sum + entry.bytes, 0),
      decoderCodeBytes: network.filter(entry => /^\/draco\//.test(new URL(entry.url).pathname)).reduce((sum, entry) => sum + entry.bytes, 0),
      errors, frames: {} };
    report.runs.push(run);
    for (const region of regions) for (const [direction, sign] of [['ventral', 1], ['dorsal', -1]]) {
      const shot = await page.evaluate(async ({ region, sign, version, comparisonMuscles, regionParts, moduleUrls }) => {
        const appModule = url => import(moduleUrls[url] ?? url);
        const THREE = await appModule('/node_modules/.vite/deps/three.js');
        const { scene } = await appModule('/js/core/scene.js');
        const { camera } = await appModule('/js/core/camera.js');
        const { controls } = await appModule('/js/core/controls.js');
        const { renderer } = await appModule('/js/core/renderer.js');
        const { getStore } = await appModule('/js/store/useStore.ts');
        // Deliberately preview full quality on this software GPU; the app itself
        // automatically uses the constrained profile on the same device.
        if (version === 'nachher') getStore().setConstrainedDevice(false);
        const box = new THREE.Box3(new THREE.Vector3(...region.min), new THREE.Vector3(...region.max));
        for (const [group, roots] of Object.entries(getStore().groups)) for (const root of roots) {
          const bounds = new THREE.Box3().setFromObject(root, true);
          const center = bounds.getCenter(new THREE.Vector3());
          let measured = false;
          if (group === 'eyes') root.traverse(o => { if (o.isMesh && o.geometry.getAttribute('bellyWeight')) measured = true; });
          // Before/after show the same muscle files under eyes, using the data keys before attributes exist.
          if (group === 'eyes' && version === 'vorher') {
            const file = root.userData.meta.model.variants.draco.filename;
            measured = comparisonMuscles.includes(file);
          }
          const withinRegion = region.id === 'arm' ? center.x < -0.11 && center.y > 0.72 && center.y < 1.49
            : region.id === 'rumpf' ? Math.abs(center.x) < 0.21 && center.y > 0.8 && center.y < 1.51
              : region.id === 'kopf' ? center.y > 1.49
                : center.y < 1.02;
          const file = root.userData.meta?.model?.variants?.draco?.filename;
          const part = regionParts[file] ?? '';
          const muscleWithinRegion = group !== 'muscles' && group !== 'eyes' ? true
            : region.id === 'arm' ? /^[123] /.test(part)
              : region.id === 'bein' ? /^[56] /.test(part)
                : region.id === 'rumpf' ? /^[34] /.test(part)
                  : /^[789] /.test(part);
          const boneName = root.userData.meta?.labels?.en ?? '';
          const boneWithinRegion = region.id !== 'bein' || group !== 'bones'
            || /femur|patella|tibia|fibula|talus|calcane|navicular|cuneiform|cuboid|hip|ilium|ischium|pubis|sacrum|acetabul|tarsal|metatarsal|toe|hallux|foot/i.test(boneName);
          root.visible = group !== 'cartilage' && withinRegion && muscleWithinRegion && boneWithinRegion && box.intersectsBox(bounds) && (group !== 'eyes' || measured);
        }
        renderer.setSize(1000, 900, false);
        camera.aspect = 1000 / 900;
        camera.up.set(0, 1, 0);
        controls.target.set(...region.center);
        camera.position.set(region.center[0], region.center[1], region.center[2] + sign * region.radius);
        camera.lookAt(controls.target);
        camera.updateProjectionMatrix();
        controls.update();
        if (version === 'nachher') {
          const { renderQualityFrame } = await appModule('/js/core/renderQuality.ts');
          renderQualityFrame(renderer, scene, camera);
        } else renderer.render(scene, camera);
        const visibleFiles = Object.values(getStore().groups).flat().filter(root => root.visible)
          .map(root => root.userData.meta.model.variants.draco.filename).sort();
        if (!visibleFiles.length) throw new Error('Empty Store in capture context');
        return { jpg: renderer.domElement.toDataURL('image/jpeg', 0.94).split(',')[1],
          visibleFiles, camera: camera.position.toArray(), target: controls.target.toArray() };
      }, { region, sign, version, comparisonMuscles, regionParts: Object.fromEntries(comparisonRegions), moduleUrls });
      report.captures.push({ region: region.id, direction, version, visibleFiles: shot.visibleFiles, camera: shot.camera, target: shot.target });
      const before = report.captures.find(capture => capture.region === region.id && capture.direction === direction && capture.version === 'vorher');
      if (version === 'nachher' && JSON.stringify([before.visibleFiles, before.camera, before.target]) !== JSON.stringify([shot.visibleFiles, shot.camera, shot.target])) {
        throw new Error(`${region.id}/${direction}: camera or visible model set differs`);
      }
      await fs.writeFile(path.join(outputDir, `${region.id}-${direction}-${version}.jpg`), Buffer.from(shot.jpg, 'base64'));
    }
    // Measure continuous orbit, never the app's idle demand-rendering frame count.
    for (const performanceMode of version === 'nachher' ? [false, true] : [true]) {
      const measurement = await page.evaluate(async ({ version, performanceMode, moduleUrls, frameCount }) => {
        const appModule = url => import(moduleUrls[url] ?? url);
        const { scene } = await appModule('/js/core/scene.js');
        const { camera } = await appModule('/js/core/camera.js');
        const { renderer } = await appModule('/js/core/renderer.js');
        const { controls } = await appModule('/js/core/controls.js');
        const { getStore } = await appModule('/js/store/useStore.ts');
        const { lifecycle } = await appModule('/js/core/lifecycle.js');
        // One controlled camera loop in both versions. Otherwise the app's
        // demand loop can render a second frame for each benchmark frame.
        lifecycle.dispose();
        const render = version === 'nachher'
          ? (await appModule('/js/core/renderQuality.ts')).renderQualityFrame
          : (renderer, scene, camera) => renderer.render(scene, camera);
        if (version === 'nachher') {
          getStore().setConstrainedDevice(false);
          getStore().setPerformanceMode(performanceMode);
          if (performanceMode && scene.environment !== null) throw new Error('Performance environment is still enabled');
        }
        for (const [group, roots] of Object.entries(getStore().groups)) for (const root of roots) root.visible = group !== 'eyes';
        const target = controls.target.set(0, 0.94, 0.02);
        const gl = renderer.getContext();
        if (!Object.values(getStore().groups).flat().length) throw new Error('Empty Store in benchmark context');
        const gpu = gl.getExtension('WEBGL_debug_renderer_info');
        let count = 0;
        // Warm shaders and the AO render targets before timing.
        for (let i = 0; i < 12; i++) render(renderer, scene, camera);
        gl.finish();
        const start = performance.now();
        await new Promise(resolve => {
          const frame = () => {
            const angle = count / frameCount * Math.PI;
            camera.position.set(2.65 * Math.sin(angle), 1.10, 2.65 * Math.cos(angle));
            camera.lookAt(target);
            render(renderer, scene, camera);
            gl.finish();
            count++;
            if (count < frameCount) requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
        const ms = performance.now() - start;
        return { frames: count, elapsedMs: ms, fps: count * 1000 / ms, forcedFullQuality: version === 'nachher' && !performanceMode, controlledLoop: true, gpu: gpu ? gl.getParameter(gpu.UNMASKED_RENDERER_WEBGL) : 'unknown', pixelRatio: renderer.getPixelRatio(), visibleRoots: Object.values(getStore().groups).flat().filter(root => root.visible).length };
      }, { version, performanceMode, moduleUrls, frameCount: cdpEndpoint ? 180 : 24 });
      run.frames[performanceMode ? 'performance' : 'quality'] = measurement;
      console.log(`${version} ${performanceMode ? 'performance' : 'quality'} ${measurement.fps.toFixed(1)} FPS; ${run.dataBytes} data bytes`);
    }
    if (version === 'nachher') {
      const checks = await page.evaluate(async moduleUrls => {
        const appModule = url => import(moduleUrls[url] ?? url);
        const { getStore } = await appModule('/js/store/useStore.ts');
        const { scene } = await appModule('/js/core/scene.js');
        const { camera } = await appModule('/js/core/camera.js');
        const { renderer } = await appModule('/js/core/renderer.js');
        const { renderQualityFrame } = await appModule('/js/core/renderQuality.ts');
        const { setModelColor, setModelOpacity } = await appModule('/js/features/appearance.js');
        const { highlightModel, clearHighlight } = await appModule('/js/interaction/highlightModel.js');
        const { enterGhostContext, exitGhostContext } = await appModule('/js/features/ghostContext.js');
        const { updateModelColors } = await appModule('/js/modelLoader/color.js');
        const root = getStore().groups.muscles.find(model => model.userData.meta.model.variants.draco.filename === 'FJ1492.glb');
        const meshes = []; root.traverse(o => { if (o.isMesh) meshes.push(o); });
        const weights = Array.from(meshes[0].geometry.getAttribute('bellyWeight').array);
        setModelColor(root, '#2872cc'); setModelOpacity(root, 0.45); highlightModel(root);
        renderQualityFrame(renderer, scene, camera);
        const cloneRetainsShader = meshes.every(mesh => mesh.material.weighted && mesh.material.color.getHex() === 0x2872cc && mesh.material.opacity === 0.45 && mesh.material.emissive.getHex() === 0x222222);
        setModelOpacity(root, 1); clearHighlight();
        const material = meshes[0].material;
        enterGhostContext(root); renderQualityFrame(renderer, scene, camera); exitGhostContext();
        const ghostRestores = material === meshes[0].material;
        updateModelColors('muscles', 0xe85861);
        for (const key of Object.keys(getStore().renderingSettings)) {
          getStore().setRenderingSetting(key, false); renderQualityFrame(renderer, scene, camera);
          getStore().setRenderingSetting(key, true); renderQualityFrame(renderer, scene, camera);
        }
        return { cloneRetainsShader, ghostRestores, weightsHaveTendonAndBelly: Math.min(...weights) === 0 && Math.max(...weights) === 1, settingsToggleRender: true };
      }, moduleUrls);
      report.checks.push(checks);
      if (Object.values(checks).some(value => value !== true)) throw new Error(`Browser regression: ${JSON.stringify(checks)}`);
    }
    await context.close();
  }
} finally {
  await fs.writeFile(path.join(outputDir, 'messwerte.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.runs.find(run => run.version === 'nachher')?.errors.length) throw new Error('Browser errors; see messwerte.json');
const controlRoot = '/mnt/c/Users/Anato/OneDrive/Arbeitsbereich/Anatomie/3D/Blender/vorschau_grenzen';
for (const file of new Set(regions.flatMap(region => region.sheets))) await fs.copyFile(path.join(controlRoot, file), path.join(outputDir, file));
const gpu = report.runs[0].frames.performance.gpu;
const html = `<!doctype html><html lang="de"><meta charset="utf-8"><title>Sehnenfarbe – Sichtprüfung</title><style>body{margin:2rem;font:16px system-ui;background:#eee;color:#222}h1{font-size:1.6rem}.row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}img{max-width:100%;display:block}figure{margin:0}figcaption{font-weight:bold;margin:.5rem 0}details img{max-height:1100px}section{margin:2rem 0}pre{white-space:pre-wrap}a{color:#164b70}</style><h1>Sehnenfarbe: vorher / nachher / Blender-Kontrolle</h1><p>12.10.2026 · Baseline d100a58 · gleiche Kamera, Bildgröße und sichtbare Strukturen je Vergleich. Gruppenfarben unverändert. Blender-Blätter zeigen eigene Beleuchtung und dunklere Knochen. Kopf: FJ801 lädt das geprüfte Original statt des bereits abweichenden Bundles.</p><p>Messhardware: ${gpu}. <a href="messwerte.json">Messwerte und Browserprüfungen</a>. Modell-/JSON-Payload ohne Code: ${report.runs[0].dataBytes} → ${report.runs[1].dataBytes} Byte. Performance: ${report.runs[0].frames.performance.fps.toFixed(2)} → ${report.runs[1].frames.performance.fps.toFixed(2)} FPS. Volle Qualität: ${report.runs[1].frames.quality.fps.toFixed(2)} FPS. Diese Werte beschreiben den Bildtakt der Prüfung, nicht die maximale GPU-Bildrate.</p>${regions.map(region => `<section><h2>${region.title}</h2>${['ventral','dorsal'].map(direction => `<h3>${direction}</h3><div class="row"><figure><figcaption>Vorher</figcaption><img src="${region.id}-${direction}-vorher.jpg"></figure><figure><figcaption>Nachher</figcaption><img src="${region.id}-${direction}-nachher.jpg"></figure><figure><figcaption>Kontrollblatt</figcaption><a href="${region.sheets[0]}"><img src="${region.sheets[0]}"></a></figure></div>`).join('')}${region.sheets.map(file => `<details><summary>${file}</summary><img src="${file}"></details>`).join('')}</section>`).join('')}</html>`;
await fs.writeFile(path.join(outputDir, 'vergleich.html'), html);
console.log(`Review ready: ${path.join(outputDir, 'vergleich.html')}`);
