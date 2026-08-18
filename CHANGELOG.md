# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format: [Keep a Changelog](https://keepachangelog.com/de/1.0.0/)

---

## [Unreleased]

### Changed (Info-Panel — Ursprung und Ansatz stehen sofort da)
- **Der Details-Aufklapper startet offen.** Muskeln sind der Hauptgrund, warum jemand eine
  Struktur anfasst; Ursprung, Ansatz, Innervation und klinischer Bezug hinter einem zweiten Klick
  zu parken, kostete bei **jedem einzelnen** Muskel eine Handbewegung. Ein Klick ins Modell
  reicht jetzt: Leiste fährt auf, Reiter steht auf „Info", Name und Fachfelder sind da.
- **Zuklappen bleibt möglich und wird respektiert.** Wer den Block schließt, findet ihn auch bei
  der nächsten Auswahl geschlossen vor — React setzt `open` bei gleichbleibendem Prop nicht
  erneut. Am laufenden Build nachgemessen, nicht aus der Doku geschlossen: erste Auswahl offen,
  nach Zuklappen zu, nächster Muskel weiterhin zu.
- Der Wechsel auf den Info-Reiter existierte bereits (ADR 0006) und ist unverändert. Neu ist
  allein, dass der Aufklapper nicht mehr zugeklappt startet.
- Die Aktionsknöpfe (Ausblenden/Isolieren/Kontext) rutschen bei langem Klinik-Text tiefer,
  bleiben aber im Sichtfeld; `shell-sidebar__body` scrollt wie vorgesehen. Nachgemessen am
  M. rectus femoris, dem Eintrag mit dem längsten Text.

### Fixed (Anatomie — der M. flexor pollicis longus entsprang am falschen Knochen)
- **Der Ursprung nannte den `Epicondylus medialis humeri` an erster Stelle.** Der FPL entspringt
  an der `Facies anterior` des Radius und an der `Membrana interossea` — der Humerus ist keine
  Ursprungsfläche dieses Muskels. Nachgeschlagen bei DocCheck Flexikon und Kenhub, beide
  deutschsprachig und übereinstimmend.
- **Die Daten widersprachen sich selbst.** Jeder andere Muskel des Datensatzes mit Ursprung am
  Epicondylus medialis führt `Art. cubiti` in den Gelenken — Pronator teres, Flexor carpi
  radialis und ulnaris, Palmaris longus, Flexor digitorum superficialis. Nur der FPL nicht, weil
  er den Ellenbogen tatsächlich nicht überquert. Die Gelenkliste war richtig, der Ursprung falsch.
- **Der akzessorische Kopf bleibt bewusst draußen.** Es gibt ihn (Gantzer-Muskel, vom Processus
  coronoideus oder Epicondylus medialis, in Studien bis zu zwei Dritteln der Präparate) — aber
  als Variante. Sie an erster Stelle als *den* Ursprung zu führen, dreht Regel und Ausnahme um.
- Korrigiert in der Quelle (`Muskelfinder/data/obere-extremitaet.json`, Feld `Origin` und
  `easy.Origin`), nicht im generierten Ergebnis: eine Korrektur hier allein hielte bis zum
  nächsten Generatorlauf.

### Fixed (Der Kartengenerator war seit der Vite-Umstellung nicht lauffähig)
- **`npm run build:muskelfinder-map` brach sofort ab.** Drei Brüche übereinander: das Skript ist
  CommonJS (`require`), das Projekt trägt längst `"type": "module"`; es las aus `data/`, während
  die Daten unter `public/data/` liegen; und es suchte die Quelle in `../Muskelfinder`, die seit
  der Umstrukturierung eine Ebene höher liegt. Alle drei behoben, das Skript ist jetzt ESM.
- **Dadurch lagen die Daten seit April 2026 brach.** Der erste erfolgreiche Lauf holt acht
  Muskeln nach, die die Quelle inzwischen kennt und die Karte nie erhielt: Corrugator supercilii,
  Latissimus dorsi, Nasalis, Procerus, Pterygoideus medialis, Rectus abdominis, Temporalis,
  Transversus abdominis — 16 Modell-IDs, links und rechts vollständig gepaart. Alle gegen
  `meta.json` gegengeprüft. Nichts ist weggefallen, keine bestehende Zuordnung hat sich
  verschoben. Automatische Abdeckung 86,7 %.

### Added (Marke — Wortmarke als Kopf der Sidebar, Zeichen aus der Rail entfernt)
- **Die Leiste beginnt jetzt mit der Marke:** Zeichen, darunter „Anatomie Fokus" (Sora 700) und
  „3D ANATOMIE" gesperrt im Akzent-Orange — dieselbe Lockup-Form wie im Muskelfinder, wo an
  derselben Stelle „MUSKELFINDER" steht. Der Produktname nimmt den orangen Bogen im Zeichen auf,
  statt mit der ersten Zeile um Aufmerksamkeit zu streiten.
- **Das Zeichen ist dafür aus der Icon-Rail verschwunden.** Genau einmal pro Bildschirm:
  dasselbe Logo zweimal ist kein Branding, sondern ein Versehen. Der Muskelfinder hat beim
  Einführen seiner Wortmarke genau dieselbe Entscheidung getroffen und begründet
  (`BrandMark.tsx`). Die Rail gewinnt dadurch 40 px für Werkzeuge.
- **Der Keil wird nicht mehr gestaucht.** Die Datei ist 985 × 892, also nicht quadratisch; die
  Rail zwang sie in 36 × 36 und drückte den Keil um rund 10 % zusammen. Jetzt stehen die echten
  Maße im Markup — der Browser reserviert den richtigen Kasten, kein Layout-Sprung — und das CSS
  setzt nur die Höhe, die Breite rechnet der Browser.
- Kein Link: anders als im Muskelfinder gibt es hier keine Startseite, zu der die Marke führen
  könnte. Ein Logo, das nur so aussieht, als wäre es anklickbar, ist eine Enttäuschung.

### Changed (Bühne, Ansichts-Cluster, Logo — Nacharbeiten zum Light-Modus)
- **Bühnenfarbe folgt dem Theme.** Im Light-Modus steht sie auf `#25211e` (rgb 37,33,30) — ein
  warmes Dunkelbraun, das den Papierton der hellen Oberfläche aufnimmt, ohne dem Modell Kontrast
  zu nehmen. Im Dark-Modus bleibt es bei `#0d0d0d`. Die Bühne bleibt damit in beiden Themes
  dunkel, wechselt aber den Ton statt hart schwarz zu bleiben.
  **Eine selbst gewählte Raumfarbe hat Vorrang:** sobald jemand im Einstellungs-Panel eine Farbe
  anfasst, hört der Theme-Wechsel auf, sie zu überschreiben — sonst würde ein Klick auf
  Sonne/Mond die eigene Einstellung stillschweigend wegwerfen. „Zurücksetzen" gibt die Hoheit
  ans Theme zurück. `#524a42` steht zusätzlich als Swatch „Taupe" zur Wahl.
- **Der Ansichts-Cluster steht wieder mittig.** Er hing auf `left: 41%` — ein Rest aus der Zeit
  der immer offenen Sidebar, als er zwischen Rail und Leiste zentriert sitzen sollte. Seit die
  Leiste eingeklappt startet und jederzeit auf- und zufährt, hat diese Fläche keine feste Breite
  mehr, der Cluster wanderte je nach Zustand woanders hin. Dazu wich er bei offenem
  Settings-Flyout zusätzlich nach rechts aus. Beides ist raus: **ein Bedienelement, das seine
  Position ändert, ist schwerer zu treffen als eines, das leicht überlappt.** `left: 50%`, fest.
  Der `flyoutOpen`-Prop von `ViewCluster` entfällt ersatzlos.
- **Das Logo war im Light-Modus unsichtbar.** `af-logo.png` ist die **weiße** Markenvariante —
  auf dem nun hellen Glas der Rail und auf dem hellen Ladebildschirm verschwand sie. Es gibt
  jetzt zwei Dateien und die Wahl fällt pro Theme, genau wie im Muskelfinder (`BrandMark.tsx`):
  `af-logo.png` auf Dunkel, das neue `af-logo-dark.png` auf Hell. Betrifft Icon-Rail und
  Ladebildschirm.

