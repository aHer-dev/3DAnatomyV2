# Backlog — Anatomie Fokus 3D

> Zentrale Sammelstelle offener Punkte. Details stehen in den verlinkten Dokus
> (hier nur Kurzfassung + Zeiger, damit nichts doppelt gepflegt wird).
> Stand: 2026-07-02.

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
