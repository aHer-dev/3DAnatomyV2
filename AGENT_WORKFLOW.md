# Anatomie Fokus 3D — Agenten-Workflow & Arbeitsumgebung

> Wie Claude Code und OpenAI Codex in diesem Projekt zusammenarbeiten — strukturiert, dokumentiert, getestet. Kein Agentenbrei, sondern ein Uhrwerk.
>
> Gilt für: Solo-Entwicklung, beide Agenten via OAuth (keine API), Stack laut `ROADMAP.md` (Vite + TS + React).

---

## 1. Grundprinzip

Drei Leitsätze, aus denen alles andere folgt:

1. **Eine Wahrheitsquelle.** Beide Agenten lesen dieselbe Datei. Was nicht dort steht, existiert für sie nicht.
2. **Du bist der Integrator, nicht der Tipper.** Die Agenten schreiben Code in Branches. Gemerged wird nur, was du im Diff geprüft hast. Nie direkt auf `main`.
3. **Ein Task, ein Branch, ein Agent, ein Owner.** Arbeit wird serialisiert, nicht parallel ins selbe Verzeichnis geworfen.

---

## 2. Die zwei eisernen Regeln gegen „Agentenbrei"

Alles in diesem Dokument dient diesen beiden Regeln. Wenn du nur zwei Dinge mitnimmst, dann diese:

### Regel 1 — Niemals zwei Agenten gleichzeitig auf denselben Dateien

Zwei Agenten, die parallel dieselben Module anfassen, erzeugen Konflikte, doppelte Logik und widersprüchliche Annahmen. Ein Task läuft von Anfang bis Ende durch **einen** Agenten. Erst wenn er gemerged (oder verworfen) ist, startet der nächste. Parallelität ist erlaubt — aber nur auf **strikt getrennten** Bereichen (z. B. Claude an `core/3d`, Codex an `ui/panels`), nie überlappend.

### Regel 2 — Eine Wahrheitsquelle für beide

Claude Code liest `CLAUDE.md`, Codex liest `AGENTS.md`. Wenn das zwei verschiedene Dateien mit driftenden Inhalten sind, arbeiten die Agenten aus unterschiedlichen Annahmen → Brei. **Lösung:** Eine physische Datei, zwei Namen (Symlink). Details in Abschnitt 3.

---

## 3. Herzstück: `AGENTS.md` als einzige Wahrheitsquelle

`AGENTS.md` ist der offene, herstellerneutrale Standard für Agenten-Instruktionen (verwaltet von der Agentic AI Foundation unter der Linux Foundation; von Codex, Cursor, Jules u. a. nativ gelesen). Wir machen ihn zur kanonischen Datei und hängen `CLAUDE.md` als Symlink dran.

```bash
# Im Repo-Root, einmalig (WSL/Linux — bei dir nativ vorhanden):
touch AGENTS.md
ln -s AGENTS.md CLAUDE.md
git add AGENTS.md CLAUDE.md
```

Ergebnis: Du pflegst **nur** `AGENTS.md`. Beide Agenten lesen garantiert identischen Text.

### Instruktions-Budget: kurz halten

Das ist keine Stilfrage, sondern Mechanik. Modelle befolgen zuverlässig nur eine begrenzte Zahl an Anweisungen; das System-Prompt des Agenten frisst davon schon einen Teil. Praktische Obergrenze für `AGENTS.md`: **80–120 Zeilen, hartes Maximum 150.** Jede Zeile darüber verwässert die Zeilen, die wirklich zählen.

Konsequenzen:
- **Keine Selbstverständlichkeiten** rein („schreib sauberen Code", „denk nach"). Das versucht der Agent ohnehin.
- **Nichts, was der Agent in einer Session selbst lernt** (Ordnerstruktur, offensichtliche Konventionen). Verschwendete Zeilen.
- **Nur projektspezifisches, nicht-offensichtliches Wissen**: Build-Befehle, die eine Regel pro Bereich, harte Verbote, Architektur-Grenzen.
- Detailwissen, das nicht ins Budget passt → ausgelagerte Doku unter `docs/`, in `AGENTS.md` nur **verlinkt**.

