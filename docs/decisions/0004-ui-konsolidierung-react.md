# ADR 0004: Chrome-UI vollständig in React, DOM-Hamburger entfernt

## Status: akzeptiert · 2026-06-24

## Kontext
Nach den Phasen 3a–3h lag die UI doppelt vor: ein React-Overlay (Suche, Toolbar,
Info-/Multi-/Sammlung-Panel, StructureBrowser) **und** parallel das alte DOM-
Hamburger-Menü (`#menu-icon` → `#controls`) plus DOM-Footer. Das Menü enthielt
teils Funktionen, die es in React schon gab (Reset, Foto — Doppelung), teils
einzigartige (Raum-/Lichteinstellungen, Preset-Bibliothek, Reset-Farbe,
Tastenkürzel, Lizenz/Rechtliches, Lernen-Link). Die Rechtliches-Links existierten
sogar dreifach (`#controls` + Footer). Verdrahtet war das über sechs Legacy-Module
(`ui-init`, `ui-controls`, `ui-room`, `ui-presets`, `license`, `licenseContent`).

Vor einem geplanten Interface-Neuentwurf sollten die Grundfunktionen stabil und
in **einer** Schicht liegen.

## Entscheidung
Alle verbleibenden Chrome-Funktionen wandern nach React; das DOM-Hamburger-Menü,
der DOM-Footer und die sechs Legacy-Module werden gelöscht.

- **Einzigartige 3D-Logik wird portiert, nicht neu erfunden** (CLAUDE.md): neue
  DOM-freie, imperative Feature-Module `features/roomSettings.js` und
  `features/presets.js` halten die Three-/Daten-Logik; React ruft sie direkt auf.
- Neue React-Komponenten: `SettingsPanel` (Raum, Reset-Farbe, Presets,
  Tastenkürzel), `Footer` + `LicenseModal` (Lizenz, Quellen, Datenschutz, Lernen).
- Zustands-Reaktivität weiter über den Store; **imperative Aktionen** (resetApp,
  enterPhotoMode, applyLighting …) werden — wie schon in der React-Toolbar — direkt
  aufgerufen. Der Store hält keinen Raum-/Preset-Zustand.
- Raum-/Licht-Defaults werden beim Start über `initRoomSettings()` in `startApp`
  gesetzt (ersetzt den Init aus dem gelöschten `setupRoomUI`).

## Konsequenzen
- `index.html` enthält nur noch Canvas + React-Mountpunkt (`#ui-root`).
- Single Source für UI = React; kein paralleles DOM-Chrome mehr, keine Doppelungen.
- Tote CSS entfernt (`presets.css`, `footer.css`, `controls/buttons.css` sowie die
  `#menu-icon`/`#controls`/`#room-controls`-Regeln); CSS-Bundle −~13 KB.
- Preset-Bibliothek bleibt funktionsgleich (liest `data/presets/index.json`).
- Pixel-/3D-Verhalten ist nicht unit-getestet → manuelle Sichtprüfung im Browser
  nötig (Raumregler, Presets, Lizenz-Modal, Foto-Modus).
