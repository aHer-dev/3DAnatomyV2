# Task: Phase 4i — UX-Konsolidierung (Legacy-Sidebar → React)

## Kontext

Die App hat eine funktionierende React-UI-Schicht (Toolbar, InfoPanel, StructureBrowser, CollectionPanel) **und** ein altes Legacy-DOM-Panel (`#controls`) das per Hamburger-Button (`#menu-icon`) geöffnet wird. Beide Schichten überlappen sich: Reset und Foto existieren doppelt, Presets und Raum-Einstellungen leben noch komplett im Legacy-Panel.

Das Ergebnis sieht so aus: links öffnet ein Hamburger ein gemischtes Panel (Lernen-Link, Beleuchtungs-Slider, Emoji-Foto-Button, Presets-Dropdown, Reset, Rechtliches) — während unten in der React-Toolbar bereits Foto, Reset und Labels sitzen. Oben in der Mitte floaten die Kamera-Richtungs-Buttons (`Ant / Post / Li / Re / Kran / Kaud`) zusammenhangslos über dem Toolbar.

**Ziel:** Eine kohärente UI ohne Duplikate. Der Legacy-`#controls`-Block und `#menu-icon` werden vollständig entfernt. Presets und Raum-Einstellungen bekommen einen eigenen React-Platz.

---

## Ist-Zustand (genau)

### Legacy DOM (index.html, noch aktiv)
| Element | ID | Problem |
|---|---|---|
| Hamburger-Button | `#menu-icon` | öffnet das Legacy-Panel |
| Gesamtes Control-Panel | `#controls` | enthält alles unten |
| Lernen-Link | `#btn-learn` | nur hier |
| Raum-Einstellungen | `#room-controls` | Beleuchtung, Helligkeit, Raumfarbe — via `ui-room.js` |
| Foto-Button (Emoji) | `#btn-photo-mode` | Duplikat — React Toolbar hat schon einen |
| Presets-Dropdown | `#preset-control` | nur hier, via `ui-presets.js` |
| Reset | `#btn-reset` | Duplikat — React Toolbar hat schon einen |
| Reset Farbe | `#btn-reset-colors` | nur hier, kein React-Äquivalent |
| Tastenkürzel | `#btn-shortcuts` | Tooltip mit Shortcut-Tabelle |
| Rechtliches (im Panel) | `#legal-links-panel` | Duplikat zu Footer `#btn-toggle-legal` |
| Footer Rechtliches | `#footer` + `#legal-menu` | zweite Rechts-Sektion |

### React-Schicht (live, funktioniert)
| Komponente | Datei | Enthält |
|---|---|---|
| `Toolbar` | `js/ui/react/components/Toolbar.tsx` | Auswählen, Mehrfach, Rechteck, Fokus, Knochen, Muskeln, Strukturen, Sammlung, Reset, Foto, Labels |
| Kamera-Richtungen | in `Toolbar.tsx` als `#toolbar-dir-panel` | Ant/Post/Li/Re/Kran/Kaud — floaten über der Toolbar |
| `InfoPanel` | `js/ui/react/components/InfoPanel.tsx` | erscheint oben rechts bei Selektion |
| `StructureBrowser` | `js/ui/react/components/StructureBrowser.tsx` | Gruppen-Liste rechts |
| `CollectionPanel` | `js/ui/react/components/CollectionPanel.tsx` | Sammlung rechts |

### Bekannte Daten-Bugs
- `Skin_hair` erscheint als `Skin_hair` im StructureBrowser, weil der Key nicht in `GROUP_LABELS` (→ `js/ui/react/groupLabels.ts`) steht. Fix: `skin_hair: 'Integument'` eintragen + `GROUP_ORDER` ergänzen.

---

## Ziel-Zustand

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰ Settings]    [ Struktur suchen… ]                            │  ← oben
│                                                                  │
│                   3D-Canvas                                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ◄ Auswählen │ Knochen │ Muskeln ‖ Strukturen │ Sammlung ‖  │   │  ← Toolbar
│  │ Reset │ Foto │ Labels ‖ Ant Post Li Re Kran Kaud          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

