/**
 * @file ui-set.js
 * @description Sammlung mit dezentestem Feedback
 */
import * as THREE from 'three';

import { setModelColor, setModelOpacity } from '../features/appearance.js';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { renderer } from '../core/renderer.js';
import { controls } from '../core/controls.js';
import { getStore } from '../store/useStore.js';
import { requestRender } from '../core/renderScheduler.js';
import { hideAllManagedModels, setModelVisibility, showModel, hideModel } from '../features/visibility.js';
import { collectionManager } from './ui-collection-export.js';

import { rebuildRaycastStructures } from '../core/raycaster.js';
import { loadGroupByName } from '../features/modelLoader-core.js';
import { extractModelData } from '../utils/modelData.js';
import { renderStructureLabel } from '../utils/anatomyLabels.js';

function showToast(message, type = 'success', duration = 3000) {
  const existingToast = document.getElementById('collection-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'collection-toast';
  toast.textContent = message;

  const colors = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3'
  };

  toast.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, duration);
}

function animateButtonSuccess(button, originalText, successText = '✅ Hinzugefügt!') {
  const originalColor = button.style.backgroundColor;
  const originalTextColor = button.style.color;

  button.style.backgroundColor = '#4caf50';
  button.style.color = 'white';
  button.textContent = successText;
  button.disabled = true;

  setTimeout(() => {
    button.style.backgroundColor = originalColor;
    button.style.color = originalTextColor;
    button.textContent = originalText;
    button.disabled = false;
  }, 2000);
}

function buildModelIndex() {
  const index = new Map();
  for (const models of Object.values(getStore().groups || {})) {
    for (const model of models) {
      const ids = [
        model.userData?.meta?.id,
        model.userData?.meta?.fma,
        model.userData?.entry?.id,
        model.userData?.entry?.fma,
        model.name,
      ];
      for (const id of ids) {
        if (id && !index.has(String(id))) index.set(String(id), model);
      }
    }
  }
  return index;
}

function findModelById(searchId, _preferredGroup = null, index = null) {
  if (!searchId) return null;
  const map = index ?? buildModelIndex();
  return map.get(String(searchId)) ?? null;
}

async function synchronizeCollection() {
  const index = buildModelIndex();
  let synced = 0, notFound = 0;

  for (const item of getStore().collection) {
    const valid = item.model?.parent && !item.model.parent.userData?.disposed;
    if (valid) { synced++; continue; }

    const found = findModelById(item.id, item.group, index);
    if (found) { item.model = found; synced++; }
    else notFound++;
  }

  if (notFound > 0) console.warn(`synchronizeCollection: ${notFound} Modelle nicht gefunden`);
}

export async function showCollectionRobust() {
  if (!getStore().collection || getStore().collection.length === 0) {
    showToast('Die Sammlung ist leer', 'info');
    return;
  }

  showCollectionLoadingOverlay();

  try {
    const requiredGroups = [...new Set(getStore().collection.map(item => item.group).filter(Boolean))];
    const currentGroups = Object.keys(getStore().groups || {}).filter(g =>
      (getStore().groups[g] || []).length > 0
    );
    const missingGroups = requiredGroups.filter(group => !currentGroups.includes(group));

    if (missingGroups.length > 0) {
      hideSceneForLoading();
      updateLoadingProgress(`Lade ${missingGroups.length} Gruppe(n)...`, 0);
    }

    for (let i = 0; i < missingGroups.length; i++) {
      const group = missingGroups[i];
      updateLoadingProgress(`Lade ${group}...`, (i / missingGroups.length) * 80);

      try {
        await loadGroupByName(group, { centerCamera: false });
      } catch (err) {
        console.error(`❌ Fehler beim Laden von "${group}":`, err);
      }
    }

    updateLoadingProgress('Bereite Sammlung vor...', 85);
    await synchronizeCollection();

    updateLoadingProgress('Bereite Anzeige vor...', 90);

    Object.values(getStore().groups || {}).forEach(models => {
      (models || []).forEach(model => hideModel(model));
    });

    let preparedCount = 0;
    for (const item of getStore().collection) {
      if (item.model && item.model.parent) {
        if (item.color !== undefined) setModelColor(item.model, item.color);
        if (item.opacity !== undefined && item.opacity < 1) setModelOpacity(item.model, item.opacity);
        showModel(item.model);
        preparedCount++;
      }
    }

    updateLoadingProgress('Fertig!', 100);
    await new Promise(resolve => setTimeout(resolve, 200));

    showSceneAfterLoading();
    requestRender();

    showToast(`Sammlung angezeigt: ${preparedCount} Objekte`, 'success');

  } catch (err) {
    console.error('❌ Fehler beim Anzeigen der Sammlung:', err);
    showSceneAfterLoading();
    showToast('Fehler beim Anzeigen der Sammlung', 'error');
  } finally {
    hideCollectionLoadingOverlay();
  }
}

