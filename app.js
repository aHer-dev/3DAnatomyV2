// app.js – Einstiegspunkt

import { startApp } from './js/bootstrap/startApp.js';
import { applyMuskelfinderPreviewClass } from './js/integration/muskelfinderPreview.js';
import { mountReactUI } from './js/ui/react/main.js';

console.log('📦 app.js geladen');
applyMuskelfinderPreviewClass();

document.addEventListener('DOMContentLoaded', () => {
  console.log('▶️ DOM vollständig geladen – Starte App');
  applyMuskelfinderPreviewClass();

  // React UI früh mounten — Komponenten warten auf Store-Daten via useReactStore.
  // Auch im Preview-Modus mounten: App.tsx rendert dort nur den LoadingScreen.
  mountReactUI();

  startApp();
});
