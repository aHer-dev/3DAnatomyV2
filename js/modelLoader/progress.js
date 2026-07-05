// js/modelLoader/progress.js - PROGRESS BAR FIX

import { getStore } from '../store/useStore.js';

let currentProgress = 0;
let isShowing = false;

/**
 * ✅ VERBESSERTE showLoadingBar mit korrekter Element-Suche
 */
export function showLoadingBar() {
  if (window?.__DISABLE_PROGRESS_OVERLAY || document.getElementById('dynamic-circle-overlay')) return;
  // Mehrere mögliche IDs versuchen
  const possibleIds = [
    'loading-bar',
    'progress-bar',
    'progress-bar-fill'
  ];

  let bar = null;
  let progressText = null;

  // Versuche verschiedene Progress-Bar Elemente zu finden
  for (const id of possibleIds) {
    const element = document.getElementById(id);
    if (element) {
      bar = element;
      break;
    }
  }

  // Fallback: Schaue nach Klassen
  if (!bar) {
    bar = document.querySelector('.progress-bar') ||
      document.querySelector('.loading-bar') ||
      document.querySelector('[class*="progress"]') ||
      document.querySelector('[id*="progress"]');
  }

  // Text-Element suchen
  progressText = document.getElementById('progress-text') ||
    document.querySelector('.progress-text') ||
    document.querySelector('[class*="progress-text"]');

  if (!bar) {
    console.warn('⚠️ Kein Loading-Bar Element gefunden. Erstelle dynamisch...');
    createDynamicProgressBar();
    // Fallback-Bar gilt als "sichtbar"
    currentProgress = 0;
    isShowing = true;
    return;
  }

  // Progress zurücksetzen
  currentProgress = 0;
  isShowing = true;

  // Element sichtbar machen und auf 0% setzen
  if (bar.style) {
    bar.style.display = 'block';
    bar.style.width = '0%';
    bar.style.opacity = '1';
  }

  // Text-Element aktualisieren
  if (progressText) {
    progressText.textContent = '0%';
    progressText.style.display = 'block';
  }

  console.log('📊 Loading Bar gezeigt:', bar.id || bar.className);
}

/**
 * ✅ VERBESSERTE updateLoadingBar mit besserer Element-Erkennung
 */
export function updateLoadingBar(percent) {
    if (window?.__DISABLE_PROGRESS_OVERLAY) return; // ← Legacy-Bar komplett aus
    if (!isShowing) {
      // robust: bei erstem Update automatisch anzeigen
      try { showLoadingBar(); } catch { /* ignore */ }
    }

  // Prozent normalisieren
  const normalizedPercent = Math.max(0, Math.min(100, percent));
  currentProgress = normalizedPercent;

  // Bar-Element finden (wie in showLoadingBar)
  let bar = document.getElementById('loading-bar') ||
    document.getElementById('progress-bar') ||
    document.getElementById('progress-bar-fill') ||
    document.querySelector('.progress-bar') ||
    document.querySelector('.loading-bar') ||
    document.querySelector('[class*="progress"]');

  // Text-Element finden
  let progressText = document.getElementById('progress-text') ||
    document.querySelector('.progress-text') ||
    document.querySelector('[class*="progress-text"]');

  if (bar) {
    // Width setzen
    if (bar.style) {
      bar.style.width = `${normalizedPercent}%`;
    }

    // Alternative: data-Attribut für CSS-basierte Bars
    try { bar.style.setProperty?.('--progress', `${normalizedPercent}%`); } catch { /* ignore */ }
    bar.setAttribute('data-progress', normalizedPercent);

    console.log(`📊 Progress aktualisiert: ${normalizedPercent}%`);
  } else {
    console.warn('⚠️ Progress Bar Element nicht gefunden für Update');
  }

  // Text aktualisieren
  if (progressText) {
    progressText.textContent = `${Math.round(normalizedPercent)}%`;
  }

  // Für den Fallback: Custom Event senden
  document.dispatchEvent(new CustomEvent('progressUpdate', {
    detail: { percent: normalizedPercent }
  }));
  
    // Auto-Close bei 100 %
    if (normalizedPercent >= 100) {
        setTimeout(() => { try { hideLoadingBar(); } catch { /* ignore */ } }, 200);
    }
}

/**
 * ✅ VERBESSERTE hideLoadingBar mit Fade-Out
 */
export function hideLoadingBar() {
  if (!isShowing) return;

  const bars = [
    document.getElementById('loading-bar'),
    document.getElementById('progress-bar'),
    document.getElementById('progress-bar-fill'),
    document.querySelector('.progress-bar'),
    document.querySelector('.loading-bar')
  ].filter(Boolean);

  const progressTexts = [
    document.getElementById('progress-text'),
    document.querySelector('.progress-text')
  ].filter(Boolean);

  // Fade-Out Animation
  bars.forEach(bar => {
    if (bar && bar.style) {
      bar.style.transition = 'opacity 0.3s ease';
      bar.style.opacity = '0';

      setTimeout(() => {
        bar.style.display = 'none';
        bar.style.width = '0%';
        bar.style.opacity = '1'; // Für nächstes Mal zurücksetzen
      }, 300);
    }
  });

  // Text ausblenden
  progressTexts.forEach(text => {
    if (text && text.style) {
      text.style.display = 'none';
    }
  });

  isShowing = false;
  currentProgress = 0;

  console.log('📊 Loading Bar versteckt');

  // Custom Event für Completion
  document.dispatchEvent(new CustomEvent('progressComplete'));
  try { hideDynamicProgressBar(); } catch { /* ignore */ }
}

