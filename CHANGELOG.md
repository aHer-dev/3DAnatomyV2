# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format: [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)

---

## [Unreleased]

### Changed (Performance-Untersuchung — Ruckeln bei Kamerabewegung, Layout B)
- **Glas-Blur moderater:** `--glass-blur-strong` 22px → 14px, `--glass-blur` 12px → 10px
  (`css/theme/variables.css`, dokumentierte Abweichung vom Handoff §8) — senkt die
  Pro-Frame-Blur-Kosten der großen, dauerhaft sichtbaren Layout-B-Flächen (Rail + volle
  Sidebar) über dem live rendernden Canvas; optisch bei 82 %-opaken Panels kaum unterscheidbar.
  Auf echter Zielhardware (Schul-Laptop) war das der entscheidende Hebel gegen das Ruckeln.
- **Labels ohne `backdrop-filter`** (`css/components/labels.css`): bei „alle Labels an" sind das
  hunderte DOM-Boxen mit je einem Blur → pro Frame neu komponiert = Ruckeln. Blur entfernt
  (Hintergrund war zu 78 % ohnehin deckend), Farben zugleich auf Marken-Schwarz/Hairline
  statt Alt-Navy. Offener Folgehebel: Label-Renderer läuft in eigener 60-fps-Dauerschleife
  ohne Culling (siehe `js/features/labels.js`).
- **Zwei verworfene Ansätze zurückgebaut** (beide ohne Wirkung auf das Ruckeln, aber mit
  sichtbaren Nebenwirkungen): Blur-Aussetzen während der Bewegung (Grau-Flackern) und
  adaptive Auflösung 0.65× während der Geste (sichtbare Pixelation bei DPR 1).
  Render-Loop/`startApp.js` wieder identisch zum Stand vor dem Redesign.
- **Ursache noch offen** — Diagnose läuft (A/B: UI-Overlay aus vs. an); Draw-Call-Reduktion
  (`BatchedMesh`) als struktureller Kandidat in `docs/BACKLOG.md` (P1) erfasst.

### Changed (Redesign „Variante B" — S4 SearchBar → Sidebar-Kopf)
- **Persistentes Suchfeld statt floatendem Lupe-Icon** (`js/ui/react/components/SearchBar.tsx`):
  Einklapp-Logik + Fixed-Toggle entfernt; die Pille lebt jetzt dauerhaft im Sidebar-Kopf
  (`.shell-searchhost`). `/` fokussiert, Esc leert.
- **§9.2-Styling** (`css/components/search-bar.css`): Pille `padding:13px 15px; radius:14px`,
  Lupe in `--accent`, Fokus-`border --accent-border`, **kein eigener Blur** (sitzt in der
  Glas-Sidebar → spart verschachtelten `backdrop-filter`). Ergebnis-Dropdown als absolut
  positioniertes Panel (Anker `.shell-searchhost`): Header „N Treffer" + „↑ ↓ · Enter"-Hinweis,
  Zeilen mit **Farbpunkt** (`--group-*`) + Name (**Fuzzy-Treffer-Teil in `--accent` 600**) +
  Gruppen-Tag; aktive Zeile `--accent-dim`.
- Treffer-Auswahl lädt bei Bedarf die Gruppe, selektiert + fokussiert → Auto-Switch auf „Info"
  (aus S1/S3). Tastatur ↑/↓/Enter/Esc. Emoji-Spinner `⏳` durch CSS-Spinner ersetzt
  (reduced-motion-fest).
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S3 InfoPanel → Tab „Info")
- **InfoPanel im Tab-Body verankert** (`js/ui/react/components/InfoPanel.tsx`): kein
  `position:fixed`/eigenes Glas/Close-X mehr (Tab-Kontext); `shell-host`-Override in
  `AppShell.tsx` für den Info-Tab abgelöst (direktes Rendern). Auto-Switch auf „Info" bei
  Auswahl war bereits seit S1 verdrahtet.
