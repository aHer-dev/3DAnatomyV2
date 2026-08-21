import type { AnatomyGroup } from '../types/index.js'

interface AppConfig {
  development: {
    enabled: boolean
    verbose: boolean
    showWarnings: boolean
  }
  features: {
    performanceMonitor: boolean
    performanceConfig: {
      enabled: boolean
      showFPS: boolean
      showMemory: boolean
      showDrawCalls: boolean
      autoWarnings: boolean
      position: string
    }
  }
  paths: {
    models: string
    textures: string
    draco: string
    data: string
    assets: string
  }
  performance: {
    batchSize: number
    maxModelsInMemory: number
    maxFPS: number
    adaptiveQuality: boolean
    /** Gruppen aus gepackter <group>.bundle.glb laden, falls vorhanden (ADR 0009) */
    useBundles: boolean
    /** Gruppen als EIN BatchedMesh rendern (ADR 0007 Phase 1, nur Messung — Interaktion aus) */
    batchedGroups: boolean
    memoryWarningThreshold: number
    autoGarbageCollection: boolean
    networkOptimization: {
      maxConcurrentRequests: number
      retryAttempts: number
      timeout: number
      preloadCritical: boolean
    }
  }
  ui: {
    mobileBreakpoint: number
    animationDuration: number
    debounceDelay: number
    showLoadingBar: boolean
    splashScreenDelay: number
    showDebugPanel: boolean
    debugPanelPosition: string
    theme: {
      background: string
      loadingScreen: string
    }
    cameraDefaults: {
      position: [number, number, number]
      target: [number, number, number]
    }
    colors: Partial<Record<AnatomyGroup | 'default', number>>
  }
}

export const APP_CONFIG: AppConfig = {
  development: {
    enabled: false,
    verbose: false,
    showWarnings: true,
  },

  features: {
    performanceMonitor: false,
    performanceConfig: {
      enabled: true,
      showFPS: true,
      showMemory: true,
      showDrawCalls: true,
      autoWarnings: true,
      // Unten rechts sitzt auf dem Handy die Marken-Kugel. Oben links ist der
      // einzige Rand, an dem das Overlay nichts verdeckt, was man antippen will.
      position: 'top-left',
    },
  },

  paths: {
    models: 'models',
    textures: 'textures',
    draco: 'draco',
    data: 'data',
    assets: 'assets',
  },

  performance: {
    batchSize: 6,
    maxModelsInMemory: 100,
    maxFPS: 60,
    adaptiveQuality: true,
    useBundles: true,
    batchedGroups: false,
    memoryWarningThreshold: 80,
    autoGarbageCollection: true,
    networkOptimization: {
      maxConcurrentRequests: 6,
      retryAttempts: 3,
      timeout: 30000,
      preloadCritical: true,
    },
  },

  ui: {
    mobileBreakpoint: 768,
    animationDuration: 300,
    debounceDelay: 150,
    showLoadingBar: true,
    splashScreenDelay: 500,
    showDebugPanel: false,
    debugPanelPosition: 'bottom-right',
    theme: {
      background: '#0d0d0d',
      loadingScreen: '#0B1020',
    },
    cameraDefaults: {
      position: [-0.5, 1.3, 1.3],
      target: [0.0, 0.9, 0.0],
    },
    colors: {
      default: 0xcccccc,
      bones: 0xe8e6dd,
      teeth: 0xe8e6dd,
      muscles: 0xe85861,
      nerves: 0xffd166,
      cartilage: 0x9FC6E5,
    },
  },
}

/**
 * Erkennt Geraete/Verbindungen, denen das volle Profil zu viel ist.
 * `deviceMemory` deckelt Chrome bei 8 — der Wert taugt als Untergrenze, nicht
 * als Mass.
 */
export function isConstrainedDevice(): boolean {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string }
    deviceMemory?: number
  }
  const slowConnection =
    nav.connection?.effectiveType === 'slow-2g' || nav.connection?.effectiveType === '2g'
  const limitedMemory = nav.deviceMemory !== undefined && nav.deviceMemory < 4
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  return slowConnection || limitedMemory || mobile
}

/**
 * Schreibt das sparsame Profil in die aktive Konfiguration und meldet, ob es
 * gegriffen hat. Einmal beim Start aufrufen, VOR dem ersten Laden.
 *
 * Schreibt bewusst in `APP_CONFIG` statt eine Kopie zurueckzugeben: `getConfig()`
 * liest aus genau diesem Objekt. Der Vorgaenger `getOptimalConfig()` gab eine
 * Kopie zurueck, wurde nirgends aufgerufen und war damit wirkungslos — das
 * sparsame Profil hat auf keinem Handy je gegriffen.
 */
export function applyDeviceProfile(): boolean {
  if (!isConstrainedDevice()) return false

  APP_CONFIG.performance.batchSize = 3
  APP_CONFIG.performance.maxModelsInMemory = 50
  APP_CONFIG.performance.networkOptimization.maxConcurrentRequests = 3
  return true
}

export function getConfig<T = unknown>(path: string, fallback: T | null = null): T | null {
  try {
    const keys = path.split('.')
    let value: unknown = APP_CONFIG
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key]
      } else {
        console.warn(`⚠️ Config "${path}" nicht gefunden, verwende Fallback:`, fallback)
        return fallback
      }
    }
    return value as T
  } catch (error) {
    console.warn(`⚠️ Config-Fehler bei "${path}":`, error)
    return fallback
  }
}

export function setConfig(path: string, value: unknown): boolean {
  try {
    const keys = path.split('.')
    let target: Record<string, unknown> = APP_CONFIG as unknown as Record<string, unknown>
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {}
      }
      target = target[key] as Record<string, unknown>
    }
    target[keys[keys.length - 1]] = value
    return true
  } catch (error) {
    console.error(`❌ Config-Fehler bei "${path}":`, error)
    return false
  }
}

export function isFeatureEnabled(featureName: string): boolean {
  try {
    const mainSwitch = getConfig<boolean>(`features.${featureName}`, false)
    const featureConfig = getConfig<boolean>(`features.${featureName}Config.enabled`, true)
    const enabled = Boolean(mainSwitch) && Boolean(featureConfig)
    if (getConfig<boolean>('development.verbose', false)) {
      console.log(`🎛️ Feature "${featureName}": ${enabled}`)
    }
    return enabled
  } catch {
    return false
  }
}

export function getDevHelpers() {
  if (!getConfig<boolean>('development.enabled', false)) return null

  return {
    showConfig: () => console.table(APP_CONFIG),
    enableFeature: (name: string) => setConfig(`features.${name}`, true),
    disableFeature: (name: string) => setConfig(`features.${name}`, false),
    getPerformanceConfig: () => getConfig('performance', {}),
    listActiveFeatures: () => {
      const features = getConfig<Record<string, unknown>>('features', {}) ?? {}
      return Object.entries(features)
        .filter(([key, val]) => val === true && !key.endsWith('Config'))
        .map(([key]) => key)
    },
  }
}

export default APP_CONFIG
export const PATHS = APP_CONFIG.paths
export const PERFORMANCE = APP_CONFIG.performance
export const UI_CONFIG = APP_CONFIG.ui
