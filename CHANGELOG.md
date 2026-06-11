# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format: [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)

---

## [Unreleased]

### Added (Phase 3b — SearchBar + InfoPanel)
- `fuse.js` installiert für Fuzzy-Suche
- `js/ui/react/components/SearchBar.tsx` — floating Suche (Top-Center):
  - Fuse.js-Index über alle `metaById`-Einträge (Latein × 3, Deutsch × 2, Englisch × 1)
  - Tastaturnavigation (↑/↓/Enter) + `/`-Shortcut zum Fokussieren
  - Bei Auswahl: Gruppe laden → Modell suchen → `highlightModel` + `setSelection`
- `js/ui/react/components/InfoPanel.tsx` — React-Panel ersetzt DOM-basiertes `#info-panel` (Einzelauswahl):
  - Liest `selected.meta` aus dem Zustand-Store (reagiert auf Store-Änderungen)
  - Zeigt Latein/Deutsch-Label, Gruppen-Badge, Beschreibung
  - Für Muskeln: lädt Muskelfinder-Details async (Ursprung, Ansatz, Innervation, Funktion)
  - Slide-in-Animation; Swipe-down zum Schließen auf Mobile
- `interaction/index.js`: schreibt `meta` in den Store bei Einzelauswahl (war vorher null)
- `css/components/search-bar.css`, `css/components/info-panel-react.css` — Glassmorphism-Stil

### Added (Phase 3a — React Shell + StructureBrowser)
- React 19 + `@vitejs/plugin-react` installiert; Vite-Config und `tsconfig.json` (jsx: react-jsx) erweitert
- `<div id="ui-root">` Overlay-Mount in `index.html` (pointer-events: none am Root, Kinder schalten selektiv ein)
- `js/ui/react/main.tsx` — `mountReactUI()` Einstiegspunkt, aus `app.js` nach DOM-Ready aufgerufen
- `js/ui/react/useReactStore.ts` — Zustand Vanilla-Store via `useStore`-Hook an React gebunden
- `js/ui/react/groupLabels.ts` — Deutsche Labels + kanonische Sortierung für Anatomie-Gruppen
- `js/ui/react/App.tsx` — Root-Komponent (Shell für alle Panel-Komponenten)
- `js/ui/react/components/StructureBrowser.tsx` — erste React-Komponente: Gruppen laden/entladen, Sichtbarkeit, Farbindikator, Modell-Anzahl, `useTransition` für non-blocking Lade-Ops
- `css/components/structure-browser.css` — Glassmorphism-Stil passend zum bestehenden Design-System
- 6 neue Tests für `groupLabels` (Labels, Sortierung, Immutabilität)

### Changed (Phase 2c-4)
- Alle custom `window.*`-Globals eliminiert — keine globale Verschmutzung mehr
  - `window.requestRender` → neues Modul `js/core/renderScheduler.js` (Late-init-Singleton)
    - `startApp.js` registriert die echte Implementierung via `registerRequestRender()`
    - 8 Consumer-Dateien importieren `requestRender` direkt statt über `window`
  - `window.renderOptimizer` → `optimizerControls` als benannter Export aus `renderer.js`
  - `window.loadingScreenManager` → entfernt (war nie von App-Code gelesen)
  - `window.testToggle/testLoad/testUnload` → entfernt (Debug-Krücken, Funktionen weiter exportiert)
  - `window.testProgress/progressUtils` → entfernt (alle Funktionen bereits als ES-Module exportiert)

### Changed (Phase 2c-3)
- Alle verbleibenden 19 Consumer-Dateien von `state.js` auf Zustand-Store migriert
  - `js/interaction/`: boxSelect, highlightModel, multiSelect, index, infoPanel, isolationView, editPanel
  - `js/ui/`: toolbar, submenu/index, ui-color, ui-loading, ui-reset, ui-search, ui-export, ui-presets, ui-set, ui-collection-export
  - `js/utils/modelData.js`, `js/integration/muskelfinderDeeplink.js`
- `highlightModel.js` erhält modul-lokale Variable `_prev` (korrekte Reset-Logik da raycaster.js setSelection vor Callback ausführt)
- `infoPanel.js` importiert `clearHighlight()` aus highlightModel statt direkte State-Mutation
- `ui-loading.js` verwendet `getConfig()` statt veralteten defaultSettings
- `ui-reset.js` ersetzt alle dispatch-Calls durch direkte Store-Aktionen
- `state.js` gelöscht — Store vollständig auf Zustand migriert

## [0.1.0] — 2026-06-10

### Added
- ROADMAP.md: Phasenplan Phase 0–6 mit Zielgruppen-Fokus Physio/Ergo/Logopädie
- AGENT_WORKFLOW.md: Agenten-Arbeitsweise, Kreuz-Review-System, Task-Templates
- AGENTS.md: Kanonische Agenten-Regeln (CLAUDE.md → Symlink)
- docs/decisions/, docs/tasks/, .claude/rules/ Verzeichnisse angelegt
- docs/architecture.md: Architektur-Überblick (Platzhalter — wächst mit Phase 1/2)
- Erste ADRs: Stack-Wahl (0001), Zustand als Bridge (0002), BodyParts3D-Lizenz (0003)
