# Muskeln und Sehnen: Datenpflege und Darstellung

Stand: 2026-10-12. Grundlage ist `AUFTRAG_App_Sehnenfarbe.md` im
OneDrive-Arbeitsbereich. Die Messwerte stammen aus Blender; die App berechnet
die Farben zur Laufzeit auf den bestehenden BodyParts3D-Modellen.

## Messwerte aktualisieren

Die Laufzeit lädt `public/data/muskelgrenzen.json`. Sie kann nicht auf OneDrive
zugreifen. Nach neuen oder korrigierten Messungen im Projektordner ausführen:

```bash
cp "/mnt/c/Users/Anato/OneDrive/Arbeitsbereich/Anatomie/3D/Blender/muskelgrenzen.json" "public/data/muskelgrenzen.json"
cmp "/mnt/c/Users/Anato/OneDrive/Arbeitsbereich/Anatomie/3D/Blender/muskelgrenzen.json" "public/data/muskelgrenzen.json"
npm run test
npm run typecheck
npm run lint
npm run build
```

Falls der OneDrive-Pfad auf dem Rechner anders lautet, zuerst suchen:

```bash
ls /mnt/c/Users/*/OneDrive/Arbeitsbereich/Anatomie/3D/
```

Die Kopie hat am 2026-10-12 **247 Einträge** unter `muskeln`. Weitere Einträge
werden ohne neue Fallunterscheidungen verarbeitet. Ein Modell ohne Zuordnung
bleibt einfarbig. Vor Übernahme neuer Daten auch die Kontrollblätter unter
`Blender/vorschau_grenzen/*.jpg` mit denselben Blickrichtungen vergleichen.
Die JSON-Aktualisierung erfordert keinen Export und keine Änderung einer GLB.

## Zuordnung und Berechnung

`js/modelLoader/muscleBoundary.ts` ordnet über den **GLB-Dateinamen** zu, nicht
über FMA-Nummer oder Gruppe. Die Zuordnung gilt auch für Muskeldateien in
`eyes`; der Dateipfad stammt weiterhin aus `meta.json`.
Gemessene und über `links` zugeordnete Muskeln in `eyes` verwenden dieselbe
gespeicherte Bauchfarbe wie die Muskelgruppe. Tatsächliche Augen behalten die
Augenfarbe; die gespeicherten Gruppenfarben und ihre Standardwerte ändern sich nicht.

- Der JSON-Schlüssel gilt unmittelbar für diese Datei. Das umfasst die Fälle,
  in denen ausschließlich ein linkes Modell vorhanden und selbst der Schlüssel ist.
- Nur eine Datei, die im Feld `links` eines Eintrags steht, verwendet die
  gespiegelten Parameter: x → −x. Ein direkter Schlüssel hat Vorrang.
- `links: null` erzeugt keine Spiegelzuordnung. Namen mit einem `M`-Suffix
  oder Seitenangaben in `meta.json` lösen keine Spiegelung aus.
- `zwischensehnen` und `sehnenfelder` fließen in die Referenzrechnung ein.
  `ganz_sehne` benötigt keinen Sonderfall: die hinter dem Mesh liegende
  Bauchstrecke ergibt bereits ein Gewicht von null.

Die Funktion `bauchGewicht` übernimmt die JavaScript-Rechnung des Auftrags
unverändert; TypeScript ergänzt nur Typen und Export. Ihre Arithmetik und
Übergänge dürfen bei einer Datenaktualisierung nicht angepasst werden. Pro
Vertex entsteht das Attribut `bellyWeight`: **0 = Sehne, 1 = Muskelbauch**.
Berechnet wird unmittelbar nach dem Laden in den unveränderten Koordinaten
des Attributes `position`, bevor die Datei in einen weiteren Laufzeitpfad gelangt.

`js/modelLoader/muscleAppearance.ts` mischt im Standardmaterial zwischen
`#EFE6D2` und der jeweiligen Bauchfarbe. Der Farbwähler verändert weiterhin
`material.color`; damit steuert er ausschließlich den Bauch. Die Sehnenfarbe
bleibt fest. Auswahl, Hervorhebung und Deckkraft verwenden die vorhandenen
Standardmaterial-APIs. `AnatomyMaterial.copy()` erhält die Shader-Eigenschaften
auch bei den Materialklonen dieser Funktionen (siehe [ADR 0010](decisions/0010-muscle-tendon-rendering.md)).

## Quellenprüfung und FJ801

Beim vorhandenen Muskel-Bundle weicht die rohe Bounding Box von
`FJ801.glb` (M. temporoparietalis) um **1,312 mm** von der JSON ab. Zwei
Dreiecke des Originals fehlen im Bundle. Die Originaldatei besteht die
Referenzprüfung.

