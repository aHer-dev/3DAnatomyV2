// js/interaction/index.js
// Werkzeug-basierte Interaktion: Select | Multi | Box

import { renderer } from '../core/renderer.js';
import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { setupRaycastOnClick } from './raycastOnClick.js';
import { pickAt } from '../core/raycaster.js';
import { hideInfoPanel } from './infoPanel.js';
import { highlightModel } from './highlightModel.js';
import { enterIsolatedView } from './isolationView.js';
import { toggleMultiSelect, clearMultiSelect, getMultiSelectedArray, addToMultiSelect } from './multiSelect.js';
import { setupBoxSelect } from './boxSelect.js';
import { getActiveTool, TOOL } from '../ui/toolbar.js';
import { getStore } from '../store/useStore.js';
import { showModel, hideModel, ghostModel } from '../features/visibility.js';
import { focusOnObject } from '../core/cameraUtils.js';
import { setupHoverTooltip } from './hoverTooltip.js';

function isTypingTarget(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function setupHotkeys() {
    window.addEventListener('keydown', (e) => {
        if (isTypingTarget(document.activeElement)) return;

        if (e.key === 'Escape') {
            if (getStore().multiSelected.size > 0) {
                clearMultiSelect();
                hideInfoPanel();
            }
            return;
        }

        const root = getStore().selected?.root || null;
        if (!root) return;
        const k = e.key.toLowerCase();
        if (k === 'g') {
            let anyPickable = false;
            root.traverse(n => { if (n.isMesh && getStore().pickableObjects.has(n)) anyPickable = true; });
            anyPickable ? ghostModel(root, 0.15) : showModel(root);
        }
        if (k === 'h') hideModel(root);
        if (k === 's') showModel(root);
    });
}

function refreshMultiPanel() {
    // React MultiSelectPanel reacts to store changes — nothing to do here
    // hideInfoPanel still called when multi-select is cleared (clears old DOM panel too)
    const sel = getMultiSelectedArray();
    if (sel.length === 0) hideInfoPanel();
}

export function setupInteractions() {
    setupRaycastOnClick(renderer.domElement, ({ meta, model, event }) => {
        const tool = getActiveTool();

        if (tool === TOOL.BOX) {
            // Im Rechteck-Modus zählt ein einzelner Klick als direktes Hinzufügen
            addToMultiSelect(model);
            refreshMultiPanel();
            return;
        }

        if (tool === TOOL.MULTI || event.ctrlKey) {
            // Mehrfach-Modus: togglen
            toggleMultiSelect(model);
            refreshMultiPanel();
            return;
        }

        // Standard: Einzelauswahl — React InfoPanel reagiert auf Store-Änderung
        if (getStore().multiSelected.size > 0) clearMultiSelect();
        highlightModel(model);
        getStore().setSelection({ meta });
        focusOnObject(camera, controls, model);
    });

    // Doppelklick → Struktur isolieren
    renderer.domElement.addEventListener('dblclick', (e) => {
        const sel = pickAt(e.clientX, e.clientY);
        if (sel?.root) enterIsolatedView(sel.root);
    });

    setupBoxSelect(renderer.domElement, refreshMultiPanel);
    setupHoverTooltip(renderer.domElement);

    setupHotkeys();
}
