# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format: [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)

---

## [Unreleased]

### Removed (Aufräumen / Hygiene — tote Dateien, Lint, Docs)
- **15 nicht importierte tote CSS-Dateien gelöscht** (`base/*`, `components/animations.css`,
  `components/ui-elements.css`, `controls/{dropdowns,inputs,set-list,sidebar,sliders}.css`,
  `layout/{canvas,layout,responsive,splashscreen}.css`, `utilities/utilities.css`) — einziger
  CSS-Einstieg ist `css/main.css`.
- **4 tote JS-Module gelöscht**: `js/core/lodManager.js`, `js/features/groups.js`,
  `js/features/groupToggle.js`, `js/bootstrap/initSplashScreen.js` (nirgends importiert).
- **Lint: 10 Fehler → 0** (`npm run lint` grün): leere `catch`-Blöcke kommentiert, ungenutzte
  `catch (error)`-Bindings entfernt, irreguläres Leerzeichen (U+202F) gefixt, tote Imports
  raus (`THREE` in selection/visibility, `setModelVisibility`, `modelPath`), tote Funktion
  `updateDynamicProgress` entfernt. Verbleibend: 5 `no-unused-vars`-Warnungen für noch nicht
  verdrahteten `resourceManager`-/Loader-Pool-WIP in `modelLoader-core.js` (bewusst behalten).
- **`docs/architecture.md`** auf den realen Ist-Stand gebracht (Schichten, Datei-Struktur,
  Store-/Aktions-Kommunikation, meta.json-Hinweis zu leeren region/system-Feldern).

### Changed (UI-Konsolidierung — Chrome vollständig in React, Hamburger entfernt)
- **DOM-Hamburger-Menü (`#menu-icon` → `#controls`) und DOM-Footer gelöscht** —
  `index.html` enthält nur noch Canvas + React-Mountpunkt. Siehe ADR 0004.
