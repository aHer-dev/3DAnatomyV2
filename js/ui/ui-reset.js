// js/ui/ui-reset.js
// App-Reset-Logik (DOM-frei aufgerufen) — React Toolbar/SettingsPanel rufen
// resetApp() und resetColors() direkt auf.
import useStore, { getStore, INITIAL_COLORS } from '../store/useStore.js';
import { renderer } from '../core/renderer.js';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { updateModelColors } from '../modelLoader/color.js';
import { loadGroupByName } from '../features/modelLoader-core.js';
import { setCameraToDefault } from '../core/cameraUtils.js';
import { setModelVisibility } from '../features/visibility.js';
import { unregisterPickables } from '../features/selection.js';
import { disposeObject3D } from '../modelLoader/cleanup.js';
import { clearIsolationState } from '../interaction/isolationView.js';

const STANDARD_GROUPS = ['bones', 'teeth', 'cartilage'];

function ensureOnlyBasicGroupsVisible() {
  Object.keys(getStore().groups || {}).forEach(groupName => {
    const models = getStore().groups[groupName] || [];
    const shouldBeVisible = STANDARD_GROUPS.includes(groupName);
    models.forEach(model => {
      if (model && model.parent) {
        setModelVisibility(model, shouldBeVisible);
      }
    });
  });
}

// ---------------------------------------------------------------
// Vollständiger Reset (Ansicht zurücksetzen)
// ---------------------------------------------------------------
export async function resetApp() {
  // Gebrandeter LoadingScreen (§9.11) über den loading-Slice wiederverwendet
  // statt eines eigenen Overlays. Store-Actions direkt (nicht progress.js) →
  // kein 'circleOverlayHidden'-Dispatch, keine Kollision mit dem Initial-Load.
  getStore().showLoading('3D-Ansicht wird zurückgesetzt …');

  try {
    getStore().setLoadingProgress(10);
    getStore().clearCollection();
    getStore().clearSelection();
    clearIsolationState();

    getStore().setLoadingProgress(20);
    const toRemove = [];
    scene.traverse(child => {
      if (child.userData?.isModelRoot) {
        toRemove.push(child);
      }
    });

    for (const obj of toRemove) {
      unregisterPickables(obj);
      scene.remove(obj);
      disposeObject3D(obj);
    }

    getStore().setLoadingProgress(30);

    for (const groupName of Object.keys(getStore().groups || {})) {
      getStore().unloadGroup(groupName);
      getStore().setGroupVisible(groupName, false);
    }

    useStore.setState({ pickableObjects: new Set(), groupOpacity: {} });

    let progressStep = 40;
    const stepSize = 40 / STANDARD_GROUPS.length;

    for (const groupName of STANDARD_GROUPS) {
      getStore().setLoadingProgress(progressStep);

      try {
        await loadGroupByName(groupName, { centerCamera: false });
        getStore().setGroupVisible(groupName, true);
      } catch (err) {
        console.error(`❌ Fehler beim Laden von "${groupName}":`, err);
      }

      progressStep += stepSize;
    }

    getStore().setLoadingProgress(90);
    setCameraToDefault(camera, controls);
    if (typeof controls?.saveState === 'function') controls.saveState();

    getStore().setLoadingProgress(95);
    ensureOnlyBasicGroupsVisible();

    getStore().setLoadingProgress(100);
    await new Promise(resolve => setTimeout(resolve, 500));

    renderer.render(scene, camera);
  } catch (err) {
    console.error('❌ Fehler beim Reset:', err);
  } finally {
    getStore().hideLoading();
  }
}

// ---------------------------------------------------------------
// Farben auf Gruppen-Defaults zurücksetzen
// ---------------------------------------------------------------
export function resetColors() {
  Object.entries(INITIAL_COLORS).forEach(([groupName, hex]) => {
    getStore().setGroupColor(groupName, hex);
    if (getStore().groups[groupName]?.length > 0) {
      updateModelColors(groupName, hex);
    }
  });
  renderer.render(scene, camera);
}
