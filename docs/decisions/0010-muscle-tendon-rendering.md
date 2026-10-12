# ADR 0010 — Sehnenfarbe und Darstellungsqualität ohne Modelltransformationen

Datum: 2026-10-12 · Status: akzeptiert

## Kontext

Die Lehrkraft hat für 247 Muskeldateien Bauchgrenzen in den rohen
glTF-Geometriekoordinaten gemessen. Die App soll den Bauch in der wählbaren
Muskelfarbe und die Sehne fest in `#EFE6D2` zeigen. Manche erfassten Modelle
stehen in `meta.json` unter `eyes`. Die Blender-Referenzrechnung ist verbindlich.
Zusätzlich sollen Licht und Schattierung ohne neue Bild- oder Modelldaten
verbessert werden; jede Maßnahme muss einzeln schaltbar bleiben.

Geometriepositionen, Indizes und Transformationen dürfen dabei nicht geändert
werden. Ein früherer Modellversuch hatte Teile gegeneinander verschoben.
Bestehende Auswahl-, Transparenz- und Hervorhebungsfunktionen klonen
Standardmaterialien. Eine nur per Instanz gesetzte `onBeforeCompile`-Funktion
würde beim normalen `Material.clone()` verloren gehen.

## Entscheidung

1. **Messdaten als Laufzeitkopie:** `public/data/muskelgrenzen.json` wird anhand
   des GLB-Dateinamens ausgewertet. Der direkte Schlüssel gilt ohne Spiegelung;
   ausschließlich `links` ordnet eine gespiegelt parametrisierte Partnerdatei
   zu. `links: null` erzeugt keine Partnerzuordnung. Die unveränderte
   `bauchGewicht`-Referenz liegt typisiert in `muscleBoundary.ts`.
2. **Neues Vertexattribut vor weiteren Verarbeitungsschritten:**
   `prepareAnatomyModel` berechnet `bellyWeight` in den Dateikoordinaten von
   `position`. Es verändert keine Positions- oder Indexdaten, keine Ursprünge
   und keine Objekttransformationen. Das Attribut bleibt Bestandteil der
   Geometrie im Performance-Pfad; Transformationsbacken ist ausgeschlossen.
3. **Kopierbares Standardmaterial:** `AnatomyMaterial` ist eine Unterklasse
   von `MeshStandardMaterial`. Die Shadererweiterung liegt auf der Klasse;
   `copy()` übernimmt die eigenen Zustandsfelder, und der Program-Cache-Key
   unterscheidet Gewichtung und Gewebematerial. So erhalten normale
   `clone()`-/`copy()`-Aufrufe die Sehnenmischung. Farbe, Emissive und Deckkraft
   bleiben über die bestehenden Standard-APIs steuerbar. Der Farbwähler
   verändert ausschließlich die Bauchfarbe. Gemessene und gepaarte Muskeln in
   `eyes` teilen die gespeicherte Muskel-Bauchfarbe; tatsächliche Augen und
   Gruppenstandardfarben bleiben unverändert.
4. **Normalen ohne Verschweißen:** Die Glättung berechnet Normalen neu und
   mittelt sie an exakt übereinstimmenden Positionen. Vertices werden weder
   verschoben noch entfernt; Positions- und Indexdaten bleiben unverändert.
   Originalnormalen bleiben für das Abschalten der Maßnahme verfügbar. Im
   bestehenden experimentellen Batchpfad werden sie über
   `getOriginalAnatomyNormal`/`preserveAnatomyNormals` in die Batchkopie übertragen.
5. **Zusätzliche Store-Bridge:** Sechs unabhängige `renderingSettings` sowie
   `performanceMode` und `constrainedDevice` liegen im Zustand-Store.
   `SettingsPanel` schreibt ausschließlich Store-Aktionen für diese Einstellungen.
   Materialvorbereitung und `core/renderQuality.ts` lesen bzw. abonnieren sie
   imperativ. Die gemeinsame pure Funktion `getEffectiveRenderingSettings`
   pausiert weiches Raumlicht und GTAO bei Performance-Modus oder schwachem Geräteprofil, ohne die
   Nutzerwahl zu überschreiben. Sichtbare transparente Materialien umgehen
   GTAO im jeweiligen Frame.
6. **Prüfungen vor Registrierung:** Die rohe `position`-Bounding-Box eines
   direkt zugeordneten Schlüssels darf von `pruef_bbox_gltf` höchstens
   **0,001 m (1 mm)** abweichen. Die Welt-Bounding-Box muss vor/nach der
   Vorbereitung innerhalb **0,00001 m (0,01 mm)** gleich bleiben. Eine
   Abweichung stoppt den Ladepfad; sie wird niemals durch Transformationen
   passend gemacht. Inventartests prüfen Originaldateien und Bundle-Wrapper.
7. **Gezielter Quellenfallback:** Der vorhandene FJ801-Wrapper im Muskel-Bundle
   überschreitet die Referenztoleranz (1,312 mm; zwei Dreiecke fehlen).
   `modelSourcePolicy.ts` wählt dafür die geprüfte bestehende Originaldatei.
   Alle GLBs bleiben unverändert. Der Quellenfallback ist explizit und wird
   zusammen mit der erwarteten Ablehnung des Wrappers getestet.
8. **Bundle-Probe mit Inhaltstyp:** HTTP 200 mit `text/html` gilt nicht als
   Modellantwort. Ein SPA-Fallback für ein fehlendes Bundle löst deshalb den
   vorhandenen Einzeldatei-Ladepfad aus; insbesondere bleiben die Originale
   der unter `eyes` eingeordneten Muskeln erreichbar.

## Konsequenzen

- Teil A benötigt zusätzlich die JSON-Messwerte (211.650 Byte Dateigröße).
  Der FJ801-Fallback benötigt einen zusätzlichen Original-Request
  (22.328 Byte Dateigröße). Tatsächliche HTTP-Übertragung wird separat gemessen.
- Teil B erzeugt RoomEnvironment/PMREM, GTAO, Materialrauheit und Normalen im
  Code. Es benötigt keine neuen Texturen, HDR-Dateien oder GLBs.
- Die Gruppenfarben werden nicht geändert. Optionale Muskelfaserung bleibt
  bis zur gesonderten Sichtprüfung und Freigabe aus.
- Qualitätswahl und Geräteprofil überleben den Modell-Reset. Browser-Storage
  wird nicht eingesetzt.
- Der UI-Schalter Performance-Modus schaltet weiches Raumlicht und GTAO ab und
  aktiviert keine Geometriebündelung. `performance.batchedGroups` bleibt ein
  standardmäßig deaktivierter Versuchspfad ohne vollständige individuelle
  Interaktion. Er erhält nun `bellyWeight`, Bauchfarben je Instanz und
  umschaltbare Normalen in Kopien, ohne die Originalgeometrien zu verändern.
  Die noch fehlende Auswahl-/Hervorhebungs-/Deckkraftsteuerung wird durch
  diese Anpassungen nicht als abgeschlossen erklärt.
- Die Inventarprüfung umfasst 2.997 Originaldateien und 789 Bundle-Wrapper;
  die Rohpositions- und Transformationsvergleiche bleiben verbindlich.
  Eine automatische Neukompression oder Reparatur des FJ801-Bundles gehört
  nicht zu diesem Task.
- Datenpflege und Abnahmeablauf sind in
  [MUSCLE_RENDERING.md](../MUSCLE_RENDERING.md) beschrieben.
