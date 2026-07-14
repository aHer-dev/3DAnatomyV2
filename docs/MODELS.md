# Modell-Provenienz: BodyParts3D

## Quelle

- **Datenbank:** BodyParts3D, © Database Center for Life Science (DBCLS), Japan
- **Lizenz:** CC BY 4.0 (Creative Commons Attribution 4.0 International) — siehe
  [ADR 0005](decisions/0005-bodyparts3d-lizenz-korrektur.md) für die Gegenprüfung an den
  offiziellen Quellen. Attribution ist Pflicht, kein ShareAlike-Zwang.
  - Archiv-Lizenzseite: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
  - Projektattribution: „BodyParts3D, © DBCLS, licensed under CC BY 4.0"
- **Rohdaten:** OBJ-Export aus BodyParts3D, 3.260 Einzelteile (Hauptset + ein separates
  3.0-Set für mimische/Latissimus/Bauch-Muskeln), Stand Download 2026-06.

## Aufbereitung (Pipeline)

Konzept: [docs/tasks/model-pipeline-bp3d.md](tasks/model-pipeline-bp3d.md) ·
Ablauf: [docs/tasks/blender-pipeline-runbook.md](tasks/blender-pipeline-runbook.md)

1. **Sortierung** (`scripts/sort-new-models.mjs`): Roh-OBJ nach Gruppe sortiert über
   App-Bestand → meta.json (FMA/FJ) → Label-Heuristik → `_unsorted`. Output:
   `NEW MODELS/sorted/<gruppe>/`, Manifest + REVIEW.md für unsicher zugeordnete Teile.
2. **Verarbeitung** (`scripts/blender/process-models.py`, Blender 4.0.2, headless):
   - Maßstab: Roh-OBJ in mm → Skalierung **0.0010844** (empirisch an Bestandsapp kalibriert)
   - Transform: `(x, z, −y)` (Z-up → Y-up)
   - Röhrenförmige Strukturen (arteries/veins/nerves): kein Voxel-Remesh (nur
     Smooth+Decimate, sonst zerfallen dünne Strukturen)
   - Alle anderen Gruppen: Voxel-Remesh (Voxelgröße relativ zur BBox) → Smooth → Decimate
   - 3.0-Set-Versatz korrigiert: `--translate-mm "0.8,5.0,-14.64"` (am Schädel kalibriert)
   - Export: glTF 2.0 binär, Y-up, 1 Material/PBR aus `default_color`, ohne UVs
3. **Kompression** (`scripts/draco-compress.mjs`): Draco-Mesh-Kompression für den
   `draco`-Tier (Web-Standard, in `public/models/<gruppe>/`)
4. **Integration** (`scripts/integrate-new-models.mjs`): neue meta.json-Einträge für
   bisher unbekannte Teile, kopiert draco+hifi nach `public/models/`
5. **QC** (`scripts/qc-models.mjs`): strukturelle Validität (1 Mesh/1 Material pro
   Datei, Dreieckszahl > 0) + meta.json↔Dateisystem-Konsistenz (Waisen, fehlende
   Dateien, FJ/Gruppen-Pfad-Abgleich). Report: `NEW MODELS/qc-report.json`

**Tool-Versionen:** Blender 4.0.2 · @gltf-transform/core 4.4.0 · three.js 0.179.1

## Tier-Schema

- `public/models/<gruppe>/<FJ>.glb` — **draco** (Web-Standard, komprimiert, aktuell ausgeliefert)
- `public/models/hifi/<gruppe>/<FJ>.glb` — **hifi** (höheres Tri-Budget, kaum/kein Draco)
- `lofi` — im Schema vorgesehen, aktuell nicht erzeugt (Pfade in meta.json gesetzt, keine Dateien)

## Bekannter Stand (2026-07-01)

- 2.997 meta.json-Einträge, alle Pfade konsistent zur `draco`-Datei
- **Komplett-Tausch NICHT durchgeführt (Kalibrierungs-Blocker):** Die 2.232 Bestandsteile
  laufen weiter auf ihren alten Meshes. Ein Tausch auf `NEW MODELS/processed/` wurde
  versucht und wieder zurückgenommen, weil die alten Live-Modelle eine **uneinheitliche,
  hand-kalibrierte Skalierung** tragen (Schädel ≈ `0.0010844`, Rumpf ≈ `0.001176`), die
  zusammengesetzt stimmt. Die Pipeline liefert einheitlich `0.0010844`; der Tausch
  zerlegt das Skelett dadurch räumlich (Schädel schwebt über der Wirbelsäule). Bevor der
  Tausch wiederholt werden kann, muss die **Per-Teil-Kalibrierung** des Alt-Stands
  reproduziert werden — praktikabel z. B., indem jedes neue Mesh per Node-Transform bzw.
  gebackener Skalierung auf die Bounding-Box seines Alt-Pendants (aus git) gesetzt wird
  (Faktor `alt_size / neu_size` um den Ursprung); das erhält die neue Topologie, aber die
  alte, ausgerichtete Lage. `scripts/swap-existing-models.mjs` bleibt als Ausgangspunkt.
- **765 neue Teile** (aus dieser Pipeline integriert) haben automatisch aus dem
  Englischen synthetisierte Pseudo-Latein-Bezeichnungen (`labels.la` leer) —
  echte Terminologia-Anatomica-Namen stehen noch aus
- Nur 5 von 16 Gruppen sind aktuell im UI freigeschaltet
  (`js/ui/react/groupLabels.ts` → `ENABLED_GROUPS`)
- 1 bekannter Inhaltsfehler: `fma7163` (Skin, `skin_hair`, deaktiviert) hat 0 Materialien
  in der GLB — vom QC als Fehler markiert, deckungsgleich mit dem Vor-Tausch-Stand

## „Modified"-Hinweis

Alle Modelle wurden gegenüber dem BodyParts3D-Original verändert: Remesh/Smooth/Decimate,
Skalierung, Koordinatentransform, Export als komprimiertes glTF, teils Neuklassifikation/
Umbenennung. Originale Rohdaten bleiben unverändert in `NEW MODELS/` (werden nicht
committet/verteilt — nur die Pipeline-Outputs in `public/models/`).
