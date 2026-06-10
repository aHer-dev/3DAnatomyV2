import type * as THREE from 'three'

// ─── Anatomie-Gruppen ────────────────────────────────────────────────────────

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

// ─── Auswahl ─────────────────────────────────────────────────────────────────

export interface SelectionState {
  root: THREE.Object3D | null
  mesh: THREE.Object3D | null
  point: THREE.Vector3 | null
  meta: MetaEntry | null
}

// ─── Sammlung ────────────────────────────────────────────────────────────────

export interface CollectionItem {
  id: string
  name: string
  group: string
  meta: Partial<MetaEntry>
  color: number
  opacity: number
  visible: boolean
  model: THREE.Object3D
  addedAt: number
  source: string
}
