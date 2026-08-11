// German display labels and load-order for anatomy groups.
// Single source of truth — used by StructureBrowser and wherever else labels are needed.

// Only these groups are active in the current release. All others are hidden.
export const ENABLED_GROUPS = new Set([
  'bones', 'muscles', 'cartilage', 'ligaments', 'teeth',
])

export const GROUP_LABELS: Record<string, string> = {
  bones:     'Knochen',
  muscles:   'Muskeln',
  cartilage: 'Knorpel',
  ligaments: 'Bänder',
  tendons:   'Sehnen',
  nerves:    'Nerven',
  arteries:  'Arterien',
  veins:     'Venen',
  organs:    'Organe',
  heart:     'Herz',
  lungs:     'Lunge',
  glands:    'Drüsen',
  brain:     'Gehirn',
  ear:       'Ohr / Nase',
  eyes:      'Augen',
  teeth:     'Zähne',
}

// Canonical display order (groups not in this list appear last, alphabetically)
export const GROUP_ORDER: string[] = [
  'bones', 'muscles', 'cartilage', 'ligaments', 'tendons',
  'nerves', 'arteries', 'veins', 'organs', 'heart', 'lungs',
  'glands', 'brain', 'ear', 'eyes', 'teeth',
]

// Reihenfolge im Sidebar-Tab „Strukturen". Weicht bewusst von GROUP_ORDER ab:
// oben stehen die Gruppen, die beim Start AUS sind — Muskeln und Bänder. Sie
// sind die Zeilen, die man überhaupt anfassen muss; darunter folgt das Skelett,
// das bereits an ist. GROUP_ORDER bleibt die kanonische Reihenfolge für alles
// andere (Ladepfad, Sammlung).
export const PANEL_GROUP_ORDER: string[] = [
  'muscles', 'ligaments', 'bones', 'cartilage', 'teeth',
]

export function getGroupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1)
}

function orderBy(order: string[], groups: string[]): string[] {
  const orderMap = new Map(order.map((g, i) => [g, i]))
  return [...groups].sort((a, b) => {
    const ai = orderMap.get(a) ?? Infinity
    const bi = orderMap.get(b) ?? Infinity
    if (ai !== bi) return ai - bi
    return a.localeCompare(b)
  })
}

export function sortGroups(groups: string[]): string[] {
  return orderBy(GROUP_ORDER, groups)
}

export function sortPanelGroups(groups: string[]): string[] {
  return orderBy(PANEL_GROUP_ORDER, groups)
}
