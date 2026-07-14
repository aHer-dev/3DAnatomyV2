// js/features/labels.js
// Struktur-Beschriftungen via CSS2DRenderer.
// Lazy-init beim ersten Einschalten; eigene rAF-Schleife solange aktiv.

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { getStore } from '../store/useStore.js';
import { getStructureDisplayLabel } from '../utils/anatomyLabels.js';

let _renderer = null;
let _active = false;
let _rafId = null;
const _labelObjects = new Map(); // root → CSS2DObject

// ─── Init ─────────────────────────────────────────────────────────────────────

function _initRenderer() {
    if (_renderer) return;

    _renderer = new CSS2DRenderer();
    _renderer.setSize(window.innerWidth, window.innerHeight);

    const el = _renderer.domElement;
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '15'; // unter React-UI (z-index 20), über Canvas
    document.body.appendChild(el);

    window.addEventListener('resize', () => {
        _renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ─── Label-Objekte ────────────────────────────────────────────────────────────

const _box = new THREE.Box3();
const _center = new THREE.Vector3();

function _createLabel(root) {
    const text = getStructureDisplayLabel(root.userData?.meta ?? root);
    if (!text) return null;

    const div = document.createElement('div');
    div.className = 'structure-label';
    div.textContent = text;

    const obj = new CSS2DObject(div);

    _box.setFromObject(root);
    if (!_box.isEmpty()) {
        _box.getCenter(_center);
        obj.position.copy(_center).sub(root.position);
    }

    root.add(obj);
    return obj;
}

function _buildLabels() {
    const { groups } = getStore();
    for (const roots of Object.values(groups)) {
        for (const root of roots) {
            if (!_labelObjects.has(root)) {
                const obj = _createLabel(root);
                if (obj) _labelObjects.set(root, obj);
            }
        }
    }
}

function _clearLabels() {
    for (const [root, obj] of _labelObjects) {
        root.remove(obj);
        obj.element.remove();
    }
    _labelObjects.clear();
}

// ─── Render-Schleife ──────────────────────────────────────────────────────────

function _tick() {
    _renderer.render(scene, camera);
    if (_active) _rafId = requestAnimationFrame(_tick);
}

// ─── Öffentliche API ──────────────────────────────────────────────────────────

export function isLabelsActive() { return _active; }

export function toggleLabels() {
    _active = !_active;

    if (_active) {
        _initRenderer();
        _buildLabels();
        _renderer.domElement.style.display = '';
        _rafId = requestAnimationFrame(_tick);
    } else {
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
        _clearLabels();
        if (_renderer) _renderer.domElement.style.display = 'none';
    }

    return _active;
}