Ein fertiges, kompaktes Skelett für deine `AGENTS.md` steht in Abschnitt 13.

---

## 4. Repo-Struktur der Steuerdateien

```
/
├── AGENTS.md              # Kanonische Agenten-Regeln (≤150 Zeilen). Wahrheitsquelle.
├── CLAUDE.md              # → Symlink auf AGENTS.md. Nicht separat pflegen.
├── ROADMAP.md             # Phasenplan (Was & Wann). Strategie.
├── CHANGELOG.md           # Was wurde wann geändert. Pflegt der Agent mit.
├── docs/
│   ├── architecture.md    # Wie hängt alles zusammen (Store, 3D-Layer, UI-Layer)
│   ├── decisions/         # ADRs — eine Datei pro Architektur-Entscheidung
│   │   ├── 0001-vite-ts-react.md
│   │   ├── 0002-zustand-als-bridge.md
│   │   └── 0003-bodyparts3d-lizenz-cc-by-sa.md
│   └── tasks/             # Task-Briefings (siehe Abschnitt 7), Historie der Aufträge
└── .claude/
    └── rules/             # Optional: modulare Detail-Regeln, bei Bedarf referenziert
```

**Trennung der drei „Was"-Ebenen:**
- `ROADMAP.md` = *Was bauen wir und in welcher Reihenfolge* (Strategie, ändert sich selten)
- `AGENTS.md` = *Wie arbeiten die Agenten* (Regeln, ändert sich selten)
- `docs/tasks/*` = *Was ist jetzt konkret zu tun* (operativ, ständig neu)

Vermischst du diese drei, wird `AGENTS.md` zur Müllhalde und reißt das Budget. Halte sie getrennt.

---

## 5. Rollenverteilung: Claude Code ↔ Codex

Zwei Agenten sind kein Nachteil — wenn jeder eine klare Rolle hat. Der größte Hebel: **Wer den Code nicht geschrieben hat, reviewt ihn.** Ein zweites Modell hat andere blinde Flecken und fängt Fehler, die das erste übersieht.

### Standard-Aufteilung

| | **Claude Code** | **OpenAI Codex** |
|---|---|---|
| **Primärrolle** | Lead-Implementierung | Independent Review + fokussierte Tasks |
| **Stärke hier** | Große, kontextlastige Änderungen, mehrere Dateien, die TS-Migration, Refactors | Eng umrissene Aufgaben, Bug-Fixes, Security-Pass, Zweitmeinung |
| **Typischer Einsatz** | „Migriere `state.js` → Zustand-Store mit Typen" | „Review diesen Branch", „Fix diesen einen Bug", „Finde Sicherheitslücken im Loader" |

### Die feste Kreuz-Review-Regel

```
Claude Code implementiert Feature  →  Codex reviewt den Diff  →  du mergst
Codex implementiert Fix            →  Claude Code reviewt den Diff  →  du mergst
```

Das ist nicht optional, sondern der Kern, warum sich zwei Agenten lohnen. Der Reviewer bekommt einen klaren Auftrag (Abschnitt 7, Review-Template) und arbeitet **read-only** — er schlägt Änderungen vor, committet aber nicht in fremde Branches (Regel 1).

### Wer kriegt welchen Task?

- **Mehrere Dateien betroffen, Architektur-nah, viel Kontext nötig** → Claude Code baut, Codex reviewt.
- **Eine Datei, klar abgegrenzt, „mach genau X"** → entweder Agent; der andere reviewt.
- **Sicherheit, Abhängigkeiten, „ist das robust?"** → Codex als Reviewer ist hier dein zweites Augenpaar.

Diese Aufteilung ist ein Startpunkt, kein Gesetz. Wenn du merkst, dass einer der beiden bei einem Aufgabentyp konsistent besser ist, dreh die Rollen. Wichtig ist nur: pro Task ist die Rollenverteilung **vorher** festgelegt, nicht während der Arbeit ausgewürfelt.

