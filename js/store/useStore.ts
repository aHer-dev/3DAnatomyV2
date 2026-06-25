import { createStore } from 'zustand/vanilla'
import type * as THREE from 'three'
import type { AnatomyGroup, CollectionItem, MetaEntry, SelectionState } from '../types/index.js'
import { APP_CONFIG } from '../config/config.js'

// ─── Konstanten ──────────────────────────────────────────────────────────────

export const DEFAULT_COLOR = 0xcccccc

// Exportiert für Fallback-Nutzung in migrierten Dateien
export const INITIAL_COLORS: Record<string, number> = {
  ...(APP_CONFIG.ui.colors as Record<string, number>),
}

// ─── Einzelansicht (Isolation) ───────────────────────────────────────────────

export interface IsolationActionBar {
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: (() => void) | null
}

export interface IsolationState {
  model: THREE.Object3D | null
  actionBar: IsolationActionBar | null
}

const emptyIsolation: IsolationState = { model: null, actionBar: null }

// ─── State-Form ──────────────────────────────────────────────────────────────

export interface StoreState {
  // ─── Geladene Modelle ───────────────────────────────────────────────────────
  groups: Partial<Record<AnatomyGroup, THREE.Object3D[]>>
  groupStates: Record<string, boolean>
  modelStates: Record<string, boolean>
  modelsByName: Map<THREE.Object3D, string>

  // ─── Auswahl ────────────────────────────────────────────────────────────────
  selected: SelectionState
  multiSelected: Set<THREE.Object3D>

  // ─── Einzelansicht ──────────────────────────────────────────────────────────
  isolation: IsolationState

  // ─── Darstellung ────────────────────────────────────────────────────────────
  colors: Record<string, number>
  opacity: Record<string, number>
  groupOpacity: Record<string, number>

  // ─── Raycasting ─────────────────────────────────────────────────────────────
  pickableObjects: Set<THREE.Object3D>

  // ─── Schutz-Gruppen (werden beim Reset nicht gelöscht) ──────────────────────
  protection: { bones: boolean; teeth: boolean }

  // ─── Meta-Daten (einmalig von meta.json befüllt) ────────────────────────────
  groupedMeta: Record<string, MetaEntry[]>
  availableGroups: string[]
  metaById: Record<string, MetaEntry>
  metaByFile: Record<string, MetaEntry>

  // ─── Sammlung ───────────────────────────────────────────────────────────────
  collection: CollectionItem[]

  // ─── Klick-Statistik ────────────────────────────────────────────────────────
  clickCounts: Record<string, number>

  // ─── Actions: Selection ───────────────────────────────────────────────────
  setSelection: (s: Partial<SelectionState>) => void
  clearSelection: () => void

  // ─── Actions: Einzelansicht ───────────────────────────────────────────────
  setIsolation: (iso: IsolationState) => void

  // ─── Actions: MultiSelect ─────────────────────────────────────────────────
  addToMultiSelected: (mesh: THREE.Object3D) => void
  removeFromMultiSelected: (mesh: THREE.Object3D) => void
  clearMultiSelected: () => void

  // ─── Actions: Visibility ──────────────────────────────────────────────────
  setGroupVisible: (group: string, visible: boolean) => void
  setModelVisible: (modelId: string, visible: boolean) => void

  // ─── Actions: Models ──────────────────────────────────────────────────────
  setGroupLoaded: (group: AnatomyGroup, models: THREE.Object3D[]) => void
  addGroupModel: (group: AnatomyGroup, model: THREE.Object3D) => void
  unloadGroup: (group: AnatomyGroup) => void

  // ─── Actions: Appearance ──────────────────────────────────────────────────
  setGroupColor: (group: string, color: number) => void
  setModelOpacity: (modelId: string, opacity: number) => void
  setGroupOpacity: (group: string, opacity: number) => void

  // ─── Actions: Pickables ───────────────────────────────────────────────────
  addPickable: (mesh: THREE.Object3D) => void
  removePickable: (mesh: THREE.Object3D) => void

  // ─── Actions: Meta-Daten ──────────────────────────────────────────────────
  setMetaData: (data: {
    groupedMeta: Record<string, MetaEntry[]>
    availableGroups: string[]
    metaById: Record<string, MetaEntry>
    metaByFile: Record<string, MetaEntry>
  }) => void

  // ─── Actions: Collection ──────────────────────────────────────────────────
  addToCollection: (item: CollectionItem) => void
  removeFromCollection: (id: string) => void
  clearCollection: () => void

  // ─── Actions: ClickCounts ─────────────────────────────────────────────────
  incrementClickCount: (id: string) => void

  // ─── Actions: Reset ───────────────────────────────────────────────────────
  resetVisibility: () => void
  resetAll: () => void
}

// ─── Initialer State ─────────────────────────────────────────────────────────

const emptySelection: SelectionState = {
  root: null,
  mesh: null,
  point: null,
  meta: null,
}

// ─── Store ───────────────────────────────────────────────────────────────────

