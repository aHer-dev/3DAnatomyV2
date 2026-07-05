# Redesign „Variante B" — Session-Plan (Master-Index)

> Umsetzung des Design-Handoffs `docs/design_handoff_anatomie_3d/` in mehreren
> Claude-Code-Sessions. **Quelle der Wahrheit für Specs** ist der Handoff
> (`README.md` + `variables.css` + `DESIGN_BRIEF.md` + die `.dc.html`-Referenzen).
> Diese Briefings duplizieren keine Farb-/Maß-Werte — sie verweisen auf die §-Nummern
> des Handoff-README und ergänzen nur das **Codebase-Wie** (welche Datei, welcher
> Store-Slice, was raus, Done-Kriterien).

Ziel: Overlay-UI (React + CSS + Tokens) auf die Marke „Anatomie Fokus" (Schwarz/Orange,
Sora/Manrope, Glassmorphism) + **Layout B** (Icon-Rail links + persistente Tab-Sidebar
rechts). Three.js/Canvas und der Store-Kontrakt bleiben unangetastet (nur Store *erweitern*).

---

## ▶ Stand & hier weiter (für die nächste Session)

- **Branch:** `refactor/ui-consolidation`. **Erledigt & committet** (bis inkl. S9): **S0–S4**
  (Tokens/Fonts, App-Shell Layout B mit ADR 0006, StructureBrowser, InfoPanel, SearchBar) +
  Perf-Fixes (Glas-Blur 22→14px, Labels ohne `backdrop-filter`) + ADR 0007/BatchedMesh-Plan,
  **S5–S7** (`3dcaa0a`: ViewCluster, Sammlung-Tab, Multi/Isolation in der Sidebar),
  **S8** (`1e3b18d`: SettingsPanel als Rail-Flyout, Frame 2f) und **S9** (Footer §9.9,
  LicenseModal §9.10 mit Fokus-Trap, Marken-LoadingScreen §9.11 + `loading`-Slice/ADR 0008,
  Favicons/Manifest §15). lint · `tsc` · 38 Tests · build grün; S6–S9 headless verifiziert.
- **Sichtprüfung:** S1–S8 vom Nutzer abgenommen (S1–S6 „bisher alles okay", S7+S8 „sieht gut
  aus", beides 2026-07-05). **S9 Sichtprüfung offen.** Bewusste Beibehaltung aus §-Specs: S2-Zeile hat zusätzlich einen
  Laden/Entladen-Button (`+`/`✕`); S3-InfoPanel hat zusätzlich einen Farbwahl-Block (beides
  nicht in §9.3/§9.4 — Funktions-Erhalt; S8-Prüfung: Farbwahl ist **pro Struktur**, gehört
  nicht in globale Settings → bleibt im InfoPanel). S5: Cluster hat zusätzlich „Unten"/kaudal;
  Reset = Voll-Reset `resetApp()` (wie zuvor). S6: Sammel-Zeilen-Klick fokussiert **ohne**
  `setSelection` (sonst Auto-Switch-Yank); „Alle fokussieren" = bisheriges „Nur Sammlung
  anzeigen". S7: Sammel-Ansicht schon ab 1 Struktur (Briefing: >1 — sonst wäre der Info-Tab
  im Multi-Modus anfangs leer); Batch-Farbe/-Deckkraft als Sekundär-Block erhalten;
  Multi-Highlight im Canvas ist noch Alt-Blau (`0x1a1a4a` in `multiSelect.js`) statt
  `--accent` — 3D-seitig, bewusst nicht in S7 (Kandidat S11/Mini-Task). S8: Presets bleiben
  die **Manifest-Anatomie-Presets** als Liste — die 2f-Segmented „Studio/Klinisch/Kontrast"
  wären neue Beleuchtungs-Presets (Nicht-Ziel); Custom-Hintergrundfarbe + „Raum zurücksetzen"
  als Funktions-Erhalt behalten; kein `room`-Store-Slice (Zustand bleibt in `roomSettings.js`,
  einziger Konsument ist das Panel → kein ADR); Tastenkürzel = echte App-Shortcuts statt der
  2f-Beispiele (F/I/Leertaste existieren nicht).
- **Perf-Kontext (wichtig für alle folgenden Sessions):** Die App ist auf schwacher Hardware
  Draw-Call-/Blur-limitiert. **Keine neuen dauerhaft sichtbaren `backdrop-filter`-Flächen**
  oder Viele-DOM-Blur-Elemente über dem Canvas einführen. Details: ADR 0007 + `project_perf_glass_blur`.
