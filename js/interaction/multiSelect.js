// js/interaction/multiSelect.js
import * as THREE from 'three';
import { getStore } from '../store/useStore.js';
import { getStructureDisplayLabel } from '../utils/anatomyLabels.js';

const HIGHLIGHT_MULTI = 0x1a1a4a;

function _getName(model) {
    return getStructureDisplayLabel(model) || model.name || '?';
}

function _applyHighlight(model, hex) {
    model.traverse(child => {
        if (child.isMesh && child.material) {
            if (!child.material.emissive) {
                child.material.emissive = new THREE.Color(hex);
            } else {
                child.material.emissive.setHex(hex);
            }
            child.material.needsUpdate = true;
        }
    });
}

function _clearHighlight(model) {
    model.traverse(child => {
        if (child.isMesh && child.material?.emissive) {
            child.material.emissive.setHex(0x000000);
            child.material.needsUpdate = true;
        }
    });
}

export function addToMultiSelect(model) {
    if (!model || getStore().multiSelected.has(model)) return false;
    getStore().addToMultiSelected(model);
    _applyHighlight(model, HIGHLIGHT_MULTI);
    return true;
}

export function removeFromMultiSelect(model) {
    if (!model || !getStore().multiSelected.has(model)) return false;
    getStore().removeFromMultiSelected(model);
    _clearHighlight(model);
    return true;
}

export function toggleMultiSelect(model) {
    if (getStore().multiSelected.has(model)) {
        removeFromMultiSelect(model);
        return false;
    } else {
        addToMultiSelect(model);
        return true;
    }
}

export function clearMultiSelect() {
    for (const model of getStore().multiSelected) {
        _clearHighlight(model);
    }
    getStore().clearMultiSelected();
}

export function getMultiSelectedArray() {
    return Array.from(getStore().multiSelected);
}

export function getModelName(model) {
    return _getName(model);
}
