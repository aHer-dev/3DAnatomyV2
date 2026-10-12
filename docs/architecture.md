# Anatomie Fokus 3D — Architektur-Überblick

> Stand der tatsächlichen Codebasis. Entscheidungen siehe `docs/decisions/` (ADRs).

---

## Schichten-Modell

```
┌─────────────────────────────────────────────┐
│            React UI (Overlay #ui-root)       │
│  SearchBar · StructureBrowser · InfoPanel    │
│  MultiSelectPanel · CollectionPanel ·        │
│  Toolbar · SettingsPanel · IsolationBar ·    │
│  Footer/License                              │
└───────────────┬─────────────────┬───────────┘
   useReactStore │                 │ direkte Aufrufe
   (reaktiver    │                 │ imperativer Aktionen
    State)       ▼                 ▼ (resetApp, enterPhotoMode,
┌────────────────────────┐   applyLighting, loadGroupByName …)
│      Zustand Store      │            │
│  (js/store/useStore.ts) │            │
│  groups · selection ·   │            │
│  visibility · colors …  │            │
└───────────┬─────────────┘            │
 store.subscribe / getState            │
┌───────────▼──────────────────────────▼──────┐
│        Three.js 3D-Layer (imperativ)         │
│  scene · camera · controls · renderer ·      │
│  modelLoader · raycaster · features/*        │
│  Bleibt imperativ — KEIN React Three Fiber   │
└──────────────────────────────────────────────┘
```

## Wichtige Regeln

- **Three.js-Code bleibt imperativ** — kein React Three Fiber.
- **Reaktiver Zustand läuft über den Store** (`useReactStore` in React, `getState`/`subscribe`
  im 3D-Layer). Daneben rufen React-Komponenten **imperative Aktions-/Feature-Funktionen
  direkt** auf (z. B. `resetApp`, `enterPhotoMode`, `applyLighting`, `loadGroupByName`) —
  derselbe Stil wie in `Toolbar.tsx`. Der Store hält keinen Raum-/Preset-Zustand.
- **Keine `window.*`-Globals** für App-State.
- **Kein paralleles DOM-Chrome mehr** — die gesamte UI liegt in React (ADR 0004);
  `index.html` enthält nur Canvas + `#ui-root`.

## Muskelmaterial und Darstellungsqualität

Die zusätzlichen Darstellungseinstellungen verwenden ausschließlich den Store
als Bridge: `SettingsPanel` schreibt `renderingSettings`, `performanceMode` und
deren Aktionen; der imperative 3D-Layer liest und abonniert sie. Das Geräteprofil
setzt `constrainedDevice`. `getEffectiveRenderingSettings` pausiert weiches Raumlicht und GTAO bei
Performance-Modus oder schwachem Gerät und erhält die gespeicherte Auswahl.

`modelLoader/muscleBoundary.ts` ordnet `muskelgrenzen.json` anhand des GLB-Dateinamens
zu und enthält die unveränderte Blender-Referenzrechnung. `muscleAppearance.ts`
ergänzt beim Laden das Bauchgewicht in rohen Dateikoordinaten und installiert ein
kopierbares `MeshStandardMaterial` mit fester Sehnenfarbe. Normalen und Rauheit
sind unabhängig schaltbar; Positionen, Indizes und Knoten bleiben unverändert.
Die Bounding-Box-Prüfung stoppt abweichende Quellen. `modelSourcePolicy.ts` wählt
für den vorhandenen fehlerhaften FJ801-Bundle-Wrapper das geprüfte Original und
erkennt HTML-Antworten auf fehlende Bundles für den Einzeldatei-Fallback.
Gemessene Augenmuskeln teilen die Muskel-Bauchfarbe; echte Augen behalten ihre
Gruppenfarbe. `muscleBoundaryData.ts` lädt und teilt die Messdaten einmal pro Sitzung.

