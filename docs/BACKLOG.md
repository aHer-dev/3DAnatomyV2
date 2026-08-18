# Backlog — Anatomie Fokus 3D

> Zentrale Sammelstelle offener Punkte. Details stehen in den verlinkten Dokus
> (hier nur Kurzfassung + Zeiger, damit nichts doppelt gepflegt wird).
> Stand: 2026-08-18.

## Priorität 1 — größter Nutzen / entblockt anderes
- **Draw-Call-Reduktion für volle Muskel-Last** — alle Muskeln geladen = hunderte
  Einzel-Meshes = hunderte Draw-Calls pro Frame; auf iGPU-Laptops der strukturelle
  Flaschenhals bei Kamerabewegung. Lösungsweg: Three.js `BatchedMesh` pro Gruppe
  (ein Draw-Call, Picking/Sichtbarkeit/Farbe pro Teil via `batchId` bleibt möglich).
  Erste Gegenmaßnahme (adaptive Auflösung bei Bewegung, 2026-07-02) ist drin — dieser
  Punkt ist der nächste Hebel, falls es auf Zielhardware noch nicht flüssig reicht.
  Eigenes Task-Briefing nötig (berührt modelLoader/raycaster/visibility).
- **Kalibrierter Modell-Tausch** — die reprozessierten (glatteren) Meshes doch live
  bringen, ohne Positions-Bruch. Lösungsweg (Bbox-Match je Teil, numerisch prüfbar)
  liegt fertig in [tasks/model-recalibration-swap.md](tasks/model-recalibration-swap.md).
- **Design-Relaunch** — Look modernisieren, Komponente für Komponente nach
  [DESIGN_BRIEF.md](DESIGN_BRIEF.md). Nächster Schritt: eine Pilot-Komponente
  (Toolbar oder InfoPanel) als Mockup + Code.
- **Weitere Gruppen im UI freischalten** (`ENABLED_GROUPS` in
  `js/ui/react/groupLabels.ts`, aktuell 5/16) — sobald Namen/Review stehen.

## Priorität 1 — Beschriftungen („Labels/Pins", Roadmap Phase 4)
> Befund vom 2026-08-18, am laufenden Build gemessen. Der Schalter existiert und
> funktioniert technisch; als Lernwerkzeug ist die Funktion noch nicht brauchbar.

- **Unlesbar durch Masse.** Nur mit dem Skelett stehen **297 Beschriftungen** gleichzeitig im
  Bild, mit **2914 überlappenden Paaren** — das Modell verschwindet vollständig darunter
  (Screenshot in der Sitzung). Mit Muskeln sind es **761**. Es fehlt jede Entzerrung: kein
  Declutter, kein Detailgrad nach Zoom, keine Begrenzung auf Sichtbares oder Ausgewähltes.
  Naheliegender erster Schritt: nur die **ausgewählte** Struktur beschriften, plus optional
  „alle" für den Überblick — dann trägt die Funktion sofort.
- **Nachgeladene Gruppen bekommen keine Beschriftung.** `_buildLabels()` in
  `js/features/labels.js` läuft nur beim Einschalten. Wer die Beschriftungen anschaltet und
  **danach** Muskeln lädt, sieht 297 statt 761 — erst Aus- und Wiedereinschalten holt sie nach.
  Gemessen: an → Skelett 297 → Muskeln geladen → weiterhin 297 → aus/an → 761. Es fehlt eine
  Store-Subscription auf `groups`.
- **Dauerhafte rAF-Schleife.** `_tick()` rendert jeden Frame, solange die Beschriftungen an
  sind — der Renderer der App arbeitet sonst bewusst *on demand* (`requestRender`). Bei 761
  Beschriftungen heißt das 761 DOM-Transforms pro Frame. **Nicht sauber gemessen** (mein
  rAF-Zähler misst die Browser-Taktung, nicht die Renderarbeit) — vor einer Optimierung erst
  richtig messen, dann entscheiden.

## Priorität 1 — Mobilversion
> Durchgang vom 2026-08-18 auf 320×568, 375×667 und 390×844 (Touch-Kontext).

