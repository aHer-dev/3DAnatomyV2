# S1 — App-Shell Layout B: Icon-Rail + Tab-Sidebar-Gerüst + UI-Slice

> Die strukturell größte Session. Baut das **Gerüst** von Layout B — bewegt aber noch
> keine Innereien um. Handoff-Refs: §10 (Mapping + Sidebar-Verhalten), §12 (State), §8 (Glas).

## Kontext
Heute floaten alle Panels frei (Layout A) und `App.tsx` hält Panel-Offen-State lokal
(`useState`). Layout B braucht (a) eine **linke Icon-Rail** (Logo oben, Tools, ⚙ unten via
`margin-top:auto`) und (b) eine **rechte, persistente Tab-Sidebar** mit genau einem aktiven
Tab aus `Strukturen · Sammlung · Info`. Auswahl einer Struktur schaltet auf „Info", Aufheben
zurück auf „Strukturen". Dafür braucht es echten UI-State im Store (kein lokaler React-State,
kein `window.*`).

## Ist-Zustand (genau)
- `App.tsx`: `browserOpen/collectionOpen/settingsOpen` als lokaler `useState`, `closeAll()`.
- `js/store/useStore.ts`: nur Domänen-State + Actions (siehe §12-Realität im Index) —
  **kein** `sidebarTab`, kein `openFlyout`, kein `activeTool`.
- Toolbar ist eine Bottom-Pille (Layout A).

## Ziel-Zustand
- **UI-Slice im Store** (additiv), z. B.:
  ```ts
  sidebarTab: 'structures' | 'collection' | 'info'
  openFlyout: 'settings' | null      // Rail-Flyout (S8); Exklusivität via closeAll-Muster
  setSidebarTab(tab), openFlyoutExclusive(name), closeFlyout()
  ```
  Auswahl-Logik: wenn `selected.root` gesetzt → Tab automatisch auf `'info'`; beim
  `clearSelection()` → zurück auf `'structures'` (in den bestehenden Actions ergänzen oder
  via Selector/Effect in der Shell — Entscheidung als ADR festhalten).
- **`AppShell.tsx`** (neu) rendert: Icon-Rail links + Sidebar-Container rechts + Slot unten
  für den Ansichts-Cluster (S5) + `#ui-root`-Kinder. Bestehende Panels werden in S2–S8 in
  die Tabs/Slots einsortiert; in dieser Session zeigt die Sidebar nur **Tab-Header + leere
  Tab-Bodies (Platzhalter)** und die Rail nur die Tool-Buttons als Gerüst.
- Footer-Links wandern in den **Sidebar-Fuß** (nur Verankerung; Styling in S9 finalisiert).

## Schritte
1. **Store erweitern** (`js/store/useStore.ts`): UI-Slice + Actions + Initialwerte. Tests in
   `js/store/useStore.test.ts` für die neuen Actions (Tab-Wechsel, Flyout-Exklusivität,
   Auto-Switch bei Selection/Clear). **ADR** in `docs/decisions/` für „UI-State in den Store".
2. **`AppShell.tsx` + `css/components/app-shell.css`** anlegen (BEM-Präfix `shell-`):
   - Rail: `left:20px; top:20px; bottom:20px; width:68px; radius:20px`, Glas-Rezept (§8, `.bar`),
     Logo oben (`assets/af-logo.png`, 34–36px), Tool-Buttons `44×44 / radius:13px / Icon 22px`,
     ⚙ unten via `margin-top:auto`.
   - Sidebar: rechts angedockt, persistent, Tab-Header (`Strukturen · Sammlung · Info`,
     genau einer aktiv → `--accent-tint`/`--accent`), scrollbarer Body, Fuß für Footer-Links.
3. **`App.tsx` umstellen:** lokalen Panel-State entfernen, Tabs/Flyout aus dem Store lesen.
   `AppShell` als Rahmen; Tab-Wechsel über `setSidebarTab`. Rail-Tools verdrahten (Panel-
   Toggles gibt es in B nicht mehr als „öffnen" — Inhalte leben in Tabs; nur ⚙ ist Flyout).
4. **Toolbar** bleibt vorerst als Datei bestehen; ihre Tools ziehen schrittweise in die Rail
   (Auswahl/Gruppen/Labels/Foto in dieser Session als Rail-Buttons abbilden, Ansichts-Cluster
   erst in S5). Toter Bottom-Pillen-Code wird entfernt, sobald alles migriert ist — hier nur
   so weit wie nötig, **keine Leichen hinterlassen**.

## Nicht-Ziele
- StructureBrowser/Info/Collection/Search/Settings-**Innereien** nicht umziehen (S2–S8).
- Kein Mobile-Layout (S10). Kein Ansichts-Cluster-Feinschliff (S5).
- Kein Three.js-Eingriff.

## Done-Kriterien
- [ ] `npm run test` grün (inkl. neuer UI-Slice-Tests) · `npm run build` sauber
- [ ] Rail links + persistente Tab-Sidebar rechts sichtbar; genau ein Tab aktiv
- [ ] Auswahl einer Struktur → Sidebar springt auf „Info"; Aufheben → „Strukturen"
- [ ] Kein Panel-State mehr in `App.tsx`-`useState`; alles über Store
- [ ] ADR für UI-State-Slice · CHANGELOG-Eintrag

## Relevante Dateien
`js/store/useStore.ts` (+`.test.ts`) · `js/ui/react/App.tsx` · `js/ui/react/components/AppShell.tsx` (neu) ·
`css/components/app-shell.css` (neu) + `main.css`-Import · `js/ui/react/components/Toolbar.tsx` ·
`docs/decisions/` (ADR)
</content>
