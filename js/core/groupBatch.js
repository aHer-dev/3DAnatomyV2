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
import {
  AnatomyMaterial, DEFAULT_MATERIAL_QUALITY, getOriginalAnatomyNormal, preserveAnatomyNormals,
} from '../modelLoader/muscleAppearance.js';

/**
 * Reduziert eine Geometriekopie auf position, normal und bellyWeight,
 * damit alle Teile einer Gruppe dieselbe Layout-Signatur für BatchedMesh haben.
 * Texturkoordinaten u. Ä. entfallen (kein Textur-Material im Batch).
 */
function normalizeGeometry(geometry) {
  const g = geometry.clone();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'bellyWeight') g.deleteAttribute(name);
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.bellyWeight) {
    const weights = new Float32Array(g.attributes.position.count).fill(1);
    g.setAttribute('bellyWeight', new THREE.BufferAttribute(weights, 1));
  }
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
   * @param {{ color?: number, bellyColor?: number, quality?: import('../modelLoader/muscleAppearance.js').MaterialQualitySettings }} [opts]
   */
  build(parts, { color = 0xcccccc, bellyColor = color, quality = DEFAULT_MATERIAL_QUALITY } = {}) {
    const geoms = parts.map((p) => normalizeGeometry(p.geometry));

    let maxVerts = 0;
    let maxIndices = 0;
    for (const g of geoms) {
      maxVerts += g.attributes.position.count;
      maxIndices += g.index ? g.index.count : g.attributes.position.count;
    }

    const material = new AnatomyMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    material.weighted = parts.some(part => !!part.geometry.getAttribute('bellyWeight'));
    material.tissueMaterials = quality.tissueMaterials;
    material.tissueRoughness = this.groupName === 'bones' ? 0.9 : 0.8;
    material.originalRoughness = 0.85;
    material.roughness = quality.tissueMaterials ? material.tissueRoughness : material.originalRoughness;
    material.polygonOffset = quality.polygonOffset && (material.weighted || this.groupName === 'muscles');
    material.polygonOffsetFactor = -1;
    material.polygonOffsetUnits = -1;

    const batch = new THREE.BatchedMesh(Math.max(1, parts.length), maxVerts, maxIndices, material);
    batch.name = `batch:${this.groupName}`;
    batch.userData.isGroupBatch = true;
    batch.userData.group = this.groupName;

    const col = new THREE.Color(color);
    const bellyCol = new THREE.Color(bellyColor);
    const originalNormals = new Float32Array(maxVerts * 3);
    for (let i = 0; i < parts.length; i++) {
      const geometryId = batch.addGeometry(geoms[i]);
      const sourceNormal = getOriginalAnatomyNormal(parts[i].geometry) ?? geoms[i].getAttribute('normal');
      const { vertexStart } = batch.getGeometryRangeAt(geometryId);
      for (let vertex = 0; vertex < sourceNormal.count; vertex++) {
        const offset = (vertexStart + vertex) * 3;
        originalNormals[offset] = sourceNormal.getX(vertex);
        originalNormals[offset + 1] = sourceNormal.getY(vertex);
        originalNormals[offset + 2] = sourceNormal.getZ(vertex);
      }
      const batchId = batch.addInstance(geometryId);
      batch.setMatrixAt(batchId, parts[i].matrixWorld);
      const weighted = !!parts[i].geometry.getAttribute('bellyWeight');
      batch.setColorAt(batchId, weighted ? bellyCol : col);
      this._byBatchId.set(batchId, { entry: parts[i].entry, geometryId, weighted });
      geoms[i].dispose();
    }
    preserveAnatomyNormals(batch.geometry, new THREE.Float32BufferAttribute(originalNormals, 3), quality.smoothNormals);

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
  setGroupColor(color, bellyColor = color) {
    if (!this.mesh) return;
    const col = new THREE.Color(color);
    const bellyCol = new THREE.Color(bellyColor);
    for (const [batchId, record] of this._byBatchId) this.mesh.setColorAt(batchId, record.weighted ? bellyCol : col);
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