### Added (Design — Light-Modus als Standard, Dark bleibt umschaltbar)
- **Die App hatte nur Dunkel.** Das Schwesterprojekt Muskelfinder-V2 führt dieselbe Marke
  („Anatomie Fokus", Variante A) längst in zwei Themes mit **Light als Standard** — und dessen
  Dark-Werte sind exakt die dieser App. Die Palette ist von dort übernommen statt neu erfunden:
  `src/styles/theme.css` → `css/theme/variables.css`. Gleiche Token-Namen für alles Neue,
  gleiches Orange `#ff6a00`.
- **`variables.css` ist jetzt dreigeteilt:** theme-agnostisch (Akzent, Typo, Spacing, Radien,
  Motion, z-Ebenen, Gruppenfarben), dann `:root, [data-theme="light"]` und `[data-theme="dark"]`.
  Das Theme hängt als `[data-theme]` an `<html>`, gesteuert aus dem Store.
- **Die 3D-Bühne bleibt in beiden Themes dunkel.** Der Three.js-Canvas holt seine Farbe weiter
  aus `roomSettings.js` und ist über die Einstellungen frei wählbar. Knochen und Muskeln lesen
  sich auf dunklem Grund klarer — derselbe Grund, aus dem der Muskelfinder sein Bildfenster
  (`--media-well`) auch im Light-Modus dunkel lässt. Was direkt auf der Bühne liegt, ist in
  `variables.css` als **bühnenfest** markiert und wechselt nicht mit: Struktur-Beschriftungen
  und der Fotomodus.
- **Orange als Schrift brauchte eigene Töne.** `#ff6a00` auf hellem Grund sind **2,87:1**, WCAG
  1.4.3 verlangt 4,5:1. Neu daher `--accent-on-surface` (#bd4800) und `--accent-on-tint`
  (#b34400) für Text und Icons, `--accent-hi-on-surface` (#8f3600) für Hover — im Dark-Modus
  sind alle drei schlicht `#ff6a00` bzw. `#ff9d3d`. **Wer Orange als Schrift setzt, nimmt die
  `-on-`-Variante, nicht `--accent`.** 22 Stellen umgestellt.
- **Rund 20 weiße Alpha-Schleier steckten hart in den Komponenten** — Slider-Schienen, Knöpfe,
  Schalter, Tastenkappen. Auf hellem Glas ist Weiß-auf-Weiß unsichtbar. Sie sind jetzt Tokens:
  `--track-bg`, `--knob-bg`, `--control-off-bg`, `--control-off-hover`, `--field-bg`. Der
  Slider-Knopf ist im Light-Modus **dunkel**, nicht weiß: er läuft über die orange Füllung UND
  über die helle Schiene, ein weißer Knopf verschwände auf der Schiene.
- **Zwei Fehler, die erst im Hellen sichtbar wurden:** die Struktur-Beschriftungen auf der Bühne
  standen auf `--text-primary` (dunkler Text auf dunklem Chip) und das Busy-Overlay der
  Einstellungen auf `rgba(0,0,0,0.7)` mit hellem Text. Beide auf passende Tokens gesetzt.
- **Sonne/Mond-Schalter** in der Icon-Rail über dem Zahnrad. **Bewusst nicht persistiert:**
  browser storage ist projektweit untersagt (CLAUDE.md) — das Schwesterprojekt legt die Wahl
  in `localStorage` ab, hier gilt sie für die Sitzung. Vier neue Store-Tests (64 gesamt).

### Fixed (Strukturen — Entladen wirkte nicht, das Auge tat gar nichts)
- **Entladene Gruppen blieben im Bild stehen.** Der Renderer arbeitet on demand
  (`startApp.js`): er zeichnet nur nach einem `requestRender()`. `loadGroupByName` fordert
  intern an — deshalb erschienen Gruppen beim Laden. `unloadGroupSilent` forderte **nicht** an,
  also flogen die Modelle aus der Szene, während der Bildschirm das letzte Bild weiter zeigte.
  Der Rail-Knopf links war davon verschont, weil `AppShell` sein `requestRender()` von Hand
  nachschob. Die Anforderung sitzt jetzt in `unloadGroupSilent` selbst und gilt damit für
  jeden Aufrufer.
- **Das Auge in der Gruppen-Zeile schaltete nichts.** Es rief `getStore().setGroupVisible(…)`
  — die **Store-Aktion**, die nur einen Boolean umlegt. Die Funktion, die tatsächlich die
  Szene anfasst, heißt `setGroupVisibility` und liegt in `features/visibility.js`, wo sie
  zusätzlich als `setGroupVisible` exportiert wird: die Namensgleichheit war die Falle. Eine
  Subscription, die Store-Zustand auf die Szene überträgt, gibt es nirgends — der Klick
  verpuffte vollständig.
- **Der Batch-Pfad in `unloadGroupSilent` vergaß `unloadGroup`** und ließ die Modell-Liste im
  Store stehen. Derzeit folgenlos, weil `performance.batchedGroups` auf `false` steht, aber
  eine Falle für Phase 2 von ADR 0007. Mitgeflickt.

### Changed (Strukturen — ein Schalter pro Gruppe statt zweier Knöpfe)
- **Jede Zeile hatte zwei Bedienelemente, deren Unterschied niemand ansah:** ein Auge für die
  Sichtbarkeit und ein `+`/`✕` fürs Laden. Zwei Wege, dieselbe Gruppe „auszumachen" — und der
  eine davon kaputt. Beide sind jetzt **ein Schalter**: an heißt geladen und sichtbar, aus
  heißt unsichtbar.
- **Ausgeschaltete Gruppen bleiben im Speicher.** Wieder-Einschalten ist damit sofort da; bei
  den Muskeln (465 Dateien, 16 MB) wäre Nachladen sonst jedes Mal eine spürbare Pause. Der
  Preis ist dauerhaft belegter Arbeitsspeicher.
- **Muskeln stehen jetzt oben** (`sortPanelGroups`, bewusst abweichend von der kanonischen
  `GROUP_ORDER`): sie sind die einzige Gruppe, die beim Start aus ist, und damit die einzige
  Zeile, die man überhaupt anfassen muss. Darunter Knochen, Knorpel, Bänder, Zähne.
- **Das Startbild ist das Skelett:** Knochen, Knorpel und Zähne an, **Muskeln und Bänder aus**.
  Beide werden erst auf Wunsch geladen und stehen deshalb oben in der Liste — die Reihenfolge
  ist `Muskeln · Bänder · Knochen · Knorpel · Zähne`, oben also die Zeilen, die man überhaupt
  anfassen muss.
- **Die Icon-Rail koppelt Bänder nicht mehr an den Muskel-Schalter.** Bänder haben im Tab einen
  eigenen Schalter, und zwei Bedienelemente, die dieselbe Gruppe verschieden weit mitnehmen,
  sind genau die Verwirrung, die dieser Tab gerade losgeworden ist. Rail-Knopf und
  Muskel-Schalter meinen jetzt dasselbe. Nach dem Laden setzt die Rail außerdem die
  Sichtbarkeit ausdrücklich, sonst stünde der Schalter auf aus, während das Modell längst in
  der Szene liegt.
- Optisch: Karte je Gruppe statt gedrängter Zeile, 36×20-Pille als Schalter, Gruppenfarbe als
  Kante der aktiven Karte, und die Röntgen-Transparenz rückt in eine eigene Zeile darunter —
  sichtbar nur, wenn die Gruppe an ist. Fünf neue Tests für `sortPanelGroups` (60 gesamt).

### Changed (Info-Panel — der Details-Aufklapper trägt jetzt das Marken-Orange)
- **Der Balken, hinter dem Ursprung und Ansatz stecken, sah nicht klickbar aus.** Grauer
  Versalien-Text (`--text-secondary`) auf 3 % Weiß, mit einer `--hairline-soft`-Kante: das
  liest sich wie eine Abschnittsüberschrift, nicht wie ein Schalter. Dahinter liegen aber
  **sechs Abschnitte für 150 Muskeln** — Ursprung, Ansatz, Bewegung, Funktion, Innervation,
  Klinischer Bezug (`public/data/muskelfinder-details.json`). Genau der Inhalt, wegen dem
  Studierende die Seite öffnen, verbarg sich hinter dem unauffälligsten Element des Panels.
- **Jetzt auf den Akzent-Tokens:** `--accent` (#ff6a00) als Schriftfarbe, `--accent-tint` als
  Fläche, `--accent-border` als Kante, dazu 700 statt 600 Schriftschnitt und etwas mehr
  Polsterung. Keine neue Farbe — das Marken-Orange steckte längst in `variables.css`, der
  Aufklapper war schlicht der eine Ort, der es nicht benutzt hat.
- **Aufgeklappt tritt der Kopf zurück** (`--accent-dim`): die Abschnittstitel darunter tragen
  bereits `--accent`, zwei volle Orangeflächen übereinander hätten miteinander konkurriert
  statt zu führen.
- Reine Stiländerung an `.ip-details__summary`, kein Markup und keine Logik angefasst —
  entsprechend ohne Unit-Test (Handoff: UI-Pixel werden nicht unit-getestet).

### Added (Sidebar — rechte Leiste auf dem Desktop einklappbar)
- **Die rechte Leiste war auf dem Desktop nicht abzuschalten.** Sie steht `position: fixed` mit
  `min(320px, …)` Breite und war der einzige Teil von Layout B ohne Aus — mobil gibt es die
  Sheet-Mechanik (`--open`) längst, auf breiten Schirmen nahm sie dem Modell dauerhaft rund
  320 px. Wer eine Struktur von allen Seiten betrachten wollte, hatte keine Möglichkeit,
  die Bühne freizuräumen.
- **Neu: ein Chevron im Sidebar-Kopf klappt sie ganz nach rechts aus dem Bild.** Übrig bleibt
  ein 26 px schmaler Griff am rechten Rand, der sie zurückholt. Nicht auf einen Icon-Streifen
  geschrumpft, sondern vollständig weg — das ist der ganze Punkt der Übung.
- **Zustand liegt im Store** (`sidebarCollapsed` + `setSidebarCollapsed`/`toggleSidebarCollapsed`),
  additiv neben `sidebarTab`, `openFlyout` und `mobileSheet`. **Bewusst nicht persistiert:**
  browser storage ist projektweit untersagt, der Zustand gilt für die Sitzung.
- **Bei Auswahl klappt die Leiste von selbst wieder auf.** Der bestehende Auto-Wechsel auf den
  Info-Tab (ADR 0006) lief sonst ins Leere: Tab richtig gesetzt, Panel unsichtbar, Details erst
  nach einem zweiten Klick. Auf Schmal-Screens bleibt es beim Sheet-Verhalten, unverändert.
- **Mobil bewusst neutralisiert.** `responsive.css` setzt `--collapsed` unter 768 px auf die
  Sheet-Regel zurück und blendet Griff wie Chevron aus. Ohne diesen Rückbau bliebe das
  Bottom-Sheet unsichtbar, sobald jemand am Desktop einklappt und dann das Fenster verschmälert.
- **A11y:** Chevron und Griff tragen `aria-expanded`/`aria-controls` auf dieselbe Region; die
  eingeklappte Leiste ist `inert`, fängt also keinen Tab-Fokus und wird nicht vorgelesen. Das
  offene Mobile-Sheet hat dabei Vorrang. Unter `prefers-reduced-motion` springt sie, statt zu
  fahren — die Transition steht ausgeschrieben und greift die Token-Abschaltung nicht.
- **Die App startet eingeklappt.** Beim Öffnen steht das Modell auf der vollen Bühne, die
  Leiste kommt auf Wunsch — oder von selbst, sobald eine Struktur ausgewählt wird.
- **Der Griff trägt das Marken-Orange und ist gefüllt statt gläsern** (30×96 px, auf 36 px
  verbreitert beim Überfahren). Damit ist er der einzige Weg zur Leiste, und ein dezenter
  Glasstreifen am Bildrand wäre auf der dunklen Bühne schlicht nicht gefunden worden.
- Vier Store-Tests decken Toggle, Idempotenz und die Unabhängigkeit von Tab/Flyout/Sheet ab
  (60 Tests gesamt, grün). Die Sichtprüfung am laufenden Dev-Server steht noch aus.

### Changed (Abhängigkeiten — Patch- und Minor-Updates innerhalb der Ranges)
- **Zwölf Pakete lagen hinter ihrem `Wanted`-Stand zurück, ohne dass eine Range angefasst werden
  musste.** `npm update` holt sie nach: react/react-dom 19.2.7 → **19.2.8**, vitest/@vitest/ui
  4.1.8 → **4.1.10**, prettier 3.8.4 → **3.9.6**, fuse.js 7.4.2 → **7.5.0**, eslint/@eslint/js
  9.39.4 → **9.39.5**, die vier `@gltf-transform/*`-Pakete 4.4.0 → **4.4.2**, dazu die
  `@types/*`-Pakete. Nur `package-lock.json` ändert sich; `package.json` bleibt unberührt.
- **Nachgemessen statt angenommen:** nach dem Rebase auf den aktuellen Stand erneut geprüft —
  Tests **64/64 grün**, Lint ohne Befund, Build durch (112 Module, 6,1 s). `vendor` steht bei
  27,24 kB (+0,23 kB durch fuse.js), `three` 631,68 kB, `react` 194,03 kB, `main` 151,61 kB.
- **Bewusst nicht mitgenommen:** die zehn Major-Sprünge — vite 6 → 8, eslint 9 → 10, three
  0.179 → 0.185, @vitejs/plugin-react 4 → 6, dependency-cruiser 16 → 17, globals 15 → 17,
  p-limit 6 → 7, @types/node 25 → 26. Besonders three.js fasst genau die Ebene an, auf der die
  imperative 3D-Logik und der BatchedMesh-Pfad (ADR 0007) sitzen; das gehört auf einen eigenen
  Branch mit eigenem Durchlauf, nicht in ein Wartungs-Update.
- **Offen, ohne Auswirkung im Moment:** `npm` warnt, dass die transitive Abhängigkeit
  `language-tags@2.1.0` Node ≥ 22 verlangt — installiert ist Node v20.20.2. Reine
  Installationswarnung, Tests und Build laufen unbeeindruckt durch.

### Fixed (Der Muskelfinder-Link führte in eine tote App)
- **Wer im Muskelfinder auf „In 3D ansehen" tippte, landete auf einer Seite ohne Bedienung.**
  Live nachgemessen: **0 Knöpfe, 0 Links, `#ui-root` leer.** Kein Rückweg, keine Werkzeuge — man
  konnte das Modell nicht einmal drehen. Und **keine sichtbare CC-BY-Attribution**, die ADR 0005
  zur Pflicht macht. Übrig blieb ein Standbild: ein Skelett mit einem roten Muskel.
- **Ursache: Der Vorschau-Modus sprang bei einer normalen Navigation an.**
  `isMuskelfinderPreviewMode()` prüfte `source === 'muskelfinder' && (muscleKey || muscle)` — und
  genau diese Kombination schickt der Muskelfinder bei **jedem** Klick, per `<a target="_blank">`,
  also als Navigation in einen neuen Tab. Die Herkunft sagt aber nichts darüber, ob die App
  **eingebettet** ist; der Muskelfinder enthält kein einziges `<iframe>`.
  Der Modus schaltet drei Dinge ab — die gesamte React-UI (`App.tsx` rendert nur den
  `LoadingScreen`), `setupInteractions()` und `initRoomSettings()`. Er ist ein **Standbild** und als
  solches für eine Einbettung gedacht, nicht für eine Seite, auf die man Nutzer schickt.
- **Die Vorschau braucht jetzt einen Auslöser, der „eingebettet" auch bedeutet:** ein fremder
  Rahmen (`window.self !== window.top`) oder ein ausdrückliches `?preview=1`. Die
  Muskelfinder-Herkunft allein genügt nicht mehr.
  Im Browser gegen den echten Link verifiziert: **24 Knöpfe, „← Zurück zum Muskelfinder", „Lizenz"
  und die Attribution „BodyParts3D, © DBCLS, CC BY 4.0" sind wieder da** — der Muskel bleibt
  hervorgehoben. Eingebettet und mit `preview=1` bleibt die Vorschau stumm wie bisher.
  Sechs Tests wachen darüber (`js/integration/muskelfinderPreview.test.ts`); einer davon ist genau
  der Regressionsfall.

### Fixed (Assets — Logo und PWA-Icons luden auf GitHub Pages nicht)
- **Das Logo (Rail + Ladebildschirm) war auf der veröffentlichten Seite tot.** Beide `<img>` zeigten
  auf den absoluten Pfad `/assets/af-logo.png`. Die Seite liegt auf Pages aber unter
  `/3DAnatomyV2/`, also fragte der Browser `aher-dev.github.io/assets/…` an → 404. Lokal fiel das
  nie auf, weil der Dev-Server auf `/` läuft. Vite schreibt Pfade in HTML und CSS-`url()` beim Build
  auf `base` um (Schriften waren deshalb nie betroffen) — **Laufzeit-Strings in JS/TSX aber nicht**.
  Beide nutzen jetzt `import.meta.env.BASE_URL`, sind damit unabhängig vom Deploy-Pfad.
- **`site.webmanifest`**: dieselbe Ursache (JSON in `public/` wird nicht verarbeitet), die drei
  Icon-Pfade sind jetzt relativ zur Manifest-URL.
- **Favicon war in hellen Tableisten unsichtbar.** Es war ein fast weißes „A" auf transparentem
  Grund — die Datei lud, man sah nur nichts. `favicon.ico` war zudem gar kein ICO, sondern ein PNG
  mit `.ico`-Endung (416×512).
- **Alle App-Icons kommen jetzt aus `scripts/generate-icons.py`** — dieselbe Rezeptur wie im
  Schwesterprojekt Muskelfinder-V2, das dasselbe Problem bereits gelöst hatte: dieselbe Logo-Quelle
  (`af-logo.png`, byteidentisch in beiden Repos), dieselbe Kachel `#1c1b18`, dieselben Radien.
  Beide Apps sehen in der Tableiste damit identisch aus. Erzeugt werden Favicon 512/64/32/16, eine
  echte ICO (16/32/48), Apple-Touch (ohne Alpha) und die maskable-Icons.
  **Hinweis:** die maskable-Icons waren vorher schwarzes A auf Orange und sind damit auf die
  Anthrazit-Kachel gewechselt.
- **Logo-Pfade nutzen den vorhandenen `assetPath()`-Helfer** aus `js/core/path.js` statt
  `import.meta.env.BASE_URL` direkt — dafür ist der Helfer da, der Rest des Codes tut es genauso.

### Changed (Bühne — neutraler Standard-Hintergrund)
- **Standard-Hintergrund der Szene ist jetzt `#0d0d0d` (rgb 13,13,13)** statt des Navy-Rests
  `#07062b`. Der sichtbare Hintergrund entsteht aus Raumfarbe × Umgebungslicht; der
  Multiplikator stand auf `0.4` und hätte `#0d0d0d` auf rgb(5,5,5) abgedunkelt. Er startet
  daher neutral bei `1.0` — die gewählte Raumfarbe erscheint jetzt unverfälscht, der Regler
  dunkelt von dort ab. Der „Schwarz"-Swatch und `ui.theme.background` liegen auf demselben
  Wert, damit der Startzustand im Panel als aktiv markiert ist.

### Fixed (Datenschutz — veraltete jsDelivr-Aussage)
- **Datenschutzerklärung und Lizenz-Dialog behaupteten einen Datenabfluss, den es nicht gibt.**
  Beide sagten, die App lade „derzeit Teile ihrer 3D-Bibliothek über jsDelivr". Das galt für die
  alte, nicht gebündelte Version (Import-Map → `cdn.jsdelivr.net`). Seit der Vite-Migration ist
  three.js eine npm-Abhängigkeit und wird lokal ins Bundle gebaut; die CSP (`default-src 'self'`)
  verbietet externe Abrufe ohnehin technisch. Eine Datenschutzerklärung, die eine Übermittlung an
  einen Dritten deklariert, die gar nicht stattfindet, ist sachlich falsch — jetzt korrigiert:
  „Inhalte von fremden Servern werden nicht geladen", inkl. Hinweis auf die CSP. Der jsDelivr-Link
  in der Empfänger-Liste ist entfernt.
  Verifiziert am echten Build: null externe Hosts, keine CSP-Verstöße.

### Added (Perf — BatchedMesh-Rendering pro Gruppe, ADR 0007 Phase 1)
- **`js/core/groupBatch.js`**: `GroupBatch` kapselt ein `THREE.BatchedMesh` pro Gruppe
  (Geometrie-Normalisierung auf position+normal, `addGeometry`/`addInstance`, Gruppenfarbe
  per Instanz via `setColorAt`) plus die **`batchId ↔ Teil`-Registry** für spätere
  Picking-Phasen. Modul-Registry `getGroupBatch/setGroupBatch/removeGroupBatch`.
- **Loader-Zweig hinter Flag** `performance.batchedGroups` (Default **aus**): baut beim
  Laden aus einem Bundle ein einziges BatchedMesh (Draw-Calls ~Teilanzahl → ~1) statt N
  Einzel-Meshes. `unloadGroupSilent` entfernt das Batch sauber. **Phase 1 = reines
  Rendering, keine Interaktion** (Picking/Selektion/Opacity folgen laut Task-Plan).
- **Bestätigt** (PoC + Headless): Materialien sind texturlos → gemeinsames Material tragfähig;
  `BatchedMesh` headless konstruierbar → Registry per Vitest getestet (4 neue Tests, 45 gesamt).
- **Offen — der Phase-1-Gate:** FPS-Messung mit allen Muskeln auf Zielhardware
  (Flag `performance.batchedGroups: true`, `npm run dev`). Nur bei bestätigtem Gewinn geht
  es zu Phase 2 (Picking) und ADR 0007 auf „akzeptiert".

### Added (Perf — Asset-Bündelung pro Gruppe, ADR 0009)
- **`scripts/bundle-groups.mjs`** (npm: `bundle:groups`): packt die Einzel-Draco-GLB einer
  Gruppe zu **einer `<group>.bundle.glb`** + `<group>.bundle.json` (Manifest der Teil-IDs).
  Jede Quell-Datei → ein benannter Wrapper-Node (Name = Basename = Teil-ID); Materialien
  **nicht** dedupliziert → per-Teil-Farbe/Deckkraft bleibt. `@gltf-transform` + Draco-CLI.
- **Loader-Bundle-Pfad** (`modelLoader-core.js`): `loadGroupByName` prüft per HEAD, ob ein
  Bundle existiert → lädt es in **1 Request** und richtet jeden Wrapper-Node exakt wie ein
  einzeln geladenes Modell ein (Meta, Pickable, Store, Schatten, Layers). Szenegraph
  äquivalent zum Einzel-Ladepfad → **Picking/Selektion/Farbe unverändert** (Pick-Auflösung
  läuft über `isModelRoot` zum Wrapper). Fehlt ein Bundle → unveränderter Einzel-Datei-Pfad.
  Kill-Switch `performance.useBundles` (Default `true`) in `config.ts`.
- **Bundles erzeugt** für Startup- + Fokus-Set: bones (207→1, −31 %), muscles (464→1, −34 %),
  cartilage (60→1), teeth (30→1), ligaments (28→1). **Startup: 297 Datei-Requests → 3.**
- Verifiziert: `tsc`/`lint`/`test` (41) grün · `build` ohne Warnungen (5 Bundles im `dist/`) ·
  Manifest→Meta 100 % gemappt (789/789 Teile) · Dev-Server nimmt den Bundle-Pfad (HEAD 200).
  **Offen (Nutzer):** visueller Klick-Test im GPU-Browser (Auswahl/Highlight einer Struktur).

### Removed (Aufräumen — Migrations-Altlasten & toter Code)
- **`initGroupLoader.js` gelöscht.** Die Datei band Klick-Handler an `btn-load-*`-Buttons,
  die es in der React-UI nicht mehr gibt (verifiziert: einzige `btn-load-`-Referenz war die
  Datei selbst). `initDynamicGroupLoading()` lief bei jedem Start zweimal (aus `app.js` und
  `startApp.js`), band ins Leere und produzierte ~34 `console.warn`-Zeilen. Enthielt außerdem
  `alert()`-Dialoge und inline-gestylte Emoji-Toasts (Alt-Stil neben der React-UI). Die einzige
  noch genutzte Funktion, `unloadGroupSilent`, ist nach `features/modelLoader-core.js` gewandert
  (zum Gegenstück `loadGroupByName`); Importe in `AppShell.tsx` und `StructureBrowser.tsx`
  entsprechend gebündelt.
- **`utils/migration-helper.js` gelöscht.** JS→TS-Migrations-Scaffolding. Außer `safeInit`
  (reiner Diagnose-Selbsttest via dynamischer Imports + `console.table`, gatete nichts) waren
  alle Exporte ungenutzt. `safeInit`-Aufruf aus `app.js` und der wirkungslose Side-Effect-Import
  aus `startApp.js` entfernt. War zudem Quelle einer Rollup-Chunk-Warnung.
- **5 verwaiste Module gelöscht** (madge + präzise Import-Prüfung, nirgends importiert):
  `core/events.js` (ungenutzter EventBus), `modelLoader/index.js` (alter URL-Resolver, abgelöst
  von `modelLoader-core.js`), `utils/cameraClipping.js`, `utils/index.js` (Barrel), `utils/utils.js`.

### Changed (Aufräumen — Build/Perf-Politur)
- **Prod-Build strippt Entwickler-Logs** (`vite.config.js`): `esbuild.pure` entfernt
  `console.log/debug/info` beim Minify; `console.warn/error` bleiben. Dev-Server (kein Minify)
  zeigt weiter alle Logs.
- **Vendor-Code-Splitting** (`vite.config.js`, `manualChunks`): Three (~600 KB) und React in
  eigene, selten wechselnde Chunks → besseres Browser-Caching. **App-Chunk 989 KB → 146 KB**
  (gzip 274 → 43 KB); Rest liegt in `three`/`react`/`vendor`.
- Beide vorherigen Build-Warnungen (mixed static/dynamic import) beseitigt.
- Verifiziert: `tsc` · `lint` · `test` (41 grün) · `build` **ohne Warnungen** · Dev-Server bootet,
  Einstieg + verschobenes Modul transformieren fehlerfrei (HTTP 200).

### Changed (Redesign „Variante B" — Feinschliff nach der Serie: Alt-Styling-Reste)
- **Reset-Overlay entbrandet → gebrandeter LoadingScreen wiederverwendet** (`ui-reset.js`):
  das injizierte Alt-Overlay (grüner `#4CAF50`-Spinner, Arial, hartkodiertes `<style>`) entfällt;
  `resetApp()` treibt jetzt den `loading`-Store-Slice (`showLoading`/`setLoadingProgress`/
  `hideLoading`, §9.11/ADR 0008) → derselbe Marken-Ladebildschirm wie beim Start. Store-Actions
  direkt (nicht `progress.js`) → kein `circleOverlayHidden`-Dispatch, keine Kollision mit dem
  Initial-Load. ~65 Zeilen injiziertes DOM/CSS gelöscht.
- **Multi-Highlight im Canvas auf Marken-Accent** (`multiSelect.js`): emissiver
  Mehrfachauswahl-Highlight `0x1a1a4a` (Alt-Blau) → `0x662a00` (Accent `#ff6a00`, ~40 % gedämpft,
  Intensität ~ wie der neutrale Einzel-Highlight `0x222222`).
- **Settings-Flyout ↔ ViewCluster-Überlappung behoben** (`ViewCluster.tsx` + `view-cluster.css`):
  bei offenem Flyout (rechte Kante 424px) weicht der Cluster breitenunabhängig in die freie
  Canvas-Fläche rechts davon aus (`left: calc((444px + 100vw)/2)`, animiert) — vorher ~19px
  Überlappung auf 1440px. Prop `flyoutOpen` aus `AppShell` (nur Desktop-Float; mobiles
  Ansicht-Sheet unberührt).
- **Fotomodus an die neue Tab-Leiste angepasst** (`photoMode.js`): mobile Reserve-Höhe
  `toolbarH` `72` → Konstante `MOBILE_TABBAR_H = 84` (Tab-Leiste: 16px Abstand + 68px Höhe),
  an allen drei Stellen (Frei-Bereich, untere Vignette, Auslöser-Grenze).
- **Tote `css/controls/search.css` entfernt** (nur `#search-bar`-Regeln der abgelösten
  Alt-Suche, inkl. hartkodiertem Blau `#4A9EFF`) + Import aus `main.css`; leerer `css/controls/`.
- **Fotomodus von Alt-Blau auf Marken-Accent umgebrandet** (`photo-mode.css`): alle
  `rgba(74,158,255,…)`/`#4A9EFF` (Rahmen, Glow, Eck-Marken, Format-Label, Sidebar-Buttons,
  Auslöser-Blitz) → `color-mix(in srgb, var(--accent) N%, transparent)` bzw. `var(--accent)`.
- Verifiziert: `test` 41 grün · `lint` · `tsc` · `build` sauber (CSS/JS kleiner). Headless:
  Reset zeigt den Marken-LoadingScreen (kein Alt-Overlay), ViewCluster weicht dem Flyout aus
  (clusterLeft 688 > 424) und stellt sich beim Schließen zurück.

### Changed (Redesign „Variante B" — S11 A11y- & Motion-Feinschliff, Serien-Abschluss)
- **Sichtbarer, konsistenter Fokus-Ring (§14):** genau EINE projektweite Wahl —
  `2px solid var(--focus-ring)` (Blau `#4a9eff`), nur bei Tastatur-Fokus (`:focus-visible`),
  global in `base.css`. Elemente, die `outline` selbst abschalten (Slider in Struktur-/Info-/
  Settings-Panel, Suchpille), setzen den Ring lokal neu (`:focus-visible` bzw.
  `.sb-search__wrap:has(.sb-search__input:focus-visible)`). Ring-Entscheidung im Index festgehalten.
- **`prefers-reduced-motion:reduce` schaltet ALLE Bewegung ab (§11/§14):** universelle Regel in
  `base.css` (`*,*::before,*::after { animation-duration:.01ms; transition-duration:.01ms;
  animation-iteration-count:1 !important }`) als Sicherheitsnetz über der token-basierten
  Abschaltung — fängt auch hartkodierte `ease`-Kurven (Foto-Modus, Loading-Fade/Fortschritt,
  Toasts), die `--transition-smooth:none` bisher nicht erreichte. Loading-Ring bleibt aus.
- **Tastatur-Bedienung/Fokus-Management:** ESC schließt das Settings-Flyout bzw. das offene
  Mobile-Sheet und gibt den Fokus an das auslösende Bedienelement zurück (Rail-⚙ / Tab-Leiste,
  je nach Breakpoint sichtbar). LicenseModal-Trap (role=dialog/aria-modal, Tab-Zirkel, ESC,
  Fokus-Rückgabe) fängt ESC weiterhin zuerst ab.
- **Audit bestätigt (kein Code nötig):** alle Icon-Buttons haben `aria-label` oder Text-Label;
  Sichtbarkeits-Toggle (StructureBrowser) ist `role="switch"` + `aria-checked`; genau eine
  Motion-Kurve. `--focus-ring` war bislang definiert, aber ungenutzt — jetzt projektweit aktiv.
- Verifiziert: `test` 41 grün · `lint` · `tsc` · `build` sauber. Headless: reduced-motion
  schaltet Transitions/Animationen auf `~0s`; ESC schließt Flyout + Fokus kehrt zum ⚙ zurück;
  Fokus-Ring-Regel matcht + `--focus-ring` löst auf (Ring-Rendering headless nicht per Pixel
  prüfbar — nativer Fokus-Ring wird am Compositor gezeichnet; in echten Browsern greift die Regel).
- **Redesign-Serie „Variante B" (S0–S11) abgeschlossen.**

### Changed (Redesign „Variante B" — S10 Mobile: Bottom-Sheets + Tab-Leiste + Safe-Area)
- **Schmal-Screen ≤768px (§13, Pflicht):** seitliche Sidebar → **Bottom-Sheet**, Icon-Rail →
  **untere Tab-Leiste**, `viewport-fit=cover`-Safe-Area-Insets greifen. Neue zentrale
  `css/layout/responsive.css` (zuletzt in `main.css` importiert, damit die Sheet-Overrides
  per Quellreihenfolge über die Komponenten-Basisregeln gewinnen).
- **Sheets per Media-Query aus den Bestandspanels** (kein Panel-Logik-Duplikat, Briefing-
  Vorgabe): dieselben `.shell-sidebar` (Strukturen/Sammlung/Info + Suche + Footer),
  `.stp-flyout` (Settings) und ein neuer `.vc-sheet` (Ansichts-Cluster) teilen ein Sheet-
  Rezept — bündig unten, `radius:28px 28px 0 0`, `--sheet-bg` (`rgba(15,16,20,.94)`),
  Grabber `42×5` als `::before` (kein Extra-Markup), Slide-in von unten (`sheet-rise`
  bzw. `--open`-Transform), `prefers-reduced-motion` → ohne Slide. Neue Tokens:
  `--radius-sheet`, `--sheet-bg`, `--sheet-grabber`, `--sheet-backdrop-bg`, `--z-sheet`,
  `--z-sheet-backdrop` (< `--z-modal`, damit das LicenseModal über dem Settings-Sheet bleibt).
- **Untere Tab-Leiste** (`AppShell.tsx`, Frame „Mobile · Default"): Glas-Floating-Bar
  `left/right:16px`, Buttons `52px` (≥`--touch-min`) — `Auswählen · Strukturen · Labels ·
  Ansicht · ⚙`. Neue Icons `layers`/`cube`. Werkzeug/Toggle-Logik aus der Rail
  wiederverwendet; `Strukturen`/`Ansicht` togglen die Sheets, `⚙` das bestehende Flyout.
- **Neuer additiver UI-Store-Zustand `mobileSheet`** (`'panel' | 'view' | null`, ADR 0006-
  Nachtrag) mit `openMobileSheet`/`closeMobileSheet`. Sheet und Settings-Flyout schließen
  sich **gegenseitig aus** (teilen mobil die untere Bühne). Auf Schmal-Screens poppt eine
  Auswahl zusätzlich das Panel-Sheet auf (Frame „Info-Sheet", `matchMedia`-Guard — sonst
  CSS-only). Desktop unverändert: `mobileSheet` ohne Wirkung (Rail/Sidebar wie gehabt).
- **Backdrop** hinter offenen Sheets (dimmt Canvas, schließt per Tap); auf Desktop
  `display:none`. **Auswahl-Chips** der Mehrfachauswahl (`.msp-chips`) werden mobil zur
  horizontal scrollbaren Reihe; Slider-Knobs 15px; Struktur-Zeilen mit mehr Touch-Höhe.
  **Isolation-Untertitel** über die Tab-Leiste gehoben, Float-`ViewCluster` mobil aus.
- **Perf:** netto **eine** dauerhaft sichtbare Blur-Fläche weniger auf Mobile — Rail- und
  Sidebar-Glas entfallen, es bleibt nur die Tab-Leiste (Sheets sind nur bei Bedarf sichtbar).
- Verifiziert: `npm run test` (41 grün, +3 Store-Tests für `mobileSheet`/Exklusivität) ·
  `lint` · `tsc` · `build` sauber; Sheet-Regeln + alle neuen Tokens im Bundle, Assets 200.

### Changed (Redesign „Variante B" — S9 Footer + LicenseModal + LoadingScreen + Branding)
- **LoadingScreen im Marken-Look** (`LoadingScreen.tsx` + `loading-screen.css` neu, §9.11):
  vollflächig `--stage-gradient`, Logo 132px mit rotierendem Akzent-Ring (SVG r98,
  `dasharray 100 520`, 1.5s linear; `prefers-reduced-motion` → statisch), Wortmarke
  „Anatomie **Fokus**" (Sora 600 46px), Tagline „Anatomie verstehen. Wissen anwenden.",
  Fortschritt 320×4 `--accent-gradient` + „3D-Modell wird geladen … NN %".
- **Neuer Store-Slice `loading`** (`{active, progress, label}` + `showLoading`/
  `setLoadingProgress`/`hideLoading`, ADR 0008): `progress.js` ist jetzt reiner
  Store-Adapter — DOM-Kreis-Overlay (Alt-Blau) + 2,2-s-„Willkommen!"-Verweilzeit
  entfernt, App startet entsprechend schneller. Event-Kontrakt `circleOverlayHidden`
  (Canvas sichtbar + Render-Loop) unverändert. React mountet jetzt auch im
  Muskelfinder-Preview-Modus — dort rendert `App.tsx` nur den LoadingScreen.
- **LicenseModal nach §9.10** (`LicenseModal.tsx` + neues `license-modal.css`):
  zentrierte Card 600px/`radius 20px` (`--modal-bg`-Token neu), Backdrop
  `rgba(6,6,7,.66)` + Blur, Header „Lizenzen & Attribution" (Sora 600 18px),
  Attributions-Zeilen mit Lizenz-Tag-Pille rechts, Footer-CTA „Schließen" (gefüllt
  `--accent`), **Fokus-Trap** (Tab zirkuliert, Fokus kehrt zum Auslöser zurück) + ESC.
  **Fix:** Modal rendert per Portal an `document.body` — die `backdrop-filter`-Panels
  (Sidebar/Flyout) bildeten einen Containing Block, der das `position:fixed`-Modal
  einfing (bisher vom gelöschten `!important`-Override kaschiert).
- **Footer im Sidebar-Fuß** (§9.9, neues `footer.css`): `Lernen · Lizenz · Quellen ·
  Datenschutz` (Manrope 500 12px `--text-faint`, Trenner `·` mit `opacity .4`) +
  BodyParts3D-Attributionszeile (CC BY 4.0 — Pflicht, ADR 0005). Glas-Floating-Bar,
  Blau-Hardcode und der `shell-sidebar__foot`-Override entfernt.
- **Branding/Favicon (§15):** `favicon.png` (512) + `favicon-16/32/64` aus
  `af-logo-white` (flach/transparent), `apple-touch-icon` 180px (Squircle-Look,
  Primär-Logo auf dunklem Radial-Verlauf), Maskable-Icons 192/512 (`af-logo-black`
  auf Akzent-Orange) + `site.webmanifest`; Links + `theme-color` in `index.html`.
- **Tote CSS entfernt:** `css/components/loading.css` gelöscht (Styles für nie
  existierende `#initial-loading-screen`/`#loading-bar`-DOM-Knoten); `.ft-`/`.lic-`-
  Blöcke aus `settings-panel.css` in die neuen Komponenten-Dateien überführt.
- Headless verifiziert: Start → Marken-LoadingScreen (45→100 %) → Canvas sichtbar ·
  Footer-Links + Attribution im Sidebar-Fuß · Modal zentriert (auch aus dem
  Settings-Flyout), Fokus-Trap zirkuliert, ESC/CTA schließen, Fokus kehrt zurück ·
  alle Icon-/Manifest-URLs 200 · Preview-Modus: nur LoadingScreen, keine Shell ·
  keine Konsolen-Fehler.

### Changed (Redesign „Variante B" — S8 SettingsPanel als Rail-Flyout)
- **SettingsPanel = Flyout links neben der Rail** (`SettingsPanel.tsx` +
  `settings-panel.css` neu geschrieben, §9.7/§10 Frame 2f): `left:100px; top/bottom:20px;
  width:324px`, Glas-Panel `radius:20px`, Slide-in mit `--ease-smooth` (reduced-motion:
  aus). Rechte Sidebar bleibt als Kontext sichtbar; Exklusivität weiter über den
  `openFlyout`-Slice aus S1 (⚙ togglet, `closeFlyout` schließt).
- **Sektionen nach 2f:** Uppercase-Header 10.5px/`.12em` (`--text-faint`). **Raum:**
  „Helligkeit"-Slider (Sonnen-Icon, = Beleuchtung 0–200 %) · „Umgebungslicht"-Slider
  (= Raumhelligkeit) · „Hintergrund"-Swatches (Schwarz `#0b0b0b` · Anthrazit `#34373c` ·
  Navy `#0a0e27`, aktiv mit `--accent`-Ring) + Custom-Farbwähler und „Raum zurücksetzen"
  als Ghost (Funktions-Erhalt). **Presets:** bestehende Manifest-Liste im neuen Zeilen-Stil —
  die Handoff-Segmented „Studio/Klinisch/Kontrast" wären neue Beleuchtungs-Presets, die es
  nicht gibt (Nicht-Ziel „kein Preset-Algorithmus"). **Tastenkürzel:** Key-Caps rechts
  (Label links), echte App-Shortcuts statt der 2f-Beispiele. **Flyout-Footer:** „Farben
  zurücksetzen" (`--accent` + Reset-Icon, = `resetColors()`) · „Lizenzen"-Link öffnet das
  bestehende LicenseModal (Umbau des Modals folgt in S9).
- **Kein `room`-Store-Slice** (Briefing-Option geprüft): Raum-Zustand lebt weiter in
  `roomSettings.js`, einziger Konsument ist das Panel — lokal belassen, kein ADR nötig.
  S3-Farbwahl-Konsolidierung geprüft: InfoPanel-Farbwahl ist **pro Struktur**, Settings sind
  global — bleibt im InfoPanel.
- Alt-Blau raus: Spinner/Sektions-Titel `#4A9EFF` → Tokens; Fehlertext → `--accent-strong`.
- Headless verifiziert: ⚙ → Flyout bei exakt `left:100px` (Sidebar sichtbar) · Slider
  85→95 % · Navy-Swatch aktiv · Preset „Hand" lädt (Overlay + 27 in Sammlung) ·
  Lizenz-Modal auf/zu · ⚙-Toggle schließt · keine Konsolen-Fehler.

### Changed (Redesign „Variante B" — S7 MultiSelect + Isolation ohne Floating-Bars)
- **MultiSelectPanel = Sammel-Ansicht des Info-Tabs** (`MultiSelectPanel.tsx` +
  neues `css/components/multi-select.css`, Frame 2d): Zähler-Badge (`--accent`/`--accent-on`,
  Sora) + „N Strukturen gewählt" + Chip-Liste (Farbpunkt + Latein-Name + ✕) + „Für alle N"-
  Aktionen **Isolieren · Ausblenden · Zur Sammlung hinzufügen** (Outline-CTA) + „Auswahl
  aufheben" am Tab-Fuß. Keine floatende Bottom-Bar mehr; Auto-Switch öffnet den Info-Tab
  jetzt auch bei Mehrfachauswahl (ab 1 Struktur — Briefing sagt >1, aber sonst wäre der
  Info-Tab im Multi-Modus anfangs leer). Batch-Farbe/-Deckkraft als Sekundär-Block erhalten.
- **Neue Sammel-Aktionen** an Bestands-Logik gebunden (kein Three.js-Umbau): Isolieren =
  `enterIsolatedView(erste, {structuralGroups: []})` + restliche sichtbar schalten;
  Ausblenden = `setModelVisibility(…, false)` je Struktur; Zur Sammlung = `addToCollection`
  je Struktur (Duplikate übersprungen, Toast „N hinzugefügt"/„Bereits in der Sammlung").
- **Isolation = Sidebar-Banner + Untertitel** (`IsolationBar.tsx` → exportiert jetzt
  `IsolationBanner` + `IsolationSubtitle`, neues `css/components/isolation-bar.css`, §9.6/
  Frame 2e): Banner „Isolation aktiv · Nur <X> sichtbar" (Target `--accent`, `--accent-dim`-
  Fläche, `--accent-border`) + Ghost „Kontext einblenden" (`enterGhostContext`) + gefülltes
  „Isolation beenden" (`actionBar.onPrimary` — Deeplink-Label „← Zurück zum Muskelfinder"
  bleibt erhalten). Unten-mittig ersetzt der **Untertitel** (Struktur + Gruppe, `left:41%`)
  den ViewCluster, solange die Isolation aktiv ist (Frame 2e zeigt dort keinen Cluster).
- **Store additiv erweitert:** `isolation.label?` (Anzeige-Label, z. B. „3 Strukturen" bei
  Mehrfach-Isolation); `isolationView.js` reicht `options.label` durch, Default-Primary-Label
  „← Zurück zur Gesamtansicht" → „Isolation beenden" (§-Wortlaut).
- **Bugfix Geister-Selektion:** `pickAt()` (raycaster.js) setzt bei jedem Canvas-Klick
  `selected.root` als Nebeneffekt — nach „Auswahl aufheben"/„Ausblenden" blieb der Info-Tab
  dadurch leer offen. Beide Aktionen rufen jetzt zusätzlich `clearSelection()` auf.
  (Gleiche Kante beim Esc-Shortcut in `interaction/index.js` bewusst offen gelassen.)
- **Tote CSS entfernt:** `css/components/panels.css` komplett gelöscht (Shortcuts-Tip ohne
  DOM-Gegenstück, `#isolation-actions`-Float, Muskelfinder-Preview-Regeln — im Preview-Modus
  mountet die React-UI nicht); `.msp-*`-Float-Block + `ip-slide-in` aus
  `info-panel-react.css` entfernt (neue Datei ist selbstständig).
- Headless verifiziert: Multi-Tool → 2 Klicks → Sammel-Ansicht (Badge/Chips/Aktionen) ·
  Chip-✕ · Isolieren → Banner/Untertitel/Cluster-Swap · Beenden → Rückbau · Zur Sammlung
  (Badge 2, Duplikat-Toast) · Ausblenden → Tab zurück auf „Strukturen" · Einzel-Isolation
  über InfoPanel → Banner mit Struktur-Name + Gruppen-Untertitel. **Pixel-Sichtprüfung offen.**

### Changed (Redesign „Variante B" — S6 CollectionPanel → Tab „Sammlung")
- **CollectionPanel im Tab-Body verankert** (`js/ui/react/components/CollectionPanel.tsx`):
  kein Float/eigenes Glas/Close-X mehr; `onClose`-Prop entfällt. Der letzte
  `shell-host`-Override in `AppShell.tsx`/`app-shell.css` ist damit abgelöst und gelöscht.
- **Frame-2c-Layout** (`css/components/collection-panel.css`): Sektions-Label
  „GESPEICHERT · N Einträge" (Klinik-Stil) · flache Zeilenliste (Farbpunkt 10px +
  Latein-Name + Fokus-Target + Trash 16px, Gruppen-Abschnitte entfallen — Gruppe bleibt
  über den Farbpunkt ablesbar) · **CTA „Alle fokussieren"** gefüllt `--accent`/`--accent-on`
  mit `margin-top:auto` am Tab-Fuß. Alt-Navy (`#4A9EFF`)-Hardcodes durch Tokens ersetzt.
- **Zeilen-Klick/Target fokussiert** (Highlight + `focusOnObject`) **ohne `setSelection`** —
  bewusste Abweichung vom alten Verhalten: Selektion würde per Auto-Switch (ADR 0006)
  sofort auf den Info-Tab springen und die Sammlung verlassen (Frame 2c: „Klick fokussiert").
- **„Alle fokussieren"** = bisheriges „Nur Sammlung anzeigen" (`showCollectionInScene()`,
  §-Wortlaut) · **Leeren/Export/Import als Sekundär-Reihe beibehalten** (Nicht-Ziel:
  Export/Import unverändert). Toast auf Orange-Tokens; Timer wird bei Unmount aufgeräumt.
- Mobile-`@media` entfernt (Bottom-Sheet kommt in S10).
- Headless verifiziert (Chromium/Swiftshader): Canvas-Klick → Info-Tab → „Zur Sammlung" →
  Tab „Sammlung" (Badge 1, Zeile, CTA) · Zeilen-Klick bleibt im Sammlung-Tab und fährt die
  Kamera auf die Struktur · „Alle fokussieren" isoliert die Sammlung sichtbar · Entfernen →
  „0 Einträge" + Leer-Hinweis + CTA disabled. **Pixel-Sichtprüfung trotzdem offen.**

### Changed (Redesign „Variante B" — S5 Ansichts-Cluster als eigene Leiste)
- **`ViewCluster.tsx` neu** (`js/ui/react/components/`): Kamera-Richtungen + Reset aus
  `AppShell.tsx` in eine eigenständige schwebende Leiste ausgelagert (Handoff §9.1/§10,
  Frames `2a`–`2e`). Kamera-Actions unverändert (`setCameraDirection`/`resetApp`).
- **§-Styling** (`css/components/view-cluster.css`, Präfix `vc-`): Glas-Rezept `.bar`,
  `left:41%` (Mitte des freien Canvas) `bottom:26px`, `radius:16px`; „Ansicht"-Label
  (Manrope 600 10px, Klinik-Tracking); Buttons 38px/`radius:10px` mit deutschen
  Richtungs-Labels **Vorne/Hinten/Links/Rechts/Oben/Unten** (Frame-Wortlaut statt
  bisher „Ant/Post/…"; anatomische Begriffe bleiben im Tooltip); Trenner + Reset-Icon.
  Kein neuer Blur — die eine `backdrop-filter`-Fläche des Clusters bestand schon (ADR 0007).
- **Reset aus der Rail entfernt** — laut §10-Mapping gehört „Ansicht zurücksetzen" zum
  Ansichts-Cluster, nicht zur Rail; Aktion (`resetApp()`) unverändert, keine Dublette.
- **Tote `#toolbar-dir-panel`/`#anatomy-toolbar`-Regel** in `panels.css`
  (Muskelfinder-Preview) entfernt: im Preview-Modus wird die React-UI gar nicht
  gemountet (`app.js`), eine Hide-Regel für Rail/Cluster kann nie greifen
  (headless verifiziert: `.shell-rail`/`.vc-bar` fehlen dort im DOM).
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Performance-Untersuchung — Ruckeln bei Kamerabewegung, Layout B)
- **Glas-Blur moderater:** `--glass-blur-strong` 22px → 14px, `--glass-blur` 12px → 10px
  (`css/theme/variables.css`, dokumentierte Abweichung vom Handoff §8) — senkt die
  Pro-Frame-Blur-Kosten der großen, dauerhaft sichtbaren Layout-B-Flächen (Rail + volle
  Sidebar) über dem live rendernden Canvas; optisch bei 82 %-opaken Panels kaum unterscheidbar.
  Auf echter Zielhardware (Schul-Laptop) war das der entscheidende Hebel gegen das Ruckeln.
- **Labels ohne `backdrop-filter`** (`css/components/labels.css`): bei „alle Labels an" sind das
  hunderte DOM-Boxen mit je einem Blur → pro Frame neu komponiert = Ruckeln. Blur entfernt
  (Hintergrund war zu 78 % ohnehin deckend), Farben zugleich auf Marken-Schwarz/Hairline
  statt Alt-Navy. Offener Folgehebel: Label-Renderer läuft in eigener 60-fps-Dauerschleife
  ohne Culling (siehe `js/features/labels.js`).
- **Zwei verworfene Ansätze zurückgebaut** (beide ohne Wirkung auf das Ruckeln, aber mit
  sichtbaren Nebenwirkungen): Blur-Aussetzen während der Bewegung (Grau-Flackern) und
  adaptive Auflösung 0.65× während der Geste (sichtbare Pixelation bei DPR 1).
  Render-Loop/`startApp.js` wieder identisch zum Stand vor dem Redesign.
- **Ursache noch offen** — Diagnose läuft (A/B: UI-Overlay aus vs. an); Draw-Call-Reduktion
  (`BatchedMesh`) als struktureller Kandidat in `docs/BACKLOG.md` (P1) erfasst.

### Changed (Redesign „Variante B" — S4 SearchBar → Sidebar-Kopf)
- **Persistentes Suchfeld statt floatendem Lupe-Icon** (`js/ui/react/components/SearchBar.tsx`):
  Einklapp-Logik + Fixed-Toggle entfernt; die Pille lebt jetzt dauerhaft im Sidebar-Kopf
  (`.shell-searchhost`). `/` fokussiert, Esc leert.
- **§9.2-Styling** (`css/components/search-bar.css`): Pille `padding:13px 15px; radius:14px`,
  Lupe in `--accent`, Fokus-`border --accent-border`, **kein eigener Blur** (sitzt in der
  Glas-Sidebar → spart verschachtelten `backdrop-filter`). Ergebnis-Dropdown als absolut
  positioniertes Panel (Anker `.shell-searchhost`): Header „N Treffer" + „↑ ↓ · Enter"-Hinweis,
  Zeilen mit **Farbpunkt** (`--group-*`) + Name (**Fuzzy-Treffer-Teil in `--accent` 600**) +
  Gruppen-Tag; aktive Zeile `--accent-dim`.
- Treffer-Auswahl lädt bei Bedarf die Gruppe, selektiert + fokussiert → Auto-Switch auf „Info"
  (aus S1/S3). Tastatur ↑/↓/Enter/Esc. Emoji-Spinner `⏳` durch CSS-Spinner ersetzt
  (reduced-motion-fest).
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S3 InfoPanel → Tab „Info")
- **InfoPanel im Tab-Body verankert** (`js/ui/react/components/InfoPanel.tsx`): kein
  `position:fixed`/eigenes Glas/Close-X mehr (Tab-Kontext); `shell-host`-Override in
  `AppShell.tsx` für den Info-Tab abgelöst (direktes Rendern). Auto-Switch auf „Info" bei
  Auswahl war bereits seit S1 verdrahtet.
- **§9.4-Layout** (`css/components/info-panel-react.css`): Titel Sora 600 21px (Latein via
  `getStructureDisplayLabel`) + **Gruppen-Badge** (Farbpunkt 8px + Gruppenname, `background:
  Gruppenfarbe @15%` aus `--group-*`) · **Deckkraft-Slider** (Fill `--accent`, Knob 13px,
  Live-Prozent, jetzt controlled) · **3 gleich breite Aktionen** Ausblenden/Isolieren/Kontext
  (Inline-SVG 19px + Label 11px) · **CTA „Zur Sammlung"** (Outline `--accent-border`). Alt-Navy
  (`#4A9EFF`) in Buttons/Toast auf Marken-Orange-Tokens umgestellt.
- **Farbwahl beibehalten** als sekundärer Block (nicht Teil von §9.4 — Layout-A-Feature, ggf.
  später in Settings/S8 konsolidieren). `ModelActions` bekommt `key={meta.id}` → frischer
  State pro Struktur (behebt latenten Stale-State bei Auswahlwechsel).
- Mobile-`@media` für `.ip-panel` entfernt (Bottom-Sheet kommt in S10); `.msp-*` (S7) unberührt.
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S2 StructureBrowser → Tab „Strukturen")
- **StructureBrowser im Tab-Body verankert** (`js/ui/react/components/StructureBrowser.tsx`):
  kein `position:fixed`/eigenes Glas/Panel-Header mehr — die Komponente füllt jetzt den
  „Strukturen"-Tab (Default-Tab der Sidebar). `shell-host`-Override in `AppShell.tsx` für
  diesen Tab abgelöst (direktes Rendern), `onClose`-Prop entfernt.
- **Gruppen-Zeile auf §9.3-Maße umgezogen** (`css/components/structure-browser.css`):
  Sichtbarkeits-Auge (17px) · Farbpunkt 11px (`--group-*`) · Label (flex 1) · Röntgen-Slider
  (Track `60×4`, Fill in Gruppenfarbe, Knob 11px weiß) · Laden/Entladen-Button. Ausgeblendete
  Gruppe gedimmt (`--text-faint`), aktive (geladen+sichtbar) `background:--accent-dim`, Label 600.
  Farbpunkt + Slider-Fill aus `--group-*`-Tokens (statt Store-Farbnummer); nur Tokens, keine Hardcodes.
- **Sichtbarkeits-Toggle als `role="switch"`** (`aria-checked`) — A11y-Grundlage (Feinschliff S11).
- **Skaliert über 5 Gruppen** hinaus: vertikale Flex-Liste im scrollenden Tab-Body, kein festes Raster.
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S1 App-Shell: Icon-Rail + Tab-Sidebar)
- **Layout B eingeführt** (`js/ui/react/components/AppShell.tsx` + `css/components/app-shell.css`):
  Icon-Rail links (Logo, Auswahl-Werkzeuge, Layer-Toggles Knochen/Muskeln, Labels/Foto/Reset,
  ⚙ unten) + **persistente Tab-Sidebar** rechts (`Strukturen · Sammlung · Info`) mit Such-Kopf
  und Footer-Fuß + Ansichts-Cluster unten mittig. Ersetzt die bisherige Bottom-Toolbar und die
  an den Ecken floatenden Panels (Layout A).
- **Additiver UI-Store-Slice** (`js/store/useStore.ts`): `sidebarTab` (`structures|collection|info`)
  + `openFlyout` (`settings|null`) mit Actions `setSidebarTab`/`openFlyoutExclusive`/`closeFlyout`.
  `App.tsx` hält keinen Panel-`useState` mehr — Navigation läuft über den Store (ADR 0006).
- **Auto-Switch:** Auswahl einer Struktur schaltet die Sidebar automatisch auf „Info", das
  Aufheben zurück auf „Strukturen" (Effekt in der Shell, `selected.root`-gebunden — bewusst
  außerhalb der imperativ genutzten Selection-Actions, ADR 0006).
