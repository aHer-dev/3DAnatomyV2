import { describe, it, expect, beforeEach } from 'vitest'
import store from './useStore.js'
import type { MetaEntry } from '../types/index.js'

// Minimales Mock-Objekt — Store braucht keine echten THREE.Object3D
const mockMesh = () => ({ uuid: crypto.randomUUID(), type: 'Mesh' }) as unknown as THREE.Object3D
const mockMeta = () => ({ id: 'fma12345', labels: { de: 'Test', en: 'Test', la: 'Test' } }) as MetaEntry

// Vor jedem Test Store auf Initialzustand zurücksetzen
beforeEach(() => {
  store.setState({
    groups: {},
    groupStates: {},
    modelStates: {},
    selected: { root: null, mesh: null, point: null, meta: null },
    colors: {},
    opacity: {},
    pickableObjects: new Set(),
    protection: { bones: true, teeth: true },
  })
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
    expect(selected.root).toBe(mesh)   // nicht gelöscht
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

// ─── Reset ────────────────────────────────────────────────────────────────────

describe('resetAll', () => {
  it('entfernt nicht-geschützte Gruppen, behält bones und teeth', () => {
    store.getState().setGroupLoaded('muscles', [mockMesh()])
    store.getState().setGroupLoaded('bones', [mockMesh()])
    store.getState().setGroupLoaded('teeth', [mockMesh()])
    store.getState().setSelection({ root: mockMesh() })

    store.getState().resetAll()

    const { groups, selected } = store.getState()
    expect(groups['muscles']).toBeUndefined()   // entfernt
    expect(groups['bones']).toBeDefined()        // geschützt
    expect(groups['teeth']).toBeDefined()        // geschützt
    expect(selected.root).toBeNull()             // Auswahl gelöscht
  })
})
