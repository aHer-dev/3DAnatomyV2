import {
  Box3, Color, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector3,
  type BufferAttribute, type BufferGeometry, type InterleavedBufferAttribute,
  type Material, type Object3D, type WebGLProgramParametersWithUniforms,
} from 'three'
import { bauchGewicht, findMuscleBoundary, type MuscleBoundaryData } from './muscleBoundary.js'

export type { MuscleBoundaryData } from './muscleBoundary.js'
export interface MaterialQualitySettings {
  tissueMaterials: boolean
  smoothNormals: boolean
  polygonOffset: boolean
}
export const DEFAULT_MATERIAL_QUALITY: MaterialQualitySettings = {
  tissueMaterials: true, smoothNormals: true, polygonOffset: true,
}
export const TENDON_COLOR = 0xefe6d2

/** Standardmaterial mit kopierbarer Sehnenmischung: Farbe/Opacity/Highlight bleiben Standard-APIs. */
export class AnatomyMaterial extends MeshStandardMaterial {
  weighted = false
  tissueMaterials = false
  originalRoughness = 1
  tissueRoughness = 0.85

  override copy(source: Material): this {
    super.copy(source as MeshStandardMaterial)
    if (source instanceof AnatomyMaterial) {
      this.weighted = source.weighted
      this.tissueMaterials = source.tissueMaterials
      this.originalRoughness = source.originalRoughness
      this.tissueRoughness = source.tissueRoughness
    }
    return this
  }

  override onBeforeCompile(shader: WebGLProgramParametersWithUniforms): void {
    if (!this.weighted) return
    shader.uniforms.tendonColor = { value: new Color(TENDON_COLOR) }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float bellyWeight;\nvarying float vBellyWeight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBellyWeight = bellyWeight;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 tendonColor;\nvarying float vBellyWeight;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(tendonColor, diffuseColor.rgb, vBellyWeight);')
    if (this.tissueMaterials) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.42, 0.8, vBellyWeight);',
      )
    }
  }

  override customProgramCacheKey(): string {
    return `anatomy-v1:${this.weighted}:${this.tissueMaterials}`
  }
}

/** Average normals at coincident vertices; POSITION/index remain byte-identical. */
export function smoothAnatomyNormals(geometry: BufferGeometry): BufferAttribute | InterleavedBufferAttribute {
  // computeVertexNormals mutates an existing normal buffer; keep the source buffer intact.
  geometry.deleteAttribute('normal')
  geometry.computeVertexNormals()
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const sums = new Map<string, Vector3>()
  const keys: string[] = []
  for (let i = 0; i < position.count; i++) {
    const key = `${position.getX(i)},${position.getY(i)},${position.getZ(i)}`
    keys.push(key)
    const sum = sums.get(key) ?? new Vector3()
    sum.x += normal.getX(i); sum.y += normal.getY(i); sum.z += normal.getZ(i)
    sums.set(key, sum)
  }
  for (const sum of sums.values()) sum.normalize()
  for (let i = 0; i < normal.count; i++) {
    const sum = sums.get(keys[i])!
    normal.setXYZ(i, sum.x, sum.y, sum.z)
  }
  return normal
}

interface PreparedGeometry {
  originalNormal: BufferAttribute | InterleavedBufferAttribute | undefined
  smoothNormal?: BufferAttribute | InterleavedBufferAttribute
}
const preparedGeometries = new WeakMap<BufferGeometry, PreparedGeometry>()

export function getOriginalAnatomyNormal(geometry: BufferGeometry) {
  return preparedGeometries.get(geometry)?.originalNormal ?? geometry.getAttribute('normal')
}

/** Runtime batches need the source normal buffer, not their already-smoothed copy. */
export function preserveAnatomyNormals(
  geometry: BufferGeometry, originalNormal: BufferAttribute, currentlySmooth: boolean,
): void {
  preparedGeometries.set(geometry, {
    originalNormal,
    smoothNormal: currentlySmooth ? geometry.getAttribute('normal') : undefined,
  })
}

function applyNormals(geometry: BufferGeometry, enabled: boolean): void {
  let prepared = preparedGeometries.get(geometry)
  if (!prepared) {
    prepared = { originalNormal: geometry.getAttribute('normal') }
    preparedGeometries.set(geometry, prepared)
  }
  if (enabled) {
    prepared.smoothNormal ??= smoothAnatomyNormals(geometry)
    geometry.setAttribute('normal', prepared.smoothNormal)
  } else if (prepared.originalNormal) {
    geometry.setAttribute('normal', prepared.originalNormal)
  } else {
    geometry.deleteAttribute('normal')
  }
}

