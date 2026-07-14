# Handoff: Anatomie Fokus — 3D-Anatomie-UI (Rebranding auf „Variante A")

> Für Claude Code. Dieses Paket beschreibt das **Redesign der React-Overlay-UI** der
> 3D-Anatomie-Webapp im neuen Marken-Look (tiefes Schwarz + Orange, Sora/Manrope,
> Glassmorphism). Es ist **selbsttragend**: Tokens, Komponenten-Specs, CSS-Rezepte,
> TSX-Struktur, Zustände und Mobile stehen hier vollständig.

---

## 1. Überblick
Die App zeigt ein 3D-Körpermodell (Three.js), über dem eine React-UI **schwebt**. Aus dem
Modell werden Strukturen geladen, gefärbt, isoliert, fokussiert und beschriftet. Zielgruppe:
Studierende der Physio-, Ergo- und Logopädie; genutzt am Laptop **und mobil**.

**Ziel dieses Auftrags:** die vorhandene Overlay-UI (Toolbar, SearchBar, StructureBrowser,
InfoPanel, MultiSelectPanel, IsolationBar, SettingsPanel, CollectionPanel, Footer,
LicenseModal, + Loading-Screen) auf die neue **Marken-Identität** umziehen. Der 3D-Canvas
und die Three.js-Logik bleiben **unangetastet** — es ändern sich nur React + CSS + Tokens.

**Gewähltes Layout: Variante B** („Angedockte Werkbank" — Icon-Rail links + persistente Tab-Sidebar
rechts). Vollständiges Komponenten→Ort-Mapping in **§10**; Referenz-Frames **`2a`–`2f`** im Dokument.

**Ton:** seriös, wissenschaftlich, ruhig — „medical atlas, scientific-clean", dunkel.

---

## 2. Über die Design-Dateien (Referenzen — kein Copy-Paste-Code)
Die HTML-Dateien in diesem Paket sind **Design-Referenzen** (Prototypen, die Aussehen und
Verhalten zeigen). Sie sind **nicht** dazu gedacht, 1:1 in die App kopiert zu werden.

**Aufgabe:** die gezeigten Designs im **bestehenden Codebase-Environment** nachbauen —
also als `.tsx`-Komponenten + `css/components/<name>.css`, die ausschließlich die Tokens aus
`variables.css` (siehe §5) nutzen. Kein Tailwind, keine Utility-Klassen, keine externen Assets.

Referenz-Dateien:
- `Anatomie Fokus App Redesign.dc.html` — das komplette Redesign: 2 Kompositionen,
  alle Zustände (Auswahl, Isolation, Mehrfachauswahl, Settings, Collection, License),
  Mobile-Bottom-Sheets und Loading-Screen. **Im Browser öffnen** (Datei liegt neben `support.js`).
