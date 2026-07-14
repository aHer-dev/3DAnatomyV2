# S4 — SearchBar → Sidebar-Kopf

> Handoff-Ref: §9.2 (Suchfeld/Dropdown/Fuzzy), §10 (SearchBar im Sidebar-Kopf, Frame `2a`).

## Kontext
Heute ist die Suche ein floatendes Lupe-Icon oben rechts. In B ist sie ein **Suchfeld im
Kopf der persistenten Sidebar** (nicht mehr floatend/eingeklappt). Fuzzy über Latein-Namen.

## Ist-Zustand
- `js/ui/react/components/SearchBar.tsx` + `css/components/search-bar.css`.
- Fuzzy-Match über `getStructureDisplayLabel()`, tastatur-navigierbar.

## Ziel-Zustand (§9.2 + §10)
- Persistentes Suchfeld im Sidebar-Kopf (über den Tab-Headern oder direkt darunter — an
  Frame `2a` orientieren): Pille `padding:13px 15px; radius:14px`, Lupe in `--accent`,
  Fokus-`border:1px solid --accent-border`.
- Ergebnis-Dropdown als Glas-Panel: Header „N Treffer" + „↑ ↓ · Enter"-Hinweis; Zeilen
  Farbpunkt + Name (Fuzzy-Teil in `--accent`, 600) + Gruppen-Tag rechts; aktive Zeile
  `background:--accent-dim`. Tastatur: ↑/↓/Enter, Esc schließt.
- Treffer-Klick → `selectStructure`/Selection setzen → Auto-Switch auf „Info" (aus S1/S3).

## Schritte
1. SearchBar in den Sidebar-Kopf einhängen; floatendes Icon/Einklapp-Logik entfernen.
2. `search-bar.css` auf §9.2-Maße + Tokens.
3. Tastatur-Navigation + Fokus-Verhalten prüfen (Grundlage; A11y-Feinschliff S11).

## Nicht-Ziele
- Kein neuer Such-Algorithmus. Kein Mobile-Sheet (S10).

## Done-Kriterien
- [x] `npm run test` grün · `npm run build` sauber
- [x] Suchfeld sitzt im Sidebar-Kopf; Dropdown zeigt Treffer, Fuzzy-Highlight in Orange
- [x] Treffer-Auswahl selektiert Struktur + Tab springt auf „Info"
- [x] CHANGELOG-Eintrag

## Relevante Dateien
`js/ui/react/components/SearchBar.tsx` · `css/components/search-bar.css` · `js/ui/react/components/AppShell.tsx`
</content>