- **☰ Settings-Button** (oben links, ersetzt `#menu-icon`) öffnet ein neues React-`SettingsPanel`
- **SettingsPanel** enthält: Raum-Einstellungen, Presets, Reset Farbe, Lernen-Link, Tastenkürzel-Tabelle, Rechtliches
- **Kamera-Richtungen** (`Ant/Post/…`) werden in die Toolbar integriert — kein separates `#toolbar-dir-panel` mehr
- **Duplikate weg**: `#btn-photo-mode`, `#btn-reset` aus `index.html` entfernt
- **Legacy DOM weg**: `#controls`, `#menu-icon`, `#footer`, `#legal-menu` aus `index.html` entfernt
- **`ui-room.js` und `ui-presets.js`** werden von React orchestriert (Logik-Funktionen bleiben als Module, DOM-Listener fliegen raus)

---

## Schritte (in dieser Reihenfolge)

### Schritt 1 — Kleiner Fix zuerst (10 min)
Datei: `js/ui/react/groupLabels.ts`
- `skin_hair: 'Integument'` in `GROUP_LABELS` ergänzen
- `'skin_hair'` ans Ende von `GROUP_ORDER` anhängen
- Test läuft mit `npm run test` (Vitest, 29 Tests → müssen grün bleiben)

### Schritt 2 — Kamera-Richtungen in Toolbar integrieren (30 min)
Datei: `js/ui/react/components/Toolbar.tsx`
- Das separate `<div id="toolbar-dir-panel">` entfernen
- Die 6 Richtungs-Buttons **innerhalb** von `<div id="anatomy-toolbar">` platzieren — nach dem letzten `<div className="toolbar-sep" />`, als eigene Gruppe mit Separator davor
- CSS: `css/components/toolbar.css` — `#toolbar-dir-panel`-Regeln löschen, Richtungs-Buttons kriegen dieselbe `toolbar-btn`-Klasse

### Schritt 3 — React `SettingsPanel`-Komponente anlegen (90 min)
Neue Datei: `js/ui/react/components/SettingsPanel.tsx`

Enthält (von oben nach unten):
1. **Raum** — Beleuchtung-Slider (0–200 %), Helligkeit-Slider (0–100 %), Raumfarbe-Picker
   - Logik-Funktionen aus `ui-room.js` extrahieren: `applyLighting(intensity)`, `updateRoomColor(color, brightness)` → direkt importierbar (kein DOM nötig)
   - State lokal in React (keine Store-Änderung nötig)
2. **Presets** — die fertige `applyPreset`-Logik aus `ui-presets.js` nutzen; React rendert die Liste via `useState + useEffect` (Manifest-Fetch beim Öffnen)
3. **Reset Farbe** — ruft `resetApp()` oder die vorhandene Reset-Farben-Funktion aus `ui-reset.js` auf
4. **Lernen** — Link-Button zu `https://aher-dev.github.io/Muskelfinder/index.html`
5. **Tastenkürzel** — statische Tabelle (G / H / S / Esc / Strg+Klick)
6. **Rechtliches** — Link-Buttons zu `quellen-lizenzen.html`, `datenschutz.html` + Lizenz-Modal-Trigger

Panel-Verhalten: Toggle-Button oben links im App-Root (`App.tsx`), gleicher Glassmorphism-Stil wie StructureBrowser (Panel rechts oder links, mit `onClose`-Prop).

### Schritt 4 — `App.tsx` verdrahten
Datei: `js/ui/react/App.tsx`
- `SettingsPanel` importieren und in `App()` einbinden
- State `settingsOpen` analog zu `browserOpen` / `collectionOpen`
- Den ☰-Button als `<button>` im React-Root rendern (nicht mehr in `index.html`)