- **Neue React-Komponenten**:
  - `SettingsPanel.tsx` — Raum (Beleuchtung/Helligkeit/Farbe), Farben zurücksetzen,
    Preset-Bibliothek, Tastenkürzel; Zahnrad-Button („Optionen") in der Toolbar
  - `Footer.tsx` + `LicenseModal.tsx` — Lizenz/Attribution, Quellen, Datenschutz,
    Lernen-Link; löst die bisherige dreifache Rechtliches-Doppelung auf
- **Neue DOM-freie Feature-Module** (portierte 3D-/Daten-Logik, kein Reinvent):
  - `features/roomSettings.js` (aus `ui-room.js`) — `applyLighting`, `applyRoomColor`,
    `initRoomSettings`; in `startApp` statt `setupUI` aufgerufen
  - `features/presets.js` (aus `ui-presets.js`) — `loadPresetManifest`, `applyPreset`
- **`ui-reset.js` entkernt**: `resetColors` exportiert (für SettingsPanel), toter
  Light-Reset (`resetToDefaultView`) + DOM-Wiring (`setupResetUI`) entfernt
- **`photoMode.js` entkoppelt**: kein `hideControlsPanel`-Import mehr, totes
  `initPhotoMode` (Legacy-Button) entfernt; `enterPhotoMode` bleibt
- **Gelöschte Legacy-Module**: `ui-init.js`, `ui-controls.js`, `ui-room.js`,
  `ui-presets.js`, `license.js`, `licenseContent.js`
- **Tote CSS entfernt**: `components/presets.css`, `layout/footer.css`,
  `controls/buttons.css` gelöscht; `#menu-icon`/`#controls`/`#room-controls`-Regeln
  aus `layout/app.css`, `#btn-photo-mode` aus `photo-mode.css`, Preview-Selektoren
  in `panels.css` bereinigt; neue `components/settings-panel.css`. CSS-Bundle −~13 KB.
- Build: 110 → 106 Module; Typecheck sauber, 29 Tests grün

### Removed (startApp.js — toter Loading-Screen- & Render-Opt-Code)
- `LoadingScreenManager`-Klasse + Instanz + `startAppWithLoadingScreen`/
  `loadGroupWithIndicator`/`loadMultipleGroups` (nirgends aufgerufen)
- Render-Opt-Cluster (`RENDER_OPTIMIZATION`, `renderOptimizer`, `useOptimization`,
  `loadOptimizer`, `renderFrame`) — nie verdrahtet, Loop nutzt `renderer.render`
- verwaiste Imports + leerer `if`-Block; `startApp.js` jetzt lint-sauber

### Added (Modell-Pipeline — BodyParts3D-Neuaufbereitung, Vorbereitung)
- **`scripts/sort-new-models.mjs`**: sortiert 3.260 Roh-OBJ (`NEW MODELS/`) in Gruppen-Ordner
  (`NEW MODELS/sorted/<gruppe>/`), Zuordnung über meta.json (FMA/FJ) vor Ordnerlage; volle
  Dateinamen behalten. Reports: `_manifest.json`, `REVIEW.md` (766 heuristisch), `_conflicts.json`
  (129 im aktuellen App-Bestand fehlsortierte Modelle).
- **`scripts/blender/process-models.py`**: headless Aufbereitung Voxel-Remesh→Smooth→Decimate→
  1 Material→GLB-Export (Tiers `hifi`+`draco`). Verifizierter Transform `(x,z,−y)·0.001`,
  röhrenförmige Gruppen ohne Remesh, Voxelgröße relativ zur Objektgröße.
- **`scripts/draco-compress.mjs`** + devDep `@gltf-transform/cli`: Draco-Nachschritt für den
  `draco/`-Tier (Blender hier ohne Draco-Lib).
- **`scripts/blender/import_group.py`**: eine Gruppe zur Sichtprüfung in Blender laden.
- **Docs**: docs/tasks/model-pipeline-bp3d.md (Briefing),
  docs/tasks/blender-pipeline-runbook.md (Runbook).
- `.gitignore`: `NEW MODELS/` (Rohdaten, groß + CC BY-SA-Quelle).

### Removed (Phase 3h — Hamburger-Menü-Legacy & toter Code endgültig raus)
- **Tote UI-Dateien gelöscht** (zielten auf nicht mehr existierende DOM-Elemente):
  - `js/ui/ui-export.js` — `#btn-export-set`/`#input-import-set` gab es nicht mehr; der `.bluebody`-Export im `CollectionPanel` ersetzt es
  - `js/ui/ui-loading.js` — Ladefarbe-Picker zielte auf entferntes `#initial-loading-screen`
- **`js/ui/ui-reset.js` entkernt** (toter Code entfernt):
  - `resetAllButtonStates()` (manipulierte entfernte `#btn-load-*`-Buttons)
  - `resetGroupToggleStates()` (`resetGroupStates`-Event hatte keinen Listener)
  - `debugResetState()` (Debug-Logging + verbotenes `window.groupToggleLoadedGroups`-Global)
  - `syncToolbarLayerButtons()`-Aufruf (No-op) + `${groupName}-color`-DOM-Reset (Elemente entfernt)
  - veraltete „Anleitung"/App-Guide-Modal (verwies auf längst entfernte Menü-Buttons) — kommt als echtes Onboarding in Phase 5 wieder
  - ungenutzter Import `registerPickables`
- **`js/ui/toolbar.js`**: No-op-Exports `syncToolbarLayerButtons()` und `setupToolbar()` entfernt (kein Consumer)
- **`js/utils/anatomyLabels.js`**: totes `renderStructureLabel()` + `splitStructureLabel()` + `LATIN_SIDE_SUFFIX_PATTERN` entfernt (kein Aufrufer mehr)
- **Tote CSS entkernt**:
  - `css/components/panels.css`: 621 → 165 Zeilen (app-guide, `#info-panel`, `.mf-detail-*`, `#edit-controls`, `.edit-btn-*`, `.multi-select-*`, `#multi-edit-*` — alles aus gelöschtem DOM)
  - verwaiste Dateien gelöscht: `css/components/info-panel.css`, `css/controls/edit-controls.css`, `css/controls/controls-panel.css` (nirgends importiert)
  - `css/controls/buttons.css`: `#btn-app-guide`-Styles raus
  - `css/layout/responsive.css`: toter `#info-panel`-Mobile-Block raus
- **`js/ui/ui-init.js`**: `setupExportUI`/`setupLoadingUI` aus dem Setup-Chain entfernt
- **`index.html`**: leeres `#room-dropdown-content` entfernt
- Module: 112 → 110, Typecheck sauber, 29 Tests grün

### Changed (Phase 3g — Sammlung in React + Legacy-DOM-Aufräumen)
- **React `CollectionPanel`** (`js/ui/react/components/CollectionPanel.tsx`) ersetzt die DOM-basierte Sammlung:
  - Liest `collection` direkt aus dem Store (reaktiv) — behebt den Bug, dass hinzugefügte Strukturen nicht in der Liste erschienen
  - Gruppierte Liste mit Einzeln-Entfernen, Klick-zum-Fokussieren, Anzahl-Badge in der Toolbar
  - „Nur Sammlung anzeigen", „Leeren", „Export"/„Import" (`.bluebody` via `collectionManager`)
  - Toolbar-Button „Sammlung" (gegenseitig ausschließend mit „Strukturen")
