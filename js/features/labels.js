// js/features/labels.js
// Struktur-Beschriftungen via CSS2DRenderer.
//
// Zwei Regeln, beide aus dem Verhalten auf einem Handy gelernt:
//
//  1. NICHT ALLES BESCHRIFTEN. Die Vorgaenger-Fassung baute ein Label pro Root
//     pro Gruppe — in der Isolation sind Knochen, Zaehne, Knorpel und Baender
//     ja bewusst wieder eingeblendet, also rund 297 Kaesten gleichzeitig. CSS2D
//     kennt keine Verdeckung: ein Label hinter dem Becken liegt trotzdem
//     obendrauf. Das Ergebnis war ein dunkler Brei ueber dem Modell. Jetzt
//     bekommen nur SICHTBARE Strukturen ein Label, davon die der Kamera
//     naechsten bis MAX_LABELS — plus die Auswahl/Isolation, die immer dabei
//     ist, egal wie weit weg sie steht.
//
//  2. KEINE EIGENE RENDER-SCHLEIFE. Die Vorgaenger-Fassung lief mit eigener
//     requestAnimationFrame-Schleife bei 60 fps weiter, solange Beschriftungen
//     an waren — auch wenn sich nichts bewegte, und der CSS2D-Renderer
//     durchlaeuft dabei jedes Mal den ganzen Szenengraph (mit Muskeln 1500+
//     Knoten). Das hebelte das Demand-Rendering der App aus. `renderLabels()`
//     haengt jetzt im zentralen Loop und wird nur gezeichnet, wenn ohnehin
//     gezeichnet wird.

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { getStore } from '../store/useStore.js';
import { requestRender } from '../core/renderScheduler.js';
import { getStructureDisplayLabel } from '../utils/anatomyLabels.js';
import { rankLabelTargets } from './labelRanking.js';

/** Wie oft die Auswahl der beschrifteten Strukturen neu bestimmt wird. */
const REFRESH_INTERVAL_MS = 200;

let _renderer = null;
let _active = false;
let _lastRefresh = 0;
/** Merker, um einen Auswahlwechsel nicht bis zum Ablauf des Takts zu verschleppen. */
let _lastPinned = null;

/** Freie Label-Objekte, die auf ihren naechsten Einsatz warten. */
const _pool = [];
/** @type {Map<THREE.Object3D, CSS2DObject>} — wer gerade beschriftet ist. */
const _attached = new Map();
/** Weltmittelpunkt je Root. Geometrie bewegt sich nicht, also einmal rechnen. */
const _centres = new WeakMap();

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
        requestRender();
    });
}

// ─── Auswahl der beschrifteten Strukturen ─────────────────────────────────────

const _box = new THREE.Box3();

/** Weltmittelpunkt eines Roots — Bounding-Box-Mitte, gecached. */
function _centre(root) {
    let c = _centres.get(root);
    if (c) return c;

    _box.setFromObject(root);
    if (_box.isEmpty()) return null;

    c = new THREE.Vector3();
    _box.getCenter(c);
    _centres.set(root, c);
    return c;
}

/**
 * Die Strukturen, die gerade ein Label verdienen: sichtbar, mit Namen, nach
 * Kameranaehe sortiert und gedeckelt. Auswahl und Isolation stehen vorn — sie
 * sind der Grund, warum jemand gerade hinschaut.
 * @returns {THREE.Object3D[]}
 */
function _pickRoots() {
    const store = getStore();
    const pinned = new Set();
    if (store.selected?.root) pinned.add(store.selected.root);
    if (store.isolation?.model) pinned.add(store.isolation.model);
    for (const m of store.multiSelected ?? []) pinned.add(m);

    const scored = [];
    for (const roots of Object.values(store.groups ?? {})) {
        for (const root of roots) {
            if (!root.visible || pinned.has(root)) continue;
            const c = _centre(root);
            if (!c) continue;
            scored.push({ root, d: c.distanceToSquared(camera.position) });
        }
    }
    return rankLabelTargets([...pinned].filter(r => r?.visible), scored);
}

// ─── Label-Objekte (Pool, damit nicht pro Bild DOM entsteht) ──────────────────

function _takeFromPool() {
    const obj = _pool.pop();
    if (obj) return obj;

    const div = document.createElement('div');
    div.className = 'structure-label';
    return new CSS2DObject(div);
}

function _attach(root) {
    const text = getStructureDisplayLabel(root.userData?.meta ?? root);
    if (!text) return;

    const centre = _centre(root);
    if (!centre) return;

    const obj = _takeFromPool();
    obj.element.textContent = text;
    obj.position.copy(root.worldToLocal(centre.clone()));
    root.add(obj);
    _attached.set(root, obj);
}

function _detach(root, obj) {
    root.remove(obj);
    obj.element.remove();
    _pool.push(obj);
    _attached.delete(root);
}

function _refresh() {
    const wanted = new Set(_pickRoots());

    for (const [root, obj] of [..._attached]) {
        if (!wanted.has(root)) _detach(root, obj);
    }
    for (const root of wanted) {
        if (!_attached.has(root)) _attach(root);
    }
}

// ─── Öffentliche API ──────────────────────────────────────────────────────────

export function isLabelsActive() { return _active; }

/**
 * Wird aus dem zentralen Render-Loop aufgerufen, direkt nach dem 3D-Bild.
 * Ohne aktive Beschriftungen kostet der Aufruf einen Vergleich.
 */
export function renderLabels() {
    if (!_active || !_renderer) return;

    // Die Auswahl ist angeheftet und soll sofort umziehen, nicht erst mit dem
    // naechsten Takt — sie ist der Grund, warum jemand gerade hinschaut.
    const pinned = getStore().selected?.root ?? null;
    if (pinned !== _lastPinned) {
        _lastPinned = pinned;
        _lastRefresh = 0;
    }

    const now = performance.now();
    if (now - _lastRefresh >= REFRESH_INTERVAL_MS) {
        _lastRefresh = now;
        _refresh();
    }

    _renderer.render(scene, camera);
}

/**
 * Alle Beschriftungen abraeumen. Wird auch vom App-Reset gebraucht: sonst haelt
 * `_attached` Referenzen auf Modelle fest, die laengst aus der Szene sind.
 */
export function clearLabels() {
    for (const [root, obj] of [..._attached]) _detach(root, obj);
    _pool.length = 0;
    _lastRefresh = 0;
    _lastPinned = null;
}

/**
 * Die Auswahl der beschrifteten Strukturen beim naechsten Bild neu bestimmen.
 * Ruft `setModelVisibility` auf — ohne das haenge die Beschriftung dem
 * Ein-/Ausblenden von Gruppen und der Isolation um einen Takt hinterher.
 * Absichtlich billig (eine Zuweisung): die Isolation ruft das 761-mal auf.
 */
export function invalidateLabels() {
    _lastRefresh = 0;
}

export function toggleLabels() {
    _active = !_active;

    if (_active) {
        _initRenderer();
        _renderer.domElement.style.display = '';
        _lastRefresh = 0;   // beim naechsten Bild sofort bestuecken
    } else {
        clearLabels();
        if (_renderer) _renderer.domElement.style.display = 'none';
    }

    requestRender();
    return _active;
}