- `Anatomie Fokus Logo und Typografie.dc.html` — Logo-Regeln, Schutzraum, Varianten, Typo-Skala.
- `Anatomie Fokus YouTube Identitaet.dc.html` — Herkunft des Marken-Looks („Variante A").
- `DESIGN_BRIEF.md` — der ursprüngliche technische Brief (harte Constraints, Architektur).

---

## 3. Fidelity: **Hi-Fi**
Pixelgenaue Mockups mit finalen Farben, Typo, Spacing und Zuständen. Bitte die UI
**pixelgenau** mit den Libraries/Patterns des Codebase nachbauen. Alle Maß-, Farb- und
Typo-Werte in diesem Dokument sind verbindlich.

---

## 4. Rebrand-Delta — was sich gegenüber dem aktuellen Stand ändert
| Aspekt | Vorher (Brief) | Nachher (Variante A) |
|---|---|---|
| Hintergrund | Navy-Verlauf `#0a0e27 → #151933` | Marken-Schwarz `#0b0c0e`, Bühnen-Radial `#181a1f→#060607` |
| Primär-Akzent | Blau `#4A9EFF` | **Orange `#FF6A00`** (Fokus/aktiv/CTA) |
| Sekundär | Orange `#FF7A4A` | Orange-Verlauf `#e64500→#ff9d3d` für Progress/CTA |
| Glas-Tint | blaustichig `rgba(30,35,55,…)` | neutral-schwarz `rgba(15,16,20,.82)` |
| Blau | — | nur noch optional als `:focus-visible`-Ring (`--focus-ring`) |
| Typo | System-Font | **Sora** (Display) + **Manrope** (UI), self-hosted |
| Radien | bis `--radius-xl:24px` | Panels `16px`, Rail/Sidebar/Modal `20px` |

Gruppenfarben (bones/muscles/nerves/cartilage/…) bleiben **unverändert** — sie sind semantisch.

---

## 5. Design-Tokens → `css/theme/variables.css`
Die vollständige, einsatzbereite Datei liegt als **`variables.css`** in diesem Paket. Kurzform
der wichtigsten Werte:

- **BG:** `--color-bg-dark:#0b0c0e` · `--color-bg-secondary:#16181d` · `--stage-gradient:…`
- **Glas:** `--glass-bg-panel:rgba(15,16,20,.82)` · `--glass-bg-controls:rgba(13,14,17,.82)` ·
  `--glass-border:rgba(255,255,255,.08)` · `--glass-blur-strong:blur(22px)` ·
  `--glass-shadow:0 12px 40px rgba(0,0,0,.5)`
- **Akzent:** `--accent:#ff6a00` · `--accent-tint` (16 %) · `--accent-dim` (12 %) ·
  `--accent-border` (50 %) · `--accent-gradient` · `--accent-on:#0b0b0b`
- **Text:** `#f6f6f7 / #c9cace / #9a9ca2 / #8a8d93 / #6e7076`
- **Radien:** 8 / 12 / 16 / 20 / 999 · **Spacing:** 4 / 8 / 16 / 24 / 32
- **Motion:** `--transition-smooth: all .28s cubic-bezier(.4,0,.2,1)` (via `prefers-reduced-motion` abschaltbar)
- **z-index:** canvas 1 · controls 100 · info-panel 1000 · menu 1100 · modal 2000

> Neue Tokens NUR in `variables.css` ergänzen, nie als Hardcode in Komponenten.

---

## 6. Typografie & CSP — Sora/Manrope **self-hosten**
Die Marke nutzt **Sora** (Display) und **Manrope** (UI). Die CSP der App verbietet externe
Fonts (kein Google Fonts). Also **self-hosten**:

1. `.woff2` von Sora (300/400/500/600/700/800) und Manrope (400/500/600/700/800) nach
   `public/fonts/` legen (Quelle: Google-Webfonts-Helper o. ä., beide unter SIL OFL 1.1).
2. `@font-face` in `css/theme/fonts.css`:
   ```css
   @font-face{ font-family:'Sora'; font-style:normal; font-weight:600;
     font-display:swap; src:url('/fonts/sora-600.woff2') format('woff2'); }
   /* … je Gewicht analog für Sora & Manrope … */
   ```
3. `connect-src`/`font-src` bleiben `'self'` — keine CSP-Änderung nötig, da alles lokal liegt.
4. Fallback im Stack ist bereits gesetzt: `--font-display` / `--font-ui` enden auf `system-ui`.

**Type-Skala (verbindlich):**
| Rolle | Font | Größe / Gewicht | Extra |
|---|---|---|---|
| Panel-Titel (InfoPanel) | Sora | 21px / 600 | `letter-spacing:-.01em`, `line-height:1.06` |
| Wortmarke | Sora | kontextuell / 600 | „Fokus" in `--accent` |
| Panel-Header / Section-Label | Manrope | 11px / 600 | `text-transform:uppercase`, `letter-spacing:.13em`, `--text-muted` |
| Zeilen-/Struktur-Label | Manrope | 13.5px / 500 (aktiv 600) | |
| Button / Chip | Manrope | 12.5px / 600–700 | |
| Loading-Wortmarke | Sora | 46px / 600 | `letter-spacing:-.02em` |

---

## 7. Anatomische Gruppenfarben → `js/config/config.ts`
Konsistent in Legenden/Badges/Farb-Indikatoren verwenden. Als CSS-Vars in `variables.css`
gespiegelt (`--group-*`).
| Gruppe | Hex | Var |
|---|---|---|
| bones / teeth | `#E8E6DD` | `--group-bones` / `--group-teeth` |
| muscles | `#E85861` | `--group-muscles` |
| nerves | `#FFD166` | `--group-nerves` |
| cartilage | `#9FC6E5` | `--group-cartilage` |
| ligaments | `#C9A05A` | `--group-ligaments` *(im Brief ohne Farbe — ergänzt)* |
| default | `#CCCCCC` | `--group-default` |

Aktuell freigeschaltet (`ENABLED_GROUPS`): **bones, muscles, cartilage, ligaments, teeth**.
Layout muss auf **bis zu 16 Gruppen** skalieren (kein hartkodiertes 5er-Raster) — Reserve-Vars
`--group-vessels`, `--group-organs` sind vorbereitet.

---

## 8. Glassmorphism-Rezepte (tokenbasiert)
```css
/* Basis für jedes Overlay-Panel (Info/Browser/Collection/Settings) */
.panel {
  position: fixed;
  pointer-events: all;                 /* PFLICHT auf interaktiven Overlays */
  background: var(--glass-bg-panel);
  backdrop-filter: var(--glass-blur-strong);
  -webkit-backdrop-filter: var(--glass-blur-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);     /* 16px */
  box-shadow: var(--glass-shadow-lg);
  color: var(--text-primary);
  overflow: hidden;
}
.panel__header {                        /* klinischer Header */
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px var(--spacing-md);
  font: 600 var(--fs-label)/1 var(--font-ui);
  letter-spacing: var(--tracking-clinical); text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--hairline-soft);
}
/* Schwebende Leisten (Toolbar / Rail / kontextuelle Bars) */
.bar {
  position: fixed; pointer-events: all;
  background: var(--glass-bg-controls);
  backdrop-filter: var(--glass-blur-strong);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);     /* 18–20px */
  box-shadow: var(--glass-shadow-lg);
}
/* Aktiver Tool-Button */
.tool--active { background: var(--accent-tint); color: var(--accent); }
/* Röntgen-/Opazitäts-Slider-Füllung */
.slider__fill { background: var(--accent); }        /* Gruppe: Gruppenfarbe */
```
**Pointer-Events (kritisch):** `#ui-root` hat `pointer-events:none; z-index:20`. **Jedes**
interaktive Panel setzt `pointer-events:all` selbst, sonst sind Buttons tot.

---

## 9. Komponenten (Screens/Views)
Referenz-Frame jeweils in `Anatomie Fokus App Redesign.dc.html`. Alle Panels teilen das
Glas-Rezept aus §8; nur Inhalt/Position unterscheiden sich.

> **Positionen unten = Referenz aus Komposition A.** Für das **gewählte Layout B** gilt das
> Komponenten→Ort-Mapping in **§10** (Rail links, Tab-Sidebar rechts). Aufbau/Innereien/Styles
> jeder Komponente bleiben identisch — nur die Verankerung ändert sich.

### 9.0 Bühne / Canvas-Hintergrund
- Vollflächiger Three.js-Canvas (`--z-canvas`). Im Mockup als dunkle Studio-Bühne simuliert
  (`--stage-gradient` + weiches Spotlight + optionales Perspektiv-Gitter + Vignette). **In der
  App ist das der echte Canvas — nicht nachbauen**, nur als Kontext verstehen. Vignette/Spotlight
  optional als CSS-Overlay hinter `#ui-root` (pointer-events:none).

### 9.1 Toolbar / Tools  · `Toolbar.tsx` / `css/components/toolbar.css`
- **Position (Layout B):** die Tools sind **keine** Bottom-Pille, sondern leben in der **Icon-Rail links**
  (`left:20px; top:20px; bottom:20px; width:68px; radius:20px`), Logo oben, ⚙ unten via `margin-top:auto`.
  Rail-Button `44×44`, `radius:13px`, Icon 22px. (Die Bottom-Pille unten ist die Referenz aus Komposition A.)
- **Ansichts-Cluster** (Vorne/Hinten/Links/Rechts/Oben + Reset) sitzt als eigene schwebende Leiste unten,
  mittig im freien Canvas (`left:41%`), `radius:16px` — nicht Teil der Rail.
- **Aufbau:** Glas-Pille, `padding:9px`, `gap:7px`, `border-radius:18px`. Reihenfolge:
  `[Auswählen ▸ aktiv]` · Trenner · Gruppen-Chips `Knochen · Muskeln · Bänder · Knorpel · Zähne`
  · Trenner · `Reset · Foto · Labels · Ansichten` · Trenner · `Strukturen · Sammlung · ⚙ Einstellungen`.
- **Tool-Button:** `44×44`, `radius:12px`, Icon 21px, `color:--text-secondary`;
  Hover `background:--glass-bg-hover`; aktiv `--tool--active`.
- **Gruppen-Chip:** `padding:9px 13px; radius:12px; background:rgba(255,255,255,.05)`;
  Farbpunkt 9px (`--group-*`) + Label Manrope 600 12.5px `#e3e4e7`. Aktiv → `--accent-tint`.
- **Trenner:** `1px × 26px`, `--hairline`.
- **Verhalten:** Panel-Toggles (Strukturen/Sammlung/Einstellungen) folgen `closeAll()` — nur **eines**
  offen. Auf schmalen Screens nicht überladen (siehe §13, Mobile-Tab-Bar).

### 9.2 SearchBar  · `SearchBar.tsx` / `search-bar.css`
- **Position:** `top:16px; right:16px` (Mockup 24px). **Eingeklappt:** `46×46` Glas-Button,
  Lupe-Icon 20px. **Ausgeklappt:** Pille `padding:13px 15px; radius:14px`, `border:1px solid --accent-border`,
  Lupe in `--accent`, Text-Cursor als 2px-Balken in `--accent` (blinkt, reduced-motion aus).
- **Ergebnis-Dropdown:** eigenes Glas-Panel darunter, Header „N Treffer" + „↑ ↓ · Enter"-Hinweis,
  Zeilen: Farbpunkt + Name (Fuzzy-Match-Teil in `--accent`, `font-weight:600`) + Gruppen-Tag rechts.
  Aktive Zeile `background:--accent-dim`.
- **Fuzzy:** über Latein-Namen (`getStructureDisplayLabel()`), Tastatur-Navigierbar.

### 9.3 StructureBrowser  · `StructureBrowser.tsx` / `structure-browser.css`
- **Position:** unten rechts, `width:288px`, `radius:16px` (über der Toolbar).
- **Header:** „STRUKTUREN" + „N Gruppen" + Collapse-Chevron.
- **Gruppen-Zeile:** `padding:9px 10px; gap:11px`: Sichtbarkeits-Icon (Auge / Auge-durchgestrichen,
  17px) · Farbpunkt 11px (`--group-*`) · Label (flex 1) · **Röntgen-Slider** (Track `60×4`, Fill in
  Gruppenfarbe, Knob 11px weiß). Ausgeblendete Gruppe: gedimmt (`--text-faint`, Auge-off).
  Aktive/gewählte Gruppe: `background:--accent-dim`, Label 600 `#f6f6f7`.
- **BEM-Präfix:** `sb-` (`.sb-panel`, `.sb-row`, `.sb-slider` …).

### 9.4 InfoPanel  · `InfoPanel.tsx` / `info-panel.css`
- **Position:** oben rechts bei Selektion (`top:82px`, unter der SearchBar), `width:308px`.
- **Titel:** Latein-Name (Sora 600 21px) via `getStructureDisplayLabel()`. Darunter **Gruppen-Badge**
  (Pille: Farbpunkt 8px + Gruppenname 600 11px, `background: Gruppenfarbe @15%`). Close-Button 30px oben rechts.
- **Body:** `Deckkraft`-Slider (Label + „100 %"; Track full-width h5, Fill `--accent`, Knob 13px).
- **Aktionen (3 gleich breit):** `Ausblenden` (Auge-off) · `Isolieren` (Target) · `Kontext` (Ring) —
  Icon 19px + Label 11px, `background:rgba(255,255,255,.045)`, `radius:11px`, `padding:11px`.
- **CTA:** `Zur Sammlung` — Outline `1.5px solid --accent-border`, Text/Icon `--accent`, `radius:12px`.

### 9.5 MultiSelectPanel  · `MultiSelectPanel.tsx` / `multi-select.css`
- **Erscheint** bei Mehrfachauswahl, `bottom:26px; left:50%` (statt/über der Toolbar).
- **Aufbau:** Zähler-Badge (Zahl auf `--accent`, `--accent-on`) + „Strukturen gewählt" + Chip-Liste
  der Auswahl (Pille `rgba(255,255,255,.06)`, Farbpunkt + Name) · Trenner · Aktionen
  `Isolieren` · `Ausblenden` · `Zur Sammlung` · `Auswahl aufheben (✕)`.

### 9.6 IsolationBar  · `IsolationBar.tsx` / `isolation-bar.css`
- **Kontextuell** im Isolations-Modus, `top:22px; left:50%`. Border `--accent-border`.
- **Inhalt:** Target-Icon (`--accent`) + „Isolation · <Struktur>" · Trenner · `Kontext einblenden`
  (Ghost) · `Beenden` (gefüllt `--accent`, Text `--accent-on`).
- **Bühne:** restliches Modell auf ~14 % Opazität gedimmt; isolierte Struktur voll + `--accent`-Ring.
  Untertitel zentriert unten (Struktur + Zusatzinfo, z. B. „Pars clavicularis · acromialis · spinalis").

### 9.7 SettingsPanel  · `SettingsPanel.tsx` / `settings-panel.css`
- **Toggle** via ⚙; rechts angedockt (`top:22px; bottom:104px; width:326px`), scrollbar. Sektionen mit
  10.5px/`.12em`-Uppercase-Headern (`--text-faint`):
  - **Raum:** `Helligkeit`-Slider · `Umgebungslicht`-Slider · `Hintergrund`-Swatches
    (Schwarz `#0b0b0b` aktiv mit `--accent`-Ring · Anthrazit `#34373c` · Navy `#0a0e27`).
  - **Preset:** Segmented `Studio · Klinisch · Kontrast` (aktiv `--accent-tint`/`--accent`).
  - **Tastenkürzel:** Key-Caps (`F` Fokus · `I` Isolieren · `Leertaste` Drehen …).
  - **Footer:** `Farben zurücksetzen` (Reset-Icon, `--accent`) + „Lizenzen"-Link → LicenseModal.
- Nur **eines** von Browser/Collection/Settings offen (`closeAll()`).

### 9.8 CollectionPanel  · `CollectionPanel.tsx` / `collection-panel.css`
- **Toggle** via Lesezeichen; rechts, `width:306px`, `top:82px`.
- **Header:** Lesezeichen-Icon (`--accent`) + „SAMMLUNG · N" + Close.
- **Zeile:** Farbpunkt + Latein-Name (flex 1) + `Fokussieren` (Target) + `Entfernen` (Trash).
  **Klick auf Zeile fokussiert** die Struktur im Canvas.
- **Footer-CTA:** `Alle fokussieren` (gefüllt `--accent`, `--accent-on`).

### 9.9 Footer  · `Footer.tsx` / `footer.css`
- Unten links (Komposition A), Manrope 500 12px `--text-faint`: `Lernen · Lizenz · Quellen · Datenschutz`
  (Trenner `·` mit `opacity:.4`). In Komposition B wandert das in den Sidebar-Fuß.

### 9.10 LicenseModal  · `LicenseModal.tsx` / `license-modal.css`
- Zentriert, `--z-modal`, `role="dialog" aria-modal="true"`, dimmender Backdrop `rgba(6,6,7,.66)` +
  leichter Blur. Card `width:600px; radius:20px`, `background:rgba(18,19,23,.94)`.
- Header „Lizenzen & Attribution" (Sora 600 18px) + Close. Attributions-Zeilen (Titel + Quelle +
  Lizenz-Tag rechts), Footer-Button `Schließen` (gefüllt `--accent`). Fokus-Trap + ESC schließt.

### 9.11 LoadingScreen  · `LoadingScreen.tsx` / `loading-screen.css`
- Vollflächig, Marken-Schwarz + `--stage-gradient`. Zentriert: **Logo** (132px,
  `assets/af-logo.png`) mit rotierendem Akzent-Ring (SVG-Kreis r98, `stroke:--accent`,
  `stroke-dasharray:100 520`, `animation:spin 1.5s linear`), Wortmarke „Anatomie **Fokus**"
  (Sora 600 46px), Tagline (uppercase `.24em`, `--text-faint`), Fortschritt (`320×4`,
  `--accent-gradient`, + „3D-Modell wird geladen … NN %"). `prefers-reduced-motion` → Ring statisch.

---

## 10. Layout — gewählt: Variante B (Frames `2a`–`2f`)
Beide Kompositionen teilen **identische Panel-Innereien** — nur die Anordnung unterscheidet sich.
- **B · „Angedockte Werkbank" — GEWÄHLT** (Frames `2a`–`2f`): linke Icon-Rail (Tools + ⚙) +
  rechte, **persistente** Sidebar mit Tabs `Strukturen · Sammlung · Info` + Ansichts-Cluster unten.
  „Pro-Tool"-Werkbank, dicht und fokussiert.
- **A · „Schwebende Inseln" — verworfen** (Frame `1a`): diskrete Glas-Panels an den Ecken. Nur noch
  als Referenz im Dokument; **nicht** umsetzen.

**B-Mapping — wo jede Komponente lebt (verbindlich):**
| Komponente | Ort in B | Frame |
|---|---|---|
| Tools (Auswählen/Gruppen/Labels/Foto/Ansichten) + ⚙ | **Icon-Rail links** (`left:20px; top:20px; bottom:20px; width:68px; radius:20px`), Logo oben, ⚙ unten (`margin-top:auto`) | alle |
| SearchBar | Suchfeld **im Sidebar-Kopf** (nicht mehr floatendes Icon) | `2a` |
| StructureBrowser | Sidebar-Tab **„Strukturen"** (Default aktiv) | `2a` |
| InfoPanel | Sidebar-Tab **„Info"** — Tab wird bei Auswahl automatisch aktiv | `2b` |
| CollectionPanel | Sidebar-Tab **„Sammlung"** | `2c` |
| MultiSelectPanel | **„Info"-Tab wird zur Sammel-Ansicht** (Zähler + Chip-Liste + Sammel-Aktionen), keine Bottom-Bar | `2d` |
| IsolationBar | **Banner oben in der Sidebar** (statt floatender Top-Bar) + gedimmtes Modell + Untertitel unten | `2e` |
| SettingsPanel | **Flyout, das aus der Rail neben ⚙ erscheint** (`left:100px`, eigenes Panel); rechte Sidebar bleibt als Kontext | `2f` |
| Ansichts-Cluster (Vorne/Hinten/…/Reset) | schwebende Leiste unten, mittig im freien Canvas (`left:41%`) | `2a`–`2e` |
| Footer-Links (Lizenz/Quellen/Datenschutz) | **Sidebar-Fuß** | alle |
| LicenseModal | zentriertes Modal (layout-unabhängig, gilt für A & B) | Abschnitt 02b |

**Sidebar-Verhalten:** genau **ein** Tab aktiv; Auswahl einer Struktur schaltet auf „Info", Auswahl-
Aufhebung zurück auf „Strukturen". Rail-Tools und Sidebar-Tabs sind zwei getrennte Achsen (Werkzeug
vs. Inhalt). Die Tokens/CSS-Rezepte (§5–§8) gelten unverändert.

---

## 11. Interaktionen & Verhalten
- **Motion:** genau eine Kurve `cubic-bezier(.4,0,.2,1)`, ~0.28s (`--transition-smooth`). Panels faden/
  sliden dezent ein (Info von rechts, Sheets von unten). `prefers-reduced-motion:reduce` schaltet alles ab.
- **Hover:** Tool-Buttons → `--glass-bg-hover`; Zeilen → leichte `--glass-bg`-Aufhellung; CTAs minimal heller.
- **Aktiv/Selektiert:** `--accent-tint` (Fläche) + `--accent` (Icon/Text). Struktur im Canvas: `--accent`-Ring.
- **Fokus (Tastatur):** sichtbarer Ring `2px --focus-ring` (Blau) oder `--accent` — konsistent wählen.
- **Panel-Exklusivität:** `closeAll()` vor dem Öffnen von Browser/Collection/Settings.
- **Loading:** Ring rotiert, Fortschrittsbalken folgt dem echten Ladefortschritt.

---

## 12. State Management (Zustand-Store)
React ↔ 3D reden **ausschließlich** über den Store (keine `window.*`, keine direkten Three-Zugriffe).
Empfohlene Slices (an bestehenden Store andocken, Namen anpassen):
```ts
interface UiState {
  activeTool: 'select';
  selection: string[];                    // structureId[]
  isolated: string | null;
  openPanel: 'browser' | 'collection' | 'settings' | null;  // closeAll() = null
  searchOpen: boolean; searchQuery: string;
  collection: string[];
  groups: Record<GroupId, { visible: boolean; opacity: number }>;  // Röntgen 0..1
  room: { brightness: number; ambient: number; bg: 'black'|'anthracite'|'navy'; preset: 'studio'|'clinical'|'contrast' };
  licenseOpen: boolean;
  loading: { active: boolean; progress: number };
  // Actions:
  setTool, selectStructure, toggleSelection, isolate, exitIsolation,
  openPanelExclusive(name), closeAll, setSearch, toggleGroup, setGroupOpacity,
  addToCollection, removeFromCollection, focusStructure, setRoom, resetColors …
}
```
- **Kein `localStorage`/Browser-Storage** — State lebt nur zur Laufzeit im Store.
- **TypeScript strict**, kein `any` in Kernpfaden. Komponenten sind `.tsx`.

---

## 13. Mobile & Bottom-Sheet (Pflicht)
- **Bottom-Sheet statt seitlicher Panels** auf Schmal-Screens. StructureBrowser, InfoPanel,
  Collection, Settings erscheinen als Sheet von unten (Grabber `42×5`, `radius:28px 28px 0 0`,
  `background:rgba(15,16,20,.94)`, `backdrop-filter:blur(26px)`).
- **Untere Tab-Leiste** statt breiter Toolbar: `Auswählen · Strukturen · Labels · Ansicht · ⚙`,
  Buttons `≥52px`. Gruppen-Chips als horizontal scrollbare Reihe.
- **Touch-Targets ≥ 44px** überall. Slider-Knobs 14–16px.
- **Safe-Area:** `viewport-fit=cover` ist gesetzt → `padding` mit `env(safe-area-inset-*)`
  (Statusleiste oben, Home-Indicator unten). Sheets respektieren die untere Inset.
- Referenz-Frames: `Mobile · Default`, `Mobile · Bottom-Sheet Strukturen`, `Mobile · Info-Sheet`.

---

## 14. Barrierefreiheit
- A11y-Grundlagen **beibehalten/ausbauen:** `aria-label` an Icon-Buttons, `role`/`aria-modal` in
  LicenseModal (+ Fokus-Trap, ESC schließt), Sichtbarkeits-Toggles als echte `role="switch"`/Checkbox.
- **Komplette Tastatur-Bedienung** anstreben; Fokus-Management beim Öffnen/Schließen von Panels/Sheets.
- Sichtbarer Fokus-Ring (`--focus-ring`). Kontrast von `--text-*` auf Glas geprüft halten.
- `prefers-reduced-motion:reduce` respektieren (Loading-Ring & Transitions aus).

---

## 15. Assets (Logo) & Einsatz
Im Ordner `assets/` (PNG mit Transparenz):
| Datei | Verwendung |
|---|---|
| `af-logo.png` | Primär (Silber-Bevel) — auf Schwarz: Brand-Ecke, Rail, Loading, Profil/Squircle-Icon |
| `af-logo-white.png` | Mono weiß — Favicon 16/32/64, Browser-Tab, kleine Größen (< 48px, flach) |
| `af-logo-black.png` | Mono schwarz — auf hellem/orangem Grund (Maskable-Icon) |
| `af-logo-orange.png` | Mono orange — Sonderfälle auf Schwarz |
| `af-logo-dark.png` | Für helle Hintergründe |
| `af-logo-green.png` | **Nicht verwenden** — nur Don't-Beispiel (Fremdfarbe) |

**Konkrete Einbauorte (vom Nutzer gewünscht):**
- **Favicon / PWA:** `af-logo-white.png` → `favicon-16/32/64`, `apple-touch-icon` (Squircle,
  `af-logo.png`), **Maskable** (`af-logo-black.png` auf `--accent`). Siehe Frame „App-Icon · Favicon".
- **Loading-Screen:** `af-logo.png`, 132px, mit Akzent-Ring (§9.11).
- **Brand-Ecke (A) / Rail-Top (B):** `af-logo.png`, 34–36px + Wortmarke „Anatomie **Fokus**".

**Logo-Regeln** (aus `Anatomie Fokus Logo und Typografie.dc.html`): Schutzraum = ½ Logohöhe ringsum;
nie verzerren/drehen/umfärben; unter 48px die flache Mono-Version. Wortmarke immer **Sora**; „Anatomie"
= `#F6F6F7` (auf hell `#1A1A1A`), „Fokus" = `--accent`.

---

## 16. Dateien in diesem Paket
```
design_handoff_anatomie_3d/
├─ README.md                                  ← dieses Dokument
├─ variables.css                              ← Tokens, drop-in nach css/theme/
├─ DESIGN_BRIEF.md                            ← ursprünglicher technischer Brief
├─ Anatomie Fokus App Redesign.dc.html        ← Haupt-Referenz (alle Zustände/Mobile/Loading)
├─ Anatomie Fokus Logo und Typografie.dc.html ← Logo/Typo-Regeln
├─ Anatomie Fokus YouTube Identitaet.dc.html  ← Herkunft „Variante A"
├─ support.js                                 ← nur damit die .dc.html im Browser rendern
└─ assets/                                    ← Logo-PNGs (s. §15)
```
Die `.dc.html`-Dateien im Browser öffnen (Doppelklick). `support.js` und `assets/` müssen daneben liegen.

---

## 17. Empfohlene Umsetzungs-Reihenfolge
1. `variables.css` einsetzen (Navy/Blau → Schwarz/Orange), `main.css`-Import prüfen. Tote
   `css/components/dropdowns.css` entfernen (aus `main.css` + Datei).
2. Fonts self-hosten (`fonts.css`, §6).
3. Glas-Rezepte (§8) als gemeinsame Basis; **eine** Komponente nach der anderen umziehen —
   Layout **B** (§10). Reihenfolge: Icon-Rail (App-Shell) → Tab-Sidebar-Gerüst (Strukturen/Sammlung/Info) →
   StructureBrowser → InfoPanel → SearchBar (Sidebar-Kopf) → Ansichts-Cluster → CollectionPanel →
   Multi/Isolation (Info-Tab-Varianten) → SettingsPanel (Rail-Flyout) → Footer/LicenseModal → LoadingScreen.
4. Mobile-Bottom-Sheets + Tab-Leiste + Safe-Area (§13).
5. A11y-Pass (§14). Isoliert pro Komponente arbeiten, nicht „alles neu".

**Nicht anfassen:** Three.js/Canvas-Code · Store-Kontrakt (nur erweitern) · kein Tailwind ·
keine externen Fonts/CDN/Icons · kein `localStorage` · kein Deutsch in **Strukturnamen** (immer Latein
über `getStructureDisplayLabel()`; UI-Chrome bleibt Deutsch).
