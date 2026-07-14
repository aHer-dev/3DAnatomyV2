# ADR 0005: BodyParts3D-Lizenz korrigiert auf CC BY 4.0 (ersetzt ADR 0003)

## Status: akzeptiert · 2026-07-01 · ersetzt [ADR 0003](0003-bodyparts3d-lizenz.md)

## Kontext
ADR 0003 hatte CC BY-SA 2.1 Japan als korrekte Lizenz festgelegt. In der Praxis
standen seither zwei widersprüchliche Stände im Projekt nebeneinander:
- UI (Footer, LicenseModal), `quellen-lizenzen.html`, `public/data/BODYPARTS3D_LICENSE_NOTE.md`
  und 2.232 ältere `meta.json`-Einträge: **CC BY 4.0**
- ADR 0003, `CLAUDE.md`/`AGENTS.md`, `scripts/integrate-new-models.mjs` und 765 neue
  `meta.json`-Einträge: **CC BY-SA 2.1 Japan**

Gegenprüfung an zwei offiziellen DBCLS-Quellen (2026-07-01):
- **Archiv-Lizenzseite** (aktuelle, von DBCLS betriebene Bereitstellung):
  `https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html` → *„The database is
  licensed under Creative Commons Attribution 4.0 International."*
- **Ursprüngliche Credit-Seite** (Stand 2008, historische Erstveröffentlichung):
  `https://lifesciencedb.jp/bp3d/info_en/userGuide/faq/credit.html` → *„クリエイティブ・
  コモンズ　表示-継承2.1　日本"* (CC BY-SA 2.1 Japan)

Beide Seiten gehören zum selben Rechteinhaber (DBCLS / Life Science Database Center).
CC BY-SA 2.1 Japan war die Lizenz der Erstveröffentlichung 2008; die aktuelle,
vom Rechteinhaber selbst betriebene Archiv-Distribution lizenziert die Datenbank
heute unter CC BY 4.0 — das ist die Lizenz, unter der die Daten *aktuell* bezogen
werden. ADR 0003 hatte sich auf die ältere, jurisdiktionsspezifische Angabe gestützt
und war damit die fehlerhafte Korrektur.

## Entscheidung
Korrekt ist **CC BY 4.0** (Creative Commons Attribution 4.0 International).
- Attribution ist weiterhin Pflicht: „BodyParts3D, © DBCLS, licensed under CC BY 4.0"
- **Kein** ShareAlike-Zwang mehr (CC BY 4.0 ist reine Attribution-Lizenz)
- Eigener Code (JS/TS/React) bleibt von der Lizenz unberührt

## Konsequenzen
- `CLAUDE.md`/`AGENTS.md` auf CC BY 4.0 aktualisiert
- Alle `meta.json`-Einträge (inkl. der 765 neuen) auf `license: "CC BY 4.0"` vereinheitlicht
- `scripts/integrate-new-models.mjs`: Template-Lizenztext für künftige Einträge auf CC BY 4.0
- `docs/MODELS.md` dokumentiert CC BY 4.0 mit den beiden oben genannten Quellen
- ADR 0003 bleibt als Historie stehen, ist aber **ersetzt** (Status-Vermerk dort ergänzt)
- Bei künftigem Import einer anderen BodyParts3D-Version: Lizenzlage erneut gegen
  die aktuelle Archiv-Seite prüfen (Quelle kann sich erneut ändern)
