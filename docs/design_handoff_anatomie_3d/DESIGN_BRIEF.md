# Design-Brief — Anatomie Fokus 3D

> Für eine Design-fokussierte KI-Session. Diese Datei ist **selbsttragend**: alles,
> was du brauchst, um passende Mockups **und** lauffähigen Code zu erzeugen, steht hier.
> Ziel: eine kohärente, moderne UI über einem 3D-Canvas — „medical atlas, scientific-clean".

---

## 1. Produkt & Zielgruppe
3D-Anatomie-Webapp für **Studierende der Physio-, Ergo- und Logopädie**. Ein 3D-Modell
des Körpers, aus dem einzelne Strukturen (Knochen, Muskeln …) geladen, gefärbt,
isoliert, fokussiert und beschriftet werden. Statische Seite (kein Backend, kein Login).

**Nutzungskontext:** gelernt wird am Laptop **und mobil** (Bahn, Bibliothek). Touch-UX und
Ladezeit auf Mittelklasse-Smartphones sind echte Anforderungen, kein Nice-to-have.

**Ton:** seriös, wissenschaftlich, ruhig. Kein verspieltes Consumer-Design. Referenz:
digitaler Anatomie-Atlas, klinisch-sauber, dunkel.

---

## 2. Harte Constraints (nicht verhandelbar — Code, der das verletzt, ist unbrauchbar)

| Regel | Konsequenz fürs Design |
|---|---|
| **React nur als Overlay** über dem Three.js-Canvas | Kein Full-Page-Layout; UI „schwebt" über 3D. Hintergrund ist immer der Canvas. |
| **Kein Tailwind** | Styling = **CSS Custom Properties + eine CSS-Datei pro Komponente**. Keine Utility-Klassen. |
| **CSP streng** (`default-src 'self'`, `font-src 'self'`, `connect-src 'self'`) | **Keine externen Fonts** (kein Google Fonts), keine CDN-Assets, keine externen Icons. Nur System-Fonts oder self-hosted. Inline-`style` ist erlaubt. |
| **Keine `localStorage`/Browser-Storage** in Komponenten | Kein „Einstellungen merken" über Storage. State lebt im Zustand-Store (nur Laufzeit). |
| **Nomenklatur: nur Latein** | Strukturnamen immer über `getStructureDisplayLabel()`. **Kein Deutsch**, kein Sprach-Toggle im UI. |
| **Canvas bleibt unangetastet** | Three.js ist imperativ. Design berührt **nur** React + CSS, nie den 3D-Code. |
| **State nur über den Zustand-Store** | React↔3D reden ausschließlich über den Store. Keine direkten Three-Zugriffe, keine `window.*`. |
| **TypeScript strict** | Komponenten sind `.tsx`, kein `any` in Kernpfaden. |

**Pointer-Events / z-index (wichtig fürs Overlay):**
Der React-Mount (`#ui-root`) hat `pointer-events: none` und `z-index: 20`, damit Maus-/
Touch-Events zum Canvas durchgehen. **Jedes interaktive Panel muss `pointer-events: all`
selbst setzen** (sonst sind Buttons tot). z-index kommt aus Tokens (s. u.).

---

## 3. Design-Sprache
- **Dunkel**, Body-Hintergrund ist ein Verlauf `#0a0e27 → #151933` (diagonal 135°).
- **Glassmorphism**: halbtransparente Panels mit `backdrop-filter: blur()`, feiner
  1px-Rand in `rgba(255,255,255,0.08)`, weicher Schatten, großzügige Radien.
- **Akzente sparsam**: Blau `#4A9EFF` (primär, Fokus/aktiv), Orange `#FF7A4A` (sekundär, selten).
- **Typo**: System-Font-Stack (kein Webfont ladbar). Labels oft `uppercase` +
  `letter-spacing` für den „klinischen" Look. Gewichte 400/600/800.
- **Bewegung**: eine Kurve für alles — `cubic-bezier(0.4, 0, 0.2, 1)`, ~0.3s.
  `prefers-reduced-motion` respektieren.

---

## 4. Design-Tokens (echte Werte — `css/theme/variables.css`)
**Immer diese Variablen benutzen, nie Hardcodes.** Redesign startet hier.