- **§9.4-Layout** (`css/components/info-panel-react.css`): Titel Sora 600 21px (Latein via
  `getStructureDisplayLabel`) + **Gruppen-Badge** (Farbpunkt 8px + Gruppenname, `background:
  Gruppenfarbe @15%` aus `--group-*`) · **Deckkraft-Slider** (Fill `--accent`, Knob 13px,
  Live-Prozent, jetzt controlled) · **3 gleich breite Aktionen** Ausblenden/Isolieren/Kontext
  (Inline-SVG 19px + Label 11px) · **CTA „Zur Sammlung"** (Outline `--accent-border`). Alt-Navy
  (`#4A9EFF`) in Buttons/Toast auf Marken-Orange-Tokens umgestellt.
- **Farbwahl beibehalten** als sekundärer Block (nicht Teil von §9.4 — Layout-A-Feature, ggf.
  später in Settings/S8 konsolidieren). `ModelActions` bekommt `key={meta.id}` → frischer
  State pro Struktur (behebt latenten Stale-State bei Auswahlwechsel).
- Mobile-`@media` für `.ip-panel` entfernt (Bottom-Sheet kommt in S10); `.msp-*` (S7) unberührt.
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S2 StructureBrowser → Tab „Strukturen")
- **StructureBrowser im Tab-Body verankert** (`js/ui/react/components/StructureBrowser.tsx`):
  kein `position:fixed`/eigenes Glas/Panel-Header mehr — die Komponente füllt jetzt den
  „Strukturen"-Tab (Default-Tab der Sidebar). `shell-host`-Override in `AppShell.tsx` für
  diesen Tab abgelöst (direktes Rendern), `onClose`-Prop entfernt.
- **Gruppen-Zeile auf §9.3-Maße umgezogen** (`css/components/structure-browser.css`):
  Sichtbarkeits-Auge (17px) · Farbpunkt 11px (`--group-*`) · Label (flex 1) · Röntgen-Slider
  (Track `60×4`, Fill in Gruppenfarbe, Knob 11px weiß) · Laden/Entladen-Button. Ausgeblendete
  Gruppe gedimmt (`--text-faint`), aktive (geladen+sichtbar) `background:--accent-dim`, Label 600.
  Farbpunkt + Slider-Fill aus `--group-*`-Tokens (statt Store-Farbnummer); nur Tokens, keine Hardcodes.
- **Sichtbarkeits-Toggle als `role="switch"`** (`aria-checked`) — A11y-Grundlage (Feinschliff S11).
- **Skaliert über 5 Gruppen** hinaus: vertikale Flex-Liste im scrollenden Tab-Body, kein festes Raster.
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S1 App-Shell: Icon-Rail + Tab-Sidebar)
- **Layout B eingeführt** (`js/ui/react/components/AppShell.tsx` + `css/components/app-shell.css`):
  Icon-Rail links (Logo, Auswahl-Werkzeuge, Layer-Toggles Knochen/Muskeln, Labels/Foto/Reset,
  ⚙ unten) + **persistente Tab-Sidebar** rechts (`Strukturen · Sammlung · Info`) mit Such-Kopf
  und Footer-Fuß + Ansichts-Cluster unten mittig. Ersetzt die bisherige Bottom-Toolbar und die
  an den Ecken floatenden Panels (Layout A).
- **Additiver UI-Store-Slice** (`js/store/useStore.ts`): `sidebarTab` (`structures|collection|info`)
  + `openFlyout` (`settings|null`) mit Actions `setSidebarTab`/`openFlyoutExclusive`/`closeFlyout`.
  `App.tsx` hält keinen Panel-`useState` mehr — Navigation läuft über den Store (ADR 0006).
- **Auto-Switch:** Auswahl einer Struktur schaltet die Sidebar automatisch auf „Info", das
  Aufheben zurück auf „Strukturen" (Effekt in der Shell, `selected.root`-gebunden — bewusst
  außerhalb der imperativ genutzten Selection-Actions, ADR 0006).
- **Bestehende Panels** (StructureBrowser/InfoPanel/CollectionPanel) werden **in die Tab-Bodies
  gehostet** (temporärer Positionierungs-Override in `app-shell.css`); ihr pixelgenauer Umbau
  folgt isoliert je Komponente (S2/S3/S6). Multi/Isolation bleiben vorerst kontextuelle Overlays
  (S7), Settings öffnet als Panel via ⚙ (Rail-Flyout in S8).
