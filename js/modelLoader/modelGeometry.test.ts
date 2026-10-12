import { createRequire } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { Logger, NodeIO, Verbosity } from '@gltf-transform/core'
import type { Document, Node, Primitive } from '@gltf-transform/core'
import { KHRDracoMeshCompression, KHRMaterialsSpecular } from '@gltf-transform/extensions'
import * as THREE from 'three'
import {
  DEFAULT_MATERIAL_QUALITY,
  prepareAnatomyModel,
  type MuscleBoundaryData,
} from './muscleAppearance'
import { preferOriginalModel } from './modelSourcePolicy'

type ModelEntry = {
  classification: { group: string }
  model: { variants: { draco: { path: string; filename: string } } }
}

type ObjectSnapshot = {
  object: THREE.Object3D
  matrix: number[]
  transform: number[]
  position: Buffer | null
}

const projectRoot = resolve(import.meta.dirname, '../..')
const modelRoot = resolve(projectRoot, 'public/models')
const meta = JSON.parse(readFileSync(resolve(projectRoot, 'public/data/meta.json'), 'utf8')) as ModelEntry[]
const data = JSON.parse(
  readFileSync(resolve(projectRoot, 'public/data/muskelgrenzen.json'), 'utf8'),
) as MuscleBoundaryData
const byFilename = new Map(meta.map((entry) => [entry.model.variants.draco.filename, entry]))
const worldTolerance = 0.00001 // 0.01 mm, as required by the Auftrag.
const referenceTolerance = 0.001 // 1 mm, including Draco quantization.
let io: NodeIO

beforeAll(async () => {
  // draco3dgltf does not ship TypeScript declarations. Keep its boundary narrow.
  const draco = createRequire(import.meta.url)('draco3dgltf') as {
    createDecoderModule: () => Promise<unknown>
  }
  io = new NodeIO()
    .setLogger(new Logger(Verbosity.SILENT))
    .registerExtensions([KHRDracoMeshCompression, KHRMaterialsSpecular])
    .registerDependencies({ 'draco3d.decoder': await draco.createDecoderModule() })
})

function primitiveGeometry(primitive: Primitive): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const attributes: Record<string, string> = {
    POSITION: 'position',
    NORMAL: 'normal',
    TEXCOORD_0: 'uv',
    TEXCOORD_1: 'uv1',
    COLOR_0: 'color',
    TANGENT: 'tangent',
  }
  for (const [gltfName, threeName] of Object.entries(attributes)) {
    const accessor = primitive.getAttribute(gltfName)
    const array = accessor?.getArray()
    if (accessor && array) {
      if (!(array instanceof Float32Array || array instanceof Float64Array
        || array instanceof Int8Array || array instanceof Uint8Array
        || array instanceof Int16Array || array instanceof Uint16Array
        || array instanceof Uint32Array)) {
        throw new Error(`Unsupported ${gltfName} component array`)
      }
      geometry.setAttribute(
        threeName,
        new THREE.BufferAttribute(array.slice(), accessor.getElementSize(), accessor.getNormalized()),
      )
    }
  }
  const indices = primitive.getIndices()?.getArray()
  if (indices) {
    if (!(indices instanceof Uint8Array || indices instanceof Uint16Array || indices instanceof Uint32Array)) {
      throw new Error('Unsupported index component array')
    }
    geometry.setIndex(new THREE.BufferAttribute(indices.slice(), 1))
  }
  return geometry
}

// This is only a fixture adapter from the Node/Draco reader to Three. It copies
// the file's matrices verbatim; preparation must subsequently leave them intact.
function nodeObject(node: Node): THREE.Object3D {
  const object = new THREE.Group()
  object.name = node.getName()
  object.matrix.fromArray(node.getMatrix())
  object.matrixAutoUpdate = false
  const primitives = node.getMesh()?.listPrimitives() ?? []
  for (const primitive of primitives) {
    object.add(new THREE.Mesh(primitiveGeometry(primitive), new THREE.MeshStandardMaterial()))
  }
  for (const child of node.listChildren()) object.add(nodeObject(child))
  return object
}