- **Bestehende Panels** (StructureBrowser/InfoPanel/CollectionPanel) werden **in die Tab-Bodies
  gehostet** (temporärer Positionierungs-Override in `app-shell.css`); ihr pixelgenauer Umbau
  folgt isoliert je Komponente (S2/S3/S6). Multi/Isolation bleiben vorerst kontextuelle Overlays
  (S7), Settings öffnet als Panel via ⚙ (Rail-Flyout in S8).
- **Toten Code entfernt:** `Toolbar.tsx` + `css/components/toolbar.css` gelöscht (Werkzeuge leben
  in der Rail, Kamera-Richtungen im Ansichts-Cluster). Store-Tests +3 (34 grün).
- **Assets:** `af-logo.png` (+ `-white`) nach `public/assets/` für die Rail (Favicon-Set folgt S9).
- **Sichtprüfung nötig:** Pixel-/3D-Verhalten ist nicht unit-getestet.

### Changed (Redesign „Variante B" — S0 Fundament: Tokens, Fonts, Cleanup)
- **Design-Tokens auf Marke „Anatomie Fokus" umgestellt** (`css/theme/variables.css`):
  Navy/Blau → Marken-Schwarz `#0b0c0e` + Orange-Akzent `#ff6a00`, neutralisiertes Glas,
  Sora/Manrope-Font-Stacks, `--stage-gradient`, Hairlines, erweiterte Spacing-/Radius-/
  z-index-Stufen und semantische Gruppenfarben (Drop-in aus dem Design-Handoff).