export function setupSetUI() {
  const addBtn = document.getElementById('btn-add-to-set');
  const showBtn = document.getElementById('btn-show-set');
  const clearBtn = document.getElementById('btn-clear-set');

  if (showBtn) {
    const newShowBtn = showBtn.cloneNode(true);
    showBtn.parentNode.replaceChild(newShowBtn, showBtn);
    newShowBtn.addEventListener('click', showCollectionRobust);
  }

  if (addBtn) {
    const originalButtonText = addBtn.textContent;

    addBtn.addEventListener('click', () => {
      const selected = getStore().selected?.root;
      if (!selected) {
        showToast('Bitte wählen Sie zuerst ein Modell aus!', 'warning');
        return;
      }

      setTimeout(() => { collectionManager.setupUI(); }, 100);

      const { id: modelId, name: modelName, group: modelGroup } = extractModelData(selected);

      const exists = getStore().collection.some(item => item.id === modelId);
      if (exists) {
        showToast(`"${modelName}" ist bereits in der Sammlung`, 'warning');

        const originalColor = addBtn.style.backgroundColor;
        addBtn.style.backgroundColor = '#ff9800';
        addBtn.style.color = 'white';
        addBtn.textContent = '⚠️ Bereits vorhanden';

        setTimeout(() => {
          addBtn.style.backgroundColor = originalColor;
          addBtn.style.color = '';
          addBtn.textContent = originalButtonText;
        }, 2000);

        return;
      }

      const collectionItem = {
        id: modelId,
        name: modelName,
        group: modelGroup,
        meta: selected.userData?.meta || selected.userData?.entry || {},
        color: extractModelColor(selected),
        opacity: extractModelOpacity(selected),
        visible: selected.visible !== false,
        model: selected,
        addedAt: Date.now(),
        originalName: selected.name,
        hasUserData: !!selected.userData,
        hasMeta: !!selected.userData?.meta,
        hasEntry: !!selected.userData?.entry
      };

      getStore().addToCollection(collectionItem);
      updateSetList();

      showToast(`"${modelName}" zur Sammlung hinzugefügt`, 'success');
      animateButtonSuccess(addBtn, originalButtonText);
      _highlightModelBriefly(selected);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (getStore().collection.length === 0) {
        showToast('Die Sammlung ist bereits leer', 'info');
        return;
      }

      const confirmed = confirm(`🗑️ Möchten Sie wirklich ${getStore().collection.length} Objekte aus der Sammlung entfernen?`);

      if (confirmed) {
        const removedCount = getStore().collection.length;
        getStore().clearCollection();
        updateSetList();

        Object.values(getStore().groups || {}).forEach(models => {
          (models || []).forEach(root => setModelVisibility(root, true));
        });

        renderer.render(scene, camera);
        showToast(`Sammlung geleert: ${removedCount} Objekte entfernt`, 'info');
      }
    });
  }

  updateSetList();

  document.addEventListener('collectionUpdated', () => {
    updateSetList();
  });
}

function extractModelColor(model) {
  if (!model) return null;
  let color = null;
  model.traverse(child => {
    if (child.isMesh && child.material && child.material.color && !color) {
      color = child.material.color.getHex();
    }
  });
  return color;
}

function extractModelOpacity(model) {
  if (!model) return 1;
  let opacity = 1;
  model.traverse(child => {
    if (child.isMesh && child.material) {
      opacity = child.material.opacity || 1;
    }
  });
  return opacity;
}

function _highlightModelBriefly(model) {
  model.traverse(obj => {
    if (obj.isMesh && obj.material) {
      const originalEmissive = obj.material.emissive?.clone() || new THREE.Color(0x000000);
      obj.material.emissive = new THREE.Color(0x00ff00);
      setTimeout(() => {
        obj.material.emissive = originalEmissive;
        renderer.render(scene, camera);
      }, 500);
    }
  });
  renderer.render(scene, camera);
}