function sceneObject(document: Document): THREE.Group {
  const scene = document.getRoot().getDefaultScene() ?? document.getRoot().listScenes()[0]
  if (!scene) throw new Error('Model has no scene')
  const root = new THREE.Group()
  for (const child of scene.listChildren()) root.add(nodeObject(child))
  root.updateMatrixWorld(true)
  return root
}

function positionBytes(object: THREE.Object3D): Buffer | null {
  if (!(object instanceof THREE.Mesh)) return null
  const position = object.geometry.getAttribute('position')
  if (!position) throw new Error('Mesh has no POSITION')
  const array = position.array
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength)
}

function snapshot(root: THREE.Object3D): ObjectSnapshot[] {
  const snapshots: ObjectSnapshot[] = []
  root.traverse((object) => {
    const position = positionBytes(object)
    snapshots.push({
      object,
      matrix: [...object.matrix.elements],
      transform: [
        ...object.position.toArray(),
        ...object.quaternion.toArray(),
        ...object.scale.toArray(),
      ],
      position: position ? Buffer.from(position) : null,
    })
  })
  return snapshots
}

function boxDifference(a: THREE.Box3, b: THREE.Box3): number {
  const left = [...a.min.toArray(), ...a.max.toArray()]
  const right = [...b.min.toArray(), ...b.max.toArray()]
  return Math.max(...left.map((value, index) => Math.abs(value - right[index])))
}

function rawPositionBox(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3()
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      // Deliberately omit all object/node transforms: the references describe
      // glTF POSITION in the file, including the documented stray triangles.
      object.geometry.computeBoundingBox()
      if (object.geometry.boundingBox) box.union(object.geometry.boundingBox)
    }
  })
  return box
}

function referenceDifference(root: THREE.Object3D, filename: string): number {
  const entry = data.muskeln[filename]
  if (!entry) throw new Error(`Missing boundary entry: ${filename}`)
  const expected = new THREE.Box3(
    new THREE.Vector3(...entry.pruef_bbox_gltf[0]),
    new THREE.Vector3(...entry.pruef_bbox_gltf[1]),
  )
  return boxDifference(rawPositionBox(root), expected)
}

function assertUnchanged(
  root: THREE.Object3D,
  before: THREE.Box3,
  snapshots: ObjectSnapshot[],
  label: string,
): void {
  const after = new THREE.Box3().setFromObject(root, true)
  expect(boxDifference(before, after), `${label}: world bounding box`).toBeLessThanOrEqual(worldTolerance)
  for (const saved of snapshots) {
    const object = saved.object
    expect(object.matrix.elements, `${label}: ${object.name} matrix`).toEqual(saved.matrix)
    expect(
      [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()],
      `${label}: ${object.name} transform`,
    ).toEqual(saved.transform)
    const position = positionBytes(object)
    expect(
      saved.position ? position?.equals(saved.position) : position === null,
      `${label}: ${object.name} POSITION bytes`,
    ).toBe(true)
  }
}

function dispose(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => material.dispose())
  })
}

