# ADR 0007: Draw-Call-Reduktion via BatchedMesh (pro Gruppe)

## Status: vorgeschlagen · 2026-07-02

## Kontext
Die App lädt jedes Anatomie-Teil als **eigenes `Object3D`/`Mesh`** und hängt es einzeln in
die Szene (`js/features/modelLoader-core.js` → `loadSingleModel` → `scene.add(model)`).
Realität pro Gruppe: bones 207 · **muscles 464** · cartilage 60 · teeth 30. Mit Muskeln
aktiv rendert die Szene **~1200 Einzel-Meshes = ~1200 Draw-Calls pro Frame**, plus die
CPU-seitige Szenegraph-Traversierung/Frustum-Cull/Sort über 1200 Objekte.

**Messung (2026-07-02, headless):** Bei abgeschaltetem React-Overlay sank die Orbit-Frame-Zeit
nur um ~20 %. **~80 % der Frame-Zeit ist die 3D-Szene selbst.** Das UI-Redesign (Layout B)
hat den 3D-Renderpfad **nicht** verändert (`git diff` gegen den Stand vor dem Redesign für
`renderer/scene/controls/lights/modelLoader` ist leer) — es addiert nur ~20 % Overlay-Last,
was auf grenzwertiger Hardware „gerade flüssig" nach „ruckelt" kippen lässt. Grundlast war
immer die Mesh-Anzahl.

Zielhardware: Schul-Laptops ohne dedizierte GPU. Vergleichbare Anbieter (BioDigital,
Sketchfab) lösen genau das mit Instancing/Batching + LOD.

## Entscheidung (vorgeschlagen)
Pro Gruppe **ein `THREE.BatchedMesh`** (three r179 vorhanden) statt hunderter Einzel-Meshes.
Draw-Calls sinken von ~1200 auf ~Anzahl Gruppen (≤16). Umsetzung **phasiert und hinter einem
Feature-Flag** parallel zum Legacy-Pfad, bis Feature-Parität + Messnachweis stehen. Details/
Phasen: `docs/tasks/perf-batched-mesh/00-plan.md`.

## Was BatchedMesh nicht out-of-the-box kann (und wie wir es lösen)
Die bestehende Interaktion arbeitet **pro Mesh-Material** — BatchedMesh hat **ein** Material
pro Gruppe. Betroffen:
- **Auswahl-Highlight** (`highlightModel.js`) und **Multi-Select** (`multiSelect.js`) setzen
  `material.emissive` pro Mesh → als **per-Instanz-Emissive-Attribut** (Shader-Injection).
- **Transparenz** — Röntgen (`appearance.setGroupOpacity`), **Ghost** (`ghostContext.js`,
  setzt Opacity auf **alle** Teile) und Isolation — pro Mesh `material.opacity` → als
  **per-Instanz-Alpha-Attribut** (Shader-Injection; einzelnes Material kann nicht pro Teil
  transparent sein).
- **Farbe** (`color.updateModelColors`, `material.color`) → BatchedMesh `setColorAt` (nativ).
- **Picking** (`selection.js` per-Mesh-`raycast`-Override, Pickable-Set) → BatchedMesh-Raycast
  liefert `batchId`; neue Mapping-Schicht `batchId ↔ Teil-Meta/Root`.
- **Sichtbarkeit** (`visibility.js`, `groupStates`) → `setVisibleAt(batchId, bool)` (nativ).

→ Ein **gemeinsamer Custom-Shader** (per-Instanz Alpha + Emissive über
`material.onBeforeCompile` bzw. BatchedMesh-Instanzdaten) plus eine **`batchId ↔ Teil`-Registry**
ersetzen die per-Mesh-Materialmanipulation. Die öffentlichen Feature-APIs (select/highlight/
setGroupOpacity/ghost/isolation/color) bleiben von außen gleich; nur ihr Innenleben wird auf
die Registry umgestellt.

## Alternativen (verworfen)
- **`BufferGeometryUtils.mergeGeometries` pro Gruppe:** eine statische Mesh, aber per-Teil-
  Sichtbarkeit/Opacity erfordert Geometrie-Neuupload → schlechter als BatchedMesh.
- **`RenderOptimizer` (LOD/Distanz-Cull, bereits vorhanden, deaktiviert):** blendet nur
  *entfernte* Teile aus; beim Blick auf den ganzen Körper sind alle sichtbar → hilft nicht.
- **Weniger Modelle laden / niedrig aufgelöste Meshes:** widerspricht dem Nutzerziel
  („alle Muskeln flüssig") bzw. ist ein separater Pipeline-Weg.

## Konsequenzen
- Mehr-Sessions-Umbau mit echter Shader-Arbeit; **Risiko** in Selektion/Highlight/Opacity/
  Ghost/Isolation. Deshalb Feature-Flag + Legacy-Pfad bis Parität.
- **Phase 1 ist reines Batch-*Rendering* hinter Flag** (keine Interaktion) → erlaubt eine
  **FPS-Messung auf echter Zielhardware**, bevor die Interaktions-Portierung investiert wird.
  Dieses ADR wird nach Phase 1 von „vorgeschlagen" auf „akzeptiert" bestätigt oder verworfen.
- **Offen / in Phase 1 zu validieren:** Haben Teile per-Teil-**Texturen** (dann kein
  gemeinsames Material)? Erwartung: nein (Modelle sind flächig eingefärbt, `updateModelColors`
  setzt nur `material.color`). Falls doch: Textur-Atlas oder Gruppen mit Textur ausnehmen.
