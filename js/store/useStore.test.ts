import { describe, it, expect, beforeEach } from 'vitest'
import type * as THREE from 'three'
import store, { getEffectiveRenderingSettings, INITIAL_RENDERING_SETTINGS } from './useStore.js'
import type { RenderingSettings } from './useStore.js'
import type { CollectionItem, MetaEntry } from '../types/index.js'

// Startwerte gleich beim Import festhalten — die Tests weiter unten verstellen sie.
const INITIAL_SIDEBAR_COLLAPSED = store.getState().sidebarCollapsed
const INITIAL_VIEWBAR_VISIBLE = store.getState().viewBarVisible
const INITIAL_THEME = store.getState().theme
const INITIAL_RENDERING = store.getState().renderingSettings
const INITIAL_PERFORMANCE_MODE = store.getState().performanceMode
const INITIAL_CONSTRAINED_DEVICE = store.getState().constrainedDevice

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
  renderingSettings: { ...INITIAL_RENDERING_SETTINGS },
  performanceMode: false,
  constrainedDevice: false,
  pickableObjects: new Set<THREE.Object3D>(),
  protection: { bones: true, teeth: true },
  groupedMeta: {},
  availableGroups: [],
  metaById: {},
  metaByFile: {},
  collection: [],
  clickCounts: {},
  loading: { active: false, progress: 0, label: '' },
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

