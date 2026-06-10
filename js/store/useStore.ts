import { createStore } from 'zustand/vanilla'
import type * as THREE from 'three'
import type { AnatomyGroup, MetaEntry, SelectionState } from '../types/index.js'
import { APP_CONFIG } from '../config/config.js'

// ─── State-Form ──────────────────────────────────────────────────────────────

export interface StoreState {
  // Welche Modelle sind pro Gruppe geladen
  groups: Partial<Record<AnatomyGroup, THREE.Object3D[]>>
  // Sichtbarkeit pro Gruppe (true = sichtbar)
  groupStates: Record<string, boolean>
  // Sichtbarkeit einzelner Modelle (override pro Model-ID)
  modelStates: Record<string, boolean>
  // Auswahl
  selected: SelectionState
  // Farben pro Gruppe (Hex-Number wie 0xe85861)
  colors: Record<string, number>
  // Opazität pro Model-ID (0.0–1.0)
  opacity: Record<string, number>
  // Für Raycasting: Menge der anklickbaren Objekte
  pickableObjects: Set<THREE.Object3D>
  // Schutz-Gruppen (bones/teeth werden nicht gelöscht beim Reset)
  protection: { bones: boolean; teeth: boolean }

  // ─── Actions: Selection ───────────────────────────────────────────────────
  setSelection: (s: Partial<SelectionState>) => void
  clearSelection: () => void

  // ─── Actions: Visibility ──────────────────────────────────────────────────
  setGroupVisible: (group: string, visible: boolean) => void
  setModelVisible: (modelId: string, visible: boolean) => void

  // ─── Actions: Models ──────────────────────────────────────────────────────
  setGroupLoaded: (group: AnatomyGroup, models: THREE.Object3D[]) => void
  unloadGroup: (group: AnatomyGroup) => void

  // ─── Actions: Appearance ──────────────────────────────────────────────────
  setGroupColor: (group: string, color: number) => void
  setModelOpacity: (modelId: string, opacity: number) => void

  // ─── Actions: Pickables ───────────────────────────────────────────────────
  addPickable: (mesh: THREE.Object3D) => void
  removePickable: (mesh: THREE.Object3D) => void

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

// Default-Farben aus config.ts übernehmen
const defaultColors: Record<string, number> = {
  ...(APP_CONFIG.ui.colors as Record<string, number>),
}

// ─── Store ───────────────────────────────────────────────────────────────────

const useStore = createStore<StoreState>((set, get) => ({
  groups: {},
  groupStates: {},
  modelStates: {},
  selected: emptySelection,
  colors: defaultColors,
  opacity: {},
  pickableObjects: new Set(),
  protection: { bones: true, teeth: true },

  // Selection
  setSelection: (s) =>
    set((state) => ({
      selected: { ...state.selected, ...s },
    })),

  clearSelection: () => set({ selected: emptySelection }),

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
      // Gruppe beim Laden automatisch sichtbar schalten
      groupStates: { ...state.groupStates, [group]: true },
    })),

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
        selected: emptySelection,
        colors: defaultColors,
        opacity: {},
        pickableObjects: new Set(),
      }
    })
  },
}))

export default useStore

// Zugriff für Three.js-Code (imperativ, kein React nötig)
export const getStore = () => useStore.getState()
export const subscribeStore = useStore.subscribe
// In Phase 3 kommt useReactStore.ts hinzu: wrap mit useStore() Hook für React
