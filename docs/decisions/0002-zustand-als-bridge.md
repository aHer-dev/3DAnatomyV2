# ADR 0002: Zustand als State-Bridge zwischen 3D-Layer und UI

## Status: akzeptiert · 2026-06-10

## Kontext
Bestehendes `state.js` + `dispatch()` System neben direktem `state.xxx`-Zugriff
und `window.*`-Globals. Schwer nachvollziehbare Bugs, Refactoring riskant.
Neues System muss in Three.js-Code (imperativ) UND React (Hooks) funktionieren.

## Entscheidung
**Zustand** (npm: `zustand`) als einzige State-Lösung:
- Slices: `models`, `selection`, `visibility`, `appearance`
- Three.js-Code nutzt `store.subscribe()` und `store.getState()`
- React-UI nutzt `useStore()` Hook
- Keine `window.*`-Globals mehr

## Warum Zustand
- Funktioniert in React *und* im imperativem Three-Code ohne Wrapper
- Minimales API, kein Boilerplate
- KI-Modelle kennen Zustand sehr gut → weniger Halluzinationen

## Konsequenzen
- `state.js` und `dispatch()` werden in Phase 2 vollständig ersetzt
- `window.*`-Globals werden eliminiert (erst in Phase 2 möglich, da Store überall importierbar)
- Alle State-Änderungen gehen durch den Store — kein direkter Zugriff mehr