function meshMaterials(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

export function updateAnatomyQuality(root: Object3D, settings: MaterialQualitySettings): void {
  root.traverse(object => {
    if (!(object instanceof Mesh) || !object.geometry.getAttribute('position')) return
    applyNormals(object.geometry, settings.smoothNormals)
    // Include opacity/ghost backup materials so restoring them preserves the current setting.
    const materials = new Set(meshMaterials(object))
    for (const key of ['__origMats', '__ownMats', '__ghostBackup', '_origMats']) {
      const backups: unknown = object.userData[key]
      if (Array.isArray(backups)) for (const material of backups) {
        if (material instanceof AnatomyMaterial) materials.add(material)
      }
    }
    for (const material of materials) {
      if (!(material instanceof AnatomyMaterial)) continue
      if (material.tissueMaterials !== settings.tissueMaterials) material.needsUpdate = true
      material.tissueMaterials = settings.tissueMaterials
      material.roughness = settings.tissueMaterials ? material.tissueRoughness : material.originalRoughness
      material.polygonOffset = settings.polygonOffset && (material.weighted || root.userData.group === 'muscles')
      material.polygonOffsetFactor = -1
      material.polygonOffsetUnits = -1
    }
  })
}

/** File geometry coordinates only, before scene registration or runtime batching. */
export function prepareAnatomyModel(
  root: Object3D, filename: string, groupName: string,
  data: MuscleBoundaryData, settings: MaterialQualitySettings,
): void {
  const before = new Box3().setFromObject(root, true)
  const reference = findMuscleBoundary(data, filename)
  const localBox = new Box3()
  const point = new Vector3()
  root.traverse(object => {
    if (!(object instanceof Mesh)) return
    const geometry = object.geometry
    const position = geometry.getAttribute('position')
    if (!position) return
    // Required order: source normals, then weight in the same untouched POSITION coordinates.
    applyNormals(geometry, settings.smoothNormals)
    if (reference) {
      const weights = new Float32Array(position.count)
      for (let i = 0; i < position.count; i++) {
        const p: [number, number, number] = [position.getX(i), position.getY(i), position.getZ(i)]
        weights[i] = bauchGewicht(p, reference.entry, reference.links)
        localBox.expandByPoint(point.fromArray(p))
      }
      geometry.setAttribute('bellyWeight', new Float32BufferAttribute(weights, 1))
    }
    const materials = meshMaterials(object).map(source => {
      if (!(source instanceof MeshStandardMaterial)) return source
      const material = new AnatomyMaterial().copy(source)
      material.weighted = !!reference
      material.originalRoughness = source.roughness
      const tissueRoughness: Record<string, number> = {
        bones: 0.9, teeth: 0.6, cartilage: 0.5, ligaments: 0.55,
        eyes: 0.3, arteries: 0.65, veins: 0.65, skin_hair: 0.85,
      }
      material.tissueRoughness = reference || groupName === 'muscles' ? 0.8 : tissueRoughness[groupName] ?? 0.75
      return material
    })
    object.material = Array.isArray(object.material) ? materials : materials[0]
  })
  // The reference is for the keyed file only; a paired left mesh is not exactly symmetric.
  if (reference && !reference.links) {
    const actual = [localBox.min.toArray(), localBox.max.toArray()]
    const expected = reference.entry.pruef_bbox_gltf
    for (let end = 0; end < 2; end++) for (let axis = 0; axis < 3; axis++) {
      const delta = Math.abs(actual[end][axis] - expected[end][axis])
      if (!Number.isFinite(delta) || delta > 0.001) {
        throw new Error(`${filename}: position-Bounding-Box weicht um ${(delta * 1000).toFixed(3)} mm ab (max. 1 mm). Laden angehalten.`)
      }
    }
  }
  updateAnatomyQuality(root, settings)
  const after = new Box3().setFromObject(root, true)
  if (!before.isEmpty() && (before.min.distanceTo(after.min) > 0.00001 || before.max.distanceTo(after.max) > 0.00001)) {
    throw new Error(`${filename}: Welt-Bounding-Box verändert. Laden angehalten.`)
  }
}