- **Toten Code entfernt:** `Toolbar.tsx` + `css/components/toolbar.css` gelöscht (Werkzeuge leben
  in der Rail, Kamera-Richtungen im Ansichts-Cluster). Store-Tests +3 (34 grün).
- **Assets:** `af-logo.png` (+ `-white`) nach `public/assets/` für die Rail (Favicon-Set folgt S9).
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S0 Fundament: Tokens, Fonts, Cleanup)
- **Design-Tokens auf Marke „Anatomie Fokus" umgestellt** (`css/theme/variables.css`):
  Navy/Blau → Marken-Schwarz `#0b0c0e` + Orange-Akzent `#ff6a00`, neutralisiertes Glas,
  Sora/Manrope-Font-Stacks, `--stage-gradient`, Hairlines, erweiterte Spacing-/Radius-/
  z-index-Stufen und semantische Gruppenfarben (Drop-in aus dem Design-Handoff).
- **Alte Blau-Token migriert:** `--accent-blue`/`--accent-blue-dim`/`--accent-orange` →
  `--accent`/`--accent-dim` in `info-panel-react.css`, `search-bar.css`,
  `structure-browser.css` (semantischer Primär-Akzent ist jetzt Orange).
- **`base.css`** nutzt Tokens statt Navy-Hardcodes (`--stage-gradient`, `--font-ui`).
- **Fonts self-hosted vorbereitet** (`css/theme/fonts.css`, in `main.css` importiert):
  `@font-face` für Sora (300–800) + Manrope (400–800), `font-display:swap`, lokale
  `/fonts/*.woff2` (CSP `font-src 'self'`). Die 11 `.woff2` (latin-ext-Subset, SIL OFL 1.1)
  liegen unter `public/fonts/` und werden vom Build nach `dist/fonts/` übernommen.
- **Toten Code entfernt:** `css/components/dropdowns.css` gelöscht + Import aus `main.css`.

### Changed (Rebranding — „BlueBody 3D" → „Anatomie Fokus 3D")
- Anzeigename überall auf **Anatomie Fokus 3D** umgestellt: Browser-Titel (`index.html`),
  alle Doku-Titel (AGENTS/CLAUDE.md, ROADMAP, architecture, STARTEN, AGENT_WORKFLOW,
  DESIGN_BRIEF), Export-Signatur im Sammlungs-Export, `name`-Feld der Preset-Dateien,
  Screenshot-Dateiname (`anatomie-fokus-3d-…jpg`) und npm-Paketname (`anatomie-fokus-3d`,
  package.json + lock synchron, `npm ci` grün).
- **Bewusst belassen:** die technische Dateiendung `.bluebody` (Format der gespeicherten
  Sammlungen/Presets) — eine Umbenennung würde bereits exportierte Nutzerdateien
  unlesbar machen; offen als separate Entscheidung.

### Added (Nomenklatur — kuratiertes Latein für sichtbare neue Muskeln)
- **`labels.la` für die 54 neuen, aktuell sichtbaren Muskel-Teile** (Gruppe `muscles`)
  mit geprüftem Terminologia-Anatomica-Latein gesetzt (`scripts/set-muscle-latin.mjs`,
  Schlüssel = FMA-ID). Ersetzt die fehleranfällige Laufzeit-Synthese aus dem Englischen
  durch feste Namen — z. B. „Right medial pterygoid" → `M. pterygoideus medialis dexter`,
  „Right internal oblique" → `M. obliquus internus abdominis dexter`. Seiten-neutral
  gespeichert (App hängt dexter/sinister an); Provenienz über `meta.validation_status =
  'latin_manual'` (menschlich kuratiert, fachliche Stichprobe noch empfohlen). Die
  restlichen 702 neuen Teile liegen in noch deaktivierten Gruppen (Gefäße/Nerven/Hirn)
  und behalten vorerst die synthetisierten Namen — dran, sobald ihre Gruppen freigeschaltet
  werden.
- **Nebenbefund (nicht behoben):** `fma57084`/`fma57086` (stylomandibular ligament) sind
  Bänder, liegen aber in der `muscles`-Gruppe (BP3D-Fehlklassifikation). Korrekt als
  `Lig. stylomandibulare dextrum/sinistrum` benannt; die Gruppen-Umlage bleibt offen.