- **Alte Blau-Token migriert:** `--accent-blue`/`--accent-blue-dim`/`--accent-orange` →
  `--accent`/`--accent-dim` in `info-panel-react.css`, `search-bar.css`,
  `structure-browser.css` (semantischer Primär-Akzent ist jetzt Orange).
- **`base.css`** nutzt Tokens statt Navy-Hardcodes (`--stage-gradient`, `--font-ui`).
- **Fonts self-hosted vorbereitet** (`css/theme/fonts.css`, in `main.css` importiert):
  `@font-face` für Sora (300–800) + Manrope (400–800), `font-display:swap`, lokale
  `/fonts/*.woff2` (CSP `font-src 'self'`). Die 11 `.woff2` (latin-ext-Subset, SIL OFL 1.1)
  liegen unter `public/fonts/` und werden vom Build nach `dist/fonts/` übernommen.
- **Toten Code entfernt:** `css/components/dropdowns.css` gelöscht + Import aus `main.css`.

### Changed (Rebranding — „BlueBody 3D" → „Anatomie Fokus 3D")
- Anzeigename überall auf **Anatomie Fokus 3D** umgestellt: Browser-Titel (`index.html`),
  alle Doku-Titel (AGENTS/CLAUDE.md, ROADMAP, architecture, STARTEN, AGENT_WORKFLOW,
  DESIGN_BRIEF), Export-Signatur im Sammlungs-Export, `name`-Feld der Preset-Dateien,
  Screenshot-Dateiname (`anatomie-fokus-3d-…jpg`) und npm-Paketname (`anatomie-fokus-3d`,
  package.json + lock synchron, `npm ci` grün).