const useStore = createStore<StoreState>((set, get) => ({
  groups: {},
  groupStates: {},
  modelStates: {},
  modelsByName: new Map(),
  selected: emptySelection,
  multiSelected: new Set(),
  isolation: emptyIsolation,
  colors: { ...INITIAL_COLORS },
  opacity: {},
  groupOpacity: {},
  pickableObjects: new Set(),
  protection: { bones: true, teeth: true },
  groupedMeta: {},
  availableGroups: [],
  metaById: {},
  metaByFile: {},
  collection: [],
  clickCounts: {},

  // Selection
  setSelection: (s) =>
    set((state) => ({
      selected: { ...state.selected, ...s },
    })),

  clearSelection: () => set({ selected: emptySelection }),

  // Einzelansicht (Isolation)
  setIsolation: (iso) => set({ isolation: iso }),

  // MultiSelect
  addToMultiSelected: (mesh) =>
    set((state) => {
      const next = new Set(state.multiSelected)
      next.add(mesh)
      return { multiSelected: next }
    }),

  removeFromMultiSelected: (mesh) =>
    set((state) => {
      const next = new Set(state.multiSelected)
      next.delete(mesh)
      return { multiSelected: next }
    }),

  clearMultiSelected: () => set({ multiSelected: new Set() }),

  // Visibility
  setGroupVisible: (group, visible) =>
    set((state) => ({
      groupStates: { ...state.groupStates, [group]: visible },
    })),

  setModelVisible: (modelId, visible) =>
    set((state) => ({
      modelStates: { ...state.modelStates, [modelId]: visible },
    })),

  // Models
  setGroupLoaded: (group, models) =>
    set((state) => ({
      groups: { ...state.groups, [group]: models },
      groupStates: { ...state.groupStates, [group]: true },
    })),

  addGroupModel: (group, model) =>
    set((state) => {
      const existing = state.groups[group] ?? []
      const next = new Map(state.modelsByName)
      next.set(model, model.name)
      return {
        groups: { ...state.groups, [group]: [...existing, model] },
        modelsByName: next,
      }
    }),

  unloadGroup: (group) =>
    set((state) => {
      const { [group]: _removed, ...rest } = state.groups
      const { [group]: _state, ...restStates } = state.groupStates
      return { groups: rest, groupStates: restStates }
    }),

  // Appearance
  setGroupColor: (group, color) =>
    set((state) => ({
      colors: { ...state.colors, [group]: color },
    })),

  setModelOpacity: (modelId, opacity) =>
    set((state) => ({
      opacity: { ...state.opacity, [modelId]: Math.max(0, Math.min(1, opacity)) },
    })),

  setGroupOpacity: (group, opacity) =>
    set((state) => ({
      groupOpacity: { ...state.groupOpacity, [group]: Math.max(0, Math.min(1, opacity)) },
    })),

  // Pickables
  addPickable: (mesh) =>
    set((state) => {
      const next = new Set(state.pickableObjects)
      next.add(mesh)
      return { pickableObjects: next }
    }),

  removePickable: (mesh) =>
    set((state) => {
      const next = new Set(state.pickableObjects)
      next.delete(mesh)
      return { pickableObjects: next }
    }),

  // Meta-Daten
  setMetaData: (data) => set(data),

  // Collection
  addToCollection: (item) =>
    set((state) => {
      if (state.collection.some((c) => c.id === item.id)) return {}
      return { collection: [...state.collection, item] }
    }),

  removeFromCollection: (id) =>
    set((state) => ({
      collection: state.collection.filter((c) => c.id !== id),
    })),

  clearCollection: () => set({ collection: [] }),

  // ClickCounts
  incrementClickCount: (id) =>
    set((state) => ({
      clickCounts: { ...state.clickCounts, [id]: (state.clickCounts[id] ?? 0) + 1 },
    })),

  // Reset: nur Sichtbarkeit zurücksetzen, Modelle bleiben geladen
  resetVisibility: () =>
    set((state) => ({
      groupStates: Object.fromEntries(
        Object.keys(state.groupStates).map((g) => [g, true])
      ),
      modelStates: {},
    })),

  // Vollständiger Reset: alles außer geschützten Gruppen
  resetAll: () => {
    const { protection } = get()
    set((state) => {
      const preservedGroups: Partial<Record<AnatomyGroup, THREE.Object3D[]>> = {}
      const preservedStates: Record<string, boolean> = {}

      for (const [group, models] of Object.entries(state.groups)) {
        if (protection[group as keyof typeof protection]) {
          preservedGroups[group as AnatomyGroup] = models
          preservedStates[group] = true
        }
      }

      return {
        groups: preservedGroups,
        groupStates: preservedStates,
        modelStates: {},
        modelsByName: new Map(),
        selected: emptySelection,
        multiSelected: new Set(),
        isolation: emptyIsolation,
        colors: { ...INITIAL_COLORS },
        opacity: {},
        groupOpacity: {},
        pickableObjects: new Set(),
        collection: [],
        clickCounts: {},
      }
    })
  },
}))

export default useStore

// Zugriff für Three.js-Code (imperativ, kein React nötig)
export const getStore = () => useStore.getState()
export const subscribeStore = useStore.subscribe
// In Phase 3 kommt useReactStore.ts hinzu: wrap mit useStore() Hook für React
