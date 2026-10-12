import { describe, expect, it, vi } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, type WebGLRenderer } from 'three'
import useStore from '../store/useStore.js'
import {
  disposeRenderQuality, hasVisibleTransparentMeshes, initializeRenderQuality,
  isConstrainedGraphics, isSoftwareRendererName, renderQualityFrame,
} from './renderQuality.js'

describe('software graphics detection', () => {
  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'softpipe',
    'Software Rasterizer',
    'Software Renderer',
    'ANGLE (Microsoft, WARP Direct3D11)',
    'Microsoft Basic Render Driver',
  ])('uses the constrained profile for %s', (name) => {
    expect(isSoftwareRendererName(name)).toBe(true)
  })

  it.each(['NVIDIA GeForce RTX 3060', 'ANGLE (Intel UHD Graphics 620)', 'AMD Radeon RX 6600', 'Apple M2', 'WebKit WebGL'])
    ('keeps the hardware/device profile for %s', (name) => {
      expect(isSoftwareRendererName(name)).toBe(false)
    })

  it('prefers the actual renderer from the debug extension over the masked name', () => {
    const renderer = {
      getContext: () => ({
        RENDERER: 1,
        getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 2 }),
        getParameter: (parameter: number) => parameter === 2 ? 'SwiftShader' : 'WebKit WebGL',
      }),
    } as unknown as WebGLRenderer
    expect(isConstrainedGraphics(renderer)).toBe(true)
  })

  it('falls back to the ordinary renderer name without the extension', () => {
    const renderer = {
      getContext: () => ({ RENDERER: 1, getExtension: () => null, getParameter: () => 'llvmpipe' }),
    } as unknown as WebGLRenderer
    expect(isConstrainedGraphics(renderer)).toBe(true)
  })

  it('preserves the existing device decision when debug access throws or returns no name', () => {
    const blocked = {
      getContext: () => ({ getExtension: () => { throw new Error('Debug information blocked') } }),
    } as unknown as WebGLRenderer
    const unavailable = {
      getContext: () => ({ RENDERER: 1, getExtension: () => null, getParameter: () => undefined }),
    } as unknown as WebGLRenderer
    expect(isConstrainedGraphics(blocked)).toBe(false)
    expect(isConstrainedGraphics(unavailable)).toBe(false)
  })
})

it('renders loading frames directly while retaining the selected ambient occlusion preference', () => {
  const state = useStore.getState()
  const render = vi.fn()
  const renderer = { render } as unknown as WebGLRenderer
  const scene = new Scene()
  const camera = new PerspectiveCamera()
  try {
    useStore.setState({
      renderingSettings: { ...state.renderingSettings, environment: false, ambientOcclusion: true },
      performanceMode: false,
      constrainedDevice: false,
      loading: { active: true, progress: 10, label: 'Loading' },
    })
    initializeRenderQuality(renderer, scene, camera)
    // The mock has no GPU allocation methods. A compositor path would fail.
    renderQualityFrame(renderer, scene, camera)
    expect(render).toHaveBeenCalledWith(scene, camera)
    expect(useStore.getState().renderingSettings.ambientOcclusion).toBe(true)
  } finally {
    disposeRenderQuality()
    useStore.setState(state)
  }
})

function addMesh(scene: Scene, material = new MeshStandardMaterial()): Mesh {
  const mesh = new Mesh(new BoxGeometry(), material)
  scene.add(mesh)
  return mesh
}

describe('ambient occlusion transparency policy', () => {
  it('allows opaque and fully opaque transparent materials', () => {
    const scene = new Scene()
    addMesh(scene)
    addMesh(scene, new MeshStandardMaterial({ transparent: true, opacity: 1 }))
    expect(hasVisibleTransparentMeshes(scene)).toBe(false)
  })

  it('pauses for any visible partly transparent material, including material arrays', () => {
    const scene = new Scene()
    const mesh = addMesh(scene)
    mesh.material = [new MeshStandardMaterial(), new MeshStandardMaterial({ transparent: true, opacity: 0.5 })]
    expect(hasVisibleTransparentMeshes(scene)).toBe(true)
  })

  it('ignores hidden meshes, hidden ancestors and invisible materials', () => {
    const scene = new Scene()
    const material = new MeshStandardMaterial({ transparent: true, opacity: 0.5 })
    const hiddenMesh = addMesh(scene, material)
    hiddenMesh.visible = false
    const hiddenGroup = new Group()
    hiddenGroup.visible = false
    hiddenGroup.add(new Mesh(new BoxGeometry(), material))
    scene.add(hiddenGroup)
    const invisibleMaterial = material.clone()
    invisibleMaterial.visible = false
    addMesh(scene, invisibleMaterial)
    expect(hasVisibleTransparentMeshes(scene)).toBe(false)
  })

  it('resumes once transparency is restored without moving any objects', () => {
    const scene = new Scene()
    const mesh = addMesh(scene, new MeshStandardMaterial({ transparent: true, opacity: 0.3 }))
    const matrix = mesh.matrix.clone()
    expect(hasVisibleTransparentMeshes(scene)).toBe(true)
    const material = mesh.material as MeshStandardMaterial
    material.opacity = 1
    material.transparent = false
    expect(hasVisibleTransparentMeshes(scene)).toBe(false)
    expect(mesh.matrix.equals(matrix)).toBe(true)
  })
})