- **Bewusst belassen:** die technische Dateiendung `.bluebody` (Format der gespeicherten
  Sammlungen/Presets) — eine Umbenennung würde bereits exportierte Nutzerdateien
  unlesbar machen; offen als separate Entscheidung.

### Added (Nomenklatur — kuratiertes Latein für sichtbare neue Muskeln)
- **`labels.la` für die 54 neuen, aktuell sichtbaren Muskel-Teile** (Gruppe `muscles`)
  mit geprüftem Terminologia-Anatomica-Latein gesetzt (`scripts/set-muscle-latin.mjs`,
  Schlüssel = FMA-ID). Ersetzt die fehleranfällige Laufzeit-Synthese aus dem Englischen
  durch feste Namen — z. B. „Right medial pterygoid" → `M. pterygoideus medialis dexter`,
  „Right internal oblique" → `M. obliquus internus abdominis dexter`. Seiten-neutral
  gespeichert (App hängt dexter/sinister an); Provenienz über `meta.validation_status =
  'latin_manual'` (menschlich kuratiert, fachliche Stichprobe noch empfohlen). Die
  restlichen 702 neuen Teile liegen in noch deaktivierten Gruppen (Gefäße/Nerven/Hirn)
  und behalten vorerst die synthetisierten Namen — dran, sobald ihre Gruppen freigeschaltet
  werden.
