import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  AnatomyMaterial,
  DEFAULT_MATERIAL_QUALITY,
  TENDON_COLOR,
  prepareAnatomyModel,
  smoothAnatomyNormals,
  updateAnatomyQuality,
  type MaterialQualitySettings,
  type MuscleBoundaryData,
} from './muscleAppearance'
import { bauchGewicht } from './muscleBoundary'

const qualityOff: MaterialQualitySettings = {
  tissueMaterials: false, smoothNormals: false, polygonOffset: false,
}
const boundaries: MuscleBoundaryData = {
  muskeln: {
    'right.glb': {
      links: 'unusual-left.glb', bauch_a: [0, 0, 0], bauch_b: [0, 1, 0], uebergang: 0.1,
      pruef_bbox_gltf: [[0, 0, 0], [1, 1, 1]],
    },
  },
}

function foldedGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 1, 0, 0, 0, 1,
  ], 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute([
    0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0,
  ], 3))
  geometry.setIndex([0, 1, 2, 3, 4, 5])
  return geometry
}

function makeModel(): THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> {
  return new THREE.Mesh(foldedGeometry(), new THREE.MeshStandardMaterial({ color: 0xe85861, roughness: 0.97 }))
}

function compile(material: AnatomyMaterial) {
  const source = THREE.ShaderLib.standard
  const shader = {
    uniforms: THREE.UniformsUtils.clone(source.uniforms),
    vertexShader: source.vertexShader,
    fragmentShader: source.fragmentShader,
  }
  material.onBeforeCompile(shader as THREE.WebGLProgramParametersWithUniforms)
  return shader
}

describe('anatomy material and appearance behavior', () => {
  it('retains tendon mixing, color, opacity and highlighting across material clones', () => {
    const original = new AnatomyMaterial()
    original.weighted = true
    original.tissueMaterials = true
    original.originalRoughness = 0.97
    original.tissueRoughness = 0.8
    original.color.setHex(0x123456)
    original.emissive.setHex(0x654321)
    original.emissiveIntensity = 0.4
    original.opacity = 0.35
    original.transparent = true
    const clone = original.clone()
    expect(clone).toBeInstanceOf(AnatomyMaterial)
    expect(clone.weighted).toBe(true)
    expect(clone.tissueMaterials).toBe(true)
    expect(clone.originalRoughness).toBe(0.97)
    expect(clone.tissueRoughness).toBe(0.8)
    expect(clone.opacity).toBe(0.35)
    expect(clone.transparent).toBe(true)
    expect(clone.color.getHex()).toBe(0x123456)
    expect(clone.emissive.getHex()).toBe(0x654321)
    expect(clone.emissiveIntensity).toBe(0.4)
    expect(compile(clone).fragmentShader).toContain('mix(tendonColor, diffuseColor.rgb, vBellyWeight)')
    clone.color.setHex(0xabcdef)
    expect(original.color.getHex()).toBe(0x123456)
  })

  it('keeps tendon color fixed when the belly picker and quality settings change', () => {
    const material = new AnatomyMaterial()
    material.weighted = true
    material.color.setHex(0xe85861)
    const first = compile(material)
    expect((first.uniforms.tendonColor.value as THREE.Color).getHex()).toBe(TENDON_COLOR)
    material.color.setHex(0x2244bb)
    material.tissueMaterials = true
    const changed = compile(material)
    expect((changed.uniforms.tendonColor.value as THREE.Color).getHex()).toBe(0xefe6d2)
    expect(material.color.getHex()).toBe(0x2244bb)
    expect(changed.fragmentShader).toContain('roughnessFactor = mix(0.42, 0.8, vBellyWeight)')
    expect(first.fragmentShader).not.toContain('roughnessFactor = mix(0.42, 0.8, vBellyWeight)')
  })

  it('leaves unmeasured muscle materials uniform and preserves their source colors', () => {
    const root = makeModel()
    const before = root.material.color.getHex()
    prepareAnatomyModel(root, 'missing.glb', 'muscles', boundaries, qualityOff)
    const material = root.material as AnatomyMaterial
    expect(material.color.getHex()).toBe(before)
    expect(material.weighted).toBe(false)
    expect(root.geometry.getAttribute('bellyWeight')).toBeUndefined()
    const shader = compile(material)
    expect(shader.uniforms.tendonColor).toBeUndefined()
    expect(shader.vertexShader).not.toContain('attribute float bellyWeight')
  })

  it('weights entries assigned to eyes using local POSITION despite ancestor transforms', () => {
    const root = new THREE.Group()
    root.position.set(12, -4, 6)
    root.rotation.set(0.1, 0.3, 0.2)
    root.scale.setScalar(2)
    const mesh = makeModel()
    root.add(mesh)
    root.updateMatrixWorld(true)
    const before = new THREE.Box3().setFromObject(root, true)
    const position = mesh.geometry.getAttribute('position')
    const sourcePositions = [...position.array]
    prepareAnatomyModel(root, 'right.glb', 'eyes', boundaries, DEFAULT_MATERIAL_QUALITY)
    const weights = mesh.geometry.getAttribute('bellyWeight')
    expect(weights.count).toBe(position.count)
    for (let i = 0; i < position.count; i++) {
      expect(weights.getX(i)).toBeCloseTo(bauchGewicht(
        [position.getX(i), position.getY(i), position.getZ(i)], boundaries.muskeln['right.glb'],
      ), 6)
    }
    expect([...position.array]).toEqual(sourcePositions)
    expect(new THREE.Box3().setFromObject(root, true).equals(before)).toBe(true)
    expect((mesh.material as AnatomyMaterial).weighted).toBe(true)
  })

  it('uses explicit left filenames without forcing a mirrored reference bounding box', () => {
    const root = makeModel()
    const position = root.geometry.getAttribute('position')
    prepareAnatomyModel(root, 'unusual-left.glb', 'eyes', boundaries, qualityOff)
    const weights = root.geometry.getAttribute('bellyWeight')
    for (let i = 0; i < position.count; i++) {
      expect(weights.getX(i)).toBeCloseTo(bauchGewicht(
        [position.getX(i), position.getY(i), position.getZ(i)], boundaries.muskeln['right.glb'], true,
      ), 6)
    }
  })

  it('rejects a source bounding box that differs by more than 1 mm without relocating the model', () => {
    const root = makeModel()
    const sourcePosition = [...root.geometry.getAttribute('position').array]
    const invalid: MuscleBoundaryData = {
      muskeln: {
        'right.glb': { ...boundaries.muskeln['right.glb'], pruef_bbox_gltf: [[0, 0, 0], [1.002, 1, 1]] },
      },
    }
    expect(() => prepareAnatomyModel(root, 'right.glb', 'muscles', invalid, DEFAULT_MATERIAL_QUALITY))
      .toThrow(/right\.glb.*Bounding-Box/)
    expect([...root.geometry.getAttribute('position').array]).toEqual(sourcePosition)
    expect(root.position.toArray()).toEqual([0, 0, 0])
    expect(root.scale.toArray()).toEqual([1, 1, 1])
  })

  it('updates cloned opacity and ghost backup materials when toggling tissue settings', () => {
    const root = makeModel()
    root.userData.group = 'muscles'
    prepareAnatomyModel(root, 'right.glb', 'muscles', boundaries, DEFAULT_MATERIAL_QUALITY)
    const material = root.material as AnatomyMaterial
    const ghost = material.clone()
    ghost.opacity = 0.15
    const opacity = material.clone()
    opacity.opacity = 0.5
    root.userData.__ghostBackup = [ghost]
    root.userData.__origMats = [opacity]
    updateAnatomyQuality(root, qualityOff)
    for (const candidate of [material, ghost, opacity]) {
      expect(candidate.weighted).toBe(true)
      expect(candidate.tissueMaterials).toBe(false)
      expect(candidate.roughness).toBe(0.97)
      expect(candidate.polygonOffset).toBe(false)
    }
    expect(ghost.opacity).toBe(0.15)
    expect(opacity.opacity).toBe(0.5)
    updateAnatomyQuality(root, DEFAULT_MATERIAL_QUALITY)
    for (const candidate of [material, ghost, opacity]) {
      expect(candidate.tissueMaterials).toBe(true)
      expect(candidate.roughness).toBe(0.8)
      expect(candidate.polygonOffset).toBe(true)
    }
  })
})

