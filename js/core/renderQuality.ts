import {
  ACESFilmicToneMapping,
  NoToneMapping,
  PMREMGenerator,
  SRGBColorSpace,
  Vector2,
} from 'three'
import type { Camera, Mesh, Scene, WebGLRenderer, WebGLRenderTarget } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { getEffectiveRenderingSettings, getStore, subscribeStore } from '../store/useStore.js'
import type { StoreState } from '../store/useStore.js'
import { requestRender } from './renderScheduler.js'

/** CPU rasterizers need the same inexpensive profile as limited mobile GPUs. */
export function isSoftwareRendererName(name: string): boolean {
  return /swiftshader|llvmpipe|softpipe|software\s+(?:rasterizer|renderer)|\bwarp\b|microsoft basic render driver/i.test(name)
}

export function isConstrainedGraphics(renderer: WebGLRenderer): boolean {
  try {
    const context = renderer.getContext()
    const extension = context.getExtension('WEBGL_debug_renderer_info')
    const unmasked: unknown = extension
      ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL)
      : null
    const name: unknown = typeof unmasked === 'string' ? unmasked : context.getParameter(context.RENDERER)
    return typeof name === 'string' && isSoftwareRendererName(name)
  } catch {
    // Privacy settings may suppress debug information; keep the device profile.
    return false
  }
}

/** GTAO's depth/normal override cannot represent partly transparent surfaces. */
export function hasVisibleTransparentMeshes(scene: Scene): boolean {
  let transparent = false
  scene.traverseVisible((object) => {
    if (transparent || !(object as Mesh).isMesh) return
    const mesh = object as Mesh
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    transparent = materials.some((material) => material.visible && material.transparent && material.opacity < 1)
  })
  return transparent
}

class RenderQualityPipeline {
  private environment: WebGLRenderTarget | null = null
  private composer: EffectComposer | null = null
  private gtao: GTAOPass | null = null
  private readonly size = new Vector2()
  private width = 0
  private height = 0
  private pixelRatio = 0
  private ambientOcclusion = false
  private readonly unsubscribe: () => void

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly scene: Scene,
    private readonly camera: Camera,
  ) {
    this.applySettings(getStore())
    this.unsubscribe = subscribeStore((state, previous) => {
      if (
        state.renderingSettings === previous.renderingSettings &&
        state.performanceMode === previous.performanceMode &&
        state.constrainedDevice === previous.constrainedDevice
      ) return
      this.applySettings(state)
      requestRender()
    })
  }

  private createEnvironment(): WebGLRenderTarget {
    if (this.environment) return this.environment
    const room = new RoomEnvironment()
    const pmrem = new PMREMGenerator(this.renderer)
    try {
      // Generated once; no HDR, texture, or model is fetched.
      this.environment = pmrem.fromScene(room, 0.04)
      return this.environment
    } finally {
      room.dispose()
      pmrem.dispose()
    }
  }

  private applySettings(state: StoreState): void {
    const settings = getEffectiveRenderingSettings(
      state.renderingSettings, state.performanceMode, state.constrainedDevice,
    )
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = settings.toneMapping ? ACESFilmicToneMapping : NoToneMapping
    this.scene.environment = settings.environment ? this.createEnvironment().texture : null
    this.ambientOcclusion = settings.ambientOcclusion
    // Release the large screen buffers when the user selects the performance
    // profile; re-enable lazily on the next frame instead of keeping GPU memory.
    if (!this.ambientOcclusion) this.disposeComposer()
  }

  private createComposer(): EffectComposer {
    if (this.composer) return this.composer
    const composer = new EffectComposer(this.renderer)
    // The renderer's canvas MSAA does not apply to an offscreen render target.
    // Keep antialiased edges in the quality path without affecting mobile/perf.
    const samples = this.renderer.getContextAttributes()?.antialias
      ? Math.min(2, this.renderer.capabilities.maxSamples)
      : 0
    composer.renderTarget1.samples = samples
    composer.renderTarget2.samples = samples
    composer.addPass(new RenderPass(this.scene, this.camera))
    const gtao = new GTAOPass(this.scene, this.camera)
    gtao.blendIntensity = 0.3
    gtao.updateGtaoMaterial({ radius: 0.015, thickness: 0.006, samples: 8 })
    gtao.updatePdMaterial({ samples: 8, radius: 2 })
    composer.addPass(gtao)
    // OutputPass performs tone mapping and the sRGB conversion exactly once
    // after the linear scene image and its ambient occlusion have been mixed.
    composer.addPass(new OutputPass())
    this.gtao = gtao
    this.composer = composer
    this.width = this.height = this.pixelRatio = 0
    return composer
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (!this.composer || (this.width === width && this.height === height && this.pixelRatio === pixelRatio)) return
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(width, height)
    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio
  }

  render(): void {
    if (!this.ambientOcclusion || getStore().loading.active || hasVisibleTransparentMeshes(this.scene)) {
      this.disposeComposer()
      this.renderer.render(this.scene, this.camera)
      return
    }
    const composer = this.createComposer()
    // The photo exporter temporarily changes the renderer dimensions; checking
    // them here keeps both ordinary frames and exported photos at the right size.
    this.renderer.getSize(this.size)
    this.resize(this.size.x, this.size.y, this.renderer.getPixelRatio())
    composer.render()
  }

  private disposeComposer(): void {
    if (!this.composer) return
    for (const pass of this.composer.passes) pass.dispose()
    // three r179's GTAOPass.dispose omits these two shader materials.
    this.gtao?.gtaoMaterial.dispose()
    this.gtao?.blendMaterial.dispose()
    this.composer.dispose()
    this.composer = null
    this.gtao = null
  }

  dispose(): void {
    this.unsubscribe()
    this.disposeComposer()
    if (this.scene.environment === this.environment?.texture) this.scene.environment = null
    this.environment?.dispose()
    this.environment = null
  }
}

let pipeline: RenderQualityPipeline | null = null

export function initializeRenderQuality(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
  pipeline?.dispose()
  scene.environmentIntensity = 0.3
  pipeline = new RenderQualityPipeline(renderer, scene, camera)
}

export function renderQualityFrame(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
  if (pipeline) pipeline.render()
  else renderer.render(scene, camera)
}

export function resizeRenderQuality(width: number, height: number, pixelRatio: number): void {
  pipeline?.resize(width, height, pixelRatio)
}

export function disposeRenderQuality(): void {
  pipeline?.dispose()
  pipeline = null
}
