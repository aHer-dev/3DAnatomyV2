# ADR 0009 — Asset-Bündelung pro Gruppe (1 Request statt N)

## Status: akzeptiert · 2026-07-06

## Kontext

Jedes Anatomie-Teil liegt als eigene Draco-GLB vor und wird einzeln geladen
(`modelLoader-core.js` → `loadSingleModel`). Pro Gruppe sind das viele Dateien:
**arteries 809 · veins 501 · muscles 464 · bones 207 · …** (gesamt 3762 GLB).
Eine Gruppe zu laden heißt darum **N HTTP-Requests + N Draco-Decoder-Aufrufe**;
die Batch-Größe ist für große Gruppen bewusst auf 2–3 gedeckelt, damit der
Main-Thread nicht blockiert → das Laden ist entsprechend langsam.

Dies ist ein **Lade-/Netzwerk**-Problem und getrennt vom **Render**-Problem
(Draw-Calls), das ADR 0007 (BatchedMesh) adressiert. Beide Hebel sind
komplementär: Ein Gruppen-Bundle ist zugleich das natürliche Eingabe-Asset für
den späteren BatchedMesh-Aufbau (alle Geometrien einer Gruppe in einer Datei).

## Entscheidung

Pro Gruppe **eine gepackte `<group>.bundle.glb`** + **`<group>.bundle.json`**
(Manifest der Teil-IDs in Node-Reihenfolge), erzeugt aus den Einzel-GLB durch
`scripts/bundle-groups.mjs` (`@gltf-transform`). Aus N Requests wird **1**.

Design-Invarianten, damit der bestehende Interaktions-Pfad **unverändert** bleibt:
- Jede Quell-Datei wird zu **einem benannten Wrapper-Node** (Name = Datei-Basename
  = Teil-ID). Der Loader mappt `node.name → meta` (via `getMetaByFile`); das
  Manifest ist redundante Absicherung der Reihenfolge.
- **Keine Material-Deduplizierung**: jedes Teil behält sein eigenes Material →
  per-Teil-Farbe/Deckkraft im Legacy-Pfad funktioniert weiter.
- Der geladene Szenegraph ist **äquivalent** zum Einzel-Laden: N Model-Roots,
  jeweils `userData.meta`, als Pickable registriert, in `groups[group]` im Store.

**Aktivierung ohne harten Flag-Zwang:** `loadGroupByName` prüft, ob ein Bundle
existiert (Manifest-Probe); wenn ja → Bundle-Pfad, sonst der **unveränderte**
Einzel-Datei-Pfad. Kill-Switch `performance.useBundles` (Default `true`) kann das
global abschalten. Groups ohne Bundle verhalten sich exakt wie heute → **null
Risiko** für noch nicht gebündelte Gruppen (Arterien/Neuro etc.).

## PoC-Messung (2026-07-06, Gruppe „ligaments")

| | vorher | Bundle |
|---|---|---|
| Requests | 28 | **1** |
| Größe | 349 KB (28 Dateien) | **247 KB** (1 Datei, −29 %) |
| Szenegraph | 28 Roots | 28 Wrapper-Nodes, 28 Meshes, **28 Materials** |
| Meta-Mapping | — | **28/28** Teile gemappt |

Die Größenreduktion kommt aus geteiltem Buffer + wegfallendem Per-Datei-Overhead.
Bestätigt zugleich die offene Frage aus ADR 0007: **keine Per-Teil-Texturen**
(flaches Material) → gemeinsames Material fürs spätere BatchedMesh ist tragfähig.

## Git-/Deploy-Strategie

Bundles sind **generierte Artefakte** aus den (weiter getrackten) Einzel-GLB.
Sie werden committet (Fokus-Set klein: Bänder 247 KB, Muskeln ~7 MB), damit der
GitHub-Pages-Deploy ohne zusätzlichen Build-Schritt funktioniert. Der Bündler ist
idempotent und jederzeit neu ausführbar (`npm run bundle:groups <group>`). Ein
späterer Schritt kann die nun redundanten Einzel-Dateien aus dem Deploy (`dist/`)
ausschließen, um die ausgelieferte Größe zu senken (separat, nicht Teil dieses ADR).

## Alternativen (verworfen)

- **Einzeldateien behalten, nur HTTP/2-Multiplexing nutzen:** reduziert
  Round-Trips, aber nicht die N Draco-Decoder-Aufrufe + Per-Request-Overhead.
- **Material-Dedup im Bundle:** kleiner, aber zerstört per-Teil-Farbe/Deckkraft
  im Legacy-Pfad → verworfen (Dedup passiert erst im BatchedMesh-Pfad, per Instanz).
- **Ein globales Bundle für alles:** verhindert selektives Laden/Entladen pro
  Gruppe (Kernfunktion der App).

## Konsequenzen

- Neuer Build-Schritt `scripts/bundle-groups.mjs` + npm-Skript; Bundles im Repo.
- Loader bekommt einen zweiten, additiven Ladepfad (Bundle) hinter Existenz-Probe
  + Kill-Switch; der Einzel-Datei-Pfad bleibt vollständig erhalten (Fallback).
- Beim Neu-Aufbereiten von Modellen muss der Bündler der betroffenen Gruppe neu
  laufen (in die Modell-Pipeline-Doku aufnehmen).