### Not done (Modell-Pipeline — Komplett-Tausch vorerst zurückgezogen)
- Der Tausch der 2.153 Bestandsteile auf die reprozessierten Meshes wurde **versucht,
  aber wieder zurückgenommen**, weil er die Modelle räumlich zerlegt hat (der Schädel
  schwebte über der Wirbelsäule). **Ursache:** Die alten Live-Modelle tragen eine
  *hand-kalibrierte, uneinheitliche* Skalierung — der Schädel liegt bereits auf
  `SCALE 0.0010844`, der Rumpf/die Wirbelsäule aber auf ~`0.001176` (≈ ×1,0844). Diese
  Mischung ergibt zusammengesetzt ein stimmiges Skelett. Die Blender-Pipeline exportiert
  jedoch **einheitlich** auf `0.0010844`; der Tausch verkleinerte deshalb den Rumpf um
  Faktor 0,922 zum Ursprung hin, ließ den (schon passenden) Schädel aber unverändert →
  Rumpf rutscht nach unten weg. Numerisch nachgewiesen an Frontal/Occipital (ratio 1,00,
  unbewegt) vs. C7/T5/Sakrum/Femur (ratio 0,922, bis −11,6 cm).
- **Konsequenz:** `public/models` + `meta.json`-Modellpfade wurden auf den bekannten,
  ausgerichteten Vor-Tausch-Stand zurückgesetzt (Ausrichtung numerisch verifiziert:
  Skull+Spine wieder bbox-identisch zum Alt-Stand). `scripts/swap-existing-models.mjs`
  bleibt erhalten, wird aber **nicht** angewandt, bis die Pipeline die alte Per-Teil-
  Kalibrierung reproduziert (offener Punkt, siehe Runbook). Der einzige QC-Fehler
  (`fma7163`, 0 Materialien, deaktivierte `skin_hair`-Gruppe) besteht damit wie vor dem
  Tausch weiter — Alt-Zustand, keine neue Regression.

### Fixed (Build — fehlende Rechtsseiten im Deploy)
- **`quellen-lizenzen.html` und `datenschutz.html` fehlten komplett im Produktions-Build**:
  `vite.config.js` hatte nur `index.html` als Rollup-Input, die beiden eigenständigen
  Rechtsseiten wurden nie nach `dist/` gebaut. Da der GitHub-Actions-Workflow exakt
  `dist/` deployt, waren die Footer-/LicenseModal-Links „Quellen & Lizenzen" und
  „Datenschutz" auf der live laufenden Seite tote 404-Links. `build.rollupOptions.input`
  um beide Seiten ergänzt; Build-Output enthält jetzt alle drei HTML-Dateien.

### Fixed (Modell-Pipeline — Ordner-Konsistenz, QC, Lizenz)
- **108 Ordner-Konflikte behoben**: GLB-Dateien, die noch im falschen Gruppen-Ordner
  lagen (`classification.group` in meta.json wich vom physischen Ablageort ab —
  z. B. ein Muskel, der aus `arteries/` geladen wurde), in den korrekten Ordner
  verschoben und `model.variants.draco.path`/`model.asset` in meta.json nachgezogen.
  Betraf u. a. Teile aus aktiven Gruppen (Muskeln, Bänder, Knorpel, Knochen), die im
  StructureBrowser bislang unter der falschen Kategorie auftauchten.
  Neues Skript `scripts/fix-folder-conflicts.mjs` (idempotent, `--dry-run`).
- **QC-Skript** (`scripts/qc-models.mjs`, Phase 6 aus `docs/tasks/model-pipeline-bp3d.md`):
  prüft jede ausgelieferte draco-GLB strukturell (1 Mesh/1 Material, Dreieckszahl > 0,
  Draco-Dekodierung via `@gltf-transform/core` + `draco3dgltf`) und gleicht meta.json
  gegen das Dateisystem ab (fehlende/verwaiste Dateien, FJ/Gruppen-Pfad-Konsistenz).
  Report unter `NEW MODELS/qc-report.json`. Lauf über alle 2.997 Einträge: nur noch
  1 bekannter Inhaltsfehler (`fma7163`, deaktivierte Gruppe `skin_hair`, 0 Materialien
  in der GLB — dokumentiert in `docs/MODELS.md`, nicht automatisch korrigiert).
