// js/bootstrap/startApp.js - IMPORT FIX

import * as THREE from 'three';

import { scene } from '../core/scene.js';
import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { renderer, requestShadowUpdate, freezeShadows, optimizerControls } from '../core/renderer.js';

import {
    defaultAppearance as appearance,
    applyRendererAppearance,
    applyEnvIntensity,
    applyGroupMaterialTweaks
} from '../features/appearance.js';

import { getStore, INITIAL_COLORS, DEFAULT_COLOR } from '../store/useStore.js';
import { getConfig } from '../config/config.js';
import { initializeGroupsFromMeta } from '../data/meta.js';
import { isMuskelfinderPreviewMode } from '../integration/muskelfinderPreview.js';


import { loadGroupByName } from '../features/modelLoader-core.js';
import { setupInteractions } from '../interaction/index.js';
import { setupBasicLights, getLightRig, fitShadowFrustumToScene } from '../lights.js';

import { initStaticAssets } from './initStaticAssets.js';
import { initResizeHandler } from './initResizeHandler.js';
import { initCameraView } from './initCameraView.js';
import { handleMuskelfinderDeeplink } from '../integration/muskelfinderDeeplink.js';
import { processDeeplink, setupDeeplinkSync } from '../integration/deeplink.js';

import { initRoomSettings } from '../features/roomSettings.js';
import { updateModelColors } from '../modelLoader/color.js';

import { updatePerformanceMonitor } from '../debug/performanceMonitor.js';
import { showLoadingCircle, updateLoadingCircle } from '../modelLoader/progress.js';
import { lifecycle } from '../core/lifecycle.js';
import { registerRequestRender } from '../core/renderScheduler.js';

// --- Demand-Rendering: nur rendern wenn sich etwas geändert hat ---
let _needsRender = true;
let _loopKeepAliveFrames = 0;
let _controlsInteracting = false;
let _loopEventsBound = false;
const DEFAULT_RENDER_BURST = 2;
const CONTROL_START_FRAMES = 8;
const CONTROL_SETTLE_FRAMES = 24;
const CONTROL_CHANGE_FRAMES = 4;

function ensureLoopRunning() {
    if (stopLoop) return;

    stopLoop = lifecycle.startLoop(() => {
        const shouldUpdateControls = _controlsInteracting || _loopKeepAliveFrames > 0;
        const controlsChanged = shouldUpdateControls ? !!controls.update?.() : false;

        if (controlsChanged) {
            _needsRender = true;
            _loopKeepAliveFrames = Math.max(_loopKeepAliveFrames, DEFAULT_RENDER_BURST);
        }

        if (_needsRender) {
            _needsRender = false;
            updatePerformanceMonitor?.();
            renderer.render(scene, camera);
        }

        if (_loopKeepAliveFrames > 0) {
            _loopKeepAliveFrames--;
        }

        if (_controlsInteracting || _loopKeepAliveFrames > 0 || _needsRender) {
            return true;
        }

        stopLoop = null;
        return false;
    });
}

export function requestRender(frames = DEFAULT_RENDER_BURST) {
    _needsRender = true;
    _loopKeepAliveFrames = Math.max(_loopKeepAliveFrames, frames);
    ensureLoopRunning();
}
registerRequestRender(requestRender);

// --- zentraler Render-Loop (einzig) ---
let stopLoop = null;
function bindLoopEvents() {
    if (_loopEventsBound) return;
    _loopEventsBound = true;

    lifecycle.on(controls, 'change', () => requestRender(CONTROL_CHANGE_FRAMES));
    lifecycle.on(controls, 'start', () => {
        _controlsInteracting = true;
        requestRender(CONTROL_START_FRAMES);
    });
    lifecycle.on(controls, 'end', () => {
        _controlsInteracting = false;
        requestRender(CONTROL_SETTLE_FRAMES);
    });
}

function startLoop() {
    bindLoopEvents();
    requestRender(CONTROL_START_FRAMES);
}

// Sauberes Cleanup beim Verlassen/Navigieren
window.addEventListener('beforeunload', () => {
    stopLoop?.();
    lifecycle.dispose();
}, { once: true });

/**
 * Hauptinitialisierung der App
 */
