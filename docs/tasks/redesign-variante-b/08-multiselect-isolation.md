# S7 — MultiSelect + IsolationBar (Info-Tab-Varianten + Sidebar-Banner)

> Handoff-Ref: §9.5 (MultiSelect), §9.6 (Isolation), §10 (Frames `2d`/`2e`). Baut auf S3 (Info-Tab).

## Kontext
In A waren das floatende Bottom-/Top-Bars. In B:
- **Mehrfachauswahl** verwandelt den **Info-Tab in eine Sammel-Ansicht** (Zähler + Chip-Liste
  + Sammel-Aktionen) — **keine** Bottom-Bar mehr (Frame `2d`).
- **Isolation** zeigt ein **Banner oben in der Sidebar** + gedimmtes Modell (~14 %) +
  zentrierten Untertitel unten (Frame `2e`) — **keine** floatende Top-Bar mehr.

## Ist-Zustand
- `js/ui/react/components/MultiSelectPanel.tsx` + `css/components/…` (floatend).
- `js/ui/react/components/IsolationBar.tsx` (floatend), liest `isolation` aus dem Store.
- `multiSelected` (Set) + `isolation` sind bereits im Store.

## Ziel-Zustand
- **Info-Tab-Varianten** (eine Komponente entscheidet nach State, welche Ansicht):
  - `selected` einzeln → normales InfoPanel (S3).
  - `multiSelected.size > 1` → Sammel-Ansicht: Zähler-Badge (`--accent`/`--accent-on`) +
    „N Strukturen gewählt" + Chip-Liste + Aktionen `Isolieren · Ausblenden · Zur Sammlung ·
    Auswahl aufheben`.
- **Isolation** (§9.6): Banner oben in der Sidebar (Target `--accent` + „Isolation · <Struktur>"
  + `Kontext einblenden` (Ghost) + `Beenden` (gefüllt `--accent`)). Untertitel-Overlay unten
  zentriert (Struktur + Zusatzinfo). Border `--accent-border`.

## Schritte
1. MultiSelect als **Variante des Info-Tabs** rendern (nicht als eigenes floatendes Panel);
   alte Float-CSS entfernen. Chip-Liste aus `multiSelected` + `getStructureDisplayLabel()`.
2. IsolationBar zu **Sidebar-Banner** + Untertitel-Overlay umbauen; Float-Regeln raus.
3. Aktionen an bestehende Store-Actions binden (`clearMultiSelected`, `setIsolation`, …).
4. Keine Leichen: entfernte Float-Container/CSS wirklich löschen.

## Nicht-Ziele
- Die visuelle **Modell-Dimmung** ist Three.js-Sache — hier nur der UI-State/Banner, kein
  Canvas-Eingriff (Dimm-Verhalten existiert bereits, nur ansteuern).
- Kein Mobile-Sheet (S10).

## Done-Kriterien
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] Mehrfachauswahl → Info-Tab zeigt Zähler + Chips + Sammel-Aktionen (keine Bottom-Bar)
- [ ] Isolation → Sidebar-Banner + Untertitel unten (keine floatende Top-Bar); Beenden funktioniert
- [ ] CHANGELOG-Eintrag

## Relevante Dateien
`js/ui/react/components/MultiSelectPanel.tsx` · `js/ui/react/components/IsolationBar.tsx` ·
`js/ui/react/components/InfoPanel.tsx` (Varianten-Umschaltung) · zugehörige CSS · `AppShell.tsx`
</content>