/**
 * ✅ NEUE FUNKTION: Dynamische Progress Bar erstellen falls keine vorhanden
 */
// Schmale, nicht-blockierende Loading-Bar (unten), Theme: Blau→Orange
function createDynamicProgressBar() {
  if (window?.__DISABLE_PROGRESS_OVERLAY || document.getElementById('dynamic-circle-overlay')) return;
  window.__dynProgressInit = true;

  // Container: ganz unten, klickt nicht in die UI rein
  const overlay = document.createElement('div');
  overlay.id = 'dynamic-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    left: 40px;
    right: 40px;
    bottom: 40px;
    height: 4px;
    z-index: 3001;
    pointer-events: none;
  `;

  // Track
  const track = document.createElement('div');
  track.style.cssText = `
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.35);
  `;

  // Fill
  const fill = document.createElement('div');
  fill.id = 'dynamic-progress-fill';
  fill.style.cssText = `
    width: 0%;
    height: 100%;
    transition: width 250ms cubic-bezier(0.4,0,0.2,1);
    background: linear-gradient(90deg, #4A9EFF, #FF7A4A);
  `;

  // Optional: versteckter Text für Screenreader
  const sr = document.createElement('div');
  sr.id = 'dynamic-progress-text';
  sr.setAttribute('aria-live', 'polite');
  sr.style.cssText = `
    position: absolute; width:1px; height:1px; overflow:hidden; clip:rect(1px,1px,1px,1px);
  `;
  sr.textContent = '0%';

  track.appendChild(fill);
  overlay.appendChild(track);
  overlay.appendChild(sr);
  document.body.appendChild(overlay);

  // Listener nur einmal registrieren
  if (!window.__dynProgressListener) {
    window.__dynProgressListener = (e) => {
      const pct = Math.max(0, Math.min(100, Number(e?.detail?.percent ?? 0)));
      const f = document.getElementById('dynamic-progress-fill');
      const t = document.getElementById('dynamic-progress-text');
      if (f) f.style.width = pct + '%';
      if (t) t.textContent = Math.round(pct) + '%';
    };
    document.addEventListener('progressUpdate', window.__dynProgressListener);
  }
    // Fallback gilt als sichtbar
      isShowing = true;
   currentProgress = 0;

}

// Öffentliche Hilfen, falls du sie brauchst:
function hideDynamicProgressBar() {
  // sauber entfernen + Listener lösen
  const ov = document.getElementById('dynamic-loading-overlay');
  if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  if (window.__dynProgressListener) {
    document.removeEventListener('progressUpdate', window.__dynProgressListener);
    window.__dynProgressListener = null;
  }
  window.__dynProgressInit = false;
}

/**
 * ✅ NEUE FUNKTION: Progress Status abfragen
 */
export function getProgress() {
  return {
    percent: currentProgress,
    isShowing: isShowing
  };
}

/**
 * ✅ NEUE FUNKTION: Progress Bar manuell testen
 */
export function testProgressBar() {
  console.log('🧪 Teste Progress Bar...');

  showLoadingBar();

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    updateLoadingBar(progress);

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => hideLoadingBar(), 1000);
    }
  }, 200);
}


// =============== LOADING SCREEN (Store-Adapter) ===============
// Ehemals zentriertes DOM-Kreis-Overlay — seit S9 rendert React den
// Marken-LoadingScreen (LoadingScreen.tsx, §9.11) aus dem loading-Store-Slice
// (ADR 0008). Diese drei Funktionen bleiben die imperative API der
// Lade-Pipeline; der Event-Kontrakt 'circleOverlayHidden' (startApp wartet
// darauf, bevor der Canvas sichtbar wird) gilt unverändert.

const HIDE_DELAY_MS = 700; // 100 % kurz stehen lassen + CSS-Fade (0.4s) ausklingen
let _hideTimer = null;

/** Ladebildschirm aktivieren (Fortschritt startet bei 0). */
export function showLoadingCircle({ label } = {}) {
  if (getStore().loading.active) return; // schon aktiv
  getStore().showLoading(label);
}

/** Fortschritt setzen (0..100); bei 100 % blendet der Screen aus. */
export function updateLoadingCircle(percent) {
  const store = getStore();
  if (!store.loading.active) return;
  store.setLoadingProgress(percent);

  if (percent >= 100 && !_hideTimer) {
    _hideTimer = setTimeout(() => hideLoadingCircle(), HIDE_DELAY_MS);
  }
}

/** Ausblenden & Signal, dass der Screen vollständig weg ist. */
export function hideLoadingCircle() {
  if (_hideTimer) {
    clearTimeout(_hideTimer);
    _hideTimer = null;
  }
  getStore().hideLoading();
  document.dispatchEvent(new Event('circleOverlayHidden'));
}
// ==================================================================