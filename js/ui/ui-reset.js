// js/ui/ui-reset.js
import useStore, { getStore, INITIAL_COLORS } from '../store/useStore.js';
import { renderer } from '../core/renderer.js';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { updateModelColors } from '../modelLoader/color.js';
import { loadGroupByName } from '../features/modelLoader-core.js';
import { setModelOpacity } from '../features/appearance.js';
import { setCameraToDefault } from '../core/cameraUtils.js';
import { setModelVisibility, showModel } from '../features/visibility.js';
import { unregisterPickables } from '../features/selection.js';
import { clearMultiSelect } from '../interaction/multiSelect.js';
import { exitIsolatedView } from '../interaction/isolationView.js';
import { disposeObject3D } from '../modelLoader/cleanup.js';

const STANDARD_GROUPS = ['bones', 'teeth', 'cartilage'];

// ---------------------------------------------------------------
// 1) LEICHTER RESET
// ---------------------------------------------------------------
export function setupResetUI() {
  const btn = document.getElementById('btn-reset');
  if (!btn) {
    console.warn('Reset-Button (#btn-reset) nicht gefunden');
    return;
  }

  const shortcutsBtn = document.getElementById('btn-shortcuts');
  const shortcutsTip = document.getElementById('shortcuts-tip');
  if (shortcutsBtn && shortcutsTip) {
    shortcutsBtn.addEventListener('mouseenter', () => {
      const r = shortcutsBtn.getBoundingClientRect();
      shortcutsTip.style.left = `${r.left + r.width / 2}px`;
      shortcutsTip.style.top = `${r.top - 8}px`;
      shortcutsTip.style.transform = 'translate(-50%, -100%)';
      shortcutsTip.classList.add('visible');
      shortcutsTip.setAttribute('aria-hidden', 'false');
    });
    shortcutsBtn.addEventListener('mouseleave', () => {
      shortcutsTip.classList.remove('visible');
      shortcutsTip.setAttribute('aria-hidden', 'true');
    });
    shortcutsBtn.addEventListener('click', () => {
      const visible = shortcutsTip.classList.toggle('visible');
      shortcutsTip.setAttribute('aria-hidden', String(!visible));
    });
  }

  const colorBtn = document.getElementById('btn-reset-colors');
  if (colorBtn) {
    colorBtn.addEventListener('click', () => {
      resetColors();
      renderer.render(scene, camera);
    }, { passive: true });
  }

  btn.addEventListener('click', async () => {
    try {
      console.log('🔄 Schneller Reset gestartet...');
      await resetToDefaultView();
      setCameraToDefault(camera, controls);
      if (typeof controls?.saveState === 'function') controls.saveState();
      renderer.render(scene, camera);
      console.log('✅ Reset: Ansicht zurückgesetzt');
    } catch (error) {
      console.error('❌ Schneller Reset fehlgeschlagen:', error);
    }
  }, { passive: true });
}

function isMuskelfinderDeeplinkActive() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('source') === 'muskelfinder'
      || params.has('muscleKey')
      || params.has('muscle');
  } catch (error) {
    return false;
  }
}

function clearMuskelfinderDeeplinkParams() {
  try {
    const url = new URL(window.location.href);
    ['muscleKey', 'muscle', 'source', 'returnTo'].forEach((key) => {
      url.searchParams.delete(key);
    });
    const search = url.searchParams.toString();
    window.history.replaceState({}, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
  } catch (error) {
    console.warn('⚠️ Deeplink-Parameter konnten nicht entfernt werden:', error);
  }
}

async function resetToDefaultView() {
  exitIsolatedView();
  clearMultiSelect();
  getStore().clearSelection();

  const loadedGroups = Object.keys(getStore().groups || {});

  for (const groupName of loadedGroups) {
    if (STANDARD_GROUPS.includes(groupName)) continue;

    const models = getStore().groups[groupName] || [];
    if (!models.length) continue;

    for (const model of models) {
      unregisterPickables(model);
      scene.remove(model);
      disposeObject3D(model);
    }

    getStore().unloadGroup(groupName);
    getStore().setGroupVisible(groupName, false);
  }

  for (const groupName of STANDARD_GROUPS) {
    if (!getStore().groups[groupName]?.length) {
      await loadGroupByName(groupName, { centerCamera: false });
    }

    getStore().setGroupVisible(groupName, true);

    (getStore().groups[groupName] || []).forEach((model) => {
      setModelOpacity(model, 1);
      showModel(model);
    });
  }

  if (isMuskelfinderDeeplinkActive()) {
    clearMuskelfinderDeeplinkParams();
  }

  console.log('✅ Startansicht mit bones, teeth und cartilage wiederhergestellt');
}

function ensureOnlyBasicGroupsVisible() {
  Object.keys(getStore().groups || {}).forEach(groupName => {
    const models = getStore().groups[groupName] || [];
    const shouldBeVisible = STANDARD_GROUPS.includes(groupName);
    models.forEach(model => {
      if (model && model.parent) {
        setModelVisibility(model, shouldBeVisible);
        if (!shouldBeVisible && model.visible) {
          console.warn(`⚠️ Gruppe "${groupName}" sollte unsichtbar sein, ist aber sichtbar!`);
        }
        if (shouldBeVisible && !model.visible) {
          console.warn(`⚠️ Gruppe "${groupName}" sollte sichtbar sein, ist aber unsichtbar!`);
        }
      }
    });
  });
}

// ---------------------------------------------------------------
// 2) VOLLSTÄNDIGER RESET
// ---------------------------------------------------------------
export async function resetApp() {
  console.log('🔄 Vollständiger Reset gestartet...');
  console.log('📋 Standard-Gruppen:', STANDARD_GROUPS);

  showResetLoadingOverlay();

  try {
    updateResetProgress('Leere Sammlung...', 10);
    getStore().clearCollection();
    getStore().clearSelection();

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

    console.log(`🗑️ ${toRemove.length} Modelle entfernt`);

    updateResetProgress('Setze Gruppenstatus zurück...', 30);

    for (const groupName of Object.keys(getStore().groups || {})) {
      getStore().unloadGroup(groupName);
      getStore().setGroupVisible(groupName, false);
    }

    useStore.setState({ pickableObjects: new Set() });

    console.log('📦 Lade Standard-Gruppen:', STANDARD_GROUPS);

    let progressStep = 40;
    const stepSize = 40 / STANDARD_GROUPS.length;

    for (const groupName of STANDARD_GROUPS) {
      updateResetProgress(`Lade ${groupName}...`, progressStep);

      try {
        await loadGroupByName(groupName, { centerCamera: false });
        getStore().setGroupVisible(groupName, true);
        console.log(`✅ ${groupName} geladen`);
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

    console.log('✅ Reset abgeschlossen - Standard-Gruppen:', STANDARD_GROUPS);

  } catch (err) {
    console.error('❌ Fehler beim Reset:', err);
  } finally {
    hideResetLoadingOverlay();
  }
}

function resetColors() {
  Object.entries(INITIAL_COLORS).forEach(([groupName, hex]) => {
    getStore().setGroupColor(groupName, hex);

    if (getStore().groups[groupName]?.length > 0) {
      updateModelColors(groupName, hex);
    }
  });
}

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
