# S10 — Mobile: Bottom-Sheets + Tab-Leiste + Safe-Area

> Handoff-Ref: §13 (Mobile, Pflicht). Erst starten, wenn S2–S9 die Panels umgezogen haben.

## Kontext
Auf Schmal-Screens ersetzen **Bottom-Sheets** die seitliche Sidebar und eine **untere
Tab-Leiste** die Rail. `viewport-fit=cover` ist gesetzt → Safe-Area-Insets beachten.

## Ist-Zustand
- Jede Komponente hat aktuell nur einen kleinen Breakpoint. Desktop-Layout B steht (S1–S9).

## Ziel-Zustand (§13)
- **Bottom-Sheet** statt Sidebar: StructureBrowser/Info/Sammlung/Settings erscheinen als Sheet
  von unten (Grabber `42×5`, `radius:28px 28px 0 0`, `background:rgba(15,16,20,.94)`,
  `backdrop-filter:blur(26px)`). Sheets respektieren die untere Safe-Area-Inset.
- **Untere Tab-Leiste** statt Rail: `Auswählen · Strukturen · Labels · Ansicht · ⚙`,
  Buttons `≥52px`. Gruppen-Chips als horizontal scrollbare Reihe.
- **Touch-Targets ≥44px** (`--touch-min`), Slider-Knobs 14–16px.
- **Safe-Area:** `padding` mit `env(safe-area-inset-*)` oben/unten.

## Schritte
1. Media-Query-Strategie festlegen (ein Breakpoint, an dem Sidebar→Sheet + Rail→Tab-Leiste
   umschalten). Wo möglich CSS-only; State (welches Sheet offen) aus dem vorhandenen UI-Slice.
2. Sheet-Container-Komponente (wiederverwendbar) mit Grabber + Safe-Area; Panels als Sheet-
   Inhalt einhängen (Wiederverwendung der Tab-Bodies, kein Duplikat der Panel-Logik).
3. Untere Tab-Leiste umsetzen; Ansichts-Cluster (S5) mobil hier integrieren.
4. Auf realem/emuliertem Schmal-Screen prüfen (Touch-Targets, Insets, kein Overflow).

## Nicht-Ziele
- Keine neue Navigations-Semantik erfinden — dieselben Tabs/Actions wie Desktop, nur als Sheet.
- Kein Three.js-Eingriff.

## Done-Kriterien
- [x] `npm run test` grün (41) · `npm run build` sauber · lint · tsc
- [x] Schmal-Screen: Panels als Bottom-Sheets, untere Tab-Leiste statt Rail
- [x] Touch-Targets ≥44px, Safe-Area-Insets greifen, Gruppen-/Auswahl-Chips scrollen horizontal
- [x] CHANGELOG-Eintrag

## Umsetzungs-Notizen (S10)
- **Ein Breakpoint** `max-width:768px` (wie photo-mode.css), zentral in `css/layout/responsive.css`
  (zuletzt in `main.css` importiert → gewinnt bei gleicher Spezifität).
- **Sheets = Media-Query-Umformung der Bestandspanels** (kein Duplikat): `.shell-sidebar`
  (Panel), `.stp-flyout` (Settings), neuer `.vc-sheet` (Ansicht) teilen ein Sheet-Rezept;
  Grabber als `::before` (kein Markup). Store additiv um `mobileSheet` erweitert (ADR-0006-
  Nachtrag), Settings bleibt der `openFlyout`-Kanal.
- **Tab-Leiste** `Auswählen · Strukturen · Labels · Ansicht · ⚙` (52px), in `AppShell.tsx`;
  Desktop via `.shell-tabbar{display:none}` aus.
- **Bewusste Abweichungen:** kein oberer Marken-/Such-Balken (Frame zeigt ihn, aber Perf-Regel
  „keine neuen Dauer-Blur-Flächen über Canvas" + Suche ist im Panel-Sheet erreichbar);
  auf Mobile nur „Auswählen" statt aller Werkzeuge (Multi/Box/Fokus). „Gruppen-Chips"
  konkretisiert als die Mehrfachauswahl-Chips (`.msp-chips`) — einzige Chip-Reihe im Bestand.
- **Nicht angefasst** (Briefing-Dateiliste): `js/ui/photoMode.js` `toolbarH=72` bleibt; die
  neue Tab-Leiste ist ~68px hoch, also weiterhin passend. Kandidat für S11, falls Feinschliff.

## Nachtrag S13 — Tab-Leiste → zwei Kugeln
Die untere Tab-Leiste aus S10 ist abgelöst. Sie war über die volle Breite gebaut und
verdeckte damit genau den Fuß des Modells; bei einer Anatomie-App ist das Bild aber der
Inhalt. An ihrer Stelle: eine Kugel in jeder unteren Ecke.
- **Links (`.shell-orbdock--left`)** — Werkzeug-Säule aus beschrifteten Pillen:
  Auswählen · Mehrfachauswahl · Knochen · Muskeln · Beschriftungen · Ansicht · Reset.
  Reihenfolge von unten nach oben nach Häufigkeit; Schalter lassen die Säule offen
  (`sticky`), Modi und Einmal-Aktionen schließen sie.
- **Rechts (`.shell-orbdock--right`)** — die Wortmarke öffnet das Panel-Sheet. Damit
  steht das Logo mobil genau einmal auf dem Bildschirm: `.shell-brand` ist im Sheet-Kopf
  ausgeblendet, an seiner Stelle sitzt `.shell-sheetgear` (Einstellungen).
- **Unverändert:** Sheet-Rezept, `mobileSheet`-Kanal, Panel-Logik. Die Kugeln sind nur
  ein anderer Auslöser. Neuer Token `--z-orbmenu` (1450), damit die offene Säule über
  dem Backdrop und unter den Sheets liegt.
- **Nicht-Ziel geblieben:** Fotomodus, Box-/Fokus-Werkzeug und der Theme-Schalter sind
  mobil weiterhin nicht erreichbar — das war schon bei der Tab-Leiste so.
- **Wegwischen (`useSheetSwipe.ts`):** alle drei Sheets schließen per Zug nach unten.
  Griff = das Sheet außer `.shell-sidebar__body` / `.stp-body` und den Bedienelementen
  darin; geregelt über `touch-action` plus die Klasse `.sheet-dragging`, die Kurve und
  Einfahr-Animation für die Dauer des Zugs aussetzt. Schwelle als reine Funktion
  `shouldDismiss(dy, dt)` — dort liegen auch die Tests.
- **`.shell-orb__count`:** Zahl der Mehrfachauswahl als kleine Kugel oben links auf der
  Marken-Kugel. Weil das aria-label der Kugel die Zahl mitträgt, greift die
  ESC-Fokusrückgabe die Kugeln über `data-orb`, nicht mehr über ihr Label.

## Relevante Dateien
Sheet-Container (neu) + `css/components/…` · alle Panel-CSS (Media-Queries) ·
`css/layout/responsive.css` · `AppShell.tsx`
</content>