---

## 6. Der Arbeitszyklus (das Uhrwerk)

Jeder Task läuft durch dieselben sieben Schritte. Immer gleich, keine Abkürzungen. Das ist es, was „wie ein Uhrwerk" konkret bedeutet.

```
1. DEFINIEREN   →  2. BRIEFEN   →  3. BRANCHEN   →  4. BAUEN
                                                      ↓
7. MERGEN  ←  6. REVIEWEN (anderer Agent)  ←  5. PRÜFEN (Tests grün)
```

| # | Schritt | Wer | Konkret |
|---|---|---|---|
| 1 | **Definieren** | Du | Task aus `ROADMAP.md` ableiten, in `docs/tasks/` als kurzes Briefing anlegen (Template Abschnitt 7) |
| 2 | **Briefen** | Du | Briefing + Verweis auf `AGENTS.md` an den zuständigen Agenten geben |
| 3 | **Branchen** | Agent | Neuer Branch `feat/struktur-browser`, nie auf `main` |
| 4 | **Bauen** | Agent | Implementieren **inkl. Tests** für Logik. Bei Architektur-Entscheidung: ADR in `docs/decisions/` |
| 5 | **Prüfen** | Agent + CI | `npm run lint && npm run test && npm run build` müssen grün sein, bevor der Agent „fertig" meldet |
| 6 | **Reviewen** | Der **andere** Agent | Diff-Review nach Review-Template. Findings zurück an dich |
| 7 | **Mergen** | Du | Diff selbst durchsehen, Findings bewerten, dann Merge. CI deployt automatisch |

**Warum die Reihenfolge zählt:** Schritt 5 vor 6 — kein Mensch und kein Reviewer-Agent soll Zeit mit Code verbrennen, den schon der Linter ablehnt. Schritt 6 vor 7 — du bist die letzte Instanz, nicht die einzige.

---

## 7. Task-Briefing (Template)

Ein Agent ohne klaren Auftrag improvisiert — und improvisierte Architektur ist die Quelle des Breis. Jeder Task kriegt ein kurzes Briefing. Ablage: `docs/tasks/JJJJ-MM-TT-kurzname.md`.

```markdown
# Task: <Titel>

## Ziel
<Ein bis zwei Sätze. Was soll danach funktionieren?>

## Kontext
- Branch: feat/<name>
- Betroffene Dateien/Module: <Liste — das setzt die Grenze für Regel 1>
- Relevante Doku: docs/architecture.md, ROADMAP.md Phase <n>

## Anforderungen
- [ ] <konkret, prüfbar>
- [ ] <konkret, prüfbar>

## Nicht-Ziele (explizit außerhalb dieses Tasks)
- <verhindert Scope-Creep>

## Definition of Done
- [ ] Tests für neue Logik vorhanden und grün
- [ ] lint + build grün
- [ ] Doku aktualisiert, falls Verhalten/Architektur sich ändert
- [ ] CHANGELOG-Eintrag
```

**Review-Briefing** (für den zweiten Agenten):

```markdown
# Review: feat/<name>

Prüfe den Diff dieses Branches. Du arbeitest READ-ONLY — schlage Änderungen vor,
committe NICHT in diesen Branch.

Achte auf:
- Korrektheit ggü. den Anforderungen im Task-Briefing
- Verstöße gegen AGENTS.md (Architektur-Grenzen, verbotene Patterns)
- Fehlende/oberflächliche Tests
- Sicherheit & Robustheit (Edge Cases, Fehlerbehandlung)
- Toten Code, Duplikate, verwaiste Imports

Gib das Ergebnis als Liste: [BLOCKER] / [SOLLTE] / [NICE-TO-HAVE].
```

Die `[BLOCKER]`-Markierung ist wichtig: Sie trennt „muss vor Merge weg" von „kann später".

