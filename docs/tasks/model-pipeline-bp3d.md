# Task: Modell-Pipeline — BodyParts3D sauber neu aufbereiten

## Kontext

Die App lädt ~2.000 anatomische Einzelteile als Draco-GLBs aus [public/models/](../../public/models/),
referenziert über **FJ-IDs als Dateiname** in [public/data/meta.json](../../public/data/meta.json).
Die Meshes stammen aus **BodyParts3D** (Marching-Cubes über MRT-Segmentierung) und tragen
typische Artefakte: Treppchen-Oberflächen, non-manifold Kanten, Löcher, unregelmäßige Tri-Dichte,
sowie **ungenutzte UVs** (TEXCOORD_0 ohne Texturen). Material: ein graues PBR pro Teil.

Ziel ist eine **einheitlich aufbereitete, „corporate" wirkende Modellpalette** mit sauberen,
wasserdichten Meshes, mit der sich gut arbeiten lässt — reproduzierbar erzeugt, nicht handgeklickt.

**Werkzeug:** Blender (lokal) + Blender-MCP für interaktive Entwicklung; Produktion headless per Skript.

## Ziel

1. Saubere Meshes via **Voxel-Remesh → Smooth → Decimate** (Strategie bestätigt).
2. Zwei Tiers physisch erzeugen: **`hifi/`** (sauberer Master) + **`draco/`** (Web-Default).
   `lofi/` bleibt im Schema, wird hier **nicht** erzeugt.
3. Reproduzierbare, versionierte Pipeline (headless Skript), kein manuelles Klicken über die Masse.
4. Automatisiertes QC inkl. Abgleich `meta.json` ↔ Dateisystem.
5. Korrekte Provenienz/Lizenz dokumentiert.

## Nicht-Ziele

- **Keine** Änderung am Three.js-Loader oder am `draco/hifi/lofi`-Schema in meta.json (nur Inhalte/Pfade befüllen).
- **Kein** Voll-Retopo, **kein** `lofi`-Tier in diesem Task.
- **Keine** Texturen/Bakes außer optionalem AO in Vertex-Colors (siehe Phase 3, optional).
- Keine Umbenennung der Gruppen-Ordner.

## Harte Randbedingungen (nicht verhandelbar)

| Regel | Warum |
|---|---|
| **Dateiname bleibt `<FJ-ID>.glb`, Ordner = Gruppe** | Join-Key zwischen meta.json und Dateisystem; sonst bricht die App. |
| **Join über FMA-ID, nicht FJ** | Bei Neu-Download kann sich die FJ-Nummerierung ändern. Stabil ist die FMA-ID (`info.links.fma`). Mapping FMA→FJ pflegen; FJ-Referenzen in meta.json ggf. neu erzeugen. |
| **Teile NICHT einzeln zentrieren** | Anatomische Lage muss erhalten bleiben. Ein *gemeinsamer* Welt-Transform fürs ganze Atlas. Position wie bisher über Node-`translation`. |
| **Draco-Export** | Muss zum vorhandenen Decoder in [public/draco/](../../public/draco/) passen. |
| **Lizenz: CC BY-SA 2.1 Japan** (siehe [ADR 0003](../decisions/0003-bodyparts3d-lizenz.md)) | ShareAlike: bearbeitete, weitergegebene Meshes bleiben CC BY-SA. Attribution + „modified"-Hinweis pflichtig. |
| **Originale read-only, außerhalb des Repos** | Größe + ShareAlike. Originale werden nie in-place editiert. |

## Pipeline

### Phase 0 — Quelle & Provenienz
- Autoritatives BodyParts3D-Release neu ziehen (OBJ-Partonomie-Paket). Version, Datum, URL festhalten.
- Originale read-only ablegen (z. B. `~/bp3d-raw/`, **nicht** im Repo, in `.gitignore` falls doch lokal).
- FMA→FJ-Mapping aus dem BodyParts3D-Partonomy übernehmen.

### Phase 1 — Standardisierung (gemeinsamer Transform)
- Import OBJ.
- Skala mm→m (`0.001`), Y-up beim glTF-Export (Blender Z-up → Exporter regelt).
- **Gemeinsamer Ursprung** fürs ganze Atlas, Teile behalten relative Lage. Transforms anwenden.

