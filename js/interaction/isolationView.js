import { renderer } from '../core/renderer.js';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { setModelVisibility } from '../features/visibility.js';
import { getStore } from '../store/useStore.js';

const DEFAULT_STRUCTURAL_GROUPS = ['bones', 'teeth', 'cartilage', 'ligaments'];

// Sichtbarkeits-Snapshot ist reine 3D-Logik und bleibt modul-lokal.
// Der für die UI relevante Isolations-Zustand (Modell + Aktionsleiste) liegt im Store.
let isolationSnapshot = null;

function saveVisibilitySnapshot() {
  const snapshot = {};
  for (const [group, models] of Object.entries(getStore().groups || {})) {
    for (const model of models) {
      snapshot[`${group}::${model.uuid}`] = model.visible;
    }
  }
  return snapshot;
}

function restoreVisibilitySnapshot(snapshot) {
  for (const [group, models] of Object.entries(getStore().groups || {})) {
    for (const model of models) {
      const key = `${group}::${model.uuid}`;
      if (key in snapshot) {
        setModelVisibility(model, snapshot[key]);
      }
    }
  }
}

/**
 * Normalisiert die (optionale) Aktionsleisten-Konfiguration auf eine vollständige
 * Form, die die React-Leiste (IsolationBar.tsx) direkt rendern kann.
 * @param {object|null} actionBar
 */
function normalizeActionBar(actionBar) {
  const base = actionBar || {};
  return {
    primaryLabel: base.primaryLabel || 'Isolation beenden',
    onPrimary: typeof base.onPrimary === 'function' ? base.onPrimary : () => exitIsolatedView(),
    secondaryLabel: base.secondaryLabel || '',
    onSecondary: typeof base.onSecondary === 'function' ? base.onSecondary : null,
  };
}

export function enterIsolatedView(model, options = {}) {
  if (!model) return false;

  const {
    structuralGroups = DEFAULT_STRUCTURAL_GROUPS,
    storeSnapshot = true,
    showBackButton = true,
    actionBar = null,
    label = null
  } = options;

  if (storeSnapshot && !isolationSnapshot) {
    isolationSnapshot = saveVisibilitySnapshot();
  }

  for (const models of Object.values(getStore().groups || {})) {
    for (const entry of models) {
      setModelVisibility(entry, false);
    }
  }

  for (const group of structuralGroups) {
    for (const entry of getStore().groups?.[group] || []) {
      setModelVisibility(entry, true);
    }
  }

  setModelVisibility(model, true);

  getStore().setIsolation({
    model,
    actionBar: showBackButton ? normalizeActionBar(actionBar) : null,
    label,
  });

  renderer.render(scene, camera);
  return true;
}

export function exitIsolatedView() {
  if (isolationSnapshot) {
    restoreVisibilitySnapshot(isolationSnapshot);
    isolationSnapshot = null;
  }

  getStore().setIsolation({ model: null, actionBar: null });
  renderer.render(scene, camera);
}

export function getIsolatedModel() {
  return getStore().isolation.model;
}

/**
 * Setzt den Isolations-Zustand hart zurück, ohne den (ggf. veralteten)
 * Sichtbarkeits-Snapshot wiederherzustellen — für den vollständigen App-Reset,
 * bei dem ohnehin alle Modelle neu geladen werden.
 */
export function clearIsolationState() {
  isolationSnapshot = null;
  getStore().setIsolation({ model: null, actionBar: null });
}
