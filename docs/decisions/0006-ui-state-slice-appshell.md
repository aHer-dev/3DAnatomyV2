# ADR 0006: Overlay-UI-Slice im Store + AppShell (Layout B)

## Status: akzeptiert · 2026-07-02

## Kontext
Das Redesign „Variante B" (Design-Handoff, `docs/tasks/redesign-variante-b/`) ersetzt
das bisherige Layout A (untere Toolbar + an den Ecken floatende Panels) durch eine
**angedockte Werkbank**: eine Icon-Rail links (Werkzeuge + ⚙) und eine **persistente
Tab-Sidebar** rechts mit genau einem aktiven Tab aus `Strukturen · Sammlung · Info`.

Bisher hielt `App.tsx` das Panel-Offen-State lokal (`useState` browserOpen/collectionOpen/
settingsOpen) und die Panel-Exklusivität über ein `closeAll()`. In Layout B braucht es:
- **einen** aktiven Sidebar-Tab, den mehrere Komponenten teilen (Rail-Tabs, Sidebar-Body,
  Auto-Umschaltung bei Auswahl),
- ein exklusives **Flyout** (nur `settings`, aus der Rail),
- eine Regel: Auswahl einer Struktur schaltet die Sidebar automatisch auf „Info", das
  Aufheben zurück auf „Strukturen".

CLAUDE.md/Design-Brief: *„State ausschließlich über den Store. Keine `window.*`-Globals."*
Lokaler `useState` in `App.tsx` skaliert für diese geteilte Navigation nicht mehr.

## Entscheidung
1. **Additiver UI-Slice im Zustand-Store** (`sidebarTab`, `openFlyout` + Actions
   `setSidebarTab`, `openFlyoutExclusive`, `closeFlyout`). Rein React-Overlay-Zustand,
   kein Three.js-Bezug. Der Store wird **erweitert, nicht umgebaut**; Domänen-Slices und
   alle bestehenden Actions bleiben unangetastet.
   - **Abgrenzung zu ADR 0004:** Raum-/Preset-Zustand bleibt weiterhin *nicht* im Store
     (imperativ). Der neue Slice hält ausschließlich **Navigations-/Chrome-Zustand** der
     Overlay-UI — der laut CLAUDE.md sanktionierte, komponentenübergreifende Kanal.
2. **`AppShell.tsx`** als neuer Overlay-Rahmen: Icon-Rail links (Logo, Werkzeuge,
   Layer-Toggles, Labels/Foto/Reset, ⚙) + persistente Tab-Sidebar rechts (Suchkopf,
   Tab-Header, Tab-Body hostet die bestehenden Panels, Footer-Fuß) + Ansichts-Cluster
   unten mittig. Ersetzt die bisherige Bottom-Toolbar (`Toolbar.tsx` entfällt).
3. **Auto-Switch via Effekt in der Shell**, nicht in den Domänen-Actions: `AppShell`
   beobachtet `selected.root` und ruft `setSidebarTab('info')` bzw. `'structures'`.
   - **Begründung:** `setSelection`/`clearSelection` werden aus imperativem Three.js-Code
     aufgerufen; sie mit UI-Navigations-Seiteneffekten zu belasten, würde die Trennung
     3D-Logik ↔ Overlay-UI verwässern. Der Effekt reagiert nur auf Änderungen von
     `selected.root`, sodass manuelle Tab-Wechsel des Nutzers erhalten bleiben.

## Konsequenzen
- `App.tsx` hält keinen Panel-`useState` mehr; Tabs/Flyout kommen aus dem Store.
- Bestehende Panels (StructureBrowser/InfoPanel/CollectionPanel) werden in dieser Session
  **in die Tab-Bodies gehostet** (Positionierungs-Override in `app-shell.css`); ihr
  pixelgenauer Umbau folgt isoliert je Komponente in S2/S3/S6. SearchBar-Kopf (S4),
  Ansichts-Cluster→`ViewCluster.tsx` (S5), Settings-Flyout (S8), Multi/Isolation als
  Info-Tab-Varianten (S7) sind eigene Folge-Sessions.
- `Toolbar.tsx` + `css/components/toolbar.css` werden gelöscht (Werkzeuge leben in der Rail,
  Kamera-Richtungen im Ansichts-Cluster). Keine toten Klassen — die Toolbar-Klassen wurden
  nirgends sonst referenziert.
- Pixel-/3D-Verhalten ist nicht unit-getestet → **manuelle Sichtprüfung** im Browser nötig.
</content>