### Phase 2 — Mesh-Cleanup (Kern)
Pro Teil, skriptbar:
1. Merge by Distance (Doubles).
2. Lose Inseln unter Schwellwert löschen.
3. **Voxel-Remesh** mit gruppenabhängiger Voxelgröße (Startwerte unten).
4. **Corrective/Laplacian Smooth** leicht (kill Treppchen, ohne Volumen zu fressen).
5. **Decimate (Collapse)** auf Tri-Budget der Gruppe.
6. Recalculate Normals außen; Auto-Smooth ~30°.

**Startwerte (am Pilot kalibrieren):**

| Gruppe | Voxelgröße | hifi Tri-Budget | draco Tri-Budget |
|---|---|---|---|
| bones, teeth, cartilage | mittel | ~20–40 k | ~6–10 k |
| muscles, organs, glands, heart, lungs | mittel | ~15–30 k | ~5–8 k |
| brain | mittel-fein | ~25 k | ~8 k |
| arteries, veins, nerves (dünn!) | **klein** | ~10 k | ~3–4 k |
| ligaments, ear, eyes, skin_hair | nach Augenmaß | — | — |

> Dünne Strukturen (Gefäße/Nerven) brauchen kleine Voxel, sonst zerfallen sie. Am Pilot prüfen.

### Phase 3 — Material/Shading
- Ein PBR-Material pro Gruppe aus `model.default_color` (meta.json). `metallic 0`, `roughness ~0.6`.
- **Ungenutzte UVs entfernen.** Runtime-Farbe überschreibt ohnehin (`js/modelLoader/color.js`) — Material-Farbe ist nur Fallback.
- *Optional Premium:* AO in **Vertex-Colors** backen (keine UVs nötig). Vorher prüfen, dass es das Runtime-Recoloring nicht stört.

### Phase 4 — Tiers
- `hifi/<gruppe>/<FJ>.glb` — Master, höheres Budget, leicht/kein Draco.
- `draco/`-Ebene = aktuelle Ordnerstruktur `public/models/<gruppe>/` — Web-Default, Draco.
- `lofi/` **nicht** erzeugen (Schema bleibt, Pfade leer).

### Phase 5 — Export (deterministisch)
- glTF 2.0 binär (.glb), Draco mesh compression, Y-up, +Normals, **−UVs**, 1 Material.
- Feste Export-Settings in der Skriptdatei → reproduzierbar.
- Dateiname `<FJ-ID>.glb`.

### Phase 6 — QC (automatisiert, Node)
Skript unter `scripts/`, Report-Pattern analog `muskelfinder-map.report.json`:
- gltf-validator: clean.
- Tri-Count im Gruppen-Budget; Dateigröße im Budget.
- Genau 1 Mesh / 1 Material pro Datei.
- BBox plausibel; Centroid ≈ Original (Lage erhalten).
- **Abgleich meta.json ↔ Dateisystem:** jede Entry hat Datei in `draco` + `hifi`; keine Waisen; FJ/FMA konsistent.
- Report als JSON + Konsolen-Summary; Exit-Code ≠ 0 bei Fehlern.

### Phase 7 — Lizenz/Provenienz
- `docs/MODELS.md`: Quelle + Version + Datum, angewandte Transforms/Parameter, Tool-Versionen, „modified"-Hinweis.
- Attribution-Text in der UI bleibt CC BY-SA 2.1 Japan (vgl. ADR 0003).

## Arbeitsweise mit Blender-MCP

1. **Pilot-Set (5 Teile)** repräsentativ wählen: langer Knochen, dünne Vene, blobbiges Organ,
   flacher Knorpel, Muskel. Mit MCP Phase 1–5 live einstellen, Parameter pro Typ kalibrieren.
2. Schritte in **`scripts/process-models.py`** (headless: `blender --background --python scripts/process-models.py`) gießen.
   Parameter-Tabelle (Voxel/Budget pro Gruppe) als Config im Skript.
3. Batch über das ganze Atlas. MCP danach nur noch für QC-Stichproben.

## Definition of Done

- [ ] Pilot-Set bestätigt (visuell ok, Gefäße intakt).
- [ ] `scripts/process-models.py` läuft headless reproduzierbar über alle Gruppen.
- [ ] `hifi/` + `draco/` vollständig erzeugt, Dateinamen = FJ-IDs.
- [ ] QC-Skript grün; meta.json ↔ Dateisystem konsistent (keine Waisen/Lücken).
- [ ] `npm run test` grün, `npm run build` ok, App lädt Modelle korrekt.
- [ ] `docs/MODELS.md` + CHANGELOG-Eintrag; ADR falls Pipeline-Architektur-Entscheidung.
