// js/core/groupBatch.js
// Phase 1 aus ADR 0007 / docs/tasks/perf-batched-mesh: EIN THREE.BatchedMesh pro
// Gruppe statt hunderter Einzel-Meshes → Draw-Calls von ~Teilanzahl auf ~1.
//
// Phase 1 ist reines Batch-*Rendering* hinter dem Flag `performance.batchedGroups`
// (Default aus) — KEINE Interaktion (Picking/Selektion/Opacity kommen in späteren
// Phasen über die batchId-Registry). Zweck: FPS-Messung auf Zielhardware.
//
// Voraussetzung (im PoC bestätigt, ADR 0009): flaches Material ohne Per-Teil-Textur
// → ein gemeinsames Material, Gruppenfarbe pro Instanz via setColorAt.

import * as THREE from 'three';

/**
 * Reduziert eine Geometrie auf ein einheitliches Attribut-Set (position, normal),
 * damit alle Teile einer Gruppe dieselbe Layout-Signatur für BatchedMesh haben.
 * Texturkoordinaten u. Ä. entfallen (kein Textur-Material im Batch).
 */
function normalizeGeometry(geometry) {
  const g = geometry.index ? geometry : geometry.toNonIndexed();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}

/**
 * Kapselt ein BatchedMesh für genau eine Gruppe plus die Registry
 * `batchId ↔ { entry }`, über die spätere Phasen Picking/Selektion auflösen.
 */
export class GroupBatch {
  constructor(groupName) {
    this.groupName = groupName;
    this.mesh = null;
    /** @type {Map<number, { entry: object, geometryId: number }>} */
    this._byBatchId = new Map();
  }

  /**
   * Baut das BatchedMesh aus den Teilen der Gruppe.
   * @param {Array<{ geometry: THREE.BufferGeometry, matrixWorld: THREE.Matrix4, entry: object }>} parts
   * @param {{ color?: number }} [opts]
   */
  build(parts, { color = 0xcccccc } = {}) {
    const geoms = parts.map((p) => normalizeGeometry(p.geometry));

    let maxVerts = 0;
    let maxIndices = 0;
    for (const g of geoms) {
      maxVerts += g.attributes.position.count;
      maxIndices += g.index ? g.index.count : g.attributes.position.count;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });

    const batch = new THREE.BatchedMesh(Math.max(1, parts.length), maxVerts, maxIndices, material);
    batch.name = `batch:${this.groupName}`;
    batch.userData.isGroupBatch = true;
    batch.userData.group = this.groupName;

    const col = new THREE.Color(color);
    for (let i = 0; i < parts.length; i++) {
      const geometryId = batch.addGeometry(geoms[i]);
      const batchId = batch.addInstance(geometryId);
      batch.setMatrixAt(batchId, parts[i].matrixWorld);
      batch.setColorAt(batchId, col);
      this._byBatchId.set(batchId, { entry: parts[i].entry, geometryId });
    }

    this.mesh = batch;
    return batch;
  }

  /** batchId → { entry, groupName } (für spätere Picking-Phase). */
  resolve(batchId) {
    const rec = this._byBatchId.get(batchId);
    return rec ? { entry: rec.entry, groupName: this.groupName } : null;
  }

  /** Anzahl Instanzen (= gebündelte Teile). */
  get size() {
    return this._byBatchId.size;
  }

  /** Gruppenfarbe für alle Instanzen setzen. */
  setGroupColor(color) {
    if (!this.mesh) return;
    const col = new THREE.Color(color);
    for (const batchId of this._byBatchId.keys()) this.mesh.setColorAt(batchId, col);
  }

  dispose() {
    if (this.mesh) {
      this.mesh.material?.dispose();
      this.mesh.dispose?.();
      this.mesh = null;
    }
    this._byBatchId.clear();
  }
}

// ─── Modul-Registry: aktive GroupBatches pro Gruppenname ─────────────────────
const _batches = new Map();

export function setGroupBatch(groupName, batch) {
  _batches.set(groupName, batch);
}

export function getGroupBatch(groupName) {
  return _batches.get(groupName) ?? null;
}

export function removeGroupBatch(groupName) {
  const batch = _batches.get(groupName);
  if (batch) {
    batch.dispose();
    _batches.delete(groupName);
  }
  return !!batch;
}
