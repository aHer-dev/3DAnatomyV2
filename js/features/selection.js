// js/features/selection.js
// ✅ BROWSER-KOMPATIBLE VERSION (kein require!)

import * as THREE from 'three';
import { getStore } from '../store/useStore.js';
import { markPickablesDirty } from '../core/raycaster.js';

/**
 * Setzt ein Mesh als pickbar/nicht-pickbar
 * @param {THREE.Mesh} mesh 
 * @param {boolean} on 
 * @param {Set} pickableSet - State wird von außen übergeben (optional)
 */

export function setPickable(mesh, pickable, pickableSet = null) {
    if (!mesh?.isMesh) return;

    const enable = !!pickable;

    // Originales Raycast sichern (einmalig)
    mesh.userData ??= {};
    if (!mesh.userData.__origRaycast) {
        mesh.userData.__origRaycast = mesh.raycast;
    }

    // Flag + Raycast setzen
    mesh.userData.pickable = enable;
    mesh.raycast = enable ? mesh.userData.__origRaycast : () => { };

    if (enable) getStore().addPickable(mesh);
    else getStore().removePickable(mesh);
    markPickablesDirty();
}


/**
 * Rekursiv alle sichtbaren Meshes eines Roots registrieren
 * @param {THREE.Object3D} root 
 * @param {Set} pickableSet 
 */
export function registerPickables(root) {
    if (!root) return;
    root.traverse(node => {
        if (node.isMesh && node.visible) {
            setPickable(node, true);
        }
    });
}

/**
 * Rekursiv alle Meshes aus dem Pick-Pool entfernen
 * @param {THREE.Object3D} root 
 * @param {Set} pickableSet 
 */
export function unregisterPickables(root) {
    if (!root) return;
    root.traverse(node => {
        if (node.isMesh) {
            setPickable(node, false);
        }
    });
}

/**
 * Prüft ob ein Mesh pickbar ist
 * @param {THREE.Mesh} mesh 
 * @param {Set} pickableSet 
 * @returns {boolean}
 */
export function isPickable(mesh) {
    return getStore().pickableObjects.has(mesh);
}

export function setMultiplePickable(meshes, pickable) {
    for (const mesh of meshes) {
        setPickable(mesh, pickable);
    }
}