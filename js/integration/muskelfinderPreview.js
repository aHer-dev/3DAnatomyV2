/*
 * Muskelfinder-Preview-Modus — die STUMME Vorschau.
 *
 * Was er abschaltet (drei Stellen): die gesamte React-UI (`App.tsx` rendert nur den
 * LoadingScreen), `setupInteractions()` und `initRoomSettings()` (`startApp.js`). Was
 * uebrigbleibt, ist ein Standbild: ein Skelett mit einem farbigen Muskel, das man nicht
 * einmal drehen kann. Genau dafuer ist der Modus gebaut — als **eingebettetes Vorschaubild**.
 *
 * Bis 2026-07-14 sprang er allein an `source=muskelfinder` + `muscleKey` an. Der Muskelfinder
 * schickt aber genau diese Kombination bei JEDEM Klick auf „In 3D ansehen" — und zwar per
 * `<a target="_blank">`, also als **Navigation in einen neuen Tab**, nicht als Einbettung.
 * Live nachgemessen: Die Schuelerin landete auf einer Seite mit 0 Knoepfen, 0 Links, ohne
 * Rueckweg, ohne Bedienung — und ohne die **sichtbare CC-BY-Attribution**, die ADR 0005
 * zur Pflicht macht. Der Muskelfinder bettet nichts ein; es gibt dort kein einziges `<iframe>`.
 *
 * Die Vorschau braucht also einen Ausloeser, der „eingebettet" wirklich BEDEUTET:
 * ein fremder Rahmen (`window.self !== window.top`) oder ein ausdrueckliches `preview=1`.
 * Die Muskelfinder-Herkunft allein genuegt nicht mehr.
 */

/** Stecken wir in einem fremden Rahmen? Cross-Origin-Zugriff wirft — dann erst recht. */
function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function readPreviewParams() {
  const params = new URLSearchParams(window.location.search);
  const muscleKey = params.get('muscleKey')?.trim() || '';
  const muscle = params.get('muscle')?.trim() || '';
  const source = params.get('source')?.trim() || '';
  const preview = params.get('preview')?.trim() || '';

  return {
    muscleKey,
    muscle,
    source,
    preview
  };
}

export function isMuskelfinderPreviewMode() {
  const request = readPreviewParams();

  // Ohne Muskel-Kontext aus dem Muskelfinder gibt es nichts vorzuschauen.
  const fromMuskelfinder =
    request.source === 'muskelfinder' && Boolean(request.muscleKey || request.muscle);
  if (!fromMuskelfinder) {
    return false;
  }

  // Die Herkunft allein sagt NICHT, dass die App eingebettet ist. Erst der Rahmen sagt das —
  // oder der Aufrufer, der es ausdruecklich verlangt.
  return request.preview === '1' || isEmbedded();
}

export function applyMuskelfinderPreviewClass() {
  if (!document.body) {
    return false;
  }

  const active = isMuskelfinderPreviewMode();
  document.body.classList.toggle('muskelfinder-preview-mode', active);
  document.body.dataset.muskelfinderPreview = active ? 'true' : 'false';
  return active;
}
