import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { Box3, Float32BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { chooseGhostMode, enterGhostContext, exitGhostContext, GHOST_MESH_BUDGET, isGhostContextActive } from './ghostContext.js'
import store, { INITIAL_RENDERING_SETTINGS } from '../store/useStore.js'
import { AnatomyMaterial, prepareAnatomyModel, updateAnatomyQuality } from '../modelLoader/muscleAppearance.js'

// Durchscheinen kostet einen Blend-Vorgang pro Schicht und Pixel. Oberhalb der
// Schwelle treten die anderen Strukturen deshalb gedaempft-opak zurueck.
describe('chooseGhostMode', () => {
  it('laesst kleine Szenen durchscheinen', () => {
    expect(chooseGhostMode(0)).toBe('translucent')
    expect(chooseGhostMode(GHOST_MESH_BUDGET)).toBe('translucent')
  })

  it('schaltet ueber der Schwelle auf gedaempft-opak', () => {
    expect(chooseGhostMode(GHOST_MESH_BUDGET + 1)).toBe('dimmed')
  })

  it('deckt die beiden realen Faelle ab', () => {
    // Isolation: Knochen + Zaehne + Knorpel sichtbar, Muskeln ausgeblendet.
    expect(chooseGhostMode(297)).toBe('translucent')
    // Alles sichtbar inklusive der 464 Muskeln.
    expect(chooseGhostMode(761)).toBe('dimmed')
  })
})

describe('Ghost-Kontext und aktuelle Darstellungsqualität', () => {
  let previousGroups = store.getState().groups
  let previousSettings = store.getState().renderingSettings
  const roots: Group[] = []

  beforeEach(() => {
    previousGroups = store.getState().groups
    previousSettings = store.getState().renderingSettings
    store.setState({ groups: {}, renderingSettings: { ...INITIAL_RENDERING_SETTINGS } })
  })

  afterEach(() => {
    exitGhostContext()
    for (const root of roots) root.traverse(object => {
      if (!(object instanceof Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
    roots.length = 0
    store.setState({ groups: previousGroups, renderingSettings: previousSettings })
  })

  it.each([false, true])('stellt Materialien mit der während Ghost gewählten Qualität %s wieder her', enabled => {
    const initial = {
      ...INITIAL_RENDERING_SETTINGS,
      tissueMaterials: !enabled,
      polygonOffset: !enabled,
      smoothNormals: !enabled,
    }
    store.setState({ renderingSettings: initial })
    const selected = new Group()
    const context = new Group()
    context.userData.group = 'muscles'
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
    geometry.setAttribute('normal', new Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0], 3))
    geometry.setIndex([0, 1, 2])
    const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: 0x2468ab, roughness: 0.65, transparent: true, opacity: 0.45 }))
    context.add(mesh)
    roots.push(selected, context)
    prepareAnatomyModel(context, 'unmeasured.glb', 'muscles', { muskeln: {} }, initial)
    const original = mesh.material as AnatomyMaterial
    const sourceColor = original.color.getHex()
    const positions = [...geometry.getAttribute('position').array]
    const bounds = new Box3().setFromObject(context, true)
    const transform = context.matrix.toArray()
    store.setState({ groups: { muscles: [selected, context] } })

    enterGhostContext(selected)
    expect(isGhostContextActive()).toBe(true)
    expect(mesh.material).not.toBe(original)
    store.getState().setRenderingSetting('tissueMaterials', enabled)
    store.getState().setRenderingSetting('polygonOffset', enabled)
    store.getState().setRenderingSetting('smoothNormals', enabled)
    // Match the loader's subscription while the shared replacement is visible.
    updateAnatomyQuality(context, store.getState().renderingSettings)
    expect(original.tissueMaterials).toBe(!enabled)

    exitGhostContext()
    expect(isGhostContextActive()).toBe(false)
    expect(mesh.material).toBe(original)
    expect(original.tissueMaterials).toBe(enabled)
    expect(original.polygonOffset).toBe(enabled)
    expect(original.roughness).toBe(enabled ? original.tissueRoughness : original.originalRoughness)
    expect(original.color.getHex()).toBe(sourceColor)
    expect(original.opacity).toBe(0.45)
    expect(original.transparent).toBe(true)
    expect([...geometry.getAttribute('position').array]).toEqual(positions)
    expect(new Box3().setFromObject(context, true).equals(bounds)).toBe(true)
    expect(context.matrix.toArray()).toEqual(transform)
    expect([...geometry.getAttribute('normal').array]).toEqual(enabled
      ? [0, 0, 1, 0, 0, 1, 0, 0, 1]
      : [1, 0, 0, 1, 0, 0, 1, 0, 0])
  })
})