describe('normal smoothing without geometry relocation', () => {
  it('averages coincident vertex normals while retaining source POSITION, indices and original normals', () => {
    const geometry = foldedGeometry()
    const originalNormals = geometry.getAttribute('normal')
    const beforeNormals = [...originalNormals.array]
    const positions = [...geometry.getAttribute('position').array]
    const index = [...geometry.index!.array]
    const smooth = smoothAnatomyNormals(geometry)
    expect(smooth).not.toBe(originalNormals)
    expect([...originalNormals.array]).toEqual(beforeNormals)
    expect([...geometry.getAttribute('position').array]).toEqual(positions)
    expect([...geometry.index!.array]).toEqual(index)
    expect(smooth.getX(0)).toBeCloseTo(Math.SQRT1_2, 6)
    expect(smooth.getY(0)).toBeCloseTo(0, 6)
    expect(smooth.getZ(0)).toBeCloseTo(Math.SQRT1_2, 6)
    expect([smooth.getX(3), smooth.getY(3), smooth.getZ(3)])
      .toEqual([smooth.getX(0), smooth.getY(0), smooth.getZ(0)])
  })

  it('restores the exact original normal attribute after smoothing is switched off', () => {
    const root = makeModel()
    const original = root.geometry.getAttribute('normal')
    const sourceBytes = [...original.array]
    prepareAnatomyModel(root, 'right.glb', 'muscles', boundaries, DEFAULT_MATERIAL_QUALITY)
    const smooth = root.geometry.getAttribute('normal')
    expect(smooth).not.toBe(original)
    updateAnatomyQuality(root, qualityOff)
    expect(root.geometry.getAttribute('normal')).toBe(original)
    expect([...root.geometry.getAttribute('normal').array]).toEqual(sourceBytes)
    updateAnatomyQuality(root, DEFAULT_MATERIAL_QUALITY)
    expect(root.geometry.getAttribute('normal')).toBe(smooth)
  })
})