```css
:root {
  /* Hintergrund */
  --color-bg-dark: #0a0e27;
  --color-bg-secondary: #151933;

  /* Glass */
  --glass-bg: rgba(255,255,255,0.03);
  --glass-bg-hover: rgba(255,255,255,0.06);
  --glass-bg-panel: rgba(30,35,55,0.92);
  --glass-bg-controls: rgba(20,25,45,0.85);
  --glass-border: rgba(255,255,255,0.08);
  --glass-shadow: 0 8px 32px 0 rgba(0,0,0,0.37);
  --glass-blur: blur(12px);
  --glass-blur-strong: blur(20px);

  /* Akzente */
  --accent-blue: #4A9EFF;
  --accent-blue-dim: rgba(74,158,255,0.1);
  --accent-orange: #FF7A4A;

  /* Text */
  --text-primary: rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.80);
  --text-muted: rgba(255,255,255,0.55);

  /* Spacing */
  --spacing-sm: 8px;  --spacing-md: 16px;  --spacing-lg: 24px;

  /* Radien */
  --radius-sm: 8px;  --radius-md: 12px;  --radius-lg: 16px;  --radius-xl: 24px;

  /* z-index-Ebenen */
  --z-canvas: 1;  --z-controls: 100;  --z-info-panel: 1000;  --z-menu-icon: 1100;

  /* Transition */
  --transition-smooth: all 0.3s cubic-bezier(0.4,0,0.2,1);
}
```
> Fehlende Tokens (z. B. Erfolg/Warnung-Farben, weitere Spacing-Stufen, Font-Sizes) dürfen
> **ergänzt** werden — aber in `variables.css`, nicht als Hardcode in Komponenten.

---

## 5. Anatomische Gruppenfarben (semantisch — `js/config/config.ts`)
Diese Farben stehen für 3D-Struktur-Gruppen und sollten in Legenden/Badges/Indikatoren
konsistent auftauchen:

| Gruppe | Farbe | |
|---|---|---|
| bones / teeth | `#E8E6DD` | knochen-elfenbein |
| muscles | `#E85861` | muskel-rot |
| nerves | `#FFD166` | nerv-gelb |
| cartilage | `#9FC6E5` | knorpel-hellblau |
| default (Rest) | `#CCCCCC` | neutralgrau |

Aktuell im UI freigeschaltet sind nur **bones, muscles, cartilage, ligaments, teeth**
(`js/ui/react/groupLabels.ts` → `ENABLED_GROUPS`). Weitere Gruppen kommen später dazu —
Design sollte mit **bis zu 16 Gruppen** skalieren (kein hartkodiertes 5er-Layout).

---

## 6. Glassmorphism-Rezept (copy-paste-Basis für Panels)
So sehen bestehende Panels aus (`css/components/structure-browser.css`). Neue Panels bitte
im selben Muster:

```css
.panel {
  position: fixed;
  pointer-events: all;                      /* PFLICHT auf interaktiven Overlays */
  background: var(--glass-bg-controls);
  backdrop-filter: var(--glass-blur-strong);
  -webkit-backdrop-filter: var(--glass-blur-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow);
  color: var(--text-primary);
  overflow: hidden;
}
.panel__header {                            /* klinischer Header-Look */
  font-size: 0.85rem; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  border-bottom: 1px solid var(--glass-border);
  padding: 14px var(--spacing-md);
}
```

---

## 7. Layout & bestehende Komponenten
Der Canvas füllt den Bildschirm. Darüber schweben React-Overlays. Grobe Karte:

```
┌────────────────────────────────────────────────────────────┐
│                                      [🔍 Suche]   (top-right)│
│                                                             │
│                     3D-CANVAS (Vollbild)                    │
│                                     ┌─ InfoPanel (bei Wahl) ┐│
│                                     └───────────────────────┘│
│                                     ┌ StructureBrowser ┐     │
│                                     │ (bottom-right)    │     │
│         ┌──────── Toolbar (bottom-center) ────────┐         │
│  Footer │ Auswählen · Knochen · Muskeln · … · ⚙︎  │         │
└────────────────────────────────────────────────────────────┘
```

**Komponenten (`js/ui/react/components/`, alle `.tsx`):**