- **`js/features/collectionView.js`** (neu) — DOM-freie Kernlogik: `showCollectionInScene()`, `clearCollectionAndRestore()`
- **Tote Legacy-DOM-Dateien gelöscht** (vollständig durch React ersetzt):
  - `js/interaction/infoPanel.js` → React `InfoPanel`
  - `js/interaction/editPanel.js` → React `InfoPanel`/`ModelActions`
  - `js/ui/submenu/` (7 Dateien) → React `StructureBrowser`
  - `js/ui/recentColors.js` → In-Memory-Farben im `InfoPanel` (kein localStorage)
  - `js/ui/ui-set.js` → React `CollectionPanel` + `collectionView.js`
  - `js/ui/ui-color.js` → Container `#color-controls` existierte nicht mehr (tot)
  - `js/utils/modelData.js` → einziger Consumer (`ui-set.js`) entfernt
- **`js/ui/ui-collection-export.js`** vom DOM entkoppelt: kein Auto-Init/Button-Injection mehr, `setupUI`/`createAndInsertButtons` entfernt; React ruft `showSaveModal()`/`importCollection()` direkt auf
- **Verkabelung gesäubert**: `startApp.js`, `core/controls.js`, `interaction/index.js`, `ui-init.js`, `ui-reset.js`, `ui-presets.js`, `muskelfinderDeeplink.js` — tote `hideInfoPanel`/`showInfoPanel`-Aufrufe und der `#info-panel`-`controls.change`-Listener entfernt (React reagiert auf Store)
- **Tote HTML/CSS entfernt**: `#submenu-container`, `#set-list`, `#btn-show-set`/`#btn-clear-set`; `set-list.css` gelöscht, `#btn-*-set`-Styles aus `buttons.css`, `#set-list`/`#submenu-container`-Regeln bereinigt
- Typecheck bereinigt: `Toolbar.tsx` useEffect-Cleanup gibt jetzt `void` zurück; `useStore.test.ts` THREE-Typ-Import ergänzt
- Module: 125 → 112 (Build)

### Added (Phase 4d-f — Ghost-Kontext, Labels/Pins, Touch)
- `js/features/ghostContext.js` — Ghost-Kontext-Modus: Kontext-Button im InfoPanel macht alle anderen Strukturen transparent (0.08), ausgewählte bleibt opak; zweiter Klick stellt Ausgangszustand wieder her
- `js/features/labels.js` — Struktur-Beschriftungen via `CSS2DRenderer`: lazy init, eigene rAF-Schleife solange aktiv, Labels-Button im Toolbar
- `css/components/labels.css` — `.structure-label` Glassmorphism-Stil für Pins
- `css/layout/canvas.css` — `touch-action: none` am Canvas (verhindert Browser-Scroll-Interferenz mit OrbitControls)
- `css/components/info-panel-react.css` — `.ip-btn--active` Stil für aktive Buttons