export async function startApp() {
    const previewMode = isMuskelfinderPreviewMode();
    window.__DISABLE_PROGRESS_OVERLAY = true;
    showLoadingCircle({ label: '3D-Modell wird geladen …' });
    renderer.domElement.style.visibility = 'hidden';
    updateLoadingCircle(5);   // kleiner Startwert, damit man den Kreis sieht
    initStaticAssets();

    // Loading-Screen wurde entfernt – tolerant bleiben
    const initialScreen = document.getElementById('initial-loading-screen');
    if (initialScreen) {
        initialScreen.style.backgroundColor = getConfig('ui.theme.loadingScreen', '#0B1020');
        initialScreen.style.display = 'flex';
    }

    try {
        // 1) Metadaten
        await initializeGroupsFromMeta();

        // 2) Licht + (optional) HDR
        setupBasicLights(scene);
        await tryApplyEnvironment(renderer);
        updateLoadingCircle(35);

        // 3) Farben aus Config in den State übernehmen (INITIAL_COLORS sind bereits gesetzt)
        const cfgColors = getConfig('ui.colors', null);
        if (cfgColors) {
            Object.entries(cfgColors).forEach(([g, hex]) => getStore().setGroupColor(g, hex));
        }

        // 4) Raum-/Lichteinstellungen initialisieren (React-UI ist bereits gemountet)
        if (!previewMode) {
            initRoomSettings();
        }
        updateLoadingCircle(45);

        // 5) Initiale Gruppen laden

        // Startbild: alles an außer den Muskeln. Die sind mit 465 Dateien / 16 MB
        // die mit Abstand schwerste Gruppe und werden erst auf Wunsch geladen —
        // im Tab „Strukturen" stehen sie deshalb ganz oben.
        await loadGroupByName('bones', { centerCamera: true });
        getStore().setGroupVisible('bones', true);
        updateLoadingCircle(60);

        await loadGroupByName('teeth', { centerCamera: false });
        getStore().setGroupVisible('teeth', true);
        updateLoadingCircle(72);

        await loadGroupByName('cartilage', { centerCamera: false });
        getStore().setGroupVisible('cartilage', true);
        updateLoadingCircle(84);

        await loadGroupByName('ligaments', { centerCamera: false });
        getStore().setGroupVisible('ligaments', true);
        updateLoadingCircle(95);

        // 6) Schatten & Material-Tweaks
        const rig = getLightRig?.();
        if (rig?.key) fitShadowFrustumToScene(rig.key, scene);

        const cfg = appearance;
        applyRendererAppearance(renderer, cfg);
        applyEnvIntensity(scene, cfg);

        applyGroupMaterialTweaks('bones', cfg);
        applyGroupMaterialTweaks('teeth', cfg);
        applyGroupMaterialTweaks('cartilage', cfg);
        applyGroupMaterialTweaks('ligaments', cfg);

        // 7) Farben anwenden
        ['bones', 'teeth', 'cartilage', 'ligaments'].forEach(g => {
            const hex = getStore().colors[g] ?? INITIAL_COLORS[g] ?? DEFAULT_COLOR;
            if (hex != null) updateModelColors(g, hex);
        });

        requestShadowUpdate();
        freezeShadows();

        // 8) Interaktionen & Resize
        if (!previewMode) {
            setupInteractions();
        }

        initResizeHandler();
        initCameraView();

        // Deeplink erst nach dem Standard-Kamera-Setup anwenden, damit
        // der Fokus nicht direkt wieder vom Default-View ueberschrieben wird.
        await handleMuskelfinderDeeplink();
        setupDeeplinkSync();
        await processDeeplink();

        // 9) Render-Loop (zentral)
        // ✅ Jetzt ist wirklich alles fertig → 100 % setzen
        updateLoadingCircle(100);

        // ⏳ Warte, bis das Overlay (mit „Willkommen!“) wirklich weg ist …
        document.addEventListener('circleOverlayHidden', () => {
            // … dann Canvas sichtbar machen und zentralen Loop starten
            renderer.domElement.style.visibility = 'visible';
            startLoop(); // <-- hier statt 'animate()'
        }, { once: true });


    } catch (err) {
        console.error('❌ Fehler beim App-Start:', err);
    } finally {
        // Falls der entfernte Initial-Screen doch existiert, sanft ausblenden
        if (initialScreen) {
            initialScreen.style.opacity = '0';
            setTimeout(() => (initialScreen.style.display = 'none'), 500);
        }
    }
}

// Bestehende Funktionen...
export function enableRenderOptimization() {
    optimizerControls.enable();
}

export function disableRenderOptimization() {
    optimizerControls.disable();
}

export function showRenderStats() {
    const stats = optimizerControls.stats();
    if (stats) console.table(stats);
}

async function tryApplyEnvironment(renderer) {
    try {
        const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();

        const hdrUrl = 'env/default.hdr';
        const hdr = await new RGBELoader().loadAsync(hdrUrl);

        hdr.mapping = THREE.EquirectangularReflectionMapping;

        const envTex = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        pmrem.dispose();

        scene.environment = envTex;
        scene.environmentIntensity = 0.3;
        scene.background = null;

        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // toneMappingExposure wird von initRoomSettings gesetzt – hier nicht überschreiben

    } catch (e) {
        console.warn('Kein HDR geladen - weiter ohne Environment.', e?.message);
        scene.environment = null;
        scene.environmentIntensity = 0;
    }
    updateLoadingCircle(25);   // nur Fortschritt, NICHT schließen
}
