# ADR 0001: Stack-Wahl — Vite + TypeScript + React

## Status: akzeptiert · 2026-06-10

## Kontext
Bestehendes Vanilla-JS-Projekt ohne Build-Tool (Importmap + Three.js via CDN).
Tech Debt: kein Tree-Shaking, kein HMR, kein TypeScript, Versions-Drift bei Addons.

## Entscheidung
- **Vite** als Build-Tool (Vanilla → Vite, dann schrittweise TS/React)
- **TypeScript** mit `allowJs: true` für schrittweise Migration
- **React** als UI-Overlay (nur über dem Canvas, nicht für Three.js-Logic)
- **Three.js via npm** statt CDN — eine Version, Addons aus `three/addons`

## Alternativen erwogen
- Minimal-Pfad (Vite + TS, UI bleibt Vanilla): valide, aber jede UI-Arbeit
  bleibt zäh und fehleranfällig. Für KI-gestützte Entwicklung klarer Nachteil.
- React Three Fiber: abgelehnt — die bestehende Three.js-Logik funktioniert,
  Migration wäre reines Risiko ohne Mehrwert.

## Konsequenzen
- Three.js-Code bleibt imperativ und wird nicht umgeschrieben
- React nur als Overlay-Layer, Verbindung ausschließlich über den Zustand-Store
- KI-Modelle generieren React am zuverlässigsten → schnellere UI-Arbeit