describe('Darstellungsqualität', () => {
  it('startet mit jeder Maßnahme einzeln aktiviert und ohne Performance-Modus', () => {
    expect(INITIAL_RENDERING).toEqual({
      environment: true,
      toneMapping: true,
      tissueMaterials: true,
      ambientOcclusion: true,
      smoothNormals: true,
      polygonOffset: true,
    })
    expect(INITIAL_PERFORMANCE_MODE).toBe(false)
    expect(INITIAL_CONSTRAINED_DEVICE).toBe(false)
  })

  it.each(Object.keys(INITIAL_RENDERING_SETTINGS) as (keyof RenderingSettings)[])(
    '%s ist unabhängig schaltbar und verändert keine Gruppenfarben',
    (key) => {
      const original = store.getState().renderingSettings
      const colors = store.getState().colors
      store.getState().setRenderingSetting(key, false)
      expect(store.getState().renderingSettings).toEqual({ ...original, [key]: false })
      expect(original[key]).toBe(true)
      expect(store.getState().colors).toBe(colors)
      store.getState().setRenderingSetting(key, true)
      expect(store.getState().renderingSettings).toEqual(original)
    },
  )

  it.each([
    [true, false],
    [false, true],
    [true, true],
  ])('pausiert AO bei Performance=%s oder schwachem Gerät=%s und behält die Auswahl', (performance, constrained) => {
    store.getState().setPerformanceMode(performance)
    store.getState().setConstrainedDevice(constrained)
    const state = store.getState()
    expect(state.performanceMode).toBe(performance)
    expect(state.constrainedDevice).toBe(constrained)
    expect(getEffectiveRenderingSettings(state.renderingSettings, state.performanceMode, state.constrainedDevice)).toEqual({
      ...INITIAL_RENDERING_SETTINGS,
      environment: false,
      ambientOcclusion: false,
    })
    expect(state.renderingSettings.ambientOcclusion).toBe(true)
    store.getState().setPerformanceMode(false)
    store.getState().setConstrainedDevice(false)
    expect(getEffectiveRenderingSettings(store.getState().renderingSettings, false, false).ambientOcclusion).toBe(true)
  })

  it('reaktiviert eine explizit abgewählte Maßnahme nach dem Performance-Modus nicht', () => {
    store.getState().setRenderingSetting('ambientOcclusion', false)
    store.getState().setRenderingSetting('environment', false)
    store.getState().setPerformanceMode(true)
    store.getState().setPerformanceMode(false)
    expect(getEffectiveRenderingSettings(store.getState().renderingSettings, false, false)).toEqual({
      ...INITIAL_RENDERING_SETTINGS,
      environment: false,
      ambientOcclusion: false,
    })
  })

  it('behält Darstellungswahl und Geräteprofil beim Modell-Reset', () => {
    store.getState().setRenderingSetting('toneMapping', false)
    store.getState().setPerformanceMode(true)
    store.getState().setConstrainedDevice(true)
    store.getState().resetAll()
    const state = store.getState()
    expect(state.renderingSettings).toEqual({ ...INITIAL_RENDERING_SETTINGS, toneMapping: false })
    expect(state.performanceMode).toBe(true)
    expect(state.constrainedDevice).toBe(true)
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

// ─── Overlay-UI (Layout B) ─────────────────────────────────────────────────────

describe('Overlay-UI', () => {
  it('startet mit Default-Tab „structures" und ohne Flyout', () => {
    store.setState({ sidebarTab: 'structures', openFlyout: null })
    expect(store.getState().sidebarTab).toBe('structures')
    expect(store.getState().openFlyout).toBeNull()
  })

  it('wechselt den Sidebar-Tab', () => {
    store.getState().setSidebarTab('info')
    expect(store.getState().sidebarTab).toBe('info')
    store.getState().setSidebarTab('collection')
    expect(store.getState().sidebarTab).toBe('collection')
  })

  it('öffnet und schließt das Flyout exklusiv', () => {
    store.getState().openFlyoutExclusive('settings')
    expect(store.getState().openFlyout).toBe('settings')
    store.getState().closeFlyout()
    expect(store.getState().openFlyout).toBeNull()
  })
})

// ─── Sidebar einklappen (Desktop) ──────────────────────────────────────────────

describe('Sidebar einklappen', () => {
  beforeEach(() => {
    store.setState({ sidebarCollapsed: false })
  })

  it('startet eingeklappt — die App öffnet auf der freien Bühne', () => {
    expect(INITIAL_SIDEBAR_COLLAPSED).toBe(true)
  })

  it('toggle schaltet hin und zurück', () => {
    store.getState().toggleSidebarCollapsed()
    expect(store.getState().sidebarCollapsed).toBe(true)
    store.getState().toggleSidebarCollapsed()
    expect(store.getState().sidebarCollapsed).toBe(false)
  })

  it('setzt den Zustand direkt und ist idempotent', () => {
    store.getState().setSidebarCollapsed(true)
    store.getState().setSidebarCollapsed(true)
    expect(store.getState().sidebarCollapsed).toBe(true)
    store.getState().setSidebarCollapsed(false)
    expect(store.getState().sidebarCollapsed).toBe(false)
  })

  it('rührt Theme, Tab, Flyout und Mobile-Sheet nicht an', () => {
    store.setState({ sidebarTab: 'collection', openFlyout: 'settings', mobileSheet: 'view', theme: 'dark' })
    store.getState().toggleSidebarCollapsed()
    expect(store.getState().sidebarCollapsed).toBe(true)
    expect(store.getState().sidebarTab).toBe('collection')
    expect(store.getState().openFlyout).toBe('settings')
    expect(store.getState().mobileSheet).toBe('view')
    expect(store.getState().theme).toBe('dark')
    store.setState({ openFlyout: null, mobileSheet: null, theme: 'light' })
  })
})

// ─── Theme (Light/Dark der Bedienoberfläche) ───────────────────────────────────

describe('Theme', () => {
  beforeEach(() => {
    store.setState({ theme: 'light' })
  })

  it('startet hell — Marke „Warm/Atlas", wie im Muskelfinder', () => {
    expect(INITIAL_THEME).toBe('light')
  })

  it('schaltet zwischen hell und dunkel hin und her', () => {
    store.getState().toggleTheme()
    expect(store.getState().theme).toBe('dark')
    store.getState().toggleTheme()
    expect(store.getState().theme).toBe('light')
  })

  it('setzt das Theme direkt und ist idempotent', () => {
    store.getState().setTheme('dark')
    store.getState().setTheme('dark')
    expect(store.getState().theme).toBe('dark')
    store.getState().setTheme('light')
    expect(store.getState().theme).toBe('light')
  })

  it('lässt den Einklapp-Zustand der Sidebar unberührt', () => {
    store.setState({ sidebarCollapsed: true })
    store.getState().toggleTheme()
    expect(store.getState().sidebarCollapsed).toBe(true)
  })
})

// ─── Mobile-Sheets (§13 / S10) ──────────────────────────────────────────────────

describe('Mobile-Sheets', () => {
  beforeEach(() => {
    store.setState({ mobileSheet: null, openFlyout: null })
  })

  it('startet ohne offenes Sheet', () => {
    expect(store.getState().mobileSheet).toBeNull()
  })

  it('öffnet und schließt ein Sheet', () => {
    store.getState().openMobileSheet('panel')
    expect(store.getState().mobileSheet).toBe('panel')
    store.getState().openMobileSheet('view')
    expect(store.getState().mobileSheet).toBe('view')
    store.getState().closeMobileSheet()
    expect(store.getState().mobileSheet).toBeNull()
  })

  it('Sheet und Settings-Flyout schließen sich gegenseitig aus', () => {
    store.getState().openFlyoutExclusive('settings')
    store.getState().openMobileSheet('panel')
    expect(store.getState().mobileSheet).toBe('panel')
    expect(store.getState().openFlyout).toBeNull()

    store.getState().openFlyoutExclusive('settings')
    expect(store.getState().openFlyout).toBe('settings')
    expect(store.getState().mobileSheet).toBeNull()
  })
})

// ─── Laden (§9.11 / ADR 0008) ──────────────────────────────────────────────────

describe('Loading', () => {
  it('showLoading aktiviert mit Label und Fortschritt 0', () => {
    store.setState({ loading: { active: false, progress: 55, label: '' } })
    store.getState().showLoading('Testlabel')
    expect(store.getState().loading).toEqual({ active: true, progress: 0, label: 'Testlabel' })
  })

  it('showLoading nutzt das Default-Label', () => {
    store.getState().showLoading()
    expect(store.getState().loading.label).toBe('3D-Modell wird geladen …')
  })

  it('setLoadingProgress klemmt auf 0..100', () => {
    store.getState().showLoading('x')
    store.getState().setLoadingProgress(65)
    expect(store.getState().loading.progress).toBe(65)
    store.getState().setLoadingProgress(150)
    expect(store.getState().loading.progress).toBe(100)
    store.getState().setLoadingProgress(-10)
    expect(store.getState().loading.progress).toBe(0)
  })

  it('hideLoading deaktiviert, behält aber Fortschritt/Label', () => {
    store.getState().showLoading('x')
    store.getState().setLoadingProgress(100)
    store.getState().hideLoading()
    const { loading } = store.getState()
    expect(loading.active).toBe(false)
    expect(loading.progress).toBe(100)
    expect(loading.label).toBe('x')
  })
})

// ─── Ansichts-Leiste (Auge in der Rail) ────────────────────────────────────────

describe('Ansichts-Leiste', () => {
  beforeEach(() => {
    store.setState({ viewBarVisible: false })
  })

  it('startet ausgeblendet — die App öffnet auf der freien Bühne', () => {
    expect(INITIAL_VIEWBAR_VISIBLE).toBe(false)
  })

  it('toggle schaltet hin und zurück', () => {
    store.getState().toggleViewBar()
    expect(store.getState().viewBarVisible).toBe(true)
    store.getState().toggleViewBar()
    expect(store.getState().viewBarVisible).toBe(false)
  })

  it('setzt den Zustand direkt und ist idempotent', () => {
    store.getState().setViewBarVisible(true)
    store.getState().setViewBarVisible(true)
    expect(store.getState().viewBarVisible).toBe(true)
    store.getState().setViewBarVisible(false)
    expect(store.getState().viewBarVisible).toBe(false)
  })

  it('rührt Sidebar, Tab, Flyout und Mobile-Sheet nicht an', () => {
    store.setState({ sidebarCollapsed: true, sidebarTab: 'collection', openFlyout: 'settings', mobileSheet: 'view' })
    store.getState().toggleViewBar()
    expect(store.getState().viewBarVisible).toBe(true)
    expect(store.getState().sidebarCollapsed).toBe(true)
    expect(store.getState().sidebarTab).toBe('collection')
    expect(store.getState().openFlyout).toBe('settings')
    // Das Handy-Sheet haengt an den Kugeln, nicht an diesem Schalter.
    expect(store.getState().mobileSheet).toBe('view')
  })
})
