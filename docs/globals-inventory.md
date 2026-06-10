# window.* Globals — Inventar (Phase 0)

> Abbau kommt in Phase 2 (Zustand-Store). Hier festgehalten damit nichts vergessen wird.

## Produktions-Globals (müssen in Phase 2 ersetzt werden)

| Global | Gesetzt in | Gelesen in | Ersatz (Phase 2) |
|---|---|---|---|
| `window.requestRender` | `bootstrap/startApp.js:178` | `features/visibility.js`, `bootstrap/initResizeHandler.js`, `js/ui/toolbar.js`, `integration/muskelfinderDeeplink.js`, `features/modelLoader-core.js` | `store.subscribe()` + importierbare `requestRender`-Funktion |
| `window.loadingScreenManager` | `bootstrap/startApp.js:669` | (intern) | Store-Slice `loading` oder direkt importiertes Singleton |
| `window.renderOptimizer` | `core/renderer.js:104` | (extern zugänglich) | Direkt importiertes Modul |

## Progress-interne Globals (Zwischenspeicher, kein echter State)

| Global | Datei | Anmerkung |
|---|---|---|
| `window.__dynProgressInit` | `modelLoader/progress.js` | Init-Guard — kann als Modul-Variable leben |
| `window.__dynProgressListener` | `modelLoader/progress.js` | Event-Listener-Referenz — kann als Modul-Variable leben |
| `window.__DISABLE_PROGRESS_OVERLAY` | `bootstrap/startApp.js` | Einmal-Flag — kann als Store-Flag oder Modul-Variable leben |

## Debug-Globals (können in Phase 2 entfernt oder hinter `development.enabled`-Gate gestellt werden)

| Global | Datei | Zweck |
|---|---|---|
| `window.testToggle` | `bootstrap/initGroupLoader.js` | Konsole: Gruppe toggeln |
| `window.testLoad` | `bootstrap/initGroupLoader.js` | Konsole: Gruppe laden |
| `window.testUnload` | `bootstrap/initGroupLoader.js` | Konsole: Gruppe entladen |
| `window.__lifeStats` | `core/lifecycle.js` | Konsole: Lifecycle-Statistik |
| `window.__muskelfinderDeeplink` | `integration/muskelfinderDeeplink.js` | Konsole: Deeplink-Debug |
| `window.testProgress` | `modelLoader/progress.js` | Konsole: Progress-Bar testen |
| `window.progressUtils` | `modelLoader/progress.js` | Konsole: Progress-Hilfsfunktionen |

## Plan Phase 2

1. `requestRender` als normale Import-Funktion aus `core/renderer.js` exportieren
2. `loadingScreenManager` als importierbares Singleton oder Store-Slice
3. `renderOptimizer` als importierbares Modul
4. Alle `window.__*` und `window.progress*` auf Modul-Scope beschränken
5. Debug-Globals unter `if (APP_CONFIG.development.enabled)` oder ganz raus

*Stand: 2026-06-10 · Phase 0 abgeschlossen*
