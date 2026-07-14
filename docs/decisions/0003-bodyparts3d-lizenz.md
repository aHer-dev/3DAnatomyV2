# ADR 0003: BodyParts3D-Lizenz ist CC BY-SA 2.1 Japan

## Status: ersetzt · 2026-06-10 · ersetzt durch [ADR 0005](0005-bodyparts3d-lizenz-korrektur.md)

> **Korrektur (2026-07-01):** Diese ADR stützte sich auf die ältere, jurisdiktions-
> spezifische Lizenzangabe der BodyParts3D-Erstveröffentlichung (2008). Die aktuelle,
> vom Rechteinhaber selbst betriebene Archiv-Distribution lizenziert die Datenbank
> heute unter **CC BY 4.0** — siehe ADR 0005 für die Gegenprüfung an den Quellen.
> Diese Seite bleibt als Entscheidungshistorie stehen.

## Kontext
Lizenz der 3D-Modelle musste verifiziert werden (vorher fälschlich als CC BY 4.0 angegeben).
Modellquelle: BodyParts3D, Database Center for Life Science (DBCLS), Japan.

## Entscheidung
Korrekt ist **CC BY-SA 2.1 Japan**.
- Attribution ist Pflicht (Quelle + Lizenz nennen)
- ShareAlike greift bei veränderten und weitergegebenen Modellen
- Eigener Code (JS/TS/React) bleibt von der Lizenz unberührt

## Konsequenzen
- Attributions-Text in der UI muss korrekte Lizenz nennen: CC BY-SA 2.1 Japan
- Veränderte Modelle, die weitergegeben werden, müssen CC BY-SA bleiben
- Keine fremden Modelle ohne geklärte Lizenz einbauen (steht auch in AGENTS.md)
