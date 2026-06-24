// js/features/presets.js
// Preset-Kernlogik (DOM-frei) — portiert aus der gelöschten ui-presets.js.
// React PresetList rendert die Liste + Lade-/Fehler-Status; hier nur Daten + 3D.
//
// Preset hinzufügen:
//   1. .bluebody-Datei in data/presets/ legen
//   2. Eintrag in data/presets/index.json ergänzen

import { getStore } from '../store/useStore.js';
import { loadGroupByName } from './modelLoader-core.js';
import { setModelColor, setModelOpacity } from './appearance.js';
import { showCollectionInScene } from './collectionView.js';

const MANIFEST_PATH = 'data/presets/index.json';

/** @typedef {{ name: string, file: string, description?: string, category?: string }} Preset */

/** Manifest laden — leeres Array bei Fehler. */
export async function loadPresetManifest() {
  try {
    const res = await fetch(`${MANIFEST_PATH}?_=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.presets) ? data.presets : [];
  } catch (err) {
    console.warn('⚠️ Preset-Manifest konnte nicht geladen werden:', err);
    return [];
  }
}

function matchModel(model, sid) {
  return String(model.userData?.meta?.id ?? '') === sid ||
         String(model.userData?.meta?.fma ?? '') === sid ||
         String(model.name) === sid;
}

function findModel(id, groupHint) {
  if (!id) return null;
  const sid = String(id);
  const groups = getStore().groups;
  if (groupHint && groups[groupHint]) {
    for (const m of groups[groupHint]) if (matchModel(m, sid)) return m;
  }
  for (const models of Object.values(groups)) {
    for (const m of models || []) if (matchModel(m, sid)) return m;
  }
  return null;
}

/**
 * Preset anwenden: benötigte Gruppen laden, Farben/Opazität setzen,
 * Sammlung füllen und in der Szene zeigen.
 * @param {Preset} preset
 * @param {(text: string) => void} [onProgress] Fortschrittstext (für Overlay)
 */
export async function applyPreset(preset, onProgress = () => {}) {
  const res = await fetch(`data/presets/${encodeURIComponent(preset.file)}?_=${Date.now()}`);
  if (!res.ok) throw new Error(`Datei nicht gefunden: ${preset.file}`);
  const data = await res.json();

  if (!data.collection || !Array.isArray(data.collection)) {
    throw new Error('Ungültiges Preset-Format');
  }

  onProgress(`Lade: ${preset.name}`);

  const needed = [...new Set(data.collection.map(i => i.group).filter(Boolean))];
  for (const group of needed) {
    if (!(getStore().groups[group]?.length)) {
      onProgress(`Lade ${group}…`);
      try {
        await loadGroupByName(group, { centerCamera: false });
      } catch (e) {
        console.error(`Gruppe "${group}" konnte nicht geladen werden:`, e);
      }
    }
  }

  getStore().clearCollection();
  onProgress('Wende Preset an…');

  for (const item of data.collection) {
    const model = findModel(item.id, item.group);
    if (!model) { console.warn(`⚠️ Nicht gefunden: ${item.name}`); continue; }
    if (item.color != null) setModelColor(model, item.color);
    if (item.opacity != null) setModelOpacity(model, item.opacity);
    getStore().addToCollection({
      id: item.id, name: item.name, group: item.group,
      meta: item.meta || {}, color: item.color,
      opacity: item.opacity, visible: item.visible !== false, model,
    });
  }

  document.dispatchEvent(new CustomEvent('collectionUpdated'));
  await showCollectionInScene();
}