- **Nebenbefund (nicht behoben):** `fma57084`/`fma57086` (stylomandibular ligament) sind
  Bänder, liegen aber in der `muscles`-Gruppe (BP3D-Fehlklassifikation). Korrekt als
  `Lig. stylomandibulare dextrum/sinistrum` benannt; die Gruppen-Umlage bleibt offen.

### Not done (Modell-Pipeline — Komplett-Tausch vorerst zurückgezogen)
- Der Tausch der 2.153 Bestandsteile auf die reprozessierten Meshes wurde **versucht,
  aber wieder zurückgenommen**, weil er die Modelle räumlich zerlegt hat (der Schädel
  schwebte über der Wirbelsäule). **Ursache:** Die alten Live-Modelle tragen eine
  *hand-kalibrierte, uneinheitliche* Skalierung — der Schädel liegt bereits auf
  `SCALE 0.0010844`, der Rumpf/die Wirbelsäule aber auf ~`0.001176` (≈ ×1,0844). Diese
  Mischung ergibt zusammengesetzt ein stimmiges Skelett. Die Blender-Pipeline exportiert
  jedoch **einheitlich** auf `0.0010844`; der Tausch verkleinerte deshalb den Rumpf um
  Faktor 0,922 zum Ursprung hin, ließ den (schon passenden) Schädel aber unverändert →
  Rumpf rutscht nach unten weg. Numerisch nachgewiesen an Frontal/Occipital (ratio 1,00,
  unbewegt) vs. C7/T5/Sakrum/Femur (ratio 0,922, bis −11,6 cm).
- **Konsequenz:** `public/models` + `meta.json`-Modellpfade wurden auf den bekannten,
  ausgerichteten Vor-Tausch-Stand zurückgesetzt (Ausrichtung numerisch verifiziert:
  Skull+Spine wieder bbox-identisch zum Alt-Stand). `scripts/swap-existing-models.mjs`
  bleibt erhalten, wird aber **nicht** angewandt, bis die Pipeline die alte Per-Teil-
  Kalibrierung reproduziert (offener Punkt, siehe Runbook). Der einzige QC-Fehler
  (`fma7163`, 0 Materialien, deaktivierte `skin_hair`-Gruppe) besteht damit wie vor dem
  Tausch weiter — Alt-Zustand, keine neue Regression.

### Fixed (Build — fehlende Rechtsseiten im Deploy)
- **`quellen-lizenzen.html` und `datenschutz.html` fehlten komplett im Produktions-Build**:
  `vite.config.js` hatte nur `index.html` als Rollup-Input, die beiden eigenständigen
  Rechtsseiten wurden nie nach `dist/` gebaut. Da der GitHub-Actions-Workflow exakt
  `dist/` deployt, waren die Footer-/LicenseModal-Links „Quellen & Lizenzen" und
  „Datenschutz" auf der live laufenden Seite tote 404-Links. `build.rollupOptions.input`
  um beide Seiten ergänzt; Build-Output enthält jetzt alle drei HTML-Dateien.

### Fixed (Modell-Pipeline — Ordner-Konsistenz, QC, Lizenz)
- **108 Ordner-Konflikte behoben**: GLB-Dateien, die noch im falschen Gruppen-Ordner
  lagen (`classification.group` in meta.json wich vom physischen Ablageort ab —
  z. B. ein Muskel, der aus `arteries/` geladen wurde), in den korrekten Ordner
  verschoben und `model.variants.draco.path`/`model.asset` in meta.json nachgezogen.
  Betraf u. a. Teile aus aktiven Gruppen (Muskeln, Bänder, Knorpel, Knochen), die im
  StructureBrowser bislang unter der falschen Kategorie auftauchten.
  Neues Skript `scripts/fix-folder-conflicts.mjs` (idempotent, `--dry-run`).
- **QC-Skript** (`scripts/qc-models.mjs`, Phase 6 aus `docs/tasks/model-pipeline-bp3d.md`):
  prüft jede ausgelieferte draco-GLB strukturell (1 Mesh/1 Material, Dreieckszahl > 0,
  Draco-Dekodierung via `@gltf-transform/core` + `draco3dgltf`) und gleicht meta.json
  gegen das Dateisystem ab (fehlende/verwaiste Dateien, FJ/Gruppen-Pfad-Konsistenz).
  Report unter `NEW MODELS/qc-report.json`. Lauf über alle 2.997 Einträge: nur noch
  1 bekannter Inhaltsfehler (`fma7163`, deaktivierte Gruppe `skin_hair`, 0 Materialien
  in der GLB — dokumentiert in `docs/MODELS.md`, nicht automatisch korrigiert).
