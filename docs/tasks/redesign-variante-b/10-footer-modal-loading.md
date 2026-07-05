# S9 — Footer + LicenseModal + LoadingScreen + Branding/Favicon

> Handoff-Ref: §9.9 (Footer), §9.10 (LicenseModal), §9.11 (LoadingScreen), §15 (Assets/Favicon).
> Bündelt die „Rahmen"-Elemente in einer Session, weil sie klein und verwandt sind.

## Kontext
Footer-Links wandern in den Sidebar-Fuß (Verankerung aus S1, hier Styling). LicenseModal ist
zentriert und layout-unabhängig. LoadingScreen bekommt das Marken-Branding. Logo-Assets liegen
in `docs/design_handoff_anatomie_3d/assets/` und müssen nach `assets/`/`public/` eingebunden werden.

## Ist-Zustand
- `Footer.tsx` (+ CSS), `LicenseModal.tsx` (Existenz prüfen), Loading heute via
  `css/components/loading.css`/Legacy — **LoadingScreen.tsx** ggf. neu.
- Logo-PNGs im Handoff (`af-logo*.png`) — noch nicht als App-Assets/Favicon eingebunden.

## Ziel-Zustand
- **Footer (§9.9):** `Lernen · Lizenz · Quellen · Datenschutz` im **Sidebar-Fuß**,
  Manrope 500 12px `--text-faint`, Trenner `·` `opacity:.4`.
- **LicenseModal (§9.10):** zentriert, `--z-modal`, `role="dialog" aria-modal="true"`,
  Backdrop `rgba(6,6,7,.66)` + Blur, Card `width:600px; radius:20px`. Header „Lizenzen &
  Attribution" (Sora 600 18px). **Fokus-Trap + ESC schließt.** Attribution BodyParts3D
  (CC BY 4.0, ADR 0005) muss enthalten sein.
- **LoadingScreen (§9.11):** Marken-Schwarz + `--stage-gradient`, Logo 132px (`af-logo.png`)
  mit rotierendem Akzent-Ring (SVG r98, `--accent`), Wortmarke „Anatomie **Fokus**" (Sora 600
  46px), Fortschritt `320×4` `--accent-gradient` + „NN %". `prefers-reduced-motion` → Ring statisch.
  Fortschritt folgt echtem Ladefortschritt (Store `loading`-Slice, falls nötig additiv).
- **Assets/Favicon (§15):** `af-logo.png` (Loading/Rail), `af-logo-white.png` → favicon
  16/32/64, `apple-touch-icon` (Squircle), Maskable (`af-logo-black.png` auf `--accent`).
  `af-logo-green.png` **nicht** verwenden.

## Schritte
1. Logo-Assets aus dem Handoff nach `assets/` (bzw. `public/`) kopieren; Favicon-Links in
   `index.html` setzen (CSP: alles lokal, keine Änderung nötig).
2. Footer-Links im Sidebar-Fuß stylen (§9.9).
3. LicenseModal umsetzen/finalisieren inkl. Fokus-Trap + ESC (A11y-Grundlage; Feinschliff S11).
4. LoadingScreen (§9.11) umsetzen; an echten Fortschritt binden (ggf. `loading`-Slice + ADR).

## Nicht-Ziele
- Keine Lade-Pipeline/Modell-Logik ändern. Kein Mobile-Layout (S10).

## Done-Kriterien
- [x] `npm run test` grün · `npm run build` sauber (38 Tests, +4 für `loading`-Slice)
- [x] Footer im Sidebar-Fuß; LicenseModal zentriert mit Fokus-Trap + ESC + BP3D-Attribution
- [x] LoadingScreen im Marken-Look, Fortschritt läuft (echte Pipeline-Meilensteine),
      reduced-motion respektiert
- [x] Favicon/Apple-Touch/Maskable gesetzt (+ `site.webmanifest`) · CHANGELOG · ADR 0008

## Umsetzungs-Notizen (2026-07-05)
- `loading`-Store-Slice + `progress.js` als Adapter (ADR 0008); `circleOverlayHidden`-
  Kontrakt unverändert; „Willkommen!"-Verweilzeit (2,2 s) entfällt.
- React mountet jetzt auch im Muskelfinder-Preview-Modus (nur LoadingScreen) —
  sonst hätte der Preview keinen Ladeindikator mehr.
- LicenseModal als Portal an `document.body`: `backdrop-filter`-Panels bilden einen
  Containing Block für `position:fixed` (Modal war sonst in der Sidebar gefangen).
- Footer behält die BodyParts3D-Attributionszeile zusätzlich zu den §9.9-Links
  (CC-BY-Pflicht, ADR 0005). „Quellen & Lizenzen"-Link heißt jetzt „Quellen" (§9.9).
- Icons per Headless-Chromium aus den Handoff-PNGs gerendert (kein ImageMagick da);
  Rezept: Scratchpad `gen-icons.mjs`.

## Relevante Dateien
`js/ui/react/components/Footer.tsx` · `LicenseModal.tsx` · `LoadingScreen.tsx` (ggf. neu) ·
`css/components/*` (footer/license/loading) · `index.html` (Favicon) · `assets/` · `AppShell.tsx`
</content>