- **NÄCHSTER SCHRITT: S10** — `11-mobile-sheets.md` (Mobile: Bottom-Sheets + Tab-Leiste +
  Safe-Area; dort auch `photoMode.js` `toolbarH=72`).
- **S9-Notizen:** `loading`-Slice + `progress.js` als Adapter (ADR 0008), „Willkommen!"-
  Verweilzeit entfällt; React mountet jetzt **auch im Muskelfinder-Preview-Modus** (nur
  LoadingScreen — sonst kein Ladeindikator im Preview); LicenseModal als **Portal an
  `document.body`** (backdrop-filter-Panels = Containing Block für `position:fixed`);
  Footer behält BP3D-Attributionszeile (CC-BY-Pflicht, ADR 0005).
- **Bewusste Roh-Kanten** (jeweils in eigener Session): `photoMode.js` hat noch `toolbarH=72`
  (Mobile, S10). Esc-Shortcut nach Multi-Auswahl lässt die Geister-Selektion aus `pickAt()`
  stehen (Info-Tab bleibt leer offen — Panel-Aktionen sind gefixt, `interaction/index.js`
  bewusst nicht angefasst). Offenes Settings-Flyout überlappt auf 1440px den linken Rand des
  ViewClusters um ~19px (Cluster `left:41%` aus 2a–2e vs. Flyout-Breite aus 2f — 2f zeigt
  keinen Cluster; Kandidat S11-Feinschliff). Reset-Overlay in `ui-reset.js` ist noch
  Alt-Styling (grün/Arial, injiziertes CSS) — Kandidat S11/Mini-Task.
- **Arbeitsweise:** immer nur die im jeweiligen `NN-*.md` genannten Dateien anfassen, Abschluss =
  test+build grün + CHANGELOG + Kästchen unten abhaken.

---

## Wie eine Session läuft (Protokoll für jede frische KI-Session)

1. **Diesen Index lesen** + das eigene Session-Briefing `NN-*.md`.
2. Handoff-README offen halten; genannte §-Abschnitte sind verbindlich (Hi-Fi, pixelgenau).
3. Nur die im Briefing genannten Dateien anfassen. **Nicht-Ziele respektieren.**
4. Abschluss jeder Session (hart):
   - `npm run test` grün · `npm run build` ohne TS-/Lint-Fehler
   - CHANGELOG.md-Eintrag unter `[Unreleased]`
   - Fortschritt hier im Index abhaken (Kästchen unten)
   - App startet und ist bedienbar — **kein halb-kaputter Zwischenstand**
5. Bei Architektur-Entscheidung (z. B. neuer UI-Store-Slice): ADR in `docs/decisions/`.

## Gemeinsame Regeln (gelten in ALLEN Sessions)

- Tokens nur aus `css/theme/variables.css` — **keine Hardcodes** in Komponenten.
- Eine CSS-Datei pro Komponente unter `css/components/<name>.css`, in `main.css` importiert.
- `pointer-events: all` auf jedem interaktiven Panel (`#ui-root` ist `pointer-events:none`).
- Strukturnamen immer über `getStructureDisplayLabel()` (Latein). UI-Chrome bleibt Deutsch.
- Kein Tailwind, keine externen Fonts/CDN/Icons, kein `localStorage`, keine `window.*`.
- React↔3D nur über den Zustand-Store. Store darf **erweitert**, nicht umgebaut werden.
- TypeScript strict, kein `any` in Kernpfaden. Komponenten sind `.tsx`.
- `prefers-reduced-motion` respektieren; genau eine Motion-Kurve (`--transition-smooth`).

## Codebase-Ausgangslage (Stand bei Planerstellung, 2026-07-02)

- `js/ui/react/App.tsx` hält Panel-Offen-State **lokal** (`useState` browserOpen/
  collectionOpen/settingsOpen) — es gibt noch **keinen** UI-Slice im Store.
- `js/store/useStore.ts` hat Domänen-State (groups, selected, isolation, collection,
  colors, opacity, groupOpacity …) — aber keine UI-/Room-/Loading-/Sidebar-Slices.
- Bestehende React-Komponenten (alle floatend, Layout A): `Toolbar, SearchBar, InfoPanel,
  MultiSelectPanel, CollectionPanel, SettingsPanel, IsolationBar, Footer`. **`LicenseModal.tsx`
  und `LoadingScreen` sind noch React-seitig zu prüfen/erstellen.**
- CSS: `css/theme/variables.css` ist noch die **alte Navy/Blau**-Version, `base.css`
  hat Navy-Body-Verlauf + Inter. `css/components/dropdowns.css` ist tot, wird noch importiert.
- Keine `public/fonts/` vorhanden.

---

## Session-Reihenfolge & Status