`js/modelLoader/modelSourcePolicy.ts` wählt deshalb ausschließlich für FJ801
die vorhandene, unveränderte Originaldatei. Die übrigen Bundle-Modelle nutzen
weiter ihren bisherigen Ladepfad. Das fehlerhafte Bundle wird weder korrigiert
noch neu exportiert. Der Modellbestand bleibt unverändert.

Diese Quellenkorrektur verursacht beim Laden der Muskelgruppe einen
zusätzlichen Original-Request mit **22.328 Byte Dateigröße**. Die JSON für
Teil A hat separat **211.650 Byte Dateigröße**. Dies sind Dateigrößen ohne
HTTP-Kompression, Cacheeffekte oder Header; die tatsächlich übertragenen
Bytes müssen im Browser gemessen werden. Die zusätzliche Modellanforderung
ist eine Folge der Quellenprüfung, nicht einer Maßnahme aus Teil B.

Eine erfolgreiche HTTP-Antwort ist allein kein Beleg für ein vorhandenes Bundle:
SPA-Hosts können bei einer fehlenden Datei `index.html` mit Status 200 liefern.
Die Quellenprüfung lehnt `text/html` bei der Bundle-Probe ab und verwendet dann
den vorhandenen Einzeldatei-Loader. Das betrifft etwa `eyes`, wo kein Gruppen-Bundle
liegt; die Augenmuskeln werden weiterhin aus den bestehenden Originaldateien geladen.

## Schaltbare Darstellungsqualität

Die Einstellungen liegen ausschließlich im Zustand-Store. Das React-Panel
schreibt `renderingSettings`; der imperative 3D-Layer reagiert per Subscription.
Alle sechs Maßnahmen starten aktiviert und sind einzeln schaltbar:

| Store-Schlüssel | Wirkung |
| --- | --- |
| `environment` | Im Code erzeugtes `RoomEnvironment` mit PMREM; keine HDR-Datei. |
| `toneMapping` | ACES-Tone-Mapping; Ausgabe bleibt in sRGB. |
| `tissueMaterials` | Gewebeabhängige Rauheit: matter Bauch und Knochen, etwas glänzendere Sehne. |
| `ambientOcclusion` | Dezentes GTAO für Fugen und Vertiefungen im Bild. |
| `smoothNormals` | Neue Normalen mit Mittelung an exakt gleichen Positionen; kein Verschweißen von Vertices. |
| `polygonOffset` | Vermeidet Z-Fighting am Muskelmaterial ohne Geometrieverschiebung. |

`performanceMode` und das Geräteprofil `constrainedDevice` pausieren das
weiche Raumlicht und GTAO, da beide Effekte zusätzliche Rechenleistung benötigen.
Die gespeicherte Wahl bleibt erhalten und wird nach Ende der Einschränkung
wieder wirksam. Bei sichtbaren transparenten Materialien setzt der Renderer
GTAO ebenfalls aus, damit deren Tiefendarstellung keine falsche Verdeckung
erzeugt. Ein Modell-Reset behält Qualitätswahl und Geräteprofil bei.

Der Schalter **Performance-Modus** pausiert weiches Raumlicht und GTAO. Er aktiviert keine
Geometriebündelung. Der ältere experimentelle Pfad `performance.batchedGroups`
bleibt standardmäßig aus: ihm fehlen weiterhin die vollständige Auswahl,
Hervorhebung und Deckkraftsteuerung einzelner Instanzen (ADR 0007).
Die Anpassung dieses Versuchspfads erhält `bellyWeight` in Geometriekopien,
trennt Bauch- und Gruppenfarbe je Instanz und führt die gespeicherten
Originalnormalen mit `getOriginalAnatomyNormal`/`preserveAnatomyNormals` mit.
Das ermöglicht reversibles Umschalten der Normalenglättung, ohne Quellen oder
eingebaute Instanzmatrizen zu ändern. Eine vollständige interaktive Bündelung
ist damit noch nicht umgesetzt.

**Teil B lädt keine zusätzlichen Modelle, Bildtexturen oder HDR-Dateien.**
RoomEnvironment, Materialien, Normalen und Nachbearbeitung werden aus Code
und bereits geladenen Geometrien erzeugt; zusätzliches JavaScript ist bei
der im Auftrag verlangten Datenprüfung ausgenommen. Die bestehenden
Gruppenfarben bleiben erhalten. Eine optionale Muskelfaserung ist nicht
aktiviert; dafür sind zuerst Beispielbilder und die Freigabe der Lehrkraft nötig.

## Geometrieprüfung und Abnahme

