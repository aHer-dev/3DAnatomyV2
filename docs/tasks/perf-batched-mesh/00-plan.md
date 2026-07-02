# Perf: Draw-Call-Reduktion via BatchedMesh — Phasenplan

> Grundlage: ADR 0007. Ziel: „alle Muskeln flüssig" auf Schul-Laptops, indem ~1200
> Einzel-Mesh-Draw-Calls auf ~1 pro Gruppe fallen. Three r179 hat `BatchedMesh`.
> **Feature-Flag** `perf.batchedGroups` (Config), Legacy-Pfad bleibt bis Feature-Parität.

## Nicht-Ziele
- Kein Umbau des Store-Kontrakts, keiner der öffentlichen Feature-APIs (select/highlight/
  setGroupOpacity/ghost/isolation/color/visibility) ändert seine Signatur.
- Kein React-Three-Fiber. Keine neue State-Library. Kein Eingriff ins UI-Redesign (S2–S11).
- Keine Änderung der Modell-Dateien/Pipeline.

## Betroffene Bestands-Dateien (Kartierung)
- Laden: `js/features/modelLoader-core.js` (`loadSingleModel`/`loadModels`),
  `js/bootstrap/initGroupLoader.js` (`unloadGroupSilent`).
- Picking: `js/core/raycaster.js`, `js/features/selection.js` (Pickable-Set/`raycast`-Override).
- Highlight: `js/interaction/highlightModel.js`, `js/interaction/multiSelect.js`.
- Opacity/Material: `js/features/appearance.js` (`setModelOpacity`/`setGroupOpacity`),
  `js/features/ghostContext.js`, `js/interaction/isolationView.js`, `js/features/visibility.js`.
- Farbe: `js/modelLoader/color.js`.
- Store: `js/store/useStore.ts` (`groups` hält heute Roots; braucht zusätzlich Batch-Handles).

## Phasen (jede Phase endet grün: test + build, App bedienbar)

### Phase 1 — Batch-*Rendering* hinter Flag + Messung  ⟵ START, de-risking
- Neues Modul `js/core/groupBatch.js`: `GroupBatch` kapselt ein `BatchedMesh` pro Gruppe
  (Geometrien via `addGeometry`/`addInstance`, `batchId ↔ {entry, groupName}`-Registry).
- Loader-Zweig: bei `perf.batchedGroups` Geometrie ins `GroupBatch` statt `scene.add(model)`.
  Farbe pro Instanz via `setColorAt` (Gruppenfarbe). **Noch keine** Selektion/Opacity/Highlight.
- **Validierung:** (a) haben Materialien `map`/Texturen? (b) sichtbarer FPS-Gewinn beim Orbit
  mit allen Muskeln — **auf echter Zielhardware** (FPS-Overlay `performanceMonitor` aktivierbar).
- **Gate/Go-Entscheidung:** nur wenn Phase-1-Messung den Gewinn bestätigt → Phase 2 ff.,
  ADR 0007 auf „akzeptiert". Sonst Stopp/Alternative.
- Vitest: Registry-Mapping (`batchId ↔ Teil`, add/remove) rein logisch testbar.

### Phase 2 — Picking auf batchId
- `raycaster`/`selection` so erweitern, dass ein BatchedMesh-Treffer über `batchId` das
  Teil/den „Root-Ersatz" auflöst (`getModelRoot`-Äquivalent liefert ein leichtgewichtiges
  Teil-Handle mit `userData.meta`). Pickable-Semantik über `setVisibleAt`+Registry.
- Vitest: Treffer→Teil-Auflösung.

### Phase 3 — Sichtbarkeit + Gruppenfarbe
- `visibility.js`/`groupStates` und `color.js` auf `setVisibleAt`/`setColorAt` umstellen
  (hinter Flag). Röntgen-Gruppentransparenz zunächst über Material (ganze Gruppe).

### Phase 4 — Per-Instanz-Alpha (Röntgen pro Teil, Ghost, Isolation)
- Custom-Shader (`onBeforeCompile`) mit per-Instanz-Alpha-Attribut; `setModelOpacity`/
  `ghostContext`/`isolationView` schreiben Alpha pro `batchId` statt Material-Klon.
- Korrekte Transparenz-Sortierung/`depthWrite` je Gruppe prüfen.

### Phase 5 — Highlight/Multi-Select (per-Instanz-Emissive)
- Per-Instanz-Emissive-Attribut im selben Shader; `highlightModel`/`multiSelect` schreiben
  Emissive pro `batchId`.

### Phase 6 — Umschalten default, Legacy-Pfad entfernen
- Nach Parität + Sichtprüfung Flag default an; toten Legacy-Pfad entfernen; CHANGELOG/ADR
  finalisieren.

## Done-Kriterien (gesamt)
- [ ] Orbit mit allen Muskeln auf Zielhardware flüssig (Messnachweis vs. vorher)
- [ ] Auswahl, Multi-Select, Röntgen, Ghost, Isolation, Farbe, Sichtbarkeit unverändert bedienbar
- [ ] `npm run test` + `npm run build` grün · CHANGELOG · ADR 0007 auf „akzeptiert"
