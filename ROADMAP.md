# Anatomie Fokus 3D — Modernisierungs-Roadmap

> Ziel: Aus der funktionierenden statischen Seite eine professionelle 3D-Anatomie-Webapp machen — als Solo-Entwickler, KI-gestützt, in klar abgegrenzten Phasen.

---

## 1. Ist-Analyse

### Was gut ist (behalten!)

- **Saubere Modul-Struktur** (`bootstrap/`, `core/`, `features/`, `ui/`, `store/`) — ungewöhnlich gut für ein Vanilla-Projekt. Die Architektur-Idee bleibt, nur das Fundament wird modern.
- **Performance-Bausteine existieren bereits**: Draco-Kompression, LOD-Manager, Resource-Manager, Render-Optimizer, Performance-Monitor, adaptive Mobile-Config.
- **Design-System angelegt**: CSS Custom Properties, Glassmorphism-Tokens, konsistente Farben pro Gruppe.
- **A11y-Grundlagen** im HTML (aria-labels, roles) — selten in Hobby-Projekten.
- **Datenmodell**: `meta.json` mit Klassifikation → gute Basis für Suche, Baum-Navigation und i18n.

### Tech Debt (der eigentliche Grund für die Modernisierung)

| Problem | Konkret | Folge |
|---|---|---|
| **Kein Build-Tool** | Importmap + Three.js vom CDN **und** lokal vendorte Addons parallel | Versions-Drift, kein Tree-Shaking, kein Minify, kein HMR |
| **Code-Leichen** | `ui-reset copy.js`, `performanceMonitor.js` doppelt (core + debug), zwei `startApp`-Varianten + `LoadingScreenManager` in einer Datei | KI-Sessions verwirren sich an totem Code |
| **Encoding kaputt** | UTF-8-Mojibake (`fÃ¼r`, `Ã¶`) in mehreren Dateien | Unprofessionell, Diff-Rauschen |
| **State halbfertig** | `dispatch()`/Actions existieren, daneben überall direkter `state.xxx`-Zugriff und `window.*`-Globals | Bugs schwer nachvollziehbar, Refactoring riskant |
| **UI skaliert nicht** | 16 Dropdown-Buttons als Hauptnavigation | Mobil unbenutzbar, neue Gruppen = HTML anfassen |
| **Kein Sicherheitsnetz** | Kein TypeScript, keine Tests, kein Linting | Bei KI-Coding besonders riskant — Halluzinationen fallen erst zur Laufzeit auf |

---

## 2. Ziel-Stack (Empfehlung)

**Kernprinzip: Three.js-Logik bleibt imperativ und wird *nicht* neu geschrieben. Nur Fundament und UI-Layer werden modernisiert.**

| Bereich | Heute | Ziel | Warum |
|---|---|---|---|
| Build | keins (Importmap) | **Vite** | Standard, HMR, ein `npm run build`, perfekt für statische Seiten |
| Sprache | JS | **TypeScript** (schrittweise, `allowJs`) | Dein wichtigstes Werkzeug gegen KI-Fehler — falsche APIs fliegen beim Build, nicht beim User |
| 3D | Three.js 0.179 via CDN + vendorte Addons | **Three.js via npm** (eine Version, Addons aus `three/addons`) | Bleibt imperativ. **Kein** React Three Fiber — die Logik funktioniert, Migration wäre Risiko ohne Nutzen |
| UI | Vanilla DOM-Manipulation | **React** (nur als Overlay über dem Canvas) | KI-Modelle sind bei React mit Abstand am stärksten → schnellere, fehlerärmere UI-Arbeit |
| State | Eigenbau (`state.js` + `dispatch`) | **Zustand** (Library) | Funktioniert in React *und* im Three-Code → ist die Brücke zwischen beiden Welten |
| Styling | `main.css`-Monolith | **Tailwind v4** mit deinen Glassmorphism-Tokens als Theme | KI generiert Tailwind am zuverlässigsten; deine CSS-Variablen bleiben als Design-Tokens |
| Qualität | — | **ESLint + Prettier + Vitest** (nur für State/Loader-Logik) | Minimal-Setup, maximaler Schutz |
| Hosting | GitHub Pages | GitHub Pages **oder** Cloudflare Pages (+ R2 für Modelle, falls >100 MB Assets) | Bleibt statisch, bleibt kostenlos |
| CI | manuell | **GitHub Action**: push → build → deploy | Nie wieder kaputte Deploys |

### Alternative (Minimal-Pfad)

Falls dir die React-Migration zu groß ist: **Vite + TypeScript, UI bleibt Vanilla.** Phasen 0–2 sind identisch, Phase 3 entfällt weitgehend. Nachteil: Jede künftige UI-Arbeit (Suche, Baum, Panels) bleibt zäh und fehleranfällig. Meine klare Empfehlung ist der React-Pfad — aber der Minimal-Pfad ist legitim und du kannst nach Phase 2 immer noch entscheiden.