### Added (Phase 4c — Deep-Links + Hover-Tooltip)
- `js/integration/deeplink.js` — URL-Deep-Links:
  - `?s=femur` → Struktur laden, hervorheben, Kamera fokussieren (ID / Latein / Deutsch)
  - `?view=anterior` → Kameraansicht direkt beim Start setzen
  - URL wird bei jeder Auswahl automatisch per `history.replaceState` aktualisiert (teilbare Links)
- `js/interaction/hoverTooltip.js` — Strukturname als Tooltip bei Hover:
  - RAF-throttled `pointermove` → `pickAt` → `getStructureDisplayLabel`
  - Verschwindet bei `pointerleave` und `pointerdown`
- `css/components/tooltip.css` — `position: fixed` für korrekte Koordinaten

### Added (Phase 4a — Kamera-Fokus-Animation + Doppelklick-Isolierung)
- Klick auf Struktur → sanfter Kameraflug zur Struktur (`focusOnObject` → `animateCameraTo`, 600 ms Ease-In-Out)
- Suchauswahl → Kamera fliegt ebenfalls zur gefundenen Struktur
- Doppelklick auf Struktur → `enterIsolatedView` (Rest ausblenden)

### Added (Phase 3f — React Toolbar + Totes Code entfernt)
- `js/ui/react/components/Toolbar.tsx` — Toolbar vollständig in React:
  - Tool-Buttons (Auswählen / Mehrfach / Rechteck / Fokus) mit Expand-Toggle
  - Layer-Buttons (Knochen / Muskeln) mit reaktivem Ladezustand aus dem Store
  - Kamera-Richtungs-Panel (Ant / Post / Li / Re / Kran / Kaud) — immer sichtbar
  - Reset- und Foto-Buttons; renutzt bestehende `toolbar.css` Klassen
- `js/ui/toolbar.js` — auf reine JS-Logik reduziert (kein DOM mehr): 328 → 40 Zeilen
- `js/ui/photoMode.js` — `enterPhotoMode` jetzt exportiert
- `js/ui/ui-search.js` — gelöscht (durch React SearchBar ersetzt)
- `js/ui/ui-setupGroupLoadEvents.js` — gelöscht (btn-load-* Buttons entfernt)
- `js/bootstrap/startApp.js` — `placeExtrasIntoDropdown` entfernt

### Added (Phase 3d — MultiSelectPanel React + HTML-Cleanup)
- `js/ui/react/components/MultiSelectPanel.tsx` — React-Panel für Mehrfachauswahl:
  - Liest `multiSelected` Set direkt aus dem Zustand-Store (reaktiv)
  - Liste aller ausgewählten Modelle mit Einzeln-Entfernen-Button
  - Batch-Farb-Picker und Opazitäts-Slider für alle ausgewählten Modelle gleichzeitig
  - Gibt `null` zurück wenn die Auswahl leer ist (kein leeres DOM-Element)
- `css/components/info-panel-react.css`: `.msp-panel` und zugehörige Klassen ergänzt
- `js/ui/react/App.tsx`: `MultiSelectPanel` eingebunden
- **HTML-Cleanup** — ersetzte Elemente entfernt:
  - 14 `<div class="dropdown"><button id="btn-load-*">` Blöcke aus `#controls` entfernt (React `StructureBrowser` übernimmt)
  - `<div id="info-panel">` entfernt (React `InfoPanel` übernimmt)
- `js/interaction/index.js`: `refreshMultiPanel` ruft nicht mehr `showMultiSelectPanel` auf; React-Panel reagiert direkt auf Store
- `js/ui/ui-init.js`: `setupSearchUI`-Import und -Aufruf entfernt (React `SearchBar` übernimmt)

### Changed (Phase 3c — InfoPanel Actions + kein Doppel-Panel)
- `InfoPanel` erhält Aktions-Controls: Farb-Picker, Opazitäts-Slider, Ausblenden, Isolieren
- `interaction/index.js`: ruft bei Einzelauswahl nicht mehr `showInfoPanel` auf — React InfoPanel übernimmt vollständig; `showMultiSelectPanel` / `hideInfoPanel` bleiben für Mehrfachauswahl

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
