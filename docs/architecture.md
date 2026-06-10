# BlueBody 3D — Architektur-Überblick

> Wächst mit den Phasen. Jetzt: Platzhalter-Struktur für Phase 0.
> Wird nach Phase 1 (Vite) und Phase 2 (TypeScript + Zustand) konkretisiert.

---

## Schichten-Modell (Ziel nach Phase 3)

```
┌─────────────────────────────────────────┐
│           React UI (Overlay)            │
│  StructureBrowser · Search · InfoPanel  │
│  Toolbar · EditPanel · Loading          │
│  Kommunikation NUR über Zustand-Store   │
└────────────────┬────────────────────────┘
                 │ useStore() / store.subscribe()
┌────────────────▼────────────────────────┐
│           Zustand Store                 │
│  Slices: models · selection ·           │
│          visibility · appearance        │
│  Brücke zwischen 3D-Layer und UI        │
└────────────────┬────────────────────────┘
                 │ store.subscribe()
┌────────────────▼────────────────────────┐
│        Three.js 3D-Layer (imperativ)    │
│  SceneManager · CameraController ·     │
│  ModelLoader · RaycasterManager ·      │
│  LODManager · ResourceManager          │
│  Bleibt imperativ — KEIN RTF           │
└─────────────────────────────────────────┘
```

## Wichtige Regeln

- **3D-Layer und UI reden NUR über den Store** — kein direkter Zugriff
- **Three.js-Code bleibt imperativ** — kein React Three Fiber
- **Keine window.* Globals** — ab Phase 2 alles über Store-Imports

## Datei-Struktur (Ziel nach Phase 1)

```
/
├── src/
│   ├── bootstrap/       # App-Start, Initialisierung
│   ├── core/            # Three.js-Layer (SceneManager, Camera, Loader...)
│   ├── features/        # Feature-Module (Raycasting, Labels, Clipping...)
│   ├── ui/              # React-Komponenten (ab Phase 3)
│   ├── store/           # Zustand-Store (ab Phase 2)
│   └── types/           # Shared TypeScript-Typen (MetaEntry, AppState...)
├── public/
│   ├── models/          # .glb-Dateien, Draco-Decoder
│   └── data/            # meta.json
├── docs/
│   ├── architecture.md  # (diese Datei)
│   ├── decisions/       # ADRs
│   └── tasks/           # Task-Briefings
├── AGENTS.md            # Agenten-Regeln (kanonisch)
├── CLAUDE.md            # → Symlink auf AGENTS.md
└── ROADMAP.md           # Phasenplan
```

## Zentrale Typen (ab Phase 2)

Die wichtigsten Typen, alles hängt am `meta.json`-Schema:

```typescript
// Wird konkretisiert wenn meta.json verfügbar
interface MetaEntry {
  id: string
  name: { de: string; la: string }
  group: AnatomyGroup
  // Muskeln: origin, insertion, innervation, function
}

interface AppState {
  models: Record<string, ModelState>
  selection: string | null
  visibility: Record<string, boolean>
  appearance: Record<string, AppearanceState>
}
```

---

*Zuletzt aktualisiert: 2026-06-10 · Stand: Phase 0 (Aufräumen)*
