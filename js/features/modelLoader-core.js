// ============================================
// modelLoader-core.js – stabile Version (Shadows + sRGB Fix)
// ============================================

import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { renderer } from '../core/renderer.js';
import { controls } from '../core/controls.js';
import { fitCameraToScene } from '../core/cameraUtils.js';
import { modelPath, withBase } from '../core/path.js';
import { registerPickables, unregisterPickables } from '../features/selection.js';
import { disposeObject3D } from '../modelLoader/cleanup.js';
import { GroupBatch, setGroupBatch, getGroupBatch, removeGroupBatch } from '../core/groupBatch.js';
import { getShadowFlagsForGroup, setGroupOpacity } from '../features/appearance.js';
import { updateModelColors } from '../modelLoader/color.js';
import { getStore, INITIAL_COLORS, DEFAULT_COLOR } from '../store/useStore.js';
import { requestRender } from '../core/renderScheduler.js';
import { createGLTFLoader } from '../loaders/gltfLoaderFactory.js';
import { setGroupVisibility, showObject, hideObject } from '../features/visibility.js';
import { showLoadingBar, hideLoadingBar, updateLoadingBar } from '../modelLoader/progress.js';

// ✅ IMPORT CONFIG für dynamische Performance-Werte
import { getConfig } from '../config/config.js';

const RESPONSIVE_BATCH_GROUPS = new Set(['muscles', 'skin_hair']);

function getResponsiveBatchSize(groupName, defaultBatchSize, entryCount) {
  const safeDefault = Math.max(1, defaultBatchSize || 1);
  const groupKey = typeof groupName === 'string' ? groupName.toLowerCase() : '';
  if (RESPONSIVE_BATCH_GROUPS.has(groupKey)) {
    return Math.min(safeDefault, 2);
  }
  if (entryCount >= 200) {
    return Math.min(safeDefault, 2);
  }
  if (entryCount >= 80) {
    return Math.min(safeDefault, 3);
  }
  return safeDefault;
}

function shouldYieldBetweenBatches(entryCount, batchSize) {
  return entryCount > batchSize;
}

function waitForBrowserBreather() {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}



// 🔆 Schatten + sRGB Fix für geladene Modelle
function prepareForShadows(root, groupName = root?.userData?.group) {
  const { castShadow, receiveShadow } = getShadowFlagsForGroup(groupName);
  root.traverse((o) => {
    if (!o.isMesh) return;

    // Schatten nur für ausgewählte Gruppen aktivieren
    o.castShadow = castShadow;
    o.receiveShadow = receiveShadow;

    // sRGB nur für „farbige“ Texturen
    const m = o.material;
    if (!m) return;
    if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
    if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    // (Normal-/Roughness-/Metalness-/AO-Maps bleiben linear, daher kein colorSpace-Set)
  });
  return root;
}



/**
 * Mehrere Modelle einer Gruppe laden (in Batches)
 */
export async function loadModels(entries, group, centerCamera, scene, loader, camera, controls, renderer) {
  if (!entries?.length) {
    console.warn(`⚠️ Keine Modelle für Gruppe "${group}" gefunden.`);
    return;
  }

  showLoadingBar();
  const errors = [];
  let loaded = 0;
  const configuredBatchSize = getConfig('performance.batchSize', 3);
  const batchSize = getResponsiveBatchSize(group, configuredBatchSize, entries.length);
  const yieldBetweenBatches = shouldYieldBetweenBatches(entries.length, batchSize);

  console.log(`🔄 Lade ${entries.length} Modelle für "${group}" (Batch: ${batchSize}/${configuredBatchSize}, Yield: ${yieldBetweenBatches})`);



  console.time(`loadGroup-${group}`);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        try {
          await loadSingleModel(entry, group, scene, loader);
          loaded++;
          updateLoadingBar(Math.round((loaded / entries.length) * 100));
        } catch (err) {
          console.error(`❌ Fehler bei ${entry?.id ?? 'unbekannt'}:`, err);
          errors.push({ id: entry?.id, error: err });
        }
      })
    );

    if (yieldBetweenBatches && i + batchSize < entries.length) {
      requestRender();
      await waitForBrowserBreather();
    }
  }

  console.timeEnd(`loadGroup-${group}`);
  hideLoadingBar();

  if (errors.length) {
    console.warn(`⚠️ ${errors.length} Modelle fehlerhaft in Gruppe "${group}":`, errors);
  }

  console.log(`✅ Gruppe "${group}" vollständig geladen! (${loaded} Modelle)`);

  if (centerCamera) {
    try {
      await fitCameraToScene(camera, controls, renderer, scene);
    } catch (err) {
      console.error('❌ Fehler beim Zentrieren der Kamera:', err);
    }
  }
}



