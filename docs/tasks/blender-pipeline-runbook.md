# Runbook: BodyParts3D-Modelle aufbereiten (Blender, headless)

> Für Mensch **und** KI-Agent. Stur von oben nach unten abarbeitbar.
> Konzept/Begründung: [model-pipeline-bp3d.md](model-pipeline-bp3d.md).

## Verifizierte Fakten (nicht erneut diskutieren)
- Roh-OBJ liegen in `NEW MODELS/sorted/<gruppe>/` (volle Namen, 3.260 Stück, bereits sortiert).
- Roh-OBJ sind in **mm** → Scale **0.001**. Transform Roh→App ist `(x, z, −y)·0.001`
  = identischer Import + Blenders Z-up→Y-up-Export. **Verifiziert** an FJ1228 (exakte Deckung).
- **Nicht** zentrieren, **nicht** rotieren. Ausgabe-Dateiname = nackte FJ-ID.
- Blender hier hat **keine** Draco-Lib → Draco kommt als Node-Nachschritt.
- Röhren (arteries/veins/nerves): **kein** Voxel-Remesh (sonst zerfallen sie); nur Smooth+Decimate.
- Voxelgröße wird **pro Objekt relativ** zur BBox berechnet (`diag/density`), nicht absolut.

## Werkzeuge
- `scripts/blender/process-models.py` — Verarbeitung (Voxel-Remesh→Smooth→Decimate→Material→Export).
  Parameter pro Gruppe stehen oben in der Datei in `GROUP_PARAMS` (hier kalibrieren).
- `scripts/draco-compress.mjs` — Draco-Kompression des `draco/`-Tiers.
- `scripts/blender/import_group.py` — eine Gruppe zur Sichtprüfung in Blender laden.

## Ablauf

### 1. Pilot (Parameter kalibrieren)
```bash
blender --background --python scripts/blender/process-models.py -- --pilot
node scripts/draco-compress.mjs "NEW MODELS/processed/draco"
```
Ausgabe: `NEW MODELS/processed/{hifi,draco}/<gruppe>/<FJ>.glb` + `_process-report.json`.
**Visuell prüfen** (Blender GUI / Blender-MCP / GLB-Viewer): glatt genug? Dünne Teile intakt?
Bei Bedarf `GROUP_PARAMS` in `process-models.py` anpassen (`density` höher = feiner,
`hifi`/`draco` = Ziel-Dreiecke) und Pilot wiederholen.

### 2. Eine Gruppe als Probe
```bash
blender --background --python scripts/blender/process-models.py -- --group veins
node scripts/draco-compress.mjs "NEW MODELS/processed/draco/veins"
```

### 3. Voller Lauf (über Nacht)
```bash
blender --background --python scripts/blender/process-models.py -- --all
node scripts/draco-compress.mjs "NEW MODELS/processed/draco"
```

### 4. QC (erledigt — `scripts/qc-models.mjs`)
- Struktur je ausgelieferter draco-GLB: 1 Mesh/1 Material, Dreieckszahl > 0
  (Draco-Dekodierung via `@gltf-transform/core` + `draco3dgltf`).
- Abgleich `meta.json` ↔ `public/models/`: fehlende/verwaiste Dateien, FJ/Gruppen-Pfad-Konsistenz.
- BBox-Plausibilität ist **nicht** abgedeckt (kein Vergleich gegen Original-OBJ-Centroid).
- Lauf: `node scripts/qc-models.mjs` → Report `NEW MODELS/qc-report.json`.
- Stand 2026-07-01 (nach Komplett-Tausch, s. u.): 0 fehlende/verwaiste draco-Dateien,
  0 Ordner-Konflikte, 0 Inhaltsfehler. Nur noch 79 fehlende hifi-Dateien (Teile ohne
  passende Rohdatei im aktuellen BP3D-Download — keine Regression, bleiben auf der
  alten Mesh-Version).

### 5. In die App übernehmen (teilweise erledigt)
- `processed/draco/<g>/` → `public/models/<g>/`: **zurückgezogen** — Tausch bricht die
  Ausrichtung (Kalibrierungs-Blocker, siehe unten). Bestandsteile laufen weiter auf
  ihren alten Meshes.
