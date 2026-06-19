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

### 4. QC (TODO — eigenes Skript)
- gltf-validator clean, Tris im Budget, 1 Mesh/1 Material, BBox plausibel.
- Abgleich `meta.json` ↔ `processed/`: jede Entry hat `hifi`+`draco`, keine Waisen.

### 5. In die App übernehmen (erst nach QC, eigener Commit)
- `processed/draco/<g>/` → `public/models/<g>/`  (ersetzt aktuelle Modelle)
- `processed/hifi/<g>/`  → `public/models/hifi/<g>/`
- meta.json `variants.hifi.path` befüllen; **129 Ordner-Konflikte** aus
  `NEW MODELS/sorted/_conflicts.json` dabei mit korrigieren.
- Attribution/Provenienz: `docs/MODELS.md` (Quelle, Transforms, CC BY-SA 2.1 JP).

## Akzeptanz
- [ ] Pilot visuell ok (glatt, dünne Strukturen erhalten).
- [ ] Voller Lauf ohne Fehler; `_process-report.json` vollständig.
- [ ] Draco-Tier komprimiert (Größen ~ App-Niveau).
- [ ] QC grün; `npm run test` + `npm run build` ok; App lädt korrekt.

## Bekannte offene Punkte (später nachschärfen)
- **3.0-Set Versatz (erledigt, ggf. nachschärfbar):** Die 50 Teile aus der 3.0-Version
  (`_set30-fj.txt`) sitzen versetzt zum Hauptset. Final am Schädel kalibriert:
  `--translate-mm "0.8,5.0,-14.64"`, auf alle 50 angewandt. Kalibrier-Sets zum Übereinanderlegen
  liegen in `NEW MODELS/calibration_sets/` (schaedel.glb + gesichtsmuskeln.glb).
  Nachschärfen bei Bedarf: Wert in `--translate-mm` anpassen, 50 Teile neu rechnen.
- **Komplett-Tausch der 2.494 Bestandsteile** auf die neuen Meshes (mit `SCALE 0.0010844`),
  inkl. der 129 Ordner-Konflikte (`NEW MODELS/sorted/_conflicts.json`).
- **Echte lateinische Namen** für die 766 neuen Teile (aktuell App-Synthese aus dem Englischen).
