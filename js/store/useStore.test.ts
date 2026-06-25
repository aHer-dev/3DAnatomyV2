import { describe, it, expect, beforeEach } from 'vitest'
import type * as THREE from 'three'
import store from './useStore.js'
import type { CollectionItem, MetaEntry } from '../types/index.js'

const mockMesh = () => ({ uuid: crypto.randomUUID(), type: 'Mesh', name: 'testMesh', isMesh: true }) as unknown as THREE.Object3D
const mockMeta = () => ({ id: 'fma12345', labels: { de: 'Test', en: 'Test', la: 'Test' } }) as MetaEntry

const emptyState = () => ({
  groups: {},
  groupStates: {},
  modelStates: {},
  modelsByName: new Map(),
  selected: { root: null, mesh: null, point: null, meta: null },
  multiSelected: new Set<THREE.Object3D>(),
  colors: {},
  opacity: {},
  pickableObjects: new Set<THREE.Object3D>(),
  protection: { bones: true, teeth: true },
  groupedMeta: {},
  availableGroups: [],
  metaById: {},
  metaByFile: {},
  collection: [],
  clickCounts: {},
})

beforeEach(() => {
  store.setState(emptyState())
})

// ─── Selection ────────────────────────────────────────────────────────────────

describe('Selection', () => {
  it('setzt eine Auswahl', () => {
    const mesh = mockMesh()
    const meta = mockMeta()
    store.getState().setSelection({ root: mesh, meta })

    const { selected } = store.getState()
    expect(selected.root).toBe(mesh)
    expect(selected.meta?.id).toBe('fma12345')
  })

  it('merged Teilupdates ohne den Rest zu überschreiben', () => {
    const mesh = mockMesh()
    store.getState().setSelection({ root: mesh })
    store.getState().setSelection({ meta: mockMeta() })

    const { selected } = store.getState()
    expect(selected.root).toBe(mesh)
    expect(selected.meta).not.toBeNull()
  })

  it('löscht die Auswahl vollständig', () => {
    store.getState().setSelection({ root: mockMesh() })
    store.getState().clearSelection()

    const { selected } = store.getState()
    expect(selected.root).toBeNull()
    expect(selected.mesh).toBeNull()
    expect(selected.meta).toBeNull()
  })
})

// ─── MultiSelect ──────────────────────────────────────────────────────────────

describe('MultiSelect', () => {
  it('fügt ein Mesh hinzu', () => {
    const mesh = mockMesh()
    store.getState().addToMultiSelected(mesh)
    expect(store.getState().multiSelected.has(mesh)).toBe(true)
  })

  it('entfernt ein Mesh', () => {
    const mesh = mockMesh()
    store.getState().addToMultiSelected(mesh)
    store.getState().removeFromMultiSelected(mesh)
    expect(store.getState().multiSelected.has(mesh)).toBe(false)
  })

  it('löscht alle Meshes', () => {
    store.getState().addToMultiSelected(mockMesh())
    store.getState().addToMultiSelected(mockMesh())
    store.getState().clearMultiSelected()
    expect(store.getState().multiSelected.size).toBe(0)
  })
})

// ─── Visibility ───────────────────────────────────────────────────────────────

describe('Visibility', () => {
  it('setzt Gruppenvidtbarkeit', () => {
    store.getState().setGroupVisible('muscles', false)
    expect(store.getState().groupStates['muscles']).toBe(false)
  })

  it('setzt Modell-Sichtbarkeit', () => {
    store.getState().setModelVisible('FJ1234', false)
    expect(store.getState().modelStates['FJ1234']).toBe(false)
  })

  it('resetVisibility setzt alle Gruppen auf true, modelStates werden geleert', () => {
    store.getState().setGroupVisible('muscles', false)
    store.getState().setGroupVisible('bones', true)
    store.getState().setModelVisible('FJ1234', false)

    store.getState().resetVisibility()

    const { groupStates, modelStates } = store.getState()
    expect(groupStates['muscles']).toBe(true)
    expect(groupStates['bones']).toBe(true)
    expect(Object.keys(modelStates)).toHaveLength(0)
  })
})

// ─── Models ───────────────────────────────────────────────────────────────────

describe('Models', () => {
  it('lädt eine Gruppe und schaltet sie sichtbar', () => {
    const models = [mockMesh(), mockMesh()]
    store.getState().setGroupLoaded('muscles', models)

    const { groups, groupStates } = store.getState()
    expect(groups['muscles']).toHaveLength(2)
    expect(groupStates['muscles']).toBe(true)
  })

  it('addGroupModel fügt einzelnes Modell hinzu und trägt in modelsByName ein', () => {
    const mesh = mockMesh()
    store.getState().addGroupModel('bones', mesh)

    const { groups, modelsByName } = store.getState()
    expect(groups['bones']).toHaveLength(1)
    expect(modelsByName.get(mesh)).toBe(mesh.name)
  })

  it('entlädt eine Gruppe', () => {
    store.getState().setGroupLoaded('muscles', [mockMesh()])
    store.getState().unloadGroup('muscles')

    const { groups, groupStates } = store.getState()
    expect(groups['muscles']).toBeUndefined()
    expect(groupStates['muscles']).toBeUndefined()
  })
})

// ─── Appearance ───────────────────────────────────────────────────────────────