---

## 3. Phasenplan

### Phase 0 — Aufräumen (≈ 1 Woche) · Risiko: niedrig

Vor jeder Migration. Sonst migrierst du Müll mit.

- [ ] Git-Stand taggen (`legacy-v1`) — Rettungsanker
- [ ] Duplikate löschen: `ui-reset copy.js`, doppelter `performanceMonitor.js`, ungenutzte `startApp`-Variante + `LoadingScreenManager` entwirren → **eine** Start-Funktion
- [ ] Encoding aller Dateien auf sauberes UTF-8 fixen
- [ ] Auskommentierte Blöcke aus `index.html` und JS-Dateien entfernen (Git hat die Historie)
- [ ] Feature-Flag-Inventur in `config.js`: Was ist real an? Tote Flags raus
- [ ] `window.*`-Globals dokumentieren (Abbau kommt in Phase 2)

**Done-Kriterium:** App läuft identisch, Codebase ist messbar kleiner, jede Datei hat genau einen Zweck.

### Phase 1 — Build-Fundament (≈ 1 Woche) · Risiko: niedrig

- [ ] `npm create vite@latest` (Vanilla-Template), bestehende Module einziehen
- [ ] `three` als npm-Dependency — **eine** Version; Importmap und CDN-Referenzen raus
- [ ] Vendorte `three-addons/` löschen → Imports aus `three/addons/...`
- [ ] Draco-Decoder nach `public/draco/`, Pfade in `gltfLoaderFactory` anpassen
- [ ] ESLint + Prettier (flat config, Defaults reichen)
- [ ] GitHub Action: build → Deploy auf Pages
- [ ] CSP aus `index.html` an Vite-Build anpassen (CDN-Einträge entfallen)

**Done-Kriterium:** `npm run dev` mit Hot-Reload, jeder Push deployt automatisch eine minifizierte Version.

### Phase 2 — TypeScript + State (≈ 2–3 Wochen) · Risiko: mittel

