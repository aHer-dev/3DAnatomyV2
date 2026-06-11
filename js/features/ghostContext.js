// js/features/ghostContext.js
// Ghost-Kontext-Modus: ausgewählte Struktur opak, alle anderen transparent.
// Snapshot-basiert — exitGhostContext stellt exakten Ausgangszustand wieder her.

import { getStore } from '../store/useStore.js';
import { setObjectOpacity } from './visibility.js';
import { requestRender } from '../core/renderScheduler.js';

const GHOST_ALPHA = 0.08;

let _active = false;
let _snapshot = null; // Map<Object3D, number> — opacity vor dem Eintritt

export function isGhostContextActive() { return _active; }

export function enterGhostContext(selectedModel) {
    if (_active) {
        exitGhostContext();
        return;
    }

    _snapshot = new Map();
    const { groups } = getStore();

    for (const roots of Object.values(groups)) {
        for (const root of roots) {
            const currentOpacity = _readOpacity(root);
            _snapshot.set(root, currentOpacity);

            if (root === selectedModel) {
                setObjectOpacity(root, 1);
            } else {
                setObjectOpacity(root, GHOST_ALPHA);
            }
        }
    }

    _active = true;
    requestRender(4);
}

export function exitGhostContext() {
    if (!_active || !_snapshot) return;

    for (const [root, opacity] of _snapshot) {
        setObjectOpacity(root, opacity);
    }

    _snapshot = null;
    _active = false;
    requestRender(4);
}

function _readOpacity(root) {
    let opacity = 1;
    root.traverse(n => {
        if (n.isMesh && n.material) {
            opacity = Array.isArray(n.material) ? n.material[0]?.opacity ?? 1 : n.material.opacity ?? 1;
        }
    });
    return opacity;
}
