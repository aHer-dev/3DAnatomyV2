# S5 — Ansichts-Cluster (untere schwebende Leiste)

> Handoff-Ref: §9.1 (Ansichts-Cluster), §10 (schwebende Leiste unten, `left:41%`).

## Kontext
Die Kamera-Richtungen (Vorne/Hinten/Links/Rechts/Oben + Reset) sind heute Teil der Toolbar
(`#toolbar-dir-panel`, siehe frühere Phase-4i). In B sind sie eine **eigene schwebende Leiste
unten-mittig im freien Canvas** — **nicht** Teil der Rail.

## Ist-Zustand
- Richtungs-Buttons leben in `Toolbar.tsx` (ggf. bereits integriert aus Phase-4i).
- `css/components/toolbar.css`.

## Ziel-Zustand (§9.1)
- Eigenständige Leiste `ViewCluster.tsx`: Glas-Rezept `.bar`, `radius:16px`, unten mittig
  (`left:41%` bzw. zentriert), Buttons `44×44` `toolbar-btn`-Stil. Reset gehört dazu.
- Von der Rail entkoppelt (getrennte Achse Werkzeug vs. Ansicht).

## Schritte
1. `ViewCluster.tsx` + `css/components/view-cluster.css` (Präfix `vc-`) anlegen; Richtungs-
   Buttons dorthin verschieben. Kamera-Actions unverändert aufrufen (kein Three.js-Umbau).
2. Reste aus `Toolbar.tsx`/`toolbar.css` (Richtungs-Panel) entfernen — **keine Leichen**.
3. In `AppShell` als Bottom-Center-Slot einhängen (`pointer-events:all`).

## Nicht-Ziele
- Keine Kamera-Logik ändern. Kein Mobile-Layout (S10, dort in die Tab-Leiste).

## Done-Kriterien
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] Ansichts-Cluster schwebt unten mittig, getrennt von der Rail; alle Richtungen + Reset
- [ ] Kein `#toolbar-dir-panel`/Richtungs-Rest mehr in Toolbar/CSS
- [ ] CHANGELOG-Eintrag

## Relevante Dateien
`js/ui/react/components/ViewCluster.tsx` (neu) · `css/components/view-cluster.css` (neu) ·
`js/ui/react/components/Toolbar.tsx` · `css/components/toolbar.css` · `AppShell.tsx`
</content>