- **BodyParts3D-Lizenz korrigiert auf CC BY 4.0** ([ADR 0005](docs/decisions/0005-bodyparts3d-lizenz-korrektur.md),
  ersetzt ADR 0003): Das Projekt führte bisher zwei widersprüchliche Lizenzangaben
  parallel — UI (Footer, LicenseModal, `quellen-lizenzen.html`) und 2.232 ältere
  meta.json-Einträge sagten CC BY 4.0, während ADR 0003/CLAUDE.md/AGENTS.md und die
  765 neu integrierten Einträge CC BY-SA 2.1 Japan vorschrieben. Gegenprüfung an zwei
  offiziellen DBCLS-Quellen ergab: CC BY-SA 2.1 Japan war die Lizenz der
  BodyParts3D-Erstveröffentlichung 2008, die aktuelle, vom Rechteinhaber selbst
  betriebene Archiv-Distribution lizenziert die Datenbank heute unter CC BY 4.0.
  Alle 2.997 meta.json-Einträge, `CLAUDE.md`/`AGENTS.md`,
  `scripts/integrate-new-models.mjs` und `quellen-lizenzen.html` auf CC BY 4.0
  vereinheitlicht; ADR 0003 als ersetzt markiert (Historie bleibt erhalten).
- **`docs/MODELS.md` neu**: Provenienz, Pipeline-Schritte, Tool-Versionen,
  „modified"-Hinweis, bekannter Stand (2.232 Bestandsteile noch nicht auf die
  reprozessierten Meshes umgestellt, 765 neue Teile ohne geprüfte Latein-Namen).

### Changed (Einzelansicht — letzte DOM-Chrome-Altlast nach React)
- **Isolations-Aktionsleiste von imperativem DOM nach React portiert** (vollendet ADR 0004:
  „kein paralleles DOM-Chrome mehr"). `isolationView.js` baut keine `document.createElement`-Leiste
  mehr, sondern schreibt den Isolations-Zustand (`isolation: { model, actionBar }`) in den Store;
  die neue `IsolationBar.tsx` rendert die Leiste reaktiv. `InfoPanel` liest den Isolations-Status
  jetzt reaktiv aus dem Store statt über lokalen State — der „Isolieren"-Button aktualisiert sich
  auch, wenn die Isolation über die Leiste verlassen wird. Der custom-`actionBar`-Erweiterungspunkt
  (Muskelfinder-Deeplink „← Zurück zum Muskelfinder") bleibt unverändert nutzbar. Nebenbei behoben:
  `resetApp()` räumt die Isolation jetzt auf (vorher konnte die DOM-Leiste nach Reset hängen bleiben).

### Added (3D-UX)
- **Röntgen-/Transparenz-Regler pro Layer** im StructureBrowser: jeder geladene & sichtbare
  Layer (Knochen, Muskeln …) bekommt einen kompakten Slider, um die ganze Gruppe stufenlos
  durchscheinen zu lassen (z. B. Muskeln auf 30 %, um Knochen darunter zu sehen). Neuer
  Store-State `groupOpacity` + Action `setGroupOpacity` (geklemmt 0–1); das bestehende, bis
  dato ungenutzte `appearance.setGroupOpacity()` persistiert jetzt in den Store und fordert ein
  Render an. `loadGroupByName` wendet gespeicherte Layer-Transparenz nach dem Laden erneut an
  (Konsistenz beim Neuladen); `resetApp()` setzt sie zurück.

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
  `updateDynamicProgress` entfernt.
- **`resourceManager`-Subsystem komplett entfernt**: `js/core/resourceManager.js` gelöscht
  (nutzte verbotenes `localStorage`, preloadete nicht existierende Dateien, war nie verdrahtet).
  In `modelLoader-core.js` die toten Helfer raus (Loader-Pool `getPooledLoader`, Material-Cache
  `getOrCreateMaterial`, das durch `updateModelColors`/`setupBasicLights` abgelöste
  `applyGroupColor`/`ensureMuscleLighting`) inkl. verwaister Konstanten; tote
  `features.resourceManager*`-Flags aus `config.ts`. **Lint damit komplett blank: 0 Fehler, 0 Warnungen.**
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
