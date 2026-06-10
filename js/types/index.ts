import type * as THREE from 'three'

// ─── Anatomie-Gruppen ────────────────────────────────────────────────────────
// Alle 16 Gruppen direkt aus meta.json abgeleitet — Single Source of Truth

export type AnatomyGroup =
  | 'arteries'
  | 'bones'
  | 'brain'
  | 'cartilage'
  | 'ear'
  | 'eyes'
  | 'glands'
  | 'heart'
  | 'ligaments'
  | 'lungs'
  | 'muscles'
  | 'nerves'
  | 'organs'
  | 'skin_hair'
  | 'teeth'
  | 'veins'

// ─── Meta-Daten (meta.json) ──────────────────────────────────────────────────

export interface ModelVariant {
  path: string
  filename: string
  format: string
}

export interface MetaEntry {
  id: string
  labels: {
    en: string
    de: string
    la: string
  }
  synonyms: {
    en: string[]
    de: string[]
  }
  classification: {
    group: AnatomyGroup
    subgroup: string | null
    side: string
    system: string
    region: string
  }
  relations: {
    is_a: string[]
    part_of: string[]
    has_parts: string[]
    adjacent_to: string[]
    cross_references: Record<string, unknown>
  }
  model: {
    current: 'draco' | 'hifi' | 'lofi'
    variants: Partial<Record<'draco' | 'hifi' | 'lofi', ModelVariant>>
    default_color: string
    visible_by_default: boolean
    highlight_color: string
    rotation: [number, number, number]
    scale: [number, number, number]
    bounding_box: [number[], number[]]
    checksum: string
    root_name: string
    asset: {
      path: string
      file: string
      url: string
      fileKey: string
    }
  }
  info: {
    description: { en: string; de: string }
    keywords: { en: string[]; de: string[] }
    links?: Record<string, unknown>
  }
}

// ─── App-State ───────────────────────────────────────────────────────────────
// Aktueller Zustand (state.js) — wird in Phase 2b durch Zustand-Store ersetzt

export interface SelectionState {
  root: THREE.Object3D | null
  mesh: THREE.Object3D | null
  point: THREE.Vector3 | null
  meta: MetaEntry | null
}

export interface AppState {
  groups: Record<string, THREE.Object3D[]>
  groupStates: Record<string, boolean | Record<string, boolean>>
  pickableObjects: Set<THREE.Object3D>
  selected: SelectionState
  colors: Record<string, string>
  protection: {
    bones: boolean
    teeth: boolean
  }
  allowProtectedCut: boolean
}

// ─── Store-Slices (für Phase 2b — Zustand) ───────────────────────────────────
// Hier schon definiert damit Phase 2b direkt loslegen kann

export interface ModelsSlice {
  groups: Record<AnatomyGroup, THREE.Object3D[]>
  loadedGroups: Set<AnatomyGroup>
}

export interface SelectionSlice {
  selected: SelectionState
  setSelection: (s: SelectionState) => void
  clearSelection: () => void
}

export interface VisibilitySlice {
  groupStates: Record<string, boolean>
  modelStates: Record<string, boolean>
  setGroupVisible: (group: string, visible: boolean) => void
  setModelVisible: (modelId: string, visible: boolean) => void
}

export interface AppearanceSlice {
  colors: Record<string, string>
  opacity: Record<string, number>
  setColor: (id: string, color: string) => void
  setOpacity: (id: string, opacity: number) => void
}
