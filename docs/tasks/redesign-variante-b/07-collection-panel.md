# S6 — CollectionPanel → Sidebar-Tab „Sammlung"

> Handoff-Ref: §9.8 (Header/Zeile/CTA), §10 (Sidebar-Tab „Sammlung", Frame `2c`).

## Kontext
Die Sammlung floatet heute rechts. In B ist sie der Tab **„Sammlung"**. Klick auf eine Zeile
fokussiert die Struktur im Canvas.

## Ist-Zustand
- `js/ui/react/components/CollectionPanel.tsx` + `css/components/collection-panel.css`.
- Liest `collection` aus dem Store; `removeFromCollection`, Fokus-Action vorhanden/anzubinden.

## Ziel-Zustand (§9.8)
- Im Tab-Body „Sammlung": Header „SAMMLUNG · N" (Lesezeichen-Icon `--accent`).
- Zeile: Farbpunkt + Latein-Name (flex 1) + `Fokussieren` (Target) + `Entfernen` (Trash);
  **Klick auf die Zeile fokussiert** die Struktur.
- Footer-CTA `Alle fokussieren` (gefüllt `--accent`, Text `--accent-on`).
- Leerer Zustand: dezenter Hinweis.

## Schritte
1. In den Tab-Body einhängen; Float raus.
2. `collection-panel.css` auf §9.8 + Tokens.
3. Zeilen-Klick + `Fokussieren` + `Alle fokussieren` an bestehende Fokus-Action anbinden
   (Store; kein Three.js-Umbau).

## Nicht-Ziele
- Kein Export-/Import-Feature ändern. Kein Mobile-Sheet (S10).

## Done-Kriterien
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] Tab „Sammlung" listet Einträge; Zeilen-Klick fokussiert; Entfernen funktioniert
- [ ] „Alle fokussieren" vorhanden · CHANGELOG-Eintrag

## Relevante Dateien
`js/ui/react/components/CollectionPanel.tsx` · `css/components/collection-panel.css` · `AppShell.tsx`
</content>