---

## 8. Testung

Ohne Tests ist KI-Code ein Blindflug — der Agent kann eine API halluzinieren, die zur Laufzeit kracht, aber im Diff plausibel aussieht. Tests und der TS-Compiler sind dein automatisiertes Review.

**Prinzipien:**
- **Der Agent schreibt Tests mit.** Steht in der Definition of Done und kostet einen Satz im Briefing. Keine separaten Test-Sessions.
- **Testen, was bricht — nicht alles.** Lohnend: Store-Logik (State-Übergänge), Meta-Parsing, der Model-Loader, URL-/Deep-Link-Serialisierung. Three.js-Rendering und UI-Pixel werden **nicht** unit-getestet — dafür ist der visuelle Check im Browser da.
- **Werkzeug:** Vitest (kommt mit Vite, Phase 2 der Roadmap).
- **Gate, nicht Deko:** `npm run test` ist Teil von Schritt 5. Rot = nicht fertig, Punkt.

**Was wo geprüft wird:**

| Ebene | Werkzeug | Fängt |
|---|---|---|
| Typen | TypeScript (`strict`) | Halluzinierte APIs, falsche Signaturen — beim Build, nicht beim User |
| Logik | Vitest | Kaputte State-Übergänge, Parsing-Fehler |
| Stil/Smell | ESLint | Toten Code, unsichere Patterns, verwaiste Imports |
| Integration | Du, im Browser | Sieht's richtig aus, fühlt sich die Interaktion gut an |

---

## 9. Dokumentation

Doku, die nicht gepflegt wird, ist schlimmer als keine — sie lügt. Deshalb: wenig, aber lebendig, und vom Agenten mitgeführt.

### Architecture Decision Records (ADRs)
Eine kurze Datei pro nennenswerter Entscheidung in `docs/decisions/`. Hält fest **warum** etwas so ist — die teuerste Information, die sonst verloren geht und die ein frischer Agent (oder du in drei Monaten) sonst neu erraten muss.

```markdown
# ADR 0003: BodyParts3D-Lizenz ist CC BY-SA 2.1 Japan

## Status: akzeptiert · 2026-xx-xx

## Kontext
Lizenz der 3D-Modelle musste verifiziert werden (vorher fälschlich als CC BY 4.0 angegeben).

## Entscheidung
Korrekt ist CC BY-SA 2.1 Japan. Attribution Pflicht; ShareAlike greift bei
veränderten und weitergegebenen Modellen. Eigener Code bleibt davon unberührt.

## Konsequenzen
- Attributions-Text in der UI korrigiert.
- Modifizierte Modelle, falls weitergegeben, müssen CC BY-SA bleiben.
```

(Dieser ADR ist real fällig — die Lizenzkorrektur aus der vorigen Analyse gehört hier dokumentiert.)

### `docs/architecture.md`
Das mentale Modell des Projekts: Wie reden 3D-Layer, Store und UI-Layer miteinander? Wo ist die Grenze? Genau das, was ein Agent zu Beginn jeder Session braucht, um nicht quer zur Architektur zu bauen. `AGENTS.md` verlinkt darauf, statt es zu duplizieren.