`core/renderQuality.ts` erzeugt RoomEnvironment/PMREM und verwaltet Tone-Mapping
und die bei Bedarf erzeugte GTAO-Nachbearbeitung. Sie hängt im vorhandenen
Demand-Render-Loop und pausiert auch bei sichtbarer Transparenz. Details und
Datenpflege: [MUSCLE_RENDERING.md](MUSCLE_RENDERING.md), Entscheidung: [ADR 0010](decisions/0010-muscle-tendon-rendering.md).

Der UI-Schalter Performance-Modus pausiert weiches Raumlicht und GTAO und aktiviert keine Bündelung.
Der ältere `groupBatch.js`-Versuchspfad hinter `performance.batchedGroups`
(Default aus) erhält Bauchgewichte, Instanzfarben und Originalnormalen in
Geometriekopien. Seine vollständige individuelle Interaktion ist weiterhin
offen (ADR 0007).

## Datei-Struktur (Ist)

```
/
├── index.html              # Canvas + #ui-root (React-Mountpunkt) + app.js
├── app.js                  # Einstieg: React mounten, startApp()
├── js/
│   ├── bootstrap/          # App-Start (startApp, initGroupLoader, initResizeHandler …)
│   ├── core/               # Three-Layer (scene, camera, controls, renderer, raycaster,
│   │                       #   renderScheduler, lifecycle, cameraUtils, resourceManager)
│   ├── features/           # Feature-Logik, DOM-frei (modelLoader-core, appearance,
│   │                       #   visibility, selection, labels, ghostContext, collectionView,
│   │                       #   roomSettings, presets)
│   ├── interaction/        # Raycasting/Auswahl (index, multiSelect, boxSelect,
│   │                       #   isolationView, highlightModel, hoverTooltip)
│   ├── modelLoader/        # GLB laden/aufräumen (color, cleanup, progress)
│   │                       #   muscleBoundary, muscleAppearance, modelSourcePolicy
│   │                       #   muscleBoundaryData
│   ├── loaders/            # gltfLoaderFactory (Draco)
│   ├── store/              # Zustand-Store (useStore.ts) — Single Source of Truth
│   ├── ui/                 # imperative UI-Logik (toolbar, photoMode, ui-reset,
│   │   │                   #   ui-collection-export, license-frei) +
│   │   └── react/          # React-Overlay: App.tsx, components/*, useReactStore, groupLabels
│   ├── config/             # APP_CONFIG (config.ts)
│   ├── data/               # meta.js (meta.json laden/normalisieren)
│   ├── integration/        # Muskelfinder-Deeplink/Preview, deeplink
│   ├── types/              # geteilte TS-Typen
│   ├── utils/              # anatomyLabels, migration-helper
│   └── debug/              # performanceMonitor
├── css/                    # main.css (einziger Einstieg) importiert theme/ + components/
├── public/
│   ├── models/             # .glb (Draco) + Decoder
│   └── data/               # meta.json, muskelgrenzen.json, presets/ (.bluebody + index.json)
└── docs/
    ├── architecture.md     # (diese Datei)
    ├── decisions/          # ADRs (0001 Vite/TS/React, 0002 Zustand, 0003 Lizenz,
    │                       #   0004 UI-Konsolidierung)
    └── tasks/              # Task-Briefings
```

## Zentrale Typen

Alles hängt am `meta.json`-Schema (Auszug):

```typescript
interface MetaEntry {
  id: string
  labels: { de: string; en: string; la: string }
  classification: { group: AnatomyGroup; subgroup; side; system; region }
  relations: { is_a; part_of; has_parts; adjacent_to; cross_references }
  model: { current: string; variants: Record<string, { path; filename; format }> }
}
```

> Hinweis: `classification.system` / `region` / `subgroup` und die `relations` sind in den
> aktuellen Daten **leer**. Region-/Themen-Navigation wird stattdessen über kuratierte
> Sammlungen (`public/data/presets/*.bluebody` + `index.json`, Feld `category`) abgebildet.

---

*Zuletzt aktualisiert: 2026-10-12 · Muskelmaterial und Qualitäts-Store-Bridge (ADR 0010)*
