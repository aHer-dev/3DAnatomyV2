// app.js – Einstiegspunkt

import { initDynamicGroupLoading } from './js/bootstrap/initGroupLoader.js';
import { startApp } from './js/bootstrap/startApp.js';
import { applyMuskelfinderPreviewClass, isMuskelfinderPreviewMode } from './js/integration/muskelfinderPreview.js';
import { safeInit } from './js/utils/migration-helper.js';

console.log('📦 app.js geladen');
applyMuskelfinderPreviewClass();

document.addEventListener('DOMContentLoaded', async () => {
  console.log('▶️ DOM vollständig geladen – Starte App');
  applyMuskelfinderPreviewClass();

  if (!isMuskelfinderPreviewMode()) {
    initDynamicGroupLoading();
  }

  const initSuccess = await safeInit();
  if (!initSuccess) {
    console.error('❌ Kritischer Fehler beim Laden der Module');
  }

  startApp();
});