/**
 * Genau EIN Modell laden und in Szene + State einhängen
 */
export function loadSingleModel(entry, group, scene, loader) {
  return new Promise((resolve) => {
    try {
      // 1) Variante ermitteln
      const current = entry?.model?.current || 'draco';
      const variant = entry?.model?.variants?.[current];

      // 2) Dateiname mit Fallbacks
      const candidates = [
        variant?.filename, entry?.filename,
        variant?.file, entry?.file,
        variant?.url, entry?.url,
        variant?.src, entry?.src,
      ].filter(v => typeof v === 'string' && v.length > 0);

      const pickBasename = (s) => { try { return s.split('/').pop(); } catch { return s; } };
      const filename = candidates.length ? pickBasename(candidates[0]) : null;

      if (!filename) {
        console.warn(`⚠️ loadSingleModel: Eintrag "${entry?.id ?? 'unbekannt'}" ohne filename – übersprungen.`);
        resolve(null); return;
      }

      // 3) URL bauen
      const variantPath = (variant?.path ?? '').toString().replace(/^\/+|\/+$/g, '');
      const effectiveGroup = group || entry?.classification?.group || 'other';

      const url = variantPath
        ? withBase(`models/${variantPath}/${filename}`)
        : modelPath(filename, effectiveGroup);

      // 4) Laden
      loader.load(
        url,
        (gltf) => {
          const model = gltf?.scene;
          if (!model) {
            console.warn(`⚠️ loadSingleModel: Kein scene-Objekt in GLTF: ${filename}`);
            resolve(null); return;
          }

          // 5) Meta anheften
          const baseName = filename.replace(/\.[^/.]+$/, '');
          model.name = entry?.id || baseName;
          model.userData.meta = entry;
          model.userData.group = effectiveGroup;
          model.userData.isModelRoot = true; // wichtig für getModelRoot()
          model.userData.entry = entry;      // direkter Zugriff im Info-Panel

          // 6) Schatten & Farbraum vorbereiten (🔆)
          prepareForShadows(model, effectiveGroup);

          // 7) Layers (0: Render, 1: Pick)
          model.traverse((ch) => {
            if (!ch.isObject3D) return;
            ch.layers.enable(0);
            ch.layers.enable(1);
          });

          // 8) Pickables registrieren
          registerPickables(model);

          // 9) In State registrieren
          getStore().addGroupModel(effectiveGroup, model);

          // 10) In Szene einhängen
          scene.add(model);

          resolve(model);
        },
        undefined, // onProgress
        (err) => {
          console.warn(`⚠️ loadSingleModel: Ladefehler bei "${entry?.id ?? filename}":`, err);
          resolve(null);
        }
      );
    } catch (e) {
      console.warn(`⚠️ loadSingleModel: Unerwarteter Fehler bei "${entry?.id ?? 'unbekannt'}":`, e);
      resolve(null);
    }
  });
}

/**
 * Existenz-Probe für ein Gruppen-Bundle. HEAD-Request, damit ein fehlendes
 * Bundle keinen 404-Ladefehler im Loader auslöst (ADR 0009).
 */
