# ADR 0008 — Ladefortschritt als Store-Slice, progress.js als Adapter

Datum: 2026-07-05 · Status: akzeptiert · Kontext: Redesign „Variante B", S9 (§9.11)

## Kontext

Der initiale Ladefortschritt wurde bisher von `js/modelLoader/progress.js` als
imperativ erzeugtes DOM-Overlay gerendert (zentrierter SVG-Kreis, Alt-Branding
Blau→Orange, „Willkommen!"-Einblendung, z-index 4000). Die Lade-Pipeline
(`startApp.js`) meldet Meilensteine über `showLoadingCircle()` /
`updateLoadingCircle(pct)`; nach dem Ausblenden signalisiert das Event
`circleOverlayHidden`, dass der Canvas sichtbar geschaltet und der Render-Loop
gestartet werden darf.

Der Handoff (§9.11) verlangt einen vollflächigen Marken-LoadingScreen (Logo,
Akzent-Ring, Wortmarke, Fortschrittsbalken) — als React-Komponente im Layout-B-
Overlay. Handoff §12 schlägt dafür einen `loading`-Slice im Store vor.

## Entscheidung

1. **Additiver Store-Slice** `loading: { active, progress, label }` mit den
   Actions `showLoading(label?)`, `setLoadingProgress(pct)` (geklemmt 0..100),
   `hideLoading()`. Kein Umbau bestehender Slices.
2. **`progress.js` bleibt die imperative API der Lade-Pipeline**, wird aber zum
   reinen Store-Adapter: `showLoadingCircle`/`updateLoadingCircle`/
   `hideLoadingCircle` schreiben in den Slice statt DOM zu bauen. Der
   **Event-Kontrakt `circleOverlayHidden` gilt unverändert** (wird von
   `hideLoadingCircle` dispatcht; `startApp` wartet weiter darauf). Bei 100 %
   blendet der Screen aus (CSS-Fade) und wird nach ~700 ms versteckt — die
   2,2-s-„Willkommen!"-Verweilzeit des Alt-Overlays entfällt (nicht in §9.11,
   App startet dadurch schneller).
3. **`LoadingScreen.tsx` rendert den Slice** (§9.11-Look, `prefers-reduced-motion`
   → Ring statisch). Damit auch der **Muskelfinder-Preview-Modus** einen
   Ladeindikator behält, mountet `app.js` die React-UI jetzt immer; `App.tsx`
   rendert im Preview-Modus **nur** den LoadingScreen (kein Shell-Overlay).

## Konsequenzen

- Lade-Pipeline und Meilenstein-Werte bleiben unangetastet (Nicht-Ziel S9);
  nur die Darstellung wandert in die React-Schicht.
- Preset-/Gruppen-Nachladen nutzt weiterhin eigene UI (Settings-Overlay bzw.
  Rail-Spinner) — der Slice ist für den vollflächigen Screen reserviert.
- Die Legacy-Balken-Funktionen (`showLoadingBar` …) in `progress.js` sind über
  `__DISABLE_PROGRESS_OVERLAY` stillgelegt; Rückbau ist ein eigener Task.
