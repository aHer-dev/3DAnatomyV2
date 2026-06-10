# BlueBody 3D — Agenten-Regeln

3D-Anatomie-Webapp für Studierende (Physio/Ergo/Logopädie). Statische Seite.
Solo-Projekt, KI-gestützt. Strategie: ROADMAP.md · Architektur: docs/architecture.md

## Befehle
- Dev:   npm run dev
- Test:  npm run test      (muss grün sein vor "fertig")
- Lint:  npm run lint
- Build: npm run build

## Architektur-Grenzen (hart)
- Three.js-Code bleibt imperativ. NICHT auf React Three Fiber umstellen.
- 3D-Layer und React-UI reden NUR über den Zustand-Store. Kein direkter Zugriff.
- Bestehende 3D-Logik wird portiert, nicht neu erfunden.

## Konventionen
- TypeScript strict. Kein `any` in Kernpfaden.
- State ausschließlich über den Store. Keine `window.*`-Globals.
- Conventional Commits. Branch pro Task, nie auf main committen.

## Pflichten pro Task
- Tests für neue Logik mitschreiben (Vitest). Three/UI-Pixel nicht unit-testen.
- CHANGELOG.md-Eintrag.
- Bei Architektur-Entscheidung: ADR in docs/decisions/.
- Briefing in docs/tasks/ befolgen; Nicht-Ziele respektieren.

## Verbote
- Keine browser storage APIs (localStorage o. Ä.) in Artifacts/Komponenten.
- Keine fremden 3D-Modelle ohne geklärte Lizenz einbauen.
  Bestehende Modelle: BodyParts3D, CC BY-SA 2.1 JP — Attribution Pflicht.
- Keinen toten/auskommentierten Code hinterlassen.
