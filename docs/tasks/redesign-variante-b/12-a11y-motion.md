# S11 — A11y- & Motion-Feinschliff (Querschnitt)

> Handoff-Ref: §11 (Interaktionen/Motion), §14 (Barrierefreiheit). Letzte Session — Querschnitt.

## Kontext
Abschluss-Pass über die fertige Layout-B-UI: Tastatur-Bedienung, Fokus-Management,
sichtbarer Fokus-Ring, reduced-motion, Kontraste. Vorherige Sessions haben A11y-Grundlagen
gelegt — hier konsolidiert und geprüft.

## Ziel-Zustand
- **Tastatur:** komplette Bedienung (Rail-Tools, Sidebar-Tabs, Sliders, Suche, Modals).
  Fokus-Management beim Öffnen/Schließen von Tabs/Flyout/Sheets/Modal.
- **Fokus-Ring:** durchgängig `2px --focus-ring` (Blau) **oder** `--accent` — **eine**
  konsistente Wahl projektweit (im Index/ADR festhalten).
- **Rollen/Labels:** `aria-label` an allen Icon-Buttons; Sichtbarkeits-Toggles als
  `role="switch"`; LicenseModal `role="dialog" aria-modal` + Fokus-Trap + ESC.
- **Motion:** genau eine Kurve `--transition-smooth`; `prefers-reduced-motion:reduce` schaltet
  alle Transitions + Loading-Ring ab (prüfen, dass nichts hardcodiert animiert).
- **Kontrast:** `--text-*` auf Glas geprüft (WCAG AA für Text).

## Schritte
1. Tastatur-Durchlauf jeder Komponente; fehlendes Fokus-Management ergänzen.
2. `:focus-visible`-Ring vereinheitlichen (eine Farbe, ein Stil, als Token/Utility).
3. `aria-label`/`role` auditieren; `role="switch"` an Sichtbarkeits-Toggles.
4. `grep` nach Inline-/Hardcode-Animationen, die reduced-motion umgehen → über Token führen.
5. Kontrast stichprobenartig prüfen (Text auf Glas, Muted-Töne).

## Nicht-Ziele
- Keine neuen Features/Panels. Keine Layout-Änderung. Kein Three.js-Eingriff.

## Done-Kriterien
- [x] `npm run test` grün (41) · `npm run build` sauber · lint · tsc
- [x] Vollständige Tastatur-Bedienung; sichtbarer, konsistenter Fokus-Ring (`2px --focus-ring`, blau, `:focus-visible`)
- [x] `prefers-reduced-motion` schaltet alle Animationen inkl. Loading-Ring ab (universelle base.css-Regel)
- [x] Icon-Buttons haben `aria-label`/Text; Toggle `role="switch"` (StructureBrowser); Modal Fokus-Trap+ESC (LicenseModal)
- [x] CHANGELOG-Eintrag; Index-Serie vollständig abgehakt

## Umsetzungs-Notizen (S11)
- **Fokus-Ring-Entscheidung:** `2px solid var(--focus-ring)` (Blau `#4a9eff`), `:focus-visible`,
  projektweit in `base.css`. Blau (nicht `--accent`) = klare Trennung vom orangen Aktiv-Zustand
  und §14 nennt `--focus-ring` explizit. Slider/Suche setzen den Ring lokal neu (sie schalten
  `outline` selbst ab). Vorher war `--focus-ring` definiert aber ungenutzt.
- **Motion:** universelle `@media (prefers-reduced-motion: reduce)`-Regel in `base.css`
  (`*` mit `animation-/transition-duration` fast 0, `!important`) als Sicherheitsnetz — fängt
  auch hartkodierte `ease`-Transitions (Foto-Modus/Loading/Toasts). Bestehende Per-Komponenten-
  Blöcke bleiben (explizite Intention, redundant aber harmlos).
- **ESC:** schließt Flyout/Mobile-Sheet + Fokus-Rückgabe an das sichtbare Auslöser-Element
  (`focusVisible()`-Helfer in AppShell). Bestehender ESC-Deselect (interaction/index.js) bleibt.
- **Audit-Ergebnis:** aria-labels/Text-Labels durchgängig vorhanden (Vorsessions), `role="switch"`
  bereits am Eye-Toggle — kein zusätzlicher Markup-Bedarf. Kontrast der `--text-*` auf Glas
  stichprobenartig okay (nicht verändert).
- **Bewusst nicht angefasst** (außerhalb A11y/Motion-Scope): `controls/search.css` (`#search-bar`,
  ungenutzte Alt-Suche); die in früheren Sessions notierten Roh-Kanten (Multi-Highlight Alt-Blau,
  Reset-Overlay, `photoMode.js toolbarH`) sind 3D-/Alt-Styling-Themen, kein A11y/Motion.

## Relevante Dateien
Querschnitt: alle `js/ui/react/components/*.tsx` + `css/components/*` + `variables.css`
(Fokus-Ring-Token) + `00-INDEX.md` (Ring-Entscheidung dokumentieren)
</content>