export function updateSetList() {
  const setList = document.getElementById('set-list');
  if (!setList) return;

  let contentWrapper = document.getElementById('set-list-content');
  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.id = 'set-list-content';
    setList.innerHTML = '';
    setList.appendChild(contentWrapper);
  }

  contentWrapper.innerHTML = '<h4 style="margin: 0 0 10px 0;">Meine Sammlung:</h4>';

  if (getStore().collection.length === 0) {
    contentWrapper.innerHTML += '<p style="color: #999; font-style: italic;">Leer - Klicken Sie Modelle an und fügen Sie sie hinzu</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.padding = '0';
  ul.style.margin = '0';
  ul.style.maxHeight = '300px';
  ul.style.overflowY = 'auto';

  const groupedItems = groupCollectionByGroup(getStore().collection);

  Object.entries(groupedItems).forEach(([groupName, items]) => {
    const groupHeader = document.createElement('li');
    groupHeader.style.fontWeight = 'bold';
    groupHeader.style.color = '#4CAF50';
    groupHeader.style.marginTop = '8px';
    groupHeader.style.marginBottom = '4px';
    groupHeader.textContent = `${groupName.toUpperCase()} (${items.length})`;
    ul.appendChild(groupHeader);

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.cssText = `
        padding: 5px 5px 5px 20px;
        margin-bottom: 3px;
        background-color: rgba(255,255,255,0.1);
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
      `;

      const nameSpan = document.createElement('span');
      renderStructureLabel(nameSpan, item.name || `Objekt ${index + 1}`);
      nameSpan.style.fontSize = '14px';

      const indicators = document.createElement('span');
      indicators.style.cssText = 'display: flex; gap: 5px; align-items: center;';

      if (item.color !== null && item.color !== undefined) {
        const colorDot = document.createElement('span');
        const hexColor = typeof item.color === 'number'
          ? '#' + item.color.toString(16).padStart(6, '0')
          : item.color;
        colorDot.style.cssText = `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${hexColor};
          border: 1px solid rgba(255,255,255,0.5);
        `;
        indicators.appendChild(colorDot);
      }

      if (item.opacity !== undefined && item.opacity < 1) {
        const opacityBadge = document.createElement('span');
        opacityBadge.textContent = `${Math.round(item.opacity * 100)}%`;
        opacityBadge.style.cssText = `
          font-size: 10px;
          padding: 1px 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          color: rgba(255,255,255,0.8);
        `;
        indicators.appendChild(opacityBadge);
      }

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: #ff4444;
        cursor: pointer;
        font-size: 16px;
        padding: 0 5px;
        transition: color 0.2s ease;
      `;
      removeBtn.title = 'Aus Sammlung entfernen';

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        getStore().removeFromCollection(item.id);
        updateSetList();
        showToast(`"${item.name}" aus Sammlung entfernt`, 'info', 2000);
      });

      li.addEventListener('mouseenter', () => { li.style.backgroundColor = 'rgba(255,255,255,0.2)'; });
      li.addEventListener('mouseleave', () => { li.style.backgroundColor = 'rgba(255,255,255,0.1)'; });

      li.appendChild(nameSpan);
      li.appendChild(indicators);
      li.appendChild(removeBtn);
      ul.appendChild(li);
    });
  });

  contentWrapper.appendChild(ul);

  const count = document.createElement('p');
  count.style.cssText = `
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.1);
    font-size: 12px;
    color: #999;
    text-align: center;
  `;
  count.textContent = `${getStore().collection.length} Objekt(e) in Sammlung`;
  contentWrapper.appendChild(count);
}

function groupCollectionByGroup(collection) {
  const grouped = {};

  collection.forEach(item => {
    const group = item.group || 'Unbekannt';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const sortedGroups = {};
  const priority = ['bones', 'teeth'];

  priority.forEach(group => {
    if (grouped[group]) sortedGroups[group] = grouped[group];
  });

  Object.keys(grouped)
    .filter(group => !priority.includes(group))
    .sort()
    .forEach(group => {
      sortedGroups[group] = grouped[group];
    });

  return sortedGroups;
}

export function updateCollectionUI() {
  updateSetList();
}

export function clearCollection() {
  getStore().clearCollection();
  updateCollectionUI();

  Object.values(getStore().groups || {}).forEach(models => {
    (models || []).forEach(root => setModelVisibility(root, true));
  });

  renderer.render(scene, camera);
}

export function showCollectionInScene() {
  const showBtn = document.getElementById('btn-show-set');
  if (showBtn) showBtn.click();
}

function showCollectionLoadingOverlay() {
  let overlay = document.getElementById('collection-loading-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'collection-loading-overlay';
    overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3>Lade Sammlung</h3>
                <p id="loading-progress-text">Bereite vor...</p>
                <div class="loading-bar">
                    <div id="loading-progress-fill" class="loading-bar-fill"></div>
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
                border: 3px solid #333; border-top: 3px solid #FF7A4A;
                border-radius: 50%; animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .loading-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; overflow: hidden; margin-top: 15px; }
            .loading-bar-fill { height: 100%; background: linear-gradient(180deg, #4A9EFF, #FF7A4A); transition: width 0.3s ease; width: 0%; }
            .loading-content h3 { margin: 0 0 10px 0; font-size: 24px; }
            .loading-content p { margin: 0; font-size: 14px; opacity: 0.8; }
        `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
}

function updateLoadingProgress(text, percent) {
  const textEl = document.getElementById('loading-progress-text');
  const fillEl = document.getElementById('loading-progress-fill');

  if (textEl) textEl.textContent = text;
  if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

function hideCollectionLoadingOverlay() {
  const overlay = document.getElementById('collection-loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

function hideSceneForLoading() {
  const canvas = renderer.domElement;
  if (canvas) {
    canvas.style.opacity = '0.3';
    canvas.style.pointerEvents = 'none';
  }
}

function showSceneAfterLoading() {
  const canvas = renderer.domElement;
  if (canvas) {
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'auto';
  }
  renderer.render(scene, camera);
}
