// js/interaction/index.js
// Werkzeug-basierte Interaktion: Select | Multi | Box

import { renderer } from '../core/renderer.js';
import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { setupRaycastOnClick } from './raycastOnClick.js';
import { pickAt } from '../core/raycaster.js';
import { highlightModel } from './highlightModel.js';
import { enterIsolatedView } from './isolationView.js';
import { toggleMultiSelect, clearMultiSelect, addToMultiSelect } from './multiSelect.js';
import { setupBoxSelect } from './boxSelect.js';
import { getActiveTool, TOOL } from '../ui/toolbar.js';
import { getStore } from '../store/useStore.js';
import { showModel, hideModel, ghostModel } from '../features/visibility.js';
import { focusOnObject } from '../core/cameraUtils.js';

function isTypingTarget(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function setupHotkeys() {
    window.addEventListener('keydown', (e) => {
        if (isTypingTarget(document.activeElement)) return;

        if (e.key === 'Escape') {
            if (getStore().multiSelected.size > 0) {
                clearMultiSelect();
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
    // React MultiSelectPanel reagiert direkt auf Store-Änderungen — nichts zu tun
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

    setupHotkeys();
}
