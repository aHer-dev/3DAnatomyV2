// app.js – Einstiegspunkt

import { initDynamicGroupLoading } from './js/bootstrap/initGroupLoader.js';
import { startApp } from './js/bootstrap/startApp.js';
import { applyMuskelfinderPreviewClass, isMuskelfinderPreviewMode } from './js/integration/muskelfinderPreview.js';
import { safeInit } from './js/utils/migration-helper.js';
import { mountReactUI } from './js/ui/react/main.js';

console.log('📦 app.js geladen');
applyMuskelfinderPreviewClass();

document.addEventListener('DOMContentLoaded', async () => {
  console.log('▶️ DOM vollständig geladen – Starte App');
  applyMuskelfinderPreviewClass();

  // React UI früh mounten — Komponenten warten auf Store-Daten via useReactStore.
  // Auch im Preview-Modus mounten: App.tsx rendert dort nur den LoadingScreen.
  mountReactUI();
  if (!isMuskelfinderPreviewMode()) {
    initDynamicGroupLoading();
  }

  const initSuccess = await safeInit();
  if (!initSuccess) {
    console.error('❌ Kritischer Fehler beim Laden der Module');
  }

  startApp();
});