- **BodyParts3D-Lizenz korrigiert auf CC BY 4.0** ([ADR 0005](docs/decisions/0005-bodyparts3d-lizenz-korrektur.md),
  ersetzt ADR 0003): Das Projekt führte bisher zwei widersprüchliche Lizenzangaben
  parallel — UI (Footer, LicenseModal, `quellen-lizenzen.html`) und 2.232 ältere
  meta.json-Einträge sagten CC BY 4.0, während ADR 0003/CLAUDE.md/AGENTS.md und die
  765 neu integrierten Einträge CC BY-SA 2.1 Japan vorschrieben. Gegenprüfung an zwei
  offiziellen DBCLS-Quellen ergab: CC BY-SA 2.1 Japan war die Lizenz der
  BodyParts3D-Erstveröffentlichung 2008, die aktuelle, vom Rechteinhaber selbst
  betriebene Archiv-Distribution lizenziert die Datenbank heute unter CC BY 4.0.
  Alle 2.997 meta.json-Einträge, `CLAUDE.md`/`AGENTS.md`,
  `scripts/integrate-new-models.mjs` und `quellen-lizenzen.html` auf CC BY 4.0
  vereinheitlicht; ADR 0003 als ersetzt markiert (Historie bleibt erhalten).
- **`docs/MODELS.md` neu**: Provenienz, Pipeline-Schritte, Tool-Versionen,
  „modified"-Hinweis, bekannter Stand (2.232 Bestandsteile noch nicht auf die
  reprozessierten Meshes umgestellt, 765 neue Teile ohne geprüfte Latein-Namen).

