// German display labels and load-order for anatomy groups.
// Single source of truth — used by StructureBrowser and wherever else labels are needed.

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

export function getGroupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1)
}

export function sortGroups(groups: string[]): string[] {
  const orderMap = new Map(GROUP_ORDER.map((g, i) => [g, i]))
  return [...groups].sort((a, b) => {
    const ai = orderMap.get(a) ?? Infinity
    const bi = orderMap.get(b) ?? Infinity
    if (ai !== bi) return ai - bi
    return a.localeCompare(b)
  })
}