async function bundleExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Gruppe aus einer gepackten <group>.bundle.glb laden (1 Request statt N, ADR 0009).
 * Jeder Wrapper-Node (Name = Teil-Basename) wird exakt wie ein einzeln geladenes
 * Modell eingerichtet und in Szene + Store gehängt — der Szenegraph ist äquivalent
 * zum Einzel-Ladepfad, Picking/Farbe/Deckkraft pro Teil bleiben erhalten.
 */
async function loadGroupBundle(groupName, bundleUrl, loader) {
  const entries = getStore().groupedMeta?.[groupName] ?? [];
  const byBase = new Map();
  for (const e of entries) {
    const variant = e?.model?.variants?.[e?.model?.current || 'draco'];
    const fn = variant?.filename || e?.filename;
    if (fn) byBase.set(fn.replace(/\.[^/.]+$/, ''), e);
  }

  showLoadingBar();
  const gltf = await loader.loadAsync(bundleUrl);
  updateLoadingBar(60);

  // Phase 1 (ADR 0007): Gruppe als EIN BatchedMesh rendern — nur Messung, keine
  // Interaktion (Picking/Selektion folgen in späteren Phasen über die Registry).
  if (getConfig('performance.batchedGroups', false)) {
    if (getGroupBatch(groupName)) { hideLoadingBar(); return; } // bereits gebatcht
    gltf.scene.updateMatrixWorld(true);
    const batchParts = [];
    for (const wrapper of [...(gltf?.scene?.children ?? [])]) {
      const entry = byBase.get(wrapper.name) ?? null;
      if (!entry) continue;
      wrapper.traverse((ch) => {
        if (ch.isMesh && ch.geometry) {
          batchParts.push({ geometry: ch.geometry, matrixWorld: ch.matrixWorld.clone(), entry });
        }
      });
    }
    const groupColor = getStore().colors?.[groupName] ?? INITIAL_COLORS[groupName] ?? DEFAULT_COLOR;
    const gb = new GroupBatch(groupName);
    const mesh = gb.build(batchParts, { color: groupColor });
    setGroupBatch(groupName, gb);
    scene.add(mesh);
    updateLoadingBar(100);
    hideLoadingBar();
    console.log(`✅ Bundle "${groupName}" als BatchedMesh (${gb.size} Instanzen, ~1 Draw-Call)`);
    return;
  }

  // Snapshot: scene.add() hängt die Nodes um → Kinder-Liste würde sonst mutieren.
  const parts = [...(gltf?.scene?.children ?? [])];
  let loaded = 0;
  let unmapped = 0;

  for (const model of parts) {
    const entry = byBase.get(model.name) ?? null;
    if (!entry) { unmapped++; continue; }

    model.name = entry.id || model.name;
    model.userData.meta = entry;
    model.userData.group = groupName;
    model.userData.isModelRoot = true;
    model.userData.entry = entry;

    prepareForShadows(model, groupName);
    model.traverse((ch) => {
      if (!ch.isObject3D) return;
      ch.layers.enable(0);
      ch.layers.enable(1);
    });

    registerPickables(model);
    getStore().addGroupModel(groupName, model);
    scene.add(model);
    loaded++;
  }

  updateLoadingBar(100);
  hideLoadingBar();

  if (unmapped) console.warn(`⚠️ Bundle "${groupName}": ${unmapped} Teile ohne Meta übersprungen.`);
  console.log(`✅ Bundle "${groupName}" geladen (${loaded} Teile, 1 Request)`);
}

/**
 * Gruppe per Namen laden (nutzt Meta/State). Bevorzugt ein gepacktes Gruppen-Bundle
 * (ADR 0009), fällt sonst auf den Einzel-Datei-Pfad zurück.
 */