describe('Appearance', () => {
  it('setzt Gruppenfarbe', () => {
    store.getState().setGroupColor('muscles', 0xe85861)
    expect(store.getState().colors['muscles']).toBe(0xe85861)
  })

  it('klemmt Opazität auf 0–1', () => {
    store.getState().setModelOpacity('FJ1234', 1.5)
    expect(store.getState().opacity['FJ1234']).toBe(1)

    store.getState().setModelOpacity('FJ1234', -0.3)
    expect(store.getState().opacity['FJ1234']).toBe(0)
  })

  it('setzt Layer-Transparenz (Röntgen) pro Gruppe und klemmt auf 0–1', () => {
    store.getState().setGroupOpacity('muscles', 0.3)
    expect(store.getState().groupOpacity['muscles']).toBe(0.3)

    store.getState().setGroupOpacity('muscles', 1.5)
    expect(store.getState().groupOpacity['muscles']).toBe(1)

    store.getState().setGroupOpacity('muscles', -0.3)
    expect(store.getState().groupOpacity['muscles']).toBe(0)
  })
})

// ─── Einzelansicht (Isolation) ──────────────────────────────────────────────────

describe('Einzelansicht', () => {
  it('setzt und löscht den Isolations-Zustand inkl. Aktionsleiste', () => {
    const mesh = mockMesh()
    store.getState().setIsolation({
      model: mesh,
      actionBar: { primaryLabel: 'Zurück', onPrimary: () => {} },
    })
    expect(store.getState().isolation.model).toBe(mesh)
    expect(store.getState().isolation.actionBar?.primaryLabel).toBe('Zurück')

    store.getState().setIsolation({ model: null, actionBar: null })
    expect(store.getState().isolation.model).toBeNull()
    expect(store.getState().isolation.actionBar).toBeNull()
  })
})

// ─── Pickables ────────────────────────────────────────────────────────────────

describe('Pickables', () => {
  it('fügt ein Mesh hinzu', () => {
    const mesh = mockMesh()
    store.getState().addPickable(mesh)
    expect(store.getState().pickableObjects.has(mesh)).toBe(true)
  })

  it('entfernt ein Mesh', () => {
    const mesh = mockMesh()
    store.getState().addPickable(mesh)
    store.getState().removePickable(mesh)
    expect(store.getState().pickableObjects.has(mesh)).toBe(false)
  })
})

// ─── MetaData ─────────────────────────────────────────────────────────────────

describe('MetaData', () => {
  it('setzt alle Meta-Felder auf einmal', () => {
    const meta = mockMeta()
    store.getState().setMetaData({
      groupedMeta: { muscles: [meta] },
      availableGroups: ['muscles'],
      metaById: { fma12345: meta },
      metaByFile: { 'test.glb': meta },
    })

    const s = store.getState()
    expect(s.availableGroups).toEqual(['muscles'])
    expect(s.metaById['fma12345']).toBe(meta)
    expect(s.metaByFile['test.glb']).toBe(meta)
    expect(s.groupedMeta['muscles']).toHaveLength(1)
  })
})

// ─── Collection ───────────────────────────────────────────────────────────────

describe('Collection', () => {
  const makeItem = (id: string): CollectionItem => ({
    id,
    name: id,
    group: 'muscles',
    meta: {},
    color: 0xff0000,
    opacity: 1,
    visible: true,
    model: mockMesh(),
    addedAt: Date.now(),
    source: 'test',
  })

  it('fügt ein Item hinzu', () => {
    store.getState().addToCollection(makeItem('a'))
    expect(store.getState().collection).toHaveLength(1)
  })

  it('verhindert doppelte IDs', () => {
    store.getState().addToCollection(makeItem('a'))
    store.getState().addToCollection(makeItem('a'))
    expect(store.getState().collection).toHaveLength(1)
  })

  it('entfernt nach ID', () => {
    store.getState().addToCollection(makeItem('a'))
    store.getState().addToCollection(makeItem('b'))
    store.getState().removeFromCollection('a')
    expect(store.getState().collection).toHaveLength(1)
    expect(store.getState().collection[0].id).toBe('b')
  })

  it('leert die Sammlung', () => {
    store.getState().addToCollection(makeItem('a'))
    store.getState().clearCollection()
    expect(store.getState().collection).toHaveLength(0)
  })
})

// ─── ClickCounts ──────────────────────────────────────────────────────────────

describe('ClickCounts', () => {
  it('zählt Klicks hoch', () => {
    store.getState().incrementClickCount('fma12345')
    store.getState().incrementClickCount('fma12345')
    expect(store.getState().clickCounts['fma12345']).toBe(2)
  })
})

// ─── Reset ────────────────────────────────────────────────────────────────────

describe('resetAll', () => {
  it('entfernt nicht-geschützte Gruppen, behält bones und teeth', () => {
    store.getState().setGroupLoaded('muscles', [mockMesh()])
    store.getState().setGroupLoaded('bones', [mockMesh()])
    store.getState().setGroupLoaded('teeth', [mockMesh()])
    store.getState().setSelection({ root: mockMesh() })
    store.getState().addToCollection({ id: 'x', name: 'x', group: 'muscles', meta: {}, color: 0, opacity: 1, visible: true, model: mockMesh(), addedAt: 0, source: 'test' })
    store.getState().addToMultiSelected(mockMesh())

    store.getState().resetAll()

    const { groups, selected, collection, multiSelected } = store.getState()
    expect(groups['muscles']).toBeUndefined()
    expect(groups['bones']).toBeDefined()
    expect(groups['teeth']).toBeDefined()
    expect(selected.root).toBeNull()
    expect(collection).toHaveLength(0)
    expect(multiSelected.size).toBe(0)
  })
})