Reihenfolge folgt Handoff §17. Später-Sessions bauen auf früheren auf — **nicht umsortieren**.

- [x] **S0** — Fundament: Tokens, Fonts, Cleanup — `01-fundament-tokens-fonts.md` ✅ (Fonts in `public/fonts/`, Build grün)
- [x] **S1** — App-Shell Layout B: Icon-Rail + Tab-Sidebar-Gerüst + UI-Slice — `02-appshell-rail-sidebar.md` ✅ (volle Umstellung: Toolbar ersetzt, Panels in Tabs gehostet, ADR 0006; Sichtprüfung offen)
- [x] **S2** — StructureBrowser → Tab „Strukturen" — `03-structure-browser.md` ✅ (§9.3-Zeile: Auge 17px/Farbpunkt 11px/Röntgen-Slider 60×4; `shell-host`-Override für den Tab abgelöst; Sichtprüfung offen)
- [x] **S3** — InfoPanel → Tab „Info" + Auto-Switch — `04-info-panel.md` ✅ (§9.4: Sora-Titel 21px, Gruppen-Badge, Deckkraft-Slider `--accent`, 3 Icon-Aktionen, CTA Outline; `shell-host` abgelöst; Farbwahl als Sekundär-Block beibehalten; Sichtprüfung offen)
- [x] **S4** — SearchBar → Sidebar-Kopf — `05-search-bar.md` ✅ (persistente Pille §9.2, Dropdown mit Treffer-Header/Farbpunkt/Fuzzy-Highlight in Orange; kein eigener Blur; Sichtprüfung offen)
- [x] **S5** — Ansichts-Cluster (untere Leiste) — `06-view-cluster.md` ✅ (`ViewCluster.tsx` + `view-cluster.css`, Frame-Maße `left:41%`/38px-Buttons, Reset aus der Rail hierher; Sichtprüfung offen)
- [x] **S6** — CollectionPanel → Tab „Sammlung" — `07-collection-panel.md` ✅ (Frame 2c: „Gespeichert · N", flache Zeilen mit Fokus/Trash, CTA „Alle fokussieren"; Fokus ohne Selection-Yank; `shell-host` entfernt; Sichtprüfung offen)
- [x] **S7** — MultiSelect + IsolationBar (Info-Tab-Varianten + Banner) — `08-multiselect-isolation.md` ✅ (Frame 2d/2e: Sammel-Ansicht im Info-Tab, Isolation-Banner + Untertitel statt Floating-Bars, `isolation.label` additiv, `panels.css` gelöscht; Sichtprüfung offen)
- [x] **S8** — SettingsPanel → Rail-Flyout — `09-settings-flyout.md` ✅ (Frame 2f: `left:100px`, Raum-Slider/Swatches, Manifest-Presets, Key-Caps, Footer mit Farben-Reset + Lizenzen→LicenseModal; kein `room`-Slice; Sichtprüfung offen)
- [x] **S9** — Footer + LicenseModal + LoadingScreen + Branding/Favicon — `10-footer-modal-loading.md` ✅ (§9.9-Fuß + BP3D-Zeile, §9.10-Modal mit Fokus-Trap als Body-Portal, §9.11-LoadingScreen + `loading`-Slice/ADR 0008, §15-Favicons + Manifest; Sichtprüfung offen)
- [ ] **S10** — Mobile: Bottom-Sheets + Tab-Leiste + Safe-Area — `11-mobile-sheets.md`
- [ ] **S11** — A11y- & Motion-Feinschliff (Querschnitt) — `12-a11y-motion.md`

## Abhängigkeits-Graph (kurz)

```
S0 (Fundament) ─┬─> S1 (Shell/Slice) ─┬─> S2 Strukturen
                │                      ├─> S3 Info ──> S7 Multi/Isolation
                │                      ├─> S4 Search
                │                      ├─> S6 Sammlung
                │                      └─> S8 Settings-Flyout
                └─> S5 Ansichts-Cluster (unabhängig, nach S1)
S9 (Footer/Modal/Loading) — nach S1, sonst unabhängig
S10 (Mobile) — nach dem alle Panels umgezogen sind (nach S2–S9)
S11 (A11y/Motion) — ganz zum Schluss, Querschnitt über alles
```

## Nicht-Ziele der GESAMTEN Serie

- Kein Three.js/Canvas-Eingriff. Keine neuen Anatomie-Features.
- Kein Store-**Umbau** (nur additive UI-Slices). Keine CSP-Änderung.
- Kein React Three Fiber. Keine neue State-Library.
- Keine fremden 3D-Modelle/Assets ohne geklärte Lizenz (Fonts: SIL OFL 1.1, ok).
</content>
</invoke>