export async function loadGroupByName(groupName, { centerCamera = false, loaderReuse = null } = {}) {
  try {
    const entries = getStore().groupedMeta?.[groupName] ?? [];
    console.log(`🔍 Lade ${entries.length} Modelle aus Gruppe "${groupName}"...`);

    if (!entries.length) {
      console.warn(`⚠️ loadGroupByName: Keine Einträge für Gruppe "${groupName}" gefunden.`);
      return;
    }

    const loader = loaderReuse ?? createGLTFLoader();

    const useBundles = getConfig('performance.useBundles', true);
    const bundleUrl = useBundles ? modelPath(`${groupName}.bundle.glb`, groupName) : null;

    if (bundleUrl && (await bundleExists(bundleUrl))) {
      await loadGroupBundle(groupName, bundleUrl, loader);
      if (centerCamera) {
        try {
          await fitCameraToScene(camera, controls, renderer, scene);
        } catch (err) {
          console.error('❌ Kamera-Fit (Bundle) fehlgeschlagen:', err);
        }
      }
    } else {
      await loadModels(entries, groupName, centerCamera, scene, loader, camera, controls, renderer);
    }

    // ✅ FIX: Farbe für ALLE Gruppen anwenden, nicht nur bones/teeth
    const hex = getStore().colors?.[groupName] ?? INITIAL_COLORS[groupName] ?? DEFAULT_COLOR;

    if (hex != null) {
      updateModelColors(groupName, hex);
      console.log(`🎨 Farbe für "${groupName}" gesetzt: 0x${hex.toString(16)}`);
    }

    // Gespeicherte Layer-Transparenz (Röntgen) auf neu geladene Modelle anwenden
    const groupOpacity = getStore().groupOpacity?.[groupName];
    if (groupOpacity != null && groupOpacity < 1) {
      setGroupOpacity(groupName, groupOpacity);
    }

    console.log(`✅ loadGroupByName: Gruppe "${groupName}" geladen (${entries.length} Modelle)`);
  } catch (err) {
    console.error(`❌ loadGroupByName: Fehler beim Laden von "${groupName}":`, err);
  }
}


/**
 * Gruppe geräuschlos entladen – aus Szene entfernen, Ressourcen freigeben,
 * Pickables abmelden und State aktualisieren. Ohne UI-Feedback (Toasts/Buttons);
 * die React-UI stellt den Fortschritt selbst dar.
 */
export async function unloadGroupSilent(groupName) {
  // Batched-Pfad (ADR 0007 Phase 1): das Gruppen-BatchedMesh entfernen.
  const batch = getGroupBatch(groupName);
  if (batch) {
    if (batch.mesh) scene.remove(batch.mesh);
    removeGroupBatch(groupName);
    getStore().setGroupVisible(groupName, false);
    return;
  }

  const models = getStore().groups[groupName] ?? [];
  if (!models.length) return;

  for (const model of models) {
    unregisterPickables(model);
    scene.remove(model);
    disposeObject3D(model);
  }
  getStore().unloadGroup(groupName);
  getStore().setGroupVisible(groupName, false);
}


/**
 * Sichtbarkeitszustand einer Gruppe wiederherstellen
 * (Kompatibilität – eigentlicher Ort: groups.js)
 */
export function restoreGroupState(groupName) {
  if (!groupName || typeof groupName !== 'string') return;
  const { groups, groupStates } = getStore();
  if (!(groupName in groups)) return;

  const models = groups?.[groupName];
  const saved = groupStates?.[groupName];
  if (!Array.isArray(models)) return;

  // Boolean: gesamte Gruppe
  if (typeof saved === 'boolean') {
    setGroupVisibility(groupName, saved);
    return;
  }

  // Object: pro Modell
  if (saved && typeof saved === 'object') {
    for (const model of models) {
      const on = saved[model?.name] !== false;
      if (on) showObject(model); else hideObject(model);
    }
    return;
  }

  // Default: alles anzeigen
  for (const model of models) showObject(model);
}