describe('unchanged anatomy model inventory', () => {
  it('preserves world bounds, source POSITION and node transforms for every original model', async () => {
    let checkedReferences = 0
    const checkedFiles = new Set<string>()
    for (const entry of meta) {
      const variant = entry.model.variants.draco
      const filename = `${variant.path}/${variant.filename}`
      if (checkedFiles.has(filename)) continue
      checkedFiles.add(filename)
      const root = sceneObject(await io.read(resolve(modelRoot, filename)))
      const before = new THREE.Box3().setFromObject(root, true)
      expect(before.isEmpty(), `${filename}: nonempty world bounding box`).toBe(false)
      const originals = snapshot(root)
      if (data.muskeln[variant.filename]) {
        expect(referenceDifference(root, variant.filename), `${filename}: JSON POSITION reference`)
          .toBeLessThanOrEqual(referenceTolerance)
        checkedReferences++
      }
      prepareAnatomyModel(root, variant.filename, entry.classification.group, data, DEFAULT_MATERIAL_QUALITY)
      assertUnchanged(root, before, originals, filename)
      dispose(root)
    }
    expect(checkedFiles.size).toBe(new Set(meta.map((entry) => {
      const variant = entry.model.variants.draco
      return `${variant.path}/${variant.filename}`
    })).size)
    expect(checkedReferences).toBe(Object.keys(data.muskeln).length)
  }, 120_000)

  it('preserves every bundle wrapper and validates every runtime-selected muscle source', async () => {
    let bundleCount = 0
    let checkedReferences = 0
    const selectedReferences = new Set<string>()
    for (const group of readdirSync(modelRoot, { withFileTypes: true })) {
      if (!group.isDirectory() || group.name === 'hifi') continue
      const bundleFilename = `${group.name}.bundle.glb`
      if (!readdirSync(resolve(modelRoot, group.name)).includes(bundleFilename)) continue
      bundleCount++
      const scene = sceneObject(await io.read(resolve(modelRoot, group.name, bundleFilename)))
      for (const root of scene.children) {
        const filename = `${root.name}.glb`
        const label = `${group.name}/${bundleFilename}/${filename}`
        const before = new THREE.Box3().setFromObject(root, true)
        const originals = snapshot(root)
        if (preferOriginalModel(filename)) {
          // The previously reported broken wrapper must fail the real runtime
          // guard. The loader selects its untouched original instead.
          expect(referenceDifference(root, filename), `${label}: known invalid wrapper`)
            .toBeGreaterThan(referenceTolerance)
          expect(() => prepareAnatomyModel(root, filename, group.name, data, DEFAULT_MATERIAL_QUALITY))
            .toThrow()
        } else {
          if (data.muskeln[filename]) {
            expect(referenceDifference(root, filename), `${label}: JSON POSITION reference`)
              .toBeLessThanOrEqual(referenceTolerance)
            checkedReferences++
            selectedReferences.add(filename)
          }
          prepareAnatomyModel(root, filename, group.name, data, DEFAULT_MATERIAL_QUALITY)
        }
        assertUnchanged(root, before, originals, label)
      }
      dispose(scene)
    }
    expect(bundleCount).toBeGreaterThan(0)
    expect(checkedReferences).toBeGreaterThan(0)
    // This completes the selected-source audit for groups without bundles and
    // for explicit original-file fallbacks; no boundary entry is skipped.
    for (const filename of Object.keys(data.muskeln)) {
      if (selectedReferences.has(filename)) continue
      const entry = byFilename.get(filename)
      expect(entry, `${filename}: meta association`).toBeDefined()
      if (!entry) throw new Error(`No meta entry for ${filename}`)
      const variant = entry.model.variants.draco
      const root = sceneObject(await io.read(resolve(modelRoot, variant.path, variant.filename)))
      expect(referenceDifference(root, filename), `${filename}: selected original POSITION reference`)
        .toBeLessThanOrEqual(referenceTolerance)
      prepareAnatomyModel(root, filename, entry.classification.group, data, DEFAULT_MATERIAL_QUALITY)
      selectedReferences.add(filename)
      dispose(root)
    }
    expect(selectedReferences.size).toBe(Object.keys(data.muskeln).length)
  }, 120_000)

  it('routes only the reported invalid FJ801 wrapper to its unmodified original', () => {
    expect(preferOriginalModel('FJ801.glb')).toBe(true)
    for (const filename of byFilename.keys()) {
      if (filename !== 'FJ801.glb') expect(preferOriginalModel(filename), filename).toBe(false)
    }
  })
})