### `CHANGELOG.md`
Ein Eintrag pro gemergetem Task (Definition of Done). Der Agent schreibt ihn beim Bauen. Format: [Keep a Changelog](https://keepachangelog.com).

---

## 10. Definition of Done — die Merge-Checkliste

Bevor *irgendetwas* nach `main` geht (du gehst das in Schritt 7 durch):

- [ ] Erfüllt alle Anforderungen aus dem Task-Briefing
- [ ] Keine offenen `[BLOCKER]` aus dem Review
- [ ] Tests für neue Logik vorhanden und grün
- [ ] `lint` + `build` grün (CI bestätigt)
- [ ] Keine toten/auskommentierten Blöcke, keine verwaisten Imports
- [ ] Doku/ADR aktualisiert, falls Architektur oder Verhalten sich änderte
- [ ] CHANGELOG-Eintrag vorhanden
- [ ] Du hast den Diff **selbst** gesehen — nicht nur dem Agenten geglaubt

---

## 11. Git & Commits

- **Branch pro Task:** `feat/`, `fix/`, `refactor/`, `docs/` + Kurzname. Z. B. `feat/fuzzy-suche`.
- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`. Maschinenlesbar, speist später automatisch den CHANGELOG.
- **PR an dich selbst:** Auch solo. Der GitHub-Diff-View ist dein Review-Werkzeug — übersichtlicher als der Agenten-Chat und die Stelle, an der du Schritt 7 machst.
- **`main` ist heilig:** Nie direkter Agenten-Commit auf `main`. CI deployt von `main` — kaputter Merge = kaputte Live-Seite.
- **Tag pro Phase:** Am Ende jeder Roadmap-Phase taggen (`v0.2-build-fundament`). Rettungsanker.

---

## 12. Anti-Patterns — was den Brei erzeugt

Explizit, damit es benennbar bleibt:

| Anti-Pattern | Warum es Brei erzeugt | Stattdessen |
|---|---|---|
| Zwei Agenten gleichzeitig auf denselben Dateien | Konflikte, doppelte Logik, widersprüchliche Annahmen | Regel 1: serialisieren |
| `CLAUDE.md` und `AGENTS.md` getrennt pflegen | Driftende Instruktionen → divergierende Agenten | Symlink (Abschnitt 3) |
| „Bau mir mal die ganze App neu" | Agent improvisiert Architektur über Hunderte Zeilen | Kleine, gebriefte Tasks (Abschnitt 7) |
| `AGENTS.md` mit allem vollstopfen | Budget reißt, wichtige Regeln werden ignoriert | ≤150 Zeilen, Rest nach `docs/` |
| Direkt auf `main` generieren lassen | Kein Review, kaputter Deploy | Branch + PR + Diff |
| Code ohne Tests mergen | Halluzinierte APIs krachen erst beim User | Tests in Definition of Done |
| Agent ohne Kontext starten | Errät Konventionen neu, baut quer zur Architektur | `AGENTS.md` + `docs/architecture.md` werden automatisch/verlinkt gelesen |
| Derselbe Agent baut und reviewt | Gleiche blinde Flecken, Fehler bleiben drin | Kreuz-Review (Abschnitt 5) |

---

## 13. Konkretes Setup — jetzt

Reihenfolge zum Aufsetzen (passt vor Phase 1 der Roadmap):

```bash
# 1. Steuerdateien anlegen
touch AGENTS.md CHANGELOG.md
ln -s AGENTS.md CLAUDE.md
mkdir -p docs/decisions docs/tasks .claude/rules

# 2. AGENTS.md mit dem Skelett unten füllen (≤150 Zeilen halten)
# 3. Erste ADRs schreiben: Stack-Wahl + Lizenz-Korrektur
# 4. architecture.md anlegen (auch knapp — wächst mit)
# 5. Alles committen
git add -A && git commit -m "chore: agenten-workflow & steuerdateien aufgesetzt"
```

### Start-Skelett für `AGENTS.md`

Kompakt, projektspezifisch, im Budget. Anpassen sobald der Stack steht (Phase 1/2):

```markdown
# Anatomie Fokus 3D — Agenten-Regeln

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
```

---

## 14. Zusammengefasst — der Takt

1. Task aus der Roadmap → Briefing in `docs/tasks/`
2. Zuständigen Agenten briefen (Verweis auf `AGENTS.md`)
3. Agent baut im Branch, **mit Tests**
4. lint + test + build grün
5. **Anderer** Agent reviewt den Diff
6. Du prüfst den Diff, mergst → CI deployt
7. CHANGELOG & ggf. ADR sind aktuell

Solange dieser Takt eingehalten wird und beide Agenten aus *einer* `AGENTS.md` arbeiten, kann es keinen Brei geben — strukturell nicht.
