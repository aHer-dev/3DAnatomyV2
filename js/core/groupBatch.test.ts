import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { GroupBatch, setGroupBatch, getGroupBatch, removeGroupBatch } from './groupBatch.js'

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

  it('normalisiert Geometrie auf position+normal (kein uv im Batch)', () => {
    const parts = [makePart('a')]
    new GroupBatch('muscles').build(parts)

    expect(parts[0].geometry.getAttribute('uv')).toBeUndefined()
    expect(parts[0].geometry.getAttribute('normal')).toBeDefined()
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
