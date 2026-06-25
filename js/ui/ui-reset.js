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
  showResetLoadingOverlay();

  try {
    updateResetProgress('Leere Sammlung...', 10);
    getStore().clearCollection();
    getStore().clearSelection();
    clearIsolationState();

    updateResetProgress('Räume Szene komplett auf...', 20);
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

    updateResetProgress('Setze Gruppenstatus zurück...', 30);

    for (const groupName of Object.keys(getStore().groups || {})) {
      getStore().unloadGroup(groupName);
      getStore().setGroupVisible(groupName, false);
    }

    useStore.setState({ pickableObjects: new Set(), groupOpacity: {} });

    let progressStep = 40;
    const stepSize = 40 / STANDARD_GROUPS.length;

    for (const groupName of STANDARD_GROUPS) {
      updateResetProgress(`Lade ${groupName}...`, progressStep);

      try {
        await loadGroupByName(groupName, { centerCamera: false });
        getStore().setGroupVisible(groupName, true);
      } catch (err) {
        console.error(`❌ Fehler beim Laden von "${groupName}":`, err);
      }

      progressStep += stepSize;
    }

    updateResetProgress('Setze Ansicht zurück...', 90);
    setCameraToDefault(camera, controls);
    if (typeof controls?.saveState === 'function') controls.saveState();

    updateResetProgress('Finalisiere...', 95);
    ensureOnlyBasicGroupsVisible();

    updateResetProgress('Fertig!', 100);
    await new Promise(resolve => setTimeout(resolve, 500));

    renderer.render(scene, camera);
  } catch (err) {
    console.error('❌ Fehler beim Reset:', err);
  } finally {
    hideResetLoadingOverlay();
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

// ---------------------------------------------------------------
// Reset-Lade-Overlay (imperativ, eigenständig)
// ---------------------------------------------------------------
function showResetLoadingOverlay() {
  let overlay = document.getElementById('reset-loading-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'reset-loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>Reset läuft</h3>
        <p id="reset-progress-text">Bereite vor...</p>
        <div class="loading-bar">
          <div id="reset-progress-fill" class="loading-bar-fill"></div>
        </div>
      </div>
    `;

    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .loading-content { text-align: center; color: white; max-width: 300px; }
      .loading-spinner {
        width: 50px; height: 50px;
        border: 3px solid #333; border-top: 3px solid #4CAF50;
        border-radius: 50%; animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .loading-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin-top: 15px; }
      .loading-bar-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); transition: width 0.3s ease; width: 0%; }
      .loading-content h3 { margin: 0 0 10px 0; font-size: 24px; }
      .loading-content p { margin: 0; font-size: 14px; opacity: 0.8; }
    `;

    if (!document.querySelector('#reset-loading-styles')) {
      style.id = 'reset-loading-styles';
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
}

function updateResetProgress(text, percent) {
  const textEl = document.getElementById('reset-progress-text');
  const fillEl = document.getElementById('reset-progress-fill');

  if (textEl) textEl.textContent = text;
  if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

function hideResetLoadingOverlay() {
  const overlay = document.getElementById('reset-loading-overlay');
  if (overlay) overlay.style.display = 'none';
}