- [ ] `tsconfig` mit `allowJs: true` → Migration Datei für Datei, App bleibt durchgehend lauffähig
- [ ] Reihenfolge: `config` → `state` → `meta` → Loader → `core` → Rest
- [ ] **Zentrale Typen definieren**: `MetaEntry`, `AnatomyGroup`, `AppState` — das `meta.json`-Schema ist dein wichtigster Typ, alles hängt daran
- [ ] **Zustand-Store** ersetzt `state.js` + `dispatch`: Slices für `models`, `selection`, `visibility`, `appearance`; Three-Code nutzt `store.subscribe()`, UI später `useStore()`
- [ ] `window.*`-Globals eliminieren (jetzt geht's, weil der Store überall importierbar ist)
- [ ] Vitest: Tests für Store-Logik und Meta-Parsing (KI schreibt sie mit)

**Done-Kriterium:** `strict: true` aktiv, keine `any` in Kernpfaden, ein einziger State-Zugriffsweg.

### Phase 3 — UI-Relaunch (≈ 3–4 Wochen) · Risiko: mittel

**Architektur:** Canvas bleibt unangetastet. React mountet als Overlay-Layer darüber. Die einzige Verbindung ist der Zustand-Store — kein direkter Three↔React-Zugriff.

Komponenten in Reihenfolge des Nutzerwerts:

1. **Struktur-Browser** (ersetzt die 16 Dropdowns): hierarchischer Baum *Region → Gruppe → Struktur*, Checkboxen für Sichtbarkeit, Farb-Indikator, Lazy-Loading pro Gruppe. Wird aus `meta.json` generiert — neue Strukturen erscheinen automatisch.
2. **Suche**: Fuzzy-Suche über alle Strukturen (fuse.js), Tastatur-Navigation (↑↓ + Enter), Treffer → laden + Kamera-Fokus. *Das* Feature, das eine Anatomie-App professionell macht.
3. **Info-Panel**: Struktur-Details aus Meta — bei Muskeln als **Steckbrief** (Ursprung, Ansatz, Innervation, Funktion = das, was abgefragt wird); Aktionen direkt am Panel (fokussieren, isolieren, ausblenden, Farbe).
4. **Edit-Panel**: Farbe/Opazität — Logik existiert, wird portiert.
5. **Toolbar**: Reset, Screenshot, Standardansichten (anterior / posterior / lateral / superior).
6. **Loading**: ein System statt drei (Splash + Kreis + Live-Sticker konsolidieren).

**Design:** Glassmorphism-Tokens als Tailwind-Theme übernehmen. Pro Komponente eine eigene KI-Session mit explizitem Stil-Briefing („medical atlas, scientific-clean") — genau die Arbeitsweise, die sich bei dir bewährt hat.

**Done-Kriterium:** Alle alten `ui-*.js`-Dateien gelöscht, mobile Ansicht benutzbar (Bottom-Sheet statt Sidebar).

### Phase 4 — UX-Kernfeatures (≈ 3–4 Wochen) · Risiko: mittel

Das, was den Unterschied zwischen „Tech-Demo" und „Produkt" ausmacht:

- [ ] **Kamera-Fokus**: Klick auf Struktur → sanfter Kameraflug (Lerp oder GSAP), Doppelklick → isolieren. Raycasting existiert, es fehlt nur die Animation.
- [ ] **Hover-Feedback**: Highlight + Tooltip mit Strukturname (rudimentär vorhanden → polieren, throttlen)
- [ ] **Ghost-Mode**: gewählte Struktur opak, Rest transparent — Kontext bleibt sichtbar
- [ ] **Labels/Pins**: Beschriftungen via `CSS2DRenderer`, global toggle-bar
- [ ] **Querschnitt**: Clipping-Ebenen mit Slider (`cameraClipping.js` als Basis ausbauen)
- [ ] **Deep-Links**: URL-State (`?s=femur&view=lateral`) → jede Ansicht teilbar/verlinkbar. Günstig zu bauen, riesiger Wert für Lernende und SEO.
- [ ] **Touch**: Pinch-Zoom, Tap-Select, reduziertes Performance-Profil greift automatisch

**Done-Kriterium:** Die Kern-Journey „Struktur suchen → finden → fokussieren → Info lesen → isolieren" läuft flüssig auf Desktop und Smartphone.

### Phase 5 — Professionalisierung (≈ 2–3 Wochen) · Risiko: niedrig

- [ ] **Nomenklatur statt klassischem i18n**: Deutsch + Latein (Terminologia Anatomica) sind für Physio/Ergo/Logo Prüfungssprache → beide Namen pro Struktur in `meta.json`, in Suche und Labels umschaltbar. Englisch ist optional und kann warten.
- [ ] **Onboarding**: max. 3 First-Run-Hints (drehen, klicken, suchen) — nicht mehr
- [ ] **A11y**: Fokus-Management in Panels, komplette Tastatur-Bedienung, `prefers-reduced-motion`
- [ ] **Performance-Budget**: Lighthouse ≥ 90, Bundle < 300 KB (ohne Modelle), Ladezeit-Messung real auf Mobilgerät
- [ ] **Landing/SEO**: statische Startseite mit Screenshots und Text — der Canvas ist für Google unsichtbar, ohne Landing existierst du nicht
- [ ] **Monitoring**: Sentry (Fehler) + Plausible/Umami (Analytics, DSGVO-freundlich) — beide free tier

### Phase 6 — Ausbau (Backlog, nach Bedarf priorisieren)

| Feature | Aufwand | Anmerkung |
|---|---|---|
| **Testat-/Quiz-Modus** | mittel | **Hochgestuft: direkt nach Phase 4 angehen.** Zwei Richtungen: „Zeige den M. supraspinatus" (klicken) und „Welche Struktur ist markiert?" (benennen) — simuliert das mündliche Testat / den Parcours. Alles dafür Nötige existiert nach Phase 4 |
| **Lernblock-Presets** | klein | Kuratierte Szenen entlang der Curricula: *Schultergürtel, Hand & Unterarm (Ergo), Knie, Hüfte, Wirbelsäule, Larynx & Schluckapparat, Kau- & mimische Muskulatur, Hirnnerven (Logo)*. Nur Listen + Deep-Link-Mechanik |
| **Texture-Painting** | groß | Bereits exploriert: technisch via `CanvasTexture` machbar, **aber** Meshes brauchen vorher UV-Unwrapping (Blender-Pipeline). Erst angehen, wenn Kern-UX steht |
| **Annotationen speichern/teilen** | mittel | Erst localStorage, später optional Backend |
| **PWA/Offline** | klein–mittel | Service Worker + Modell-Cache; sinnvoll für Lernende unterwegs |
| **Accounts/Sync** | groß | Erst bei echtem Bedarf — bedeutet Abschied von „rein statisch". Leichtester Weg dann: Supabase |

---

## 4. Arbeitsweise mit KI (dein eigentlicher Hebel)

- **`CLAUDE.md` ins Repo**: Architektur-Überblick, Konventionen, Store-Schnittstelle, Do/Don'ts. Jede KI-Session startet damit informiert statt bei null. Pflegen wie Code.
- **Kleine, isolierte Aufträge**: eine Komponente, ein Modul pro Session — deckt sich mit deiner Erfahrung (frontend-design für isolierte UI-Teile, nie „redesign alles").
- **TS + ESLint sind dein Review-Ersatz**: Was die KI halluziniert, fängt der Compiler. Ohne Phase 2 ist KI-Coding bei dieser Projektgröße ein Blindflug.
- **Tests mitbestellen**: Bei Store- und Loader-Änderungen die KI immer Vitest-Tests mitschreiben lassen. Kostet einen Satz im Prompt.
- **Branch pro Phase, PR an dich selbst**: Der Diff-View ist dein Code-Review. Nie direkt auf `main` generieren lassen.

---

## 5. Übersicht & Aufwand

| Phase | Inhalt | Aufwand (solo + KI, nebenbei) | Risiko |
|---|---|---|---|
| 0 | Aufräumen | 1 Woche | niedrig |
| 1 | Vite + npm + CI | 1 Woche | niedrig |
| 2 | TypeScript + Zustand | 2–3 Wochen | mittel |
| 3 | React-UI-Relaunch | 3–4 Wochen | mittel |
| 4 | UX-Kernfeatures | 3–4 Wochen | mittel |
| 5 | Politur, i18n, SEO | 2–3 Wochen | niedrig |
| **Σ** | **bis „professionell"** | **≈ 3–4 Monate** | |

Reihenfolge ist bewusst: 0–2 sind unsichtbar, aber ohne sie wird 3–4 zur Qual. Nicht überspringen.

---

## 6. Entscheidungen, die nur du treffen kannst

1. **React-Pfad oder Minimal-Pfad?** (Empfehlung: React — Entscheidung kann bis Ende Phase 2 warten)
2. **Zielgruppe: entschieden — Studierende Physio / Ergo / Logopädie** → Konsequenzen in Abschnitt 7
3. **Hosting**: GitHub Pages behalten oder Cloudflare Pages? Relevant erst, wenn die Modell-Assets groß werden (>100 MB → R2-Bucket)
4. **Monetarisierung irgendwann?** Beeinflusst, ob Accounts/Backend je nötig werden — vorher nicht drüber nachdenken

---

## 7. Zielgruppen-Fokus: Physio / Ergo / Logopädie

Die Zielgruppe verschiebt den Schwerpunkt: **Der Mehrwert liegt nicht im 3D-Modell allein, sondern in 3D + prüfungsrelevanten Daten.** Daraus ergibt sich ein Content-Track, der parallel zur Technik läuft.

### Content-Track (parallel zu Phase 3–5, kein Code nötig)

- [ ] `meta.json` pro Struktur erweitern: lateinischer Name (Terminologia Anatomica), deutscher Name, bei Muskeln **Ursprung / Ansatz / Innervation / Funktion**, bei Nerven Segmente/Versorgungsgebiet
- [ ] KI kann diese Rohdaten schnell liefern — **aber: jede fachliche Angabe gegen ein Standardwerk prüfen** (Prometheus, Schünke). Bei Lerninhalten für Gesundheitsberufe ist ein falscher Ansatzpunkt schlimmer als ein fehlender. Quelle pro Eintrag mitführen.
- [ ] Review-Schleife organisieren: Dozent oder zwei Kommilitonen aus höherem Semester gegenlesen lassen — günstigste Qualitätssicherung, die es gibt

### Modellbestand-Check für Logopädie

Physio und Ergo sind mit Knochen/Muskeln/Bändern/Nerven gut abgedeckt. Für Logopädie prüfen, ob diese Strukturen als einzelne Meshes existieren (Gruppen `ear`, `brain`, `teeth` sind da — reicht aber nicht):

- [ ] Larynx (Kehlkopfknorpel einzeln: Thyroid, Cricoid, Arytenoide), Pharynx, Zunge
- [ ] Schluck- und Kaumuskulatur, mimische Muskulatur (suprahyoidal/infrahyoidal differenziert?)
- [ ] Hirnnerven einzeln — mindestens **V, VII, IX, X, XII** (die logopädisch relevanten)

Was fehlt → Lückenliste anlegen. Beschaffung/Modellierung ist ein eigenes Projekt und sollte die Technik-Phasen nicht blockieren.

### UX-Konsequenzen (fließen in Phase 3–5 ein)

- **Suche muss Latein *und* Deutsch matchen** („deltoideus" und „Deltamuskel" finden dasselbe)
- **Mobile ist nicht optional**: gelernt wird in Bahn und Bibliothek — Touch-UX und Ladezeit auf Mittelklasse-Smartphones real testen
- **Teilen-Funktion (Deep-Links) früh**: Lerngruppen schicken sich Strukturen — kostenloser Vertriebskanal in den Semestern
