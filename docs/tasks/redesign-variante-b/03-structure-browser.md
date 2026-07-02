# S2 — StructureBrowser → Sidebar-Tab „Strukturen"

> Handoff-Ref: §9.3 (verbindliche Maße/Zustände), §7 (Gruppenfarben), §10 (Ort).

## Kontext
Der `StructureBrowser` floatet heute unten rechts (Layout A). In B ist er der **Default-Tab
„Strukturen"** der persistenten Sidebar (Gerüst aus S1). Innereien bleiben inhaltlich gleich,
nur Verankerung + Marken-Styling ändern sich.

## Ist-Zustand
- `js/ui/react/components/StructureBrowser.tsx` + `css/components/structure-browser.css`.
- Liest Gruppen/Sichtbarkeit/`groupOpacity` aus dem Store; nutzt `groupLabels.ts`.
- Muss auf **bis zu 16 Gruppen** skalieren (kein hartkodiertes 5er-Raster).

## Ziel-Zustand (§9.3)
- Wohnt im Sidebar-Tab „Strukturen" (kein `position:fixed` mehr, füllt den Tab-Body).
- Gruppen-Zeile: Sichtbarkeits-Auge (17px) · Farbpunkt 11px (`--group-*`) · Label (flex 1) ·
  **Röntgen-Slider** (Track `60×4`, Fill in Gruppenfarbe, Knob 11px). Ausgeblendet → gedimmt
  (`--text-faint`, Auge-off). Aktiv → `background:--accent-dim`, Label 600 `#f6f6f7`.
- BEM-Präfix `sb-`. Nur Tokens.

## Schritte
1. `StructureBrowser` in den Tab-Body einhängen (Rendern, wenn `sidebarTab==='structures'`);
   `position:fixed`/Float-Regeln raus.
2. `structure-browser.css` auf §9.3-Maße + Tokens umziehen; Slider-Fill = Gruppenfarbe.
3. Sichtbarkeits-Toggle als echtes `role="switch"` (A11y-Grundlage, Feinschliff in S11).
4. Gegen ≥16 Gruppen prüfen (Overflow/Scroll im Tab-Body, kein festes Raster).

## Nicht-Ziele
- Keine Änderung an der Gruppen-Lade-Logik/Three.js. Keine neuen Gruppen freischalten.
- Kein Mobile-Sheet (S10).

## Done-Kriterien
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] „Strukturen" ist Default-Tab, zeigt Gruppen mit Auge/Farbpunkt/Röntgen-Slider
- [ ] Skaliert sichtbar über 5 Gruppen hinaus (Scroll statt Bruch)
- [ ] CHANGELOG-Eintrag

## Relevante Dateien
`js/ui/react/components/StructureBrowser.tsx` · `css/components/structure-browser.css` ·
`js/ui/react/components/AppShell.tsx` (Tab-Einhängung) · `js/ui/react/groupLabels.ts` (nur lesen)
</content>