### Schritt 5 — Legacy-DOM aus `index.html` entfernen
Entfernen:
- `<button id="menu-icon">☰</button>`
- `<div id="controls">…</div>` (der gesamte Block inkl. Raum-Controls, Foto-Button, Presets, Reset, Reset Farbe, Shortcuts, Legal-Links-Panel)
- `<footer id="footer">…</footer>` + `<div id="legal-menu">…</div>` (Rechtliches jetzt im SettingsPanel)
- `<div id="license-info">…</div>` nur wenn Lizenz-Modal in React übernommen wurde

Behalten:
- `<canvas id="canvas">` + `<div id="canvas-container">`
- `<div id="ui-root">` (React-Einstieg)
- `<div id="label-container">` (CSS2DRenderer für Labels)

### Schritt 6 — Alte JS-UI-Inits entfernen
Datei: `js/ui/ui-init.js`
- `setupRoomUI()`, `setupPresetsUI()` Aufrufe entfernen (React übernimmt)
- `#btn-photo-mode`-Listener entfernen (React Toolbar hat das)
- `#btn-reset`-Listener entfernen (React Toolbar hat das)
- Wenn `setupRoomUI` und `setupPresetsUI` danach keine Aufrufer mehr haben → `ui-room.js` und `ui-presets.js` löschen (DOM-Listener-Code) und die reinen Logik-Funktionen direkt in `SettingsPanel.tsx` einziehen

### Schritt 7 — CSS bereinigen
- `css/controls/sidebar.css` → löschen (wenn `#controls` weg)
- `css/controls/buttons.css` → `#btn-reset`, `#btn-photo-mode`, `#btn-reset-colors`-Regeln entfernen
- `css/layout/responsive.css` → Legacy-Sidebar-Breakpoints entfernen
- `#toolbar-dir-panel`-Regeln aus `css/components/toolbar.css` entfernen

---

## Nicht-Ziele (nicht anfassen)

- Keine Three.js-Logik ändern
- Kein Umbau des Stores
- Kein Styling-Redesign — Glassmorphism-Tokens beibehalten
- `ui-room.js` und `ui-presets.js`: Logik-Funktionen **dürfen** importiert werden, aber die Dateien nicht refaktorisieren — nur die DOM-Listener-Schicht entfernen
- Keine neuen Features (kein Querschnitt, kein Onboarding)
- `index.html` CSP bleibt unverändert

---

## Done-Kriterien

- [ ] `npm run test` → grün (29 Tests + evtl. neue für groupLabels)
- [ ] `npm run build` → kein TS-Fehler, kein Lint-Fehler
- [ ] `#controls`, `#menu-icon`, `#footer` nicht mehr in `index.html`
- [ ] SettingsPanel öffnet sich per ☰-Button (React), enthält Raum/Presets/Shortcuts/Rechtliches
- [ ] Kamera-Richtungen in der Toolbar, kein separates floating div
- [ ] `Skin_hair` erscheint als `Integument` im StructureBrowser
- [ ] Foto-Button und Reset-Button nur noch in der React-Toolbar
- [ ] CHANGELOG.md-Eintrag unter `[Unreleased]`

---

## Relevante Dateien

| Datei | Rolle |
|---|---|
| `index.html` | Legacy-DOM — wird stark verkleinert |
| `js/ui/react/App.tsx` | Root — SettingsPanel + ☰-Button hier einbauen |
| `js/ui/react/components/Toolbar.tsx` | Kamera-Richtungen rein, `#toolbar-dir-panel` raus |
| `js/ui/react/components/SettingsPanel.tsx` | **neu anlegen** |
| `js/ui/react/groupLabels.ts` | `skin_hair` Eintrag ergänzen |
| `js/ui/ui-room.js` | Logik-Funktionen extrahieren, DOM-Listener entfernen/löschen |
| `js/ui/ui-presets.js` | `applyPreset` bleibt, DOM-Init entfernen/löschen |
| `js/ui/ui-init.js` | Aufrufe für Room/Presets/Legacy-Buttons entfernen |
| `css/controls/sidebar.css` | löschen |
| `css/components/toolbar.css` | `#toolbar-dir-panel`-Regeln entfernen |