- **Das offene Sheet begräbt die Tab-Leiste.** Sheet liegt auf `z-index: 1500`, das Backdrop auf
  `1400`, die Tab-Leiste auf **`100`**. Solange ein Sheet offen ist, ist die primäre Navigation
  verdeckt: ein Tipp auf „Ansicht" oder „Beschriftungen" erreicht stattdessen
  `.shell-sidebar__foot`. **Kein Sackgassen-Fall** — ein Tipp neben das Sheet schließt es, danach
  ist die Leiste wieder bedienbar — aber der Ausweg ist unsichtbar: es gibt keinen
  Schließen-Knopf. Eine Griffleiste ist oben sichtbar; ob sie sich wischen lässt, ist **nicht
  geprüft**. Lösungsweg: Tab-Leiste über das Sheet heben *oder* einen sichtbaren Schließen-Knopf.
- **Tippziele unter 44 px** (WCAG 2.5.5), auf allen drei Breiten gleich:
  - Gruppen-Schalter **36×20** — das ist das *wichtigste* Bedienelement der App
  - Transparenz-Regler **4 px hoch**
  - Reiter Strukturen/Sammlung/Info **31 px**
  - Fußzeilen-Links (Lernen/Lizenz/Quellen/Datenschutz) **17 px**
  - Suchfeld **19 px**
  Die sichtbare Fläche darf klein bleiben; es reicht, das *Tippfeld* per Padding oder
  `::after`-Overlay auf 44 px zu bringen.
- **Was gut ist:** kein horizontales Scrollen auf keiner der drei Breiten · Icon-Rail korrekt
  ausgeblendet, Tab-Leiste da · Float-Cluster korrekt aus (Sheet-Weg stattdessen) · keine
  Konsolenfehler · Ansicht-Sheet vollständig mit sieben Knöpfen inkl. Zurücksetzen.

## Priorität 2 — Content & Korrektheit
- **Fachliche Stichprobe der 54 Muskel-Latein-Namen** (`validation_status='latin_manual'`)
  gegen ein Standardwerk (Prometheus/Schünke) — Projektregel.
- **Latein für die 702 restlichen neuen Teile** (Gefäße/Nerven/Hirn, `labels.la` leer) —
  sinnvoll, sobald ihre Gruppen freigeschaltet werden. Meist compositional (Äste).
- **766 heuristisch zugeordnete Teile** aus `NEW MODELS/sorted/REVIEW.md` fachlich/visuell
  prüfen.
- **2 fehlklassifizierte Bänder** umlegen: `stylomandibular ligament` (`fma57084`/`fma57086`)
  liegen in Gruppe `muscles`, gehören nach `ligaments` (kleiner Fix analog
  `scripts/fix-folder-conflicts.mjs`).
- **`fma7163`** (Skin, 0 Materialien in der GLB) — Mesh neu exportieren oder ausschließen.
  Einziger QC-Fehler, deaktivierte Gruppe `skin_hair`. Siehe [MODELS.md](MODELS.md).

## Priorität 3 — Features (Roadmap Phase 4/5)
- **Querschnitt/Clipping** anbinden — `js/utils/cameraClipping.js` existiert, ist nirgends
  verdrahtet.
- **hifi-Tier laden** — aktuell lädt kein Code die hifi-Variante; Qualitäts-Umschalter.
- **TypeScript-Migration im 3D-Kern fortführen** — aktuell ~26 % (React/Store ist TS,
  Three.js/Loader/Features noch `.js`). Berührt Design nicht, aber offen aus Roadmap Phase 2.

## Offene Entscheidungen (brauchen dich)
- **`.bluebody`-Dateiendung** beim Rebranding umbenennen? Voller Rebrand vs.
  Kompatibilitätsbruch bei bereits exportierten Sammlungen. Aktuell bewusst belassen.
- **Figma vs. code-first** fürs Design — Empfehlung: In-App-UI code-first, Figma nur für
  Marke/Landing/Exploration.
