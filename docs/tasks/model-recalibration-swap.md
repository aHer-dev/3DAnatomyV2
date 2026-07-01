# Task: Kalibrierter Komplett-Tausch der Bestandsteile

> Status: **offen / blockiert-gelöst** (Lösungsweg steht, noch nicht umgesetzt).
> Kontext/Pipeline: [blender-pipeline-runbook.md](blender-pipeline-runbook.md).

## Ziel
Die 2.232 Bestandsteile auf die neu prozessierten Meshes (`NEW MODELS/processed/`)
umstellen — **ohne** die räumliche Ausrichtung zu zerstören.

## Warum blockiert (Kern des Problems)
Die alten Live-Modelle tragen eine uneinheitliche, hand-kalibrierte Skalierung:
Schädel ≈ `SCALE 0.0010844`, Rumpf/Wirbelsäule ≈ `0.001176` (≈ ×1,0844). Zusammengesetzt
ergibt diese Mischung ein stimmiges Skelett. Die Pipeline exportiert aber **einheitlich**
`0.0010844`. Ein naiver Datei-Tausch (`scripts/swap-existing-models.mjs`) schrumpft
deshalb den Rumpf um Faktor 0,922 zum Ursprung hin, lässt den (schon passenden) Schädel
unverändert → der Schädel „schwebt" über der eingesunkenen Wirbelsäule.

Numerisch belegt: Frontal/Occipital ratio 1,00 (unbewegt) vs. C7/T5/Sakrum/Femur
ratio 0,922 (bis −11,6 cm). Der naive Tausch wurde deshalb wieder zurückgesetzt.

## Lösungsweg (erprobt, noch nicht implementiert)
Jedes neue Mesh **vor** dem Tausch exakt auf die Bounding-Box seines Alt-Pendants setzen:

1. Für jede FJ-ID: Alt-Bbox aus `git HEAD` lesen (`center_alt`, `size_alt`) und Neu-Bbox
   aus `NEW MODELS/processed/…` (`center_neu`, `size_neu`).
2. Skalierungsfaktor um den Ursprung: `r = size_alt / size_neu` (pro Achse; da gleiche
   Grundgeometrie nur neu vermesht, ist `r` nahezu uniform — uniformer Median genügt,
   Rest über eine kleine Node-Translation `t = center_alt − center_neu·r` exakt matchen).
3. Transform ins neue Mesh bringen — **zwei Optionen**:
   - **Node-TRS** (Root-Node `scale`/`translation` setzen, Geometrie unangetastet) →
     kein Draco-Re-Encode, risikoarm, reversibel. Achtung: prüfen, dass `modelLoader`
     Node-Transforms respektiert (three.js tut das; Raycasting/Selection bleibt korrekt).
   - **Gebacken** (Vertices skalieren, neu Draco-encoden) → konsistent mit den 766 bereits
     integrierten Teilen (Scale in Vertices gebacken, Node = Identity). Braucht Draco-
     Encoder (`draco3dgltf.createEncoderModule`, ist als Dependency vorhanden).
4. Sowohl `draco`- als auch `hifi`-Tier behandeln.

## Verifikation (ohne Rendering möglich!)
Nach dem Transform **numerisch** prüfen: Neu-Bbox == Alt-Bbox pro Teil (center-offset ≈ 0,
size-ratio ≈ 1,00). Da der Alt-Stand verifiziert-ausgerichtet ist, garantiert bbox-Deckung
die korrekte Montage — kein visueller Vergleich nötig. Zusätzlich: `npm run test`,
`npm run build`, `node scripts/qc-models.mjs`. Danach Stichprobe im echten Browser
(`?s=<id>`-Deep-Links, z. B. Femur `fma24475`, Deltoid `fma34682`, Schildknorpel `fma55099`).

## Nicht-Ziele / Hinweise
- Kein erneuter Blender-Lauf nötig — `processed/` liegt fertig vor.
- 79 Teile ohne passende Rohdatei im aktuellen BP3D-Download bleiben auf der Alt-Version.
- Der Messwert-Ansatz (Bbox aus GLB, Draco-Dekodierung) ist in `scripts/qc-models.mjs`
  bereits vorhanden und wiederverwendbar.
- **Blast radius:** ersetzt live ausgelieferte Modelle für ~75 % aller Strukturen — vor
  dem Commit an einer kleinen Stichprobe (5 Knochen) numerisch UND visuell gegenprüfen.
