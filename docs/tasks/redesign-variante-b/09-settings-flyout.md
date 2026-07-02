# S8 — SettingsPanel → Rail-Flyout

> Handoff-Ref: §9.7 (Sektionen Raum/Preset/Kürzel/Footer), §10 (Flyout aus der Rail, `left:100px`, Frame `2f`).

## Kontext
Einstellungen werden über ⚙ (unten in der Rail) geöffnet — als **Flyout-Panel neben der
Rail** (`left:100px`), während die rechte Sidebar als Kontext bestehen bleibt. Exklusivität
über `openFlyout` (aus S1-Store-Slice).

## Ist-Zustand
- `js/ui/react/components/SettingsPanel.tsx` + `css/components/settings-panel.css`.
- Raum-/Preset-Logik existiert (aus Phase-4i in React orchestriert).
- Room-State liegt heute evtl. lokal in React — prüfen, ob ein `room`-Store-Slice sinnvoll ist
  (Handoff §12 schlägt `room` vor). Falls ja: **additiv** ergänzen (ADR), sonst lokal belassen.

## Ziel-Zustand (§9.7)
- Flyout links aus der Rail (`left:100px`, eigenes Glas-Panel, scrollbar, `radius:20px`).
- Sektionen mit Uppercase-Headern (`--text-faint`, `.12em`):
  - **Raum:** Helligkeit-Slider · Umgebungslicht-Slider · Hintergrund-Swatches
    (Schwarz `#0b0b0b` aktiv mit `--accent`-Ring · Anthrazit · Navy).
  - **Preset:** Segmented `Studio · Klinisch · Kontrast` (aktiv `--accent-tint`/`--accent`).
  - **Tastenkürzel:** Key-Caps (F/I/Leertaste …).
  - **Footer:** `Farben zurücksetzen` (`--accent`) + „Lizenzen"-Link → LicenseModal (S9).
- Flyout ist exklusiv (`openFlyout==='settings'`); Öffnen schließt anderes über `closeFlyout`.

## Schritte
1. SettingsPanel als Rail-Flyout positionieren (§9.7-Maße + Tokens); an `openFlyout` binden.
2. Sektionen an bestehende Room-/Preset-/Reset-Logik anbinden. Falls `room`-Slice: Store +
   Tests + ADR.
3. „Lizenzen"-Link triggert LicenseModal-State (Modal-Umsetzung in S9; hier nur Trigger vorbereiten).

## Nicht-Ziele
- Kein Preset-/Beleuchtungs-Algorithmus ändern. Kein Mobile-Sheet (S10).

## Done-Kriterien
- [ ] `npm run test` grün · `npm run build` sauber
- [ ] ⚙ öffnet Flyout links neben der Rail; Sidebar bleibt sichtbar
- [ ] Raum/Preset/Kürzel/Reset funktionieren; „Lizenzen"-Link vorhanden
- [ ] CHANGELOG-Eintrag (+ ADR falls `room`-Slice)

## Relevante Dateien
`js/ui/react/components/SettingsPanel.tsx` · `css/components/settings-panel.css` ·
`js/store/useStore.ts` (nur falls `room`-Slice) · `AppShell.tsx`
</content>
