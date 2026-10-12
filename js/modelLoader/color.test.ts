import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import store, { INITIAL_COLORS } from '../store/useStore.js'
import { updateModelColors, resetGroupColor } from './color.js'
import { setModelColor, setModelOpacity } from '../features/appearance.js'
import { AnatomyMaterial, prepareAnatomyModel, TENDON_COLOR, type MuscleBoundaryData } from './muscleAppearance'

// setModelColor/setModelOpacity are the real picker implementations. Visibility
// is unrelated to these tests and imports browser-only scene/UI setup.
vi.mock('../features/visibility.js', () => ({ setModelVisibility: vi.fn() }))

const boundaries: MuscleBoundaryData = {
  muskeln: {
    'measured.glb': {
      links: null, bauch_a: [0, 0, 0], bauch_b: [0, 1, 0], uebergang: 0.1,
      pruef_bbox_gltf: [[0, 0, 0], [1, 1, 0]],
    },
  },
}

function makeModel(group: string, weighted: boolean, color: number) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }))
  const root = new THREE.Group()
  root.userData.group = group
  root.add(mesh)
  prepareAnatomyModel(root, weighted ? 'measured.glb' : 'unmeasured.glb', group, boundaries, {
    tissueMaterials: false, smoothNormals: false, polygonOffset: false,
  })
  return { root, mesh, material: () => mesh.material as AnatomyMaterial }
}

function tendonColor(material: AnatomyMaterial): number {
  const source = THREE.ShaderLib.standard
  const shader = {
    uniforms: THREE.UniformsUtils.clone(source.uniforms),
    vertexShader: source.vertexShader,
    fragmentShader: source.fragmentShader,
  }
  material.onBeforeCompile(shader as THREE.WebGLProgramParametersWithUniforms)
  return (shader.uniforms.tendonColor.value as THREE.Color).getHex()
}

beforeEach(() => {
  store.setState({ groups: {}, colors: { ...INITIAL_COLORS } })
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  for (const models of Object.values(store.getState().groups)) {
    for (const root of models ?? []) root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach(material => material.dispose())
    })
  }
  store.setState({ groups: {}, colors: { ...INITIAL_COLORS } })
  vi.restoreAllMocks()
})

describe('muscle belly palette across anatomical groups', () => {
  it('uses the saved muscle palette for keyed eyes muscles while the eye group picker controls actual eyes', () => {
    const eyeMuscle = makeModel('eyes', true, INITIAL_COLORS.eyes)
    const eyeball = makeModel('eyes', false, INITIAL_COLORS.eyes)
    store.setState({
      groups: { eyes: [eyeMuscle.root, eyeball.root] },
      colors: { ...INITIAL_COLORS, muscles: 0x2266aa },
    })
    updateModelColors('eyes', 0x8899aa)
    expect(eyeMuscle.material().color.getHex()).toBe(0x2266aa)
    expect(eyeball.material().color.getHex()).toBe(0x8899aa)
    expect(store.getState().colors.muscles).toBe(0x2266aa)
    expect(store.getState().colors.eyes).toBe(0x8899aa)
    expect(tendonColor(eyeMuscle.material())).toBe(TENDON_COLOR)
    expect(eyeball.material().weighted).toBe(false)
  })

  it('updates measured muscle bellies in eyes along with muscles and preserves every other group color', () => {
    const muscle = makeModel('muscles', true, INITIAL_COLORS.muscles)
    const unmeasuredMuscle = makeModel('muscles', false, INITIAL_COLORS.muscles)
    const eyeMuscle = makeModel('eyes', true, INITIAL_COLORS.muscles)
    const eyeball = makeModel('eyes', false, 0x778899)
    const bone = makeModel('bones', false, INITIAL_COLORS.bones)
    store.setState({
      groups: {
        muscles: [muscle.root, unmeasuredMuscle.root],
        eyes: [eyeMuscle.root, eyeball.root], bones: [bone.root],
      },
      colors: { ...INITIAL_COLORS, eyes: 0x778899 },
    })
    updateModelColors('muscles', 0x44aa22)
    for (const model of [muscle, unmeasuredMuscle, eyeMuscle]) {
      expect(model.material().color.getHex()).toBe(0x44aa22)
    }
    expect(eyeball.material().color.getHex()).toBe(0x778899)
    expect(bone.material().color.getHex()).toBe(INITIAL_COLORS.bones)
    expect(store.getState().colors.eyes).toBe(0x778899)
    expect(store.getState().colors.bones).toBe(INITIAL_COLORS.bones)
    for (const model of [muscle, eyeMuscle]) expect(tendonColor(model.material())).toBe(0xefe6d2)
    expect(unmeasuredMuscle.material().weighted).toBe(false)
  })

  it('uses the existing muscle default when no belly palette has been saved', () => {
    const eyeMuscle = makeModel('eyes', true, 0xcccccc)
    const eyeball = makeModel('eyes', false, 0xcccccc)
    store.setState({ groups: { eyes: [eyeMuscle.root, eyeball.root] }, colors: {} })
    updateModelColors('eyes', 0x667788)
    expect(eyeMuscle.material().color.getHex()).toBe(INITIAL_COLORS.muscles)
    expect(eyeball.material().color.getHex()).toBe(0x667788)
  })

  it('resets the belly palette across groups while retaining the eye group palette', () => {
    const muscle = makeModel('muscles', true, 0x114488)
    const eyeMuscle = makeModel('eyes', true, 0x114488)
    const eyeball = makeModel('eyes', false, 0x778899)
    store.setState({
      groups: { muscles: [muscle.root], eyes: [eyeMuscle.root, eyeball.root] },
      colors: { ...INITIAL_COLORS, muscles: 0x114488, eyes: 0x778899 },
    })
    resetGroupColor('muscles')
    expect(muscle.material().color.getHex()).toBe(INITIAL_COLORS.muscles)
    expect(eyeMuscle.material().color.getHex()).toBe(INITIAL_COLORS.muscles)
    expect(eyeball.material().color.getHex()).toBe(0x778899)
    expect(store.getState().colors.eyes).toBe(0x778899)
    expect(tendonColor(eyeMuscle.material())).toBe(TENDON_COLOR)
  })

  it('preserves tendon mixing through the real per-model color and opacity picker clones', () => {
    const muscle = makeModel('muscles', true, INITIAL_COLORS.muscles)
    store.setState({ groups: { muscles: [muscle.root] } })
    const original = muscle.material()
    setModelOpacity(muscle.root, 0.4)
    const transparent = muscle.material()
    expect(transparent).not.toBe(original)
    expect(transparent).toBeInstanceOf(AnatomyMaterial)
    setModelColor(muscle.root, '#001122')
    const picked = muscle.material()
    expect(picked).not.toBe(transparent)
    expect(picked).toBeInstanceOf(AnatomyMaterial)
    expect(picked.color.getHex()).toBe(0x001122)
    expect(picked.opacity).toBe(0.4)
    expect(picked.transparent).toBe(true)
    expect(picked.weighted).toBe(true)
    expect(tendonColor(picked)).toBe(0xefe6d2)
    expect(original.color.getHex()).toBe(INITIAL_COLORS.muscles)
    expect(store.getState().colors.muscles).toBe(INITIAL_COLORS.muscles)
  })
})
