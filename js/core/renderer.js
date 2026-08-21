import * as THREE from 'three';
import { createOptimizer, optimizeRender } from './renderOptimizer.js';

const MAX_DESKTOP_PIXEL_RATIO = 1.5;
const MAX_COARSE_PIXEL_RATIO = 1.25;

function prefersCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}

export function getTargetPixelRatio() {
  const devicePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const cap = prefersCoarsePointer() ? MAX_COARSE_PIXEL_RATIO : MAX_DESKTOP_PIXEL_RATIO;
  return Math.min(devicePixelRatio, cap);
}

// Existierendes Canvas nutzen oder neu anlegen
const canvas = document.getElementById('canvas') || (() => {
  const c = document.createElement('canvas');
  c.id = 'canvas';
  document.body.appendChild(c);
  return c;
})();

// Renderer mit Performance-Optionen
//
// `antialias` nur am Desktop. MSAA laesst den Tile-Renderer eines Handys
// (Mali/Adreno) jeden Kachel-Puffer mehrfach aufloesen — das kostet Fuellrate
// genau dort, wo sie ohnehin knapp ist, und bringt bei der gedeckelten
// Aufloesung (1.25x) wenig sichtbaren Gewinn. Die Entscheidung faellt einmal
// beim Anlegen des Kontexts; spaeter ist sie nicht mehr aenderbar.
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !prefersCoarsePointer(),
  alpha: false,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false
});


// Auflösung deckeln, um GPU-/VRAM-Last zu senken
renderer.setPixelRatio(getTargetPixelRatio());

// Startgröße setzen
renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);

// Performance-/Darstellungs-Settings
renderer.sortObjects = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.65;

//shadow?
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Optionaler Optimizer
let optimizer = null;

/**
 * Initialisiert den Optimizer (nach Scene/Camera Setup)
 */
export function initOptimizer(camera, scene) {
  optimizer = createOptimizer(camera, scene, renderer);

  // Auto-Aktivierung für Mobile Geräte
  if (optimizer.isMobileDevice()) {
    console.log('📱 Mobile Gerät erkannt – Optimierung verfügbar');
    // Noch nicht automatisch aktivieren, nur vorbereiten
  }
}

/**
 * Render-Funktion mit optionaler Optimierung
 */
export function renderWithOptimization(scene, camera) {
  if (optimizer && optimizer.enabled) {
    optimizeRender();
  }
  renderer.render(scene, camera);
}

/**
 * Standard-Render (Rückwärtskompatibilität)
 */
export function render(scene, camera) {
  renderer.render(scene, camera);
}

// Schatten-Helfer (exportieren)
export function requestShadowUpdate() {
  // 1 Frame lang Shadow-Map neu rendern
  renderer.shadowMap.needsUpdate = true;
}
export function freezeShadows() {
  // Schatten-Map nicht jedes Frame neu berechnen
  renderer.shadowMap.autoUpdate = false;
}
export function thawShadows() {
  // vor großen Umbauten kurz aktivieren
  renderer.shadowMap.autoUpdate = true;
}

// Resize handling moved to centralized initResizeHandler.js


export const optimizerControls = {
  enable: () => optimizer?.enable(),
  disable: () => optimizer?.disable(),
  stats: () => optimizer?.getStats(),
  auto: () => optimizer?.autoOptimize()
};

export { renderer };
