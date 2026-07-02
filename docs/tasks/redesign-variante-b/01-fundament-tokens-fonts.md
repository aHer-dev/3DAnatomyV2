# S0 — Fundament: Tokens, Fonts, Cleanup

> Erste Session der Serie. **Kein Layout-Umbau** — nur die Basis austauschen, damit alle
> bestehenden Komponenten über Tokens automatisch den neuen Marken-Look erben.
> Handoff-Refs: §4, §5, §6, §17-Punkt-1/2.

## Kontext
Die App läuft im alten Navy/Blau-Look. `css/theme/variables.css` ist die alte Token-Datei,
`base.css` setzt Navy-Body-Verlauf + Inter, `css/components/dropdowns.css` ist toter Code der
noch in `main.css` importiert wird. Der Handoff liefert eine fertige, einsatzbereite
`variables.css` (Schwarz/Orange, Sora/Manrope, Gruppenfarben, z-index).

## Ist-Zustand (genau)
- `css/theme/variables.css` — alte Navy/Blau-Tokens (~1 KB).
- `css/theme/base.css` — `body { background: linear-gradient(135deg,#0a0e27,#151933); font-family: …Inter… }`.
- `css/main.css` — importiert u. a. `components/dropdowns.css` (tot).
- Keine `public/fonts/`, kein `css/theme/fonts.css`.

## Ziel-Zustand
- Neue Marken-Tokens aktiv; App visuell dunkel-schwarz/orange, Fonts Sora/Manrope (mit
  System-Fallback, falls woff2 noch fehlen — App bleibt lauffähig).
- `dropdowns.css` entfernt (Datei + Import).
- `base.css` nutzt Tokens statt Navy-Hardcodes.

## Schritte
1. **Tokens ersetzen:** Inhalt von `docs/design_handoff_anatomie_3d/variables.css` nach
   `css/theme/variables.css` übernehmen (Drop-in). Prüfen, dass keine Komponente eine
   *entfernte* alte Variable braucht (`grep -rn "accent-blue\|glass-bg-panel\|radius-xl\|color-bg" css/ js/`).
   Fehlende, aber referenzierte alte Namen → entweder Komponente auf neuen Token umziehen
   oder Alias-Var ergänzen (in `variables.css`, mit Kommentar).
2. **base.css:** Body-`background` auf `var(--stage-gradient)` (Fallback hinter Canvas),
   `color: var(--text-primary)`, `font-family: var(--font-ui)`. Keine Hardcode-Farben mehr.
3. **Fonts self-hosten** (§6):
   - `css/theme/fonts.css` anlegen mit `@font-face` je Gewicht: Sora 300/400/500/600/700/800,
     Manrope 400/500/600/700/800, `font-display:swap`, `src:url('/fonts/<name>-<weight>.woff2')`.
   - In `main.css` **als erstes nach variables** importieren: `@import 'theme/fonts.css';`.
   - **Asset-Voraussetzung:** die `.woff2` müssen unter `public/fonts/` liegen (SIL OFL 1.1,
     via google-webfonts-helper). Sind sie noch nicht da → `@font-face` trotzdem schreiben;
     der System-Fallback in `--font-display/--font-ui` hält die App lauffähig. **In der
     CHANGELOG/BACKLOG vermerken, falls woff2 noch fehlen** (Follow-up: Dateien einlegen).
4. **Cleanup:** `@import 'components/dropdowns.css';` aus `main.css` entfernen **und**
   `css/components/dropdowns.css` löschen. `grep -rn "dropdown" css/ js/ index.html` → keine
   lebenden Referenzen mehr.

## Nicht-Ziele
- Kein Komponenten-Umbau, kein Layout B (kommt ab S1). Keine neuen Panels.
- Keine CSP-Änderung (font-src bleibt `'self'`, alles lokal).
- Gruppenfarben nicht ändern (semantisch).

## Done-Kriterien
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] App startet, dunkler Look, Orange-Akzente sichtbar, keine kaputten Panels
- [ ] `dropdowns.css` weg (Datei + Import), keine toten Referenzen
- [ ] `fonts.css` importiert; Fonts laden (oder System-Fallback greift dokumentiert)
- [ ] CHANGELOG-Eintrag

## Relevante Dateien
`css/theme/variables.css` · `css/theme/base.css` · `css/theme/fonts.css` (neu) ·
`css/main.css` · `css/components/dropdowns.css` (löschen) · `public/fonts/` (Assets)
</content>