| Komponente | Rolle | Position |
|---|---|---|
| `Toolbar` | Haupt-Leiste: Auswahl-Tools, Gruppen laden, Reset, Foto, Labels, Kamera-Richtungen, Panel-Toggles (⚙︎ Settings) | unten mittig (`bottom:20px; left:50%`) |
| `SearchBar` | einklappbare Fuzzy-Suche (Lupe-Toggle) | oben rechts (`top:16px; right:16px`) |
| `StructureBrowser` | Gruppen-Liste mit Sichtbarkeits-Checkbox, Farb-Indikator, Röntgen-Slider pro Layer | unten rechts, `width:260px` |
| `InfoPanel` | Details der gewählten Struktur: Latein-Name, Gruppe, Farbe, Opazität, Ausblenden/Isolieren/Kontext, „zur Sammlung" | oben rechts (bei Selektion) |
| `MultiSelectPanel` | Mehrfachauswahl-Aktionen | erscheint bei Multi-Select |
| `CollectionPanel` | gesammelte Strukturen, Klick-zum-Fokussieren | rechts (Toggle) |
| `SettingsPanel` | Raum (Licht/Helligkeit/Farbe), Presets, Farb-Reset, Tastenkürzel, Rechtliches | Panel (⚙︎-Toggle) |
| `IsolationBar` | Aktionsleiste im Isolations-Modus | kontextuell |
| `Footer` | Lernen-Link, Lizenz, Quellen, Datenschutz | unten |
| `LicenseModal` | Attribution/Lizenzen (Modal) | zentriert |

**Panel-Verhalten:** `App.tsx` erlaubt nur **eines** von Browser/Collection/Settings offen
(`closeAll()`-Muster). Neue Panels konsistent so einhängen.

---

## 8. CSS-Architektur & Namenskonvention
- Einstieg: `css/main.css` (`@import` aller Komponenten-Dateien). Pro Komponente **eine**
  Datei unter `css/components/<name>.css`.
- Namensschema: kurzer Komponenten-Präfix + BEM-artig — z. B. `.sb-panel`, `.sb-header`,
  `.sb-close` (StructureBrowser). Neue Komponente → eigener Präfix, eigene CSS-Datei, in
  `main.css` importieren.
- **Tote Datei:** `css/components/dropdowns.css` gehört zur entfernten Dropdown-Navigation
  und wird nirgends mehr benutzt — beim Redesign entfernen (aus `main.css` + Datei).

---

## 9. Barrierefreiheit & Mobile
- A11y-Grundlagen sind da (`aria-label`, `role`, `aria-modal` in Modals) — **beibehalten/ausbauen**.
  Fokus-Management in Panels, komplette Tastatur-Bedienung anstreben.
- `prefers-reduced-motion` beachten (Animationen abschaltbar).
- **Mobile ist Pflicht:** Jede Komponente hat aktuell nur 1 kleinen Breakpoint. Für ein
  Redesign gewünscht: Bottom-Sheet statt seitlicher Panels auf Schmal-Screens, Touch-taugliche
  Trefferflächen (≥44px), Toolbar nicht überladen. `viewport-fit=cover` ist gesetzt →
  Safe-Area-Insets (`env(safe-area-inset-*)`) berücksichtigen.

---

## 10. Was du liefern sollst
1. **Mockup zuerst** (ASCII/Markdown oder inline-styled HTML-Snippet), damit die Richtung
   vor dem Code stimmt. Dunkler Canvas-Hintergrund als Kontext mitdenken.
2. **Dann Code**: `.tsx`-Komponente(n) + zugehörige `css/components/<name>.css`, die
   ausschließlich die Tokens aus §4 nutzen. Kein Tailwind, keine externen Assets.
3. **Isoliert pro Komponente** arbeiten (eine Komponente / ein Auftrag), nicht „alles neu".
4. Wenn du Tokens ergänzt: in `variables.css`, mit kurzer Begründung.

---

## 11. Do / Don't (Schnell-Checkliste)
**Do:** Tokens statt Hardcodes · `pointer-events:all` auf interaktiven Panels · System-Fonts ·
Latein über `getStructureDisplayLabel()` · mit 16 Gruppen skalierbar · mobil (Bottom-Sheet,
Safe-Area) · `prefers-reduced-motion` · glassmorphism-Rezept aus §6.

**Don't:** kein Tailwind · keine Google/CDN-Fonts oder externen Icons (CSP blockt) · kein
`localStorage` · kein Deutsch/Sprach-Toggle im UI · Canvas/Three-Code nicht anfassen ·
keine `window.*`-Globals · keine harten Farb-/Größenwerte, wo ein Token existiert.