### Changed (Einzelansicht — letzte DOM-Chrome-Altlast nach React)
- **Isolations-Aktionsleiste von imperativem DOM nach React portiert** (vollendet ADR 0004:
  „kein paralleles DOM-Chrome mehr"). `isolationView.js` baut keine `document.createElement`-Leiste
  mehr, sondern schreibt den Isolations-Zustand (`isolation: { model, actionBar }`) in den Store;
  die neue `IsolationBar.tsx` rendert die Leiste reaktiv. `InfoPanel` liest den Isolations-Status
  jetzt reaktiv aus dem Store statt über lokalen State — der „Isolieren"-Button aktualisiert sich
  auch, wenn die Isolation über die Leiste verlassen wird. Der custom-`actionBar`-Erweiterungspunkt
  (Muskelfinder-Deeplink „← Zurück zum Muskelfinder") bleibt unverändert nutzbar. Nebenbei behoben:
  `resetApp()` räumt die Isolation jetzt auf (vorher konnte die DOM-Leiste nach Reset hängen bleiben).

### Added (3D-UX)
- **Röntgen-/Transparenz-Regler pro Layer** im StructureBrowser: jeder geladene & sichtbare
  Layer (Knochen, Muskeln …) bekommt einen kompakten Slider, um die ganze Gruppe stufenlos
  durchscheinen zu lassen (z. B. Muskeln auf 30 %, um Knochen darunter zu sehen). Neuer
  Store-State `groupOpacity` + Action `setGroupOpacity` (geklemmt 0–1); das bestehende, bis
  dato ungenutzte `appearance.setGroupOpacity()` persistiert jetzt in den Store und fordert ein
  Render an. `loadGroupByName` wendet gespeicherte Layer-Transparenz nach dem Laden erneut an
  (Konsistenz beim Neuladen); `resetApp()` setzt sie zurück.

### Removed (Aufräumen / Hygiene — tote Dateien, Lint, Docs)
- **15 nicht importierte tote CSS-Dateien gelöscht** (`base/*`, `components/animations.css`,
  `components/ui-elements.css`, `controls/{dropdowns,inputs,set-list,sidebar,sliders}.css`,
  `layout/{canvas,layout,responsive,splashscreen}.css`, `utilities/utilities.css`) — einziger
  CSS-Einstieg ist `css/main.css`.
- **4 tote JS-Module gelöscht**: `js/core/lodManager.js`, `js/features/groups.js`,
  `js/features/groupToggle.js`, `js/bootstrap/initSplashScreen.js` (nirgends importiert).
- **Lint: 10 Fehler → 0** (`npm run lint` grün): leere `catch`-Blöcke kommentiert, ungenutzte
  `catch (error)`-Bindings entfernt, irreguläres Leerzeichen (U+202F) gefixt, tote Imports
  raus (`THREE` in selection/visibility, `setModelVisibility`, `modelPath`), tote Funktion
  `updateDynamicProgress` entfernt.
- **`resourceManager`-Subsystem komplett entfernt**: `js/core/resourceManager.js` gelöscht
  (nutzte verbotenes `localStorage`, preloadete nicht existierende Dateien, war nie verdrahtet).
  In `modelLoader-core.js` die toten Helfer raus (Loader-Pool `getPooledLoader`, Material-Cache
  `getOrCreateMaterial`, das durch `updateModelColors`/`setupBasicLights` abgelöste
  `applyGroupColor`/`ensureMuscleLighting`) inkl. verwaister Konstanten; tote
  `features.resourceManager*`-Flags aus `config.ts`. **Lint damit komplett blank: 0 Fehler, 0 Warnungen.**
- **`docs/architecture.md`** auf den realen Ist-Stand gebracht (Schichten, Datei-Struktur,
  Store-/Aktions-Kommunikation, meta.json-Hinweis zu leeren region/system-Feldern).

### Changed (UI-Konsolidierung — Chrome vollständig in React, Hamburger entfernt)
- **DOM-Hamburger-Menü (`#menu-icon` → `#controls`) und DOM-Footer gelöscht** —
  `index.html` enthält nur noch Canvas + React-Mountpunkt. Siehe ADR 0004.
- **Neue React-Komponenten**:
  - `SettingsPanel.tsx` — Raum (Beleuchtung/Helligkeit/Farbe), Farben zurücksetzen,
    Preset-Bibliothek, Tastenkürzel; Zahnrad-Button („Optionen") in der Toolbar
  - `Footer.tsx` + `LicenseModal.tsx` — Lizenz/Attribution, Quellen, Datenschutz,
    Lernen-Link; löst die bisherige dreifache Rechtliches-Doppelung auf
- **Neue DOM-freie Feature-Module** (portierte 3D-/Daten-Logik, kein Reinvent):
  - `features/roomSettings.js` (aus `ui-room.js`) — `applyLighting`, `applyRoomColor`,
    `initRoomSettings`; in `startApp` statt `setupUI` aufgerufen
  - `features/presets.js` (aus `ui-presets.js`) — `loadPresetManifest`, `applyPreset`
- **`ui-reset.js` entkernt**: `resetColors` exportiert (für SettingsPanel), toter
  Light-Reset (`resetToDefaultView`) + DOM-Wiring (`setupResetUI`) entfernt
- **`photoMode.js` entkoppelt**: kein `hideControlsPanel`-Import mehr, totes
  `initPhotoMode` (Legacy-Button) entfernt; `enterPhotoMode` bleibt
- **Gelöschte Legacy-Module**: `ui-init.js`, `ui-controls.js`, `ui-room.js`,
  `ui-presets.js`, `license.js`, `licenseContent.js`
- **Tote CSS entfernt**: `components/presets.css`, `layout/footer.css`,
  `controls/buttons.css` gelöscht; `#menu-icon`/`#controls`/`#room-controls`-Regeln
  aus `layout/app.css`, `#btn-photo-mode` aus `photo-mode.css`, Preview-Selektoren
  in `panels.css` bereinigt; neue `components/settings-panel.css`. CSS-Bundle −~13 KB.
- Build: 110 → 106 Module; Typecheck sauber, 29 Tests grün

### Removed (startApp.js — toter Loading-Screen- & Render-Opt-Code)
- `LoadingScreenManager`-Klasse + Instanz + `startAppWithLoadingScreen`/
  `loadGroupWithIndicator`/`loadMultipleGroups` (nirgends aufgerufen)
- Render-Opt-Cluster (`RENDER_OPTIMIZATION`, `renderOptimizer`, `useOptimization`,
  `loadOptimizer`, `renderFrame`) — nie verdrahtet, Loop nutzt `renderer.render`
- verwaiste Imports + leerer `if`-Block; `startApp.js` jetzt lint-sauber

### Added (Modell-Pipeline — BodyParts3D-Neuaufbereitung, Vorbereitung)
- **`scripts/sort-new-models.mjs`**: sortiert 3.260 Roh-OBJ (`NEW MODELS/`) in Gruppen-Ordner
  (`NEW MODELS/sorted/<gruppe>/`), Zuordnung über meta.json (FMA/FJ) vor Ordnerlage; volle
  Dateinamen behalten. Reports: `_manifest.json`, `REVIEW.md` (766 heuristisch), `_conflicts.json`
  (129 im aktuellen App-Bestand fehlsortierte Modelle).
- **`scripts/blender/process-models.py`**: headless Aufbereitung Voxel-Remesh→Smooth→Decimate→
  1 Material→GLB-Export (Tiers `hifi`+`draco`). Verifizierter Transform `(x,z,−y)·0.001`,
  röhrenförmige Gruppen ohne Remesh, Voxelgröße relativ zur Objektgröße.
- **`scripts/draco-compress.mjs`** + devDep `@gltf-transform/cli`: Draco-Nachschritt für den
  `draco/`-Tier (Blender hier ohne Draco-Lib).
- **`scripts/blender/import_group.py`**: eine Gruppe zur Sichtprüfung in Blender laden.
- **Docs**: docs/tasks/model-pipeline-bp3d.md (Briefing),
  docs/tasks/blender-pipeline-runbook.md (Runbook).
- `.gitignore`: `NEW MODELS/` (Rohdaten, groß + CC BY-SA-Quelle).

### Removed (Phase 3h — Hamburger-Menü-Legacy & toter Code endgültig raus)
- **Tote UI-Dateien gelöscht** (zielten auf nicht mehr existierende DOM-Elemente):
  - `js/ui/ui-export.js` — `#btn-export-set`/`#input-import-set` gab es nicht mehr; der `.bluebody`-Export im `CollectionPanel` ersetzt es
  - `js/ui/ui-loading.js` — Ladefarbe-Picker zielte auf entferntes `#initial-loading-screen`
- **`js/ui/ui-reset.js` entkernt** (toter Code entfernt):
  - `resetAllButtonStates()` (manipulierte entfernte `#btn-load-*`-Buttons)
  - `resetGroupToggleStates()` (`resetGroupStates`-Event hatte keinen Listener)
  - `debugResetState()` (Debug-Logging + verbotenes `window.groupToggleLoadedGroups`-Global)
  - `syncToolbarLayerButtons()`-Aufruf (No-op) + `${groupName}-color`-DOM-Reset (Elemente entfernt)
  - veraltete „Anleitung"/App-Guide-Modal (verwies auf längst entfernte Menü-Buttons) — kommt als echtes Onboarding in Phase 5 wieder
  - ungenutzter Import `registerPickables`
- **`js/ui/toolbar.js`**: No-op-Exports `syncToolbarLayerButtons()` und `setupToolbar()` entfernt (kein Consumer)
- **`js/utils/anatomyLabels.js`**: totes `renderStructureLabel()` + `splitStructureLabel()` + `LATIN_SIDE_SUFFIX_PATTERN` entfernt (kein Aufrufer mehr)
- **Tote CSS entkernt**:
  - `css/components/panels.css`: 621 → 165 Zeilen (app-guide, `#info-panel`, `.mf-detail-*`, `#edit-controls`, `.edit-btn-*`, `.multi-select-*`, `#multi-edit-*` — alles aus gelöschtem DOM)
  - verwaiste Dateien gelöscht: `css/components/info-panel.css`, `css/controls/edit-controls.css`, `css/controls/controls-panel.css` (nirgends importiert)
  - `css/controls/buttons.css`: `#btn-app-guide`-Styles raus
  - `css/layout/responsive.css`: toter `#info-panel`-Mobile-Block raus
- **`js/ui/ui-init.js`**: `setupExportUI`/`setupLoadingUI` aus dem Setup-Chain entfernt
- **`index.html`**: leeres `#room-dropdown-content` entfernt
- Module: 112 → 110, Typecheck sauber, 29 Tests grün

### Changed (Phase 3g — Sammlung in React + Legacy-DOM-Aufräumen)
- **React `CollectionPanel`** (`js/ui/react/components/CollectionPanel.tsx`) ersetzt die DOM-basierte Sammlung:
  - Liest `collection` direkt aus dem Store (reaktiv) — behebt den Bug, dass hinzugefügte Strukturen nicht in der Liste erschienen
  - Gruppierte Liste mit Einzeln-Entfernen, Klick-zum-Fokussieren, Anzahl-Badge in der Toolbar
  - „Nur Sammlung anzeigen", „Leeren", „Export"/„Import" (`.bluebody` via `collectionManager`)
  - Toolbar-Button „Sammlung" (gegenseitig ausschließend mit „Strukturen")
- **`js/features/collectionView.js`** (neu) — DOM-freie Kernlogik: `showCollectionInScene()`, `clearCollectionAndRestore()`
- **Tote Legacy-DOM-Dateien gelöscht** (vollständig durch React ersetzt):
  - `js/interaction/infoPanel.js` → React `InfoPanel`
  - `js/interaction/editPanel.js` → React `InfoPanel`/`ModelActions`
  - `js/ui/submenu/` (7 Dateien) → React `StructureBrowser`
  - `js/ui/recentColors.js` → In-Memory-Farben im `InfoPanel` (kein localStorage)
  - `js/ui/ui-set.js` → React `CollectionPanel` + `collectionView.js`
  - `js/ui/ui-color.js` → Container `#color-controls` existierte nicht mehr (tot)
  - `js/utils/modelData.js` → einziger Consumer (`ui-set.js`) entfernt
- **`js/ui/ui-collection-export.js`** vom DOM entkoppelt: kein Auto-Init/Button-Injection mehr, `setupUI`/`createAndInsertButtons` entfernt; React ruft `showSaveModal()`/`importCollection()` direkt auf
- **Verkabelung gesäubert**: `startApp.js`, `core/controls.js`, `interaction/index.js`, `ui-init.js`, `ui-reset.js`, `ui-presets.js`, `muskelfinderDeeplink.js` — tote `hideInfoPanel`/`showInfoPanel`-Aufrufe und der `#info-panel`-`controls.change`-Listener entfernt (React reagiert auf Store)
- **Tote HTML/CSS entfernt**: `#submenu-container`, `#set-list`, `#btn-show-set`/`#btn-clear-set`; `set-list.css` gelöscht, `#btn-*-set`-Styles aus `buttons.css`, `#set-list`/`#submenu-container`-Regeln bereinigt
- Typecheck bereinigt: `Toolbar.tsx` useEffect-Cleanup gibt jetzt `void` zurück; `useStore.test.ts` THREE-Typ-Import ergänzt
- Module: 125 → 112 (Build)

### Added (Phase 4d-f — Ghost-Kontext, Labels/Pins, Touch)
- `js/features/ghostContext.js` — Ghost-Kontext-Modus: Kontext-Button im InfoPanel macht alle anderen Strukturen transparent (0.08), ausgewählte bleibt opak; zweiter Klick stellt Ausgangszustand wieder her
- `js/features/labels.js` — Struktur-Beschriftungen via `CSS2DRenderer`: lazy init, eigene rAF-Schleife solange aktiv, Labels-Button im Toolbar
- `css/components/labels.css` — `.structure-label` Glassmorphism-Stil für Pins
- `css/layout/canvas.css` — `touch-action: none` am Canvas (verhindert Browser-Scroll-Interferenz mit OrbitControls)
- `css/components/info-panel-react.css` — `.ip-btn--active` Stil für aktive Buttons

### Added (Phase 4c — Deep-Links + Hover-Tooltip)
- `js/integration/deeplink.js` — URL-Deep-Links:
  - `?s=femur` → Struktur laden, hervorheben, Kamera fokussieren (ID / Latein / Deutsch)
  - `?view=anterior` → Kameraansicht direkt beim Start setzen
  - URL wird bei jeder Auswahl automatisch per `history.replaceState` aktualisiert (teilbare Links)
- `js/interaction/hoverTooltip.js` — Strukturname als Tooltip bei Hover:
  - RAF-throttled `pointermove` → `pickAt` → `getStructureDisplayLabel`
  - Verschwindet bei `pointerleave` und `pointerdown`
- `css/components/tooltip.css` — `position: fixed` für korrekte Koordinaten

### Added (Phase 4a — Kamera-Fokus-Animation + Doppelklick-Isolierung)
- Klick auf Struktur → sanfter Kameraflug zur Struktur (`focusOnObject` → `animateCameraTo`, 600 ms Ease-In-Out)
- Suchauswahl → Kamera fliegt ebenfalls zur gefundenen Struktur
- Doppelklick auf Struktur → `enterIsolatedView` (Rest ausblenden)

### Added (Phase 3f — React Toolbar + Totes Code entfernt)
- `js/ui/react/components/Toolbar.tsx` — Toolbar vollständig in React:
  - Tool-Buttons (Auswählen / Mehrfach / Rechteck / Fokus) mit Expand-Toggle
  - Layer-Buttons (Knochen / Muskeln) mit reaktivem Ladezustand aus dem Store
  - Kamera-Richtungs-Panel (Ant / Post / Li / Re / Kran / Kaud) — immer sichtbar
  - Reset- und Foto-Buttons; renutzt bestehende `toolbar.css` Klassen
- `js/ui/toolbar.js` — auf reine JS-Logik reduziert (kein DOM mehr): 328 → 40 Zeilen
- `js/ui/photoMode.js` — `enterPhotoMode` jetzt exportiert
- `js/ui/ui-search.js` — gelöscht (durch React SearchBar ersetzt)
- `js/ui/ui-setupGroupLoadEvents.js` — gelöscht (btn-load-* Buttons entfernt)
- `js/bootstrap/startApp.js` — `placeExtrasIntoDropdown` entfernt

### Added (Phase 3d — MultiSelectPanel React + HTML-Cleanup)
- `js/ui/react/components/MultiSelectPanel.tsx` — React-Panel für Mehrfachauswahl:
  - Liest `multiSelected` Set direkt aus dem Zustand-Store (reaktiv)
  - Liste aller ausgewählten Modelle mit Einzeln-Entfernen-Button
  - Batch-Farb-Picker und Opazitäts-Slider für alle ausgewählten Modelle gleichzeitig
  - Gibt `null` zurück wenn die Auswahl leer ist (kein leeres DOM-Element)
- `css/components/info-panel-react.css`: `.msp-panel` und zugehörige Klassen ergänzt
- `js/ui/react/App.tsx`: `MultiSelectPanel` eingebunden
- **HTML-Cleanup** — ersetzte Elemente entfernt:
  - 14 `<div class="dropdown"><button id="btn-load-*">` Blöcke aus `#controls` entfernt (React `StructureBrowser` übernimmt)
  - `<div id="info-panel">` entfernt (React `InfoPanel` übernimmt)
- `js/interaction/index.js`: `refreshMultiPanel` ruft nicht mehr `showMultiSelectPanel` auf; React-Panel reagiert direkt auf Store
- `js/ui/ui-init.js`: `setupSearchUI`-Import und -Aufruf entfernt (React `SearchBar` übernimmt)

### Changed (Phase 3c — InfoPanel Actions + kein Doppel-Panel)
- `InfoPanel` erhält Aktions-Controls: Farb-Picker, Opazitäts-Slider, Ausblenden, Isolieren
- `interaction/index.js`: ruft bei Einzelauswahl nicht mehr `showInfoPanel` auf — React InfoPanel übernimmt vollständig; `showMultiSelectPanel` / `hideInfoPanel` bleiben für Mehrfachauswahl

### Added (Phase 3b — SearchBar + InfoPanel)
- `fuse.js` installiert für Fuzzy-Suche
- `js/ui/react/components/SearchBar.tsx` — floating Suche (Top-Center):
  - Fuse.js-Index über alle `metaById`-Einträge (Latein × 3, Deutsch × 2, Englisch × 1)
  - Tastaturnavigation (↑/↓/Enter) + `/`-Shortcut zum Fokussieren
  - Bei Auswahl: Gruppe laden → Modell suchen → `highlightModel` + `setSelection`
- `js/ui/react/components/InfoPanel.tsx` — React-Panel ersetzt DOM-basiertes `#info-panel` (Einzelauswahl):
  - Liest `selected.meta` aus dem Zustand-Store (reagiert auf Store-Änderungen)
  - Zeigt Latein/Deutsch-Label, Gruppen-Badge, Beschreibung
  - Für Muskeln: lädt Muskelfinder-Details async (Ursprung, Ansatz, Innervation, Funktion)
  - Slide-in-Animation; Swipe-down zum Schließen auf Mobile
- `interaction/index.js`: schreibt `meta` in den Store bei Einzelauswahl (war vorher null)
- `css/components/search-bar.css`, `css/components/info-panel-react.css` — Glassmorphism-Stil

### Added (Phase 3a — React Shell + StructureBrowser)
- React 19 + `@vitejs/plugin-react` installiert; Vite-Config und `tsconfig.json` (jsx: react-jsx) erweitert
- `<div id="ui-root">` Overlay-Mount in `index.html` (pointer-events: none am Root, Kinder schalten selektiv ein)
- `js/ui/react/main.tsx` — `mountReactUI()` Einstiegspunkt, aus `app.js` nach DOM-Ready aufgerufen
- `js/ui/react/useReactStore.ts` — Zustand Vanilla-Store via `useStore`-Hook an React gebunden
- `js/ui/react/groupLabels.ts` — Deutsche Labels + kanonische Sortierung für Anatomie-Gruppen
- `js/ui/react/App.tsx` — Root-Komponent (Shell für alle Panel-Komponenten)
- `js/ui/react/components/StructureBrowser.tsx` — erste React-Komponente: Gruppen laden/entladen, Sichtbarkeit, Farbindikator, Modell-Anzahl, `useTransition` für non-blocking Lade-Ops
- `css/components/structure-browser.css` — Glassmorphism-Stil passend zum bestehenden Design-System
- 6 neue Tests für `groupLabels` (Labels, Sortierung, Immutabilität)

### Changed (Phase 2c-4)
- Alle custom `window.*`-Globals eliminiert — keine globale Verschmutzung mehr
  - `window.requestRender` → neues Modul `js/core/renderScheduler.js` (Late-init-Singleton)
    - `startApp.js` registriert die echte Implementierung via `registerRequestRender()`
    - 8 Consumer-Dateien importieren `requestRender` direkt statt über `window`
  - `window.renderOptimizer` → `optimizerControls` als benannter Export aus `renderer.js`
  - `window.loadingScreenManager` → entfernt (war nie von App-Code gelesen)
  - `window.testToggle/testLoad/testUnload` → entfernt (Debug-Krücken, Funktionen weiter exportiert)
  - `window.testProgress/progressUtils` → entfernt (alle Funktionen bereits als ES-Module exportiert)

### Changed (Phase 2c-3)
- Alle verbleibenden 19 Consumer-Dateien von `state.js` auf Zustand-Store migriert
  - `js/interaction/`: boxSelect, highlightModel, multiSelect, index, infoPanel, isolationView, editPanel
  - `js/ui/`: toolbar, submenu/index, ui-color, ui-loading, ui-reset, ui-search, ui-export, ui-presets, ui-set, ui-collection-export
  - `js/utils/modelData.js`, `js/integration/muskelfinderDeeplink.js`
- `highlightModel.js` erhält modul-lokale Variable `_prev` (korrekte Reset-Logik da raycaster.js setSelection vor Callback ausführt)
- `infoPanel.js` importiert `clearHighlight()` aus highlightModel statt direkte State-Mutation
- `ui-loading.js` verwendet `getConfig()` statt veralteten defaultSettings
- `ui-reset.js` ersetzt alle dispatch-Calls durch direkte Store-Aktionen
- `state.js` gelöscht — Store vollständig auf Zustand migriert

## [0.1.0] — 2026-06-10

### Added
- ROADMAP.md: Phasenplan Phase 0–6 mit Zielgruppen-Fokus Physio/Ergo/Logopädie
- AGENT_WORKFLOW.md: Agenten-Arbeitsweise, Kreuz-Review-System, Task-Templates
- AGENTS.md: Kanonische Agenten-Regeln (CLAUDE.md → Symlink)
- docs/decisions/, docs/tasks/, .claude/rules/ Verzeichnisse angelegt
- docs/architecture.md: Architektur-Überblick (Platzhalter — wächst mit Phase 1/2)
- Erste ADRs: Stack-Wahl (0001), Zustand als Bridge (0002), BodyParts3D-Lizenz (0003)
