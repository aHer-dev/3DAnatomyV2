// js/interaction/index.js
// Werkzeug-basierte Interaktion: Select | Multi | Box

import { renderer } from '../core/renderer.js';
import { setupRaycastOnClick } from './raycastOnClick.js';
import { hideInfoPanel } from './infoPanel.js';
import { highlightModel } from './highlightModel.js';
import { toggleMultiSelect, clearMultiSelect, getMultiSelectedArray, addToMultiSelect } from './multiSelect.js';
import { setupBoxSelect } from './boxSelect.js';
import { getActiveTool, TOOL } from '../ui/toolbar.js';
import { getStore } from '../store/useStore.js';
import { showModel, hideModel, ghostModel } from '../features/visibility.js';

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
    });

    setupBoxSelect(renderer.domElement, refreshMultiPanel);

    setupHotkeys();
}