- `processed/hifi/<g>/`  → `public/models/hifi/<g>/`: ebenfalls zurückgezogen.
- meta.json `variants.draco.path` ↔ `classification.group`: **erledigt**
  (`scripts/fix-folder-conflicts.mjs`, 108 Fälle behoben) — geometrie-neutral, bleibt.
- Attribution/Provenienz: `docs/MODELS.md` — **erledigt** (Quelle, Transforms, CC BY 4.0,
  siehe [ADR 0005](../decisions/0005-bodyparts3d-lizenz-korrektur.md)).

## Akzeptanz
- [ ] Pilot visuell ok (glatt, dünne Strukturen erhalten) — offen (Komplett-Tausch blockiert).
- [x] Voller Blender-Lauf ohne Fehler; `_process-report.json` vollständig (3.260 Teile).
- [x] Draco-Tier komprimiert (in `NEW MODELS/processed/`, noch nicht als Tausch übernommen).
- [~] QC: `npm run test` + `npm run build` grün; 1 bekannter QC-Fehler (`fma7163`, 0 Materialien,
      deaktivierte `skin_hair`-Gruppe) — Alt-Stand, keine Regression.

## Bekannte offene Punkte (später nachschärfen)
- **3.0-Set Versatz (erledigt, ggf. nachschärfbar):** Die 50 Teile aus der 3.0-Version
  (`_set30-fj.txt`) sitzen versetzt zum Hauptset. Final am Schädel kalibriert:
  `--translate-mm "0.8,5.0,-14.64"`, auf alle 50 angewandt. Kalibrier-Sets zum Übereinanderlegen
  liegen in `NEW MODELS/calibration_sets/` (schaedel.glb + gesichtsmuskeln.glb).
  Nachschärfen bei Bedarf: Wert in `--translate-mm` anpassen, 50 Teile neu rechnen.
- **Komplett-Tausch der Bestandsteile (BLOCKIERT — Kalibrierung):** Ein Tausch auf die
  reprozessierten Meshes (`scripts/swap-existing-models.mjs`) wurde durchgeführt und wieder
  **zurückgesetzt**, weil er die Modelle räumlich zerlegt: Die alten Live-Modelle haben eine
  uneinheitliche, hand-kalibrierte Skalierung (Schädel ≈ `0.0010844`, Rumpf/Wirbelsäule ≈
  `0.001176`), die zusammengesetzt stimmt; die Pipeline liefert einheitlich `0.0010844`,
  wodurch der Rumpf um Faktor 0,922 zum Ursprung schrumpft und der Schädel „abhebt".
  Numerisch nachgewiesen: Frontal/Occipital ratio 1,00 (unbewegt) vs. C7/T5/Sakrum/Femur
  ratio 0,922 (bis −11,6 cm). **Weg nach vorn:** jedes neue Mesh vor dem Tausch per
  Node-Transform bzw. gebackener Skalierung auf die Bounding-Box seines Alt-Pendants (aus
  git HEAD) setzen — Faktor `alt_size / neu_size` um den Ursprung, pro Teil. Das erhält die
  neue, glattere Topologie, reproduziert aber exakt die alte, ausgerichtete Lage
  (numerisch prüfbar: bbox neu == bbox alt → garantiert deckungsgleiche Montage).
  → Eigenes Task-Briefing: [model-recalibration-swap.md](model-recalibration-swap.md).
- **Echte lateinische Namen** für die 766 neuen Teile (aktuell App-Synthese aus dem
  Englischen, `labels.la` leer) — fachliche Prüfung gegen Terminologia Anatomica nötig,
  nicht automatisierbar (Projektregel: falscher Fachbegriff schlimmer als fehlender).
- **766 Teile aus REVIEW.md** (`NEW MODELS/sorted/REVIEW.md`) sind weiterhin nur
  heuristisch einer Gruppe zugeordnet und ungeprüft — fachliche/visuelle Durchsicht steht aus.
