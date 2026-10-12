import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { GroupBatch, setGroupBatch, getGroupBatch, removeGroupBatch } from './groupBatch.js'
import { AnatomyMaterial, prepareAnatomyModel, updateAnatomyQuality, DEFAULT_MATERIAL_QUALITY } from '../modelLoader/muscleAppearance.js'

function makePart(entryId: string, x = 0) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3),
  )
  // uv soll beim Batchen entfernt werden (kein Textur-Material)
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1]), 2))
  geometry.setIndex([0, 1, 2])
  const matrixWorld = new THREE.Matrix4().makeTranslation(x, 0, 0)
  return { geometry, matrixWorld, entry: { id: entryId } }
}

describe('GroupBatch', () => {
  it('bildet batchId auf das richtige Teil ab', () => {
    const parts = [makePart('a'), makePart('b', 1), makePart('c', 2)]
    const gb = new GroupBatch('muscles')
    gb.build(parts, { color: 0xcccccc })

    expect(gb.size).toBe(3)
    expect(gb.resolve(0)).toEqual({ entry: { id: 'a' }, groupName: 'muscles' })
    expect(gb.resolve(1)?.entry.id).toBe('b')
    expect(gb.resolve(2)?.entry.id).toBe('c')
    expect(gb.resolve(99)).toBeNull()
  })

  it('normalisiert nur die Batchkopie, ohne die Quelldatei zu ändern', () => {
    const parts = [makePart('a')]
    const mesh = new GroupBatch('muscles').build(parts)

    expect(parts[0].geometry.getAttribute('uv')).toBeDefined()
    expect(mesh.geometry.getAttribute('uv')).toBeUndefined()
    expect(mesh.geometry.getAttribute('normal')).toBeDefined()
    expect(Array.from(mesh.geometry.getAttribute('bellyWeight').array)).toEqual([1, 1, 1])
  })

  it('erhält Bauchgewicht neben unbekannten Muskeln und Instanztransformationen', () => {
    const weighted = makePart('weighted', 2)
    const original = Array.from(weighted.geometry.getAttribute('position').array)
    weighted.geometry.setAttribute('bellyWeight', new THREE.Float32BufferAttribute([0, 0.5, 1], 1))
    const mesh = new GroupBatch('eyes').build([weighted, makePart('unknown', -2)])
    expect(Array.from(mesh.geometry.getAttribute('bellyWeight').array)).toEqual([0, 0.5, 1, 1, 1, 1])
    expect(Array.from(weighted.geometry.getAttribute('position').array)).toEqual(original)
    const matrix = new THREE.Matrix4()
    mesh.getMatrixAt(0, matrix)
    expect(matrix.equals(weighted.matrixWorld)).toBe(true)
    expect((mesh.material as AnatomyMaterial).weighted).toBe(true)
  })

  it('stellt Originalnormalen im Batch wieder her, ohne Quellen oder Positionen zu ändern', () => {
    const part = makePart('normals')
    part.geometry.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0], 3))
    const sourceNormal = Array.from(part.geometry.getAttribute('normal').array)
    const model = new THREE.Mesh(part.geometry, new THREE.MeshStandardMaterial())
    prepareAnatomyModel(model, 'unknown.glb', 'bones', { muskeln: {} }, DEFAULT_MATERIAL_QUALITY)
    const mesh = new GroupBatch('bones').build([part])
    const positions = Array.from(mesh.geometry.getAttribute('position').array)
    const smoothNormals = Array.from(mesh.geometry.getAttribute('normal').array)
    expect(smoothNormals).not.toEqual(sourceNormal)
    updateAnatomyQuality(mesh, { ...DEFAULT_MATERIAL_QUALITY, smoothNormals: false })
    expect(Array.from(mesh.geometry.getAttribute('normal').array)).toEqual(sourceNormal)
    updateAnatomyQuality(mesh, DEFAULT_MATERIAL_QUALITY)
    expect(Array.from(mesh.geometry.getAttribute('normal').array)).toEqual(smoothNormals)
    expect(Array.from(mesh.geometry.getAttribute('position').array)).toEqual(positions)
  })

  it('ändert nur die Bauchpalette gemessener Instanzen, auch außerhalb der Muskelgruppe', () => {
    const weighted = makePart('muscle')
    weighted.geometry.setAttribute('bellyWeight', new THREE.Float32BufferAttribute([0, 0.5, 1], 1))
    const batch = new GroupBatch('eyes')
    const mesh = batch.build([weighted, makePart('eye')], { color: 0xcccccc, bellyColor: 0xe85861 })
    batch.setGroupColor(0xcccccc, 0x2872cc)
    const color = new THREE.Color()
    mesh.getColorAt(0, color)
    expect(color.getHex()).toBe(0x2872cc)
    mesh.getColorAt(1, color)
    expect(color.getHex()).toBe(0xcccccc)
    expect(Array.from(mesh.geometry.getAttribute('bellyWeight').array)).toEqual([0, 0.5, 1, 1, 1, 1])
  })

  it('erzeugt ein BatchedMesh mit Gruppen-Metadaten', () => {
    const mesh = new GroupBatch('bones').build([makePart('x')])
    expect(mesh.userData.isGroupBatch).toBe(true)
    expect(mesh.userData.group).toBe('bones')
    expect(mesh.name).toBe('batch:bones')
  })

  it('Registry: set/get/remove', () => {
    const gb = new GroupBatch('teeth')
    gb.build([makePart('t')])
    setGroupBatch('teeth', gb)
    expect(getGroupBatch('teeth')).toBe(gb)
    expect(removeGroupBatch('teeth')).toBe(true)
    expect(getGroupBatch('teeth')).toBeNull()
    expect(removeGroupBatch('teeth')).toBe(false)
  })
})
