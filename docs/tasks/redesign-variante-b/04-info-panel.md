# S3 — InfoPanel → Sidebar-Tab „Info" + Auto-Switch

> Handoff-Ref: §9.4 (Titel/Badge/Slider/Aktionen/CTA), §10 (Ort + Auto-Switch), §12.

## Kontext
Der `InfoPanel` erscheint heute floatend oben rechts bei Selektion. In B ist er der Tab
**„Info"**, der bei Auswahl **automatisch aktiv** wird (Auto-Switch-Logik kam in S1 in den
Store). Titel ist der Latein-Name via `getStructureDisplayLabel()`.

## Ist-Zustand
- `js/ui/react/components/InfoPanel.tsx` + `css/components/info-panel-react.css`.
- Liest `selected` aus dem Store; kennt Ausblenden/Isolieren/Kontext + „zur Sammlung".
- Auto-Switch auf „Info" bei Selection ist bereits in S1 verdrahtet — hier nur den Inhalt.

## Ziel-Zustand (§9.4)
- Im Tab-Body: Titel Sora 600 21px (Latein) + **Gruppen-Badge** (Farbpunkt 8px + Gruppenname,
  `background: Gruppenfarbe @15%`). Kein Close-X nötig (Tab-Kontext), stattdessen sauberer
  Header — Detail an §9.4 orientieren, im Tab aber ohne floatendes Close.
- Body: `Deckkraft`-Slider (Fill `--accent`, Knob 13px, Live-Prozent).
- 3 gleich breite Aktionen: `Ausblenden · Isolieren · Kontext` (Icon 19px + Label 11px).
- CTA `Zur Sammlung` (Outline `1.5px --accent-border`, Text/Icon `--accent`).
- Leerer Zustand (kein `selected`): Tab „Info" nicht auto-aktiv; falls manuell gewählt →
  dezenter Hinweis „Struktur auswählen".

## Schritte
1. `InfoPanel` in den Tab-Body „Info" einhängen; Float/`position:fixed` raus.
2. `info-panel-react.css` auf §9.4-Maße + Tokens; Deckkraft-Slider = `--accent`-Fill.
3. `Isolieren` setzt `isolation` im Store → S7-Banner reagiert später darauf (nur Action-Wiring).
4. `Zur Sammlung` nutzt bestehendes `addToCollection`.

## Nicht-Ziele
- MultiSelect-Variante des Info-Tabs = **S7** (nicht hier).
- Keine Änderung an Selektions-/Isolations-Logik im Three.js.

## Done-Kriterien
- [x] `npm run test` grün · `npm run build` sauber
- [x] Auswahl → Tab „Info" zeigt Latein-Titel, Gruppen-Badge, Deckkraft, 3 Aktionen, CTA
- [x] Deckkraft-Slider verändert Opazität live (`setModelOpacity`, Live-Prozent)
- [x] CHANGELOG-Eintrag

## Relevante Dateien
`js/ui/react/components/InfoPanel.tsx` · `css/components/info-panel-react.css` ·
`js/ui/react/components/AppShell.tsx` (Tab-Einhängung)
</content>
