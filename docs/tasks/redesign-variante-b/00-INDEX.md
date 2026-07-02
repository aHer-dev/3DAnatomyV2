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
- [ ] **S2** — StructureBrowser → Tab „Strukturen" — `03-structure-browser.md`
- [ ] **S3** — InfoPanel → Tab „Info" + Auto-Switch — `04-info-panel.md`
- [ ] **S4** — SearchBar → Sidebar-Kopf — `05-search-bar.md`
- [ ] **S5** — Ansichts-Cluster (untere Leiste) — `06-view-cluster.md`
- [ ] **S6** — CollectionPanel → Tab „Sammlung" — `07-collection-panel.md`
- [ ] **S7** — MultiSelect + IsolationBar (Info-Tab-Varianten + Banner) — `08-multiselect-isolation.md`
- [ ] **S8** — SettingsPanel → Rail-Flyout — `09-settings-flyout.md`
- [ ] **S9** — Footer + LicenseModal + LoadingScreen + Branding/Favicon — `10-footer-modal-loading.md`
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
