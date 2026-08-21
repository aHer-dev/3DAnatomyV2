// js/features/ghostContext.js
// Ghost-Kontext-Modus: ausgewählte Struktur bleibt, alle anderen treten zurück.
//
// Drei Regeln, alle aus einem Absturz auf einem Mittelklasse-Android gelernt:
//
//  1. NUR SICHTBARE MESHES ANFASSEN. Der Knopf sitzt in der Isolations-Leiste,
//     und die Isolation hat die 464 Muskeln längst auf `visible = false`
//     gesetzt. Die alte Fassung ging trotzdem über alle Roots aller Gruppen.
//  2. EIN GETEILTES MATERIAL statt zwei Klonen pro Mesh. Die alte Fassung legte
//     über `setObjectOpacity` pro Mesh `__origMats` UND `__ownMats` an — mit
//     geladenen Muskeln rund 1500 neue Materialien auf einen Schlag. Wir merken
//     uns stattdessen die Material-*Referenz* und hängen sie beim Verlassen
//     zurück: nichts wird geklont, nichts muss disposed werden.
//  3. AB EINER GEWISSEN SZENENGRÖSSE NICHT DURCHSCHEINEN LASSEN. `transparent`
//     mit `depthWrite: false` heißt: jede Schicht wird pro Pixel geblendet. Bei
//     761 Meshes sind das 761 Schichten übereinander — auf Tile-Renderern
//     (Mali/Adreno) der sichere Weg in den Speicher-Abbruch. Darüber treten die
//     anderen deshalb gedämpft-opak zurück statt durchscheinend: der Kontext
//     bleibt sichtbar, kostet aber keinen einzigen Blend-Vorgang extra.

import * as THREE from 'three';
import { getStore } from '../store/useStore.js';
import { requestRender } from '../core/renderScheduler.js';

const GHOST_ALPHA = 0.08;

/** Ab wie vielen sichtbaren Meshes das Durchscheinen zu teuer wird. */
export const GHOST_MESH_BUDGET = 500;

/** @typedef {'translucent' | 'dimmed'} GhostMode */

let _active = false;
/** @type {GhostMode|null} */
let _mode = null;
/** @type {Array<{ mesh: THREE.Mesh, material: THREE.Material|THREE.Material[] }>|null} */
let _touched = null;

let _translucentMat = null;
let _dimmedMat = null;

/**
 * Welcher Modus für so viele sichtbare Meshes. Reine Funktion, damit die
 * Schwelle prüfbar ist, ohne eine Szene aufzubauen.
 * @param {number} visibleMeshes
 * @returns {GhostMode}
 */
export function chooseGhostMode(visibleMeshes) {
  return visibleMeshes > GHOST_MESH_BUDGET ? 'dimmed' : 'translucent';
}

// Beide Materialien sind Singletons: sie werden von allen zurücktretenden
// Meshes geteilt und leben bis zum Seiten-Ende. `DoubleSide`, weil die
// Bundle-Materialien durchweg doubleSided sind — ein einseitiges Ersatzmaterial
// würde Innenflächen aufreißen.
function translucentMaterial() {
  _translucentMat ??= new THREE.MeshStandardMaterial({
    color: 0xb8bcc4, roughness: 0.9, metalness: 0,
    transparent: true, opacity: GHOST_ALPHA, depthWrite: false,
    side: THREE.DoubleSide,
  });
  return _translucentMat;
}

function dimmedMaterial() {
  _dimmedMat ??= new THREE.MeshStandardMaterial({
    color: 0x3a3d44, roughness: 0.95, metalness: 0,
    side: THREE.DoubleSide,
  });
  return _dimmedMat;
}

/** Sichtbare Meshes aller Gruppen zählen — einmal beim Eintritt. */
function countVisibleMeshes(groups) {
  let n = 0;
  for (const roots of Object.values(groups)) {
    for (const root of roots) {
      if (!root.visible) continue;
      root.traverse(o => { if (o.isMesh && o.visible) n++; });
    }
  }
  return n;
}

export function isGhostContextActive() { return _active; }

/** @returns {GhostMode|null} — womit der aktive Kontext gerade arbeitet. */
export function getGhostContextMode() { return _mode; }

export function enterGhostContext(selectedModel) {
  if (_active) {
    exitGhostContext();
    return;
  }

  const { groups } = getStore();
  _mode = chooseGhostMode(countVisibleMeshes(groups));
  const replacement = _mode === 'dimmed' ? dimmedMaterial() : translucentMaterial();
  _touched = [];

  for (const roots of Object.values(groups)) {
    for (const root of roots) {
      if (root === selectedModel || !root.visible) continue;
      root.traverse(mesh => {
        if (!mesh.isMesh || !mesh.visible || !mesh.material) return;
        _touched.push({ mesh, material: mesh.material });
        mesh.material = replacement;
      });
    }
  }

  _active = true;
  requestRender(4);
}

/**
 * Zustand fallen lassen, OHNE die Materialien zurueckzuhaengen — fuer den
 * vollstaendigen App-Reset, bei dem die Modelle ohnehin aus der Szene fliegen.
 * Ohne das haelt `_touched` hunderte Mesh-Referenzen am Leben, die niemand mehr
 * braucht: genau der Speicher, um den es hier geht.
 */
export function clearGhostContext() {
  _touched = null;
  _mode = null;
  _active = false;
}

export function exitGhostContext() {
  if (!_active) return;

  for (const { mesh, material } of _touched ?? []) {
    mesh.material = material;
  }

  _touched = null;
  _mode = null;
  _active = false;
  requestRender(4);
}
