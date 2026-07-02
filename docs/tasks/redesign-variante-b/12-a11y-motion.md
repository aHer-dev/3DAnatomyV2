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
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] Vollständige Tastatur-Bedienung; sichtbarer, konsistenter Fokus-Ring
- [ ] `prefers-reduced-motion` schaltet alle Animationen inkl. Loading-Ring ab
- [ ] Icon-Buttons haben `aria-label`; Toggles `role="switch"`; Modal Fokus-Trap+ESC
- [ ] CHANGELOG-Eintrag; Index-Serie vollständig abgehakt

## Relevante Dateien
Querschnitt: alle `js/ui/react/components/*.tsx` + `css/components/*` + `variables.css`
(Fokus-Ring-Token) + `00-INDEX.md` (Ring-Entscheidung dokumentieren)
</content>