Die Vorbereitung verändert weder `position` noch Indexdaten, Knotenmatrizen,
Positionen, Rotation oder Maßstab. Laufzeitprüfungen halten das Laden an, wenn
die Welt-Bounding-Box um mehr als **0,01 mm** oder die rohe `position`-Box
einer direkt per Schlüssel zugeordneten Datei um mehr als **1 mm** von
`pruef_bbox_gltf` abweicht. Die linke Partnerdatei hat keine eigene JSON-Box;
die rechte Box wird dafür nicht als symmetrisch garantierte Referenz ausgegeben.

`js/modelLoader/modelGeometry.test.ts` prüft den gesamten Originalbestand
mit **2.997 Originaldateien** und **789 Bundle-Wrappern** einschließlich roher
Positionsdaten und gespeicherter Transformationen. Die erwartete Ablehnung des fehlerhaften
FJ801-Wrappers wird ausdrücklich geprüft; die gewählte Originalquelle muss
die Referenz bestehen. Die Prüfung verändert und exportiert keine Modelle.

Die Abschlussprüfung am 2026-10-12 ist grün: **162 Vitest-Tests**, Typecheck,
Lint und Build. Die neuen Kernmodule bestehen zusätzlich `tsc --strict`.
Die SHA-256-Prüfsummen aller **3.767 GLBs** stimmen mit dem Ausgangsstand überein.
Ein separater Browser-Smoke prüft zwölf UI-/Interaktionsfälle einschließlich
aller sechs Schalter, echter Canvas-Auswahl, Hervorhebung und Fotoexport
(600 × 800); keine Browserfehler.

Die Abnahme-Dateien liegen im OneDrive-Arbeitsbereich unter
`Anatomie/3D/Blender/abnahme_app_sehnenfarbe_2026-10-12/`:
`vergleich.html`, `messwerte.json`, `ui-pruefung.json`, sechzehn
Vorher-/Nachher-JPGs (Arm, Bein, Rumpf, Kopf jeweils ventral/dorsal) und die
zugehörigen Kontrollblätter. Die Aufnahme bricht ab, wenn Kamera, Zielpunkt
oder sichtbare Modelldateien eines Vorher-/Nachher-Paars abweichen.

| Prüfung | Vorher (`d100a58`) | Nachher |
| --- | ---: | ---: |
| Modell- und JSON-Nutzdaten, kaltes Laden | 15.296.444 Byte | 15.530.422 Byte |
| Bildrate, Performance-Modus | 30,30 FPS | 30,32 FPS |
| Bildrate, volle Qualität | — | 30,33 FPS |

Gemessen in Windows Chrome 155 mit **AMD Radeon 8060S / Direct3D 11**, bei
1000 × 900 Pixeln und Pixelverhältnis 1. Die Kameradrehung umfasst jeweils
180 Frames, 761 sichtbare Modell-Roots und eine kontrollierte Render-Schleife;
die zusätzliche Demand-Schleife wird im Prüfskript angehalten. Der Bildtakt
liegt in allen Profilen bei rund 30 FPS; daraus lässt sich keine maximale
GPU-Bildrate oder Bildrate auf anderen Geräten ableiten. Die Software-Grafik-
Diagnose bleibt separat als `messwerte-softwaregrafik.json` erhalten.

Der zusätzliche Payload von **233.978 Byte** ist exakt die JSON (211.650)
plus das geprüfte FJ801-Original (22.328). **Teil B: +0 Byte Datenassets.**
JavaScript und Draco-Decoder werden als Code getrennt gezählt. Der lokale
Server überträgt die Nutzdaten ohne HTTP-Kompression; Header werden nicht
mitgezählt. Für die Baseline nutzt die Augen-Gruppe ihren vorhandenen
Einzel-Datei-Lader, weil deren alte Bundle-Probe die HTML-Fallback-Seite für
eine GLB hält; beide Versionen vergleichen so denselben Modellbestand.

Reproduktion: `scripts/review-muscle-rendering.mjs <Playwright-Modul> <Zielordner>
[CDP-Endpunkt]` bei laufenden Baseline-/Task-Vite-Servern auf Port 4173/4174.
Playwright ist ein externes Prüfwerkzeug und keine neue App-Abhängigkeit.
Das Skript benutzt die von der App geladenen Modul-URLs, um doppelte Store-
Instanzen bei Vite-Hot-Reload auszuschließen.

Offen bleibt die Sichtabnahme durch die Lehrkraft, insbesondere für verdeckte
Strukturen und die bisher als Entwurf markierten Teile. Die optionale
Muskelfaserung ist nicht aktiviert. Gruppenfarben und Meta-Zuordnungen wurden
nicht geändert.
