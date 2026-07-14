# Anatomie Fokus 3D — Lokal starten

## Voraussetzungen

- **Node.js** Version 18 oder neuer → [nodejs.org](https://nodejs.org) (LTS herunterladen)
- **npm** kommt automatisch mit Node.js mit

Prüfen ob beides installiert ist:
```
node --version
npm --version
```

---

## Einmalig: Abhängigkeiten installieren

Im Projektordner (`3DAnatomy 2.0/`) einmal ausführen:

```
npm install
```

Das lädt alle Pakete (Three.js, React, Vite usw.) in den `node_modules/`-Ordner.
Dauert beim ersten Mal 1–2 Minuten.

---

## Dev-Server starten

```
npm run dev
```

Danach im Browser öffnen: **http://localhost:5173**

Der Server läuft solange das Terminal offen ist. Mit `Strg + C` stoppen.

> **Wichtig:** Nicht über Live Server (Port 5500) öffnen — das funktioniert nicht mit TypeScript/JSX.
> Immer `localhost:5173` benutzen.

---

## Weitere Befehle

| Befehl | Was er macht |
|---|---|
| `npm run dev` | Dev-Server mit Hot-Reload starten |
| `npm run build` | Produktions-Build erstellen (Ausgabe: `dist/`) |
| `npm run preview` | Den fertigen Build lokal testen (nach `build`) |
| `npm run test` | Alle Tests ausführen |
| `npm run typecheck` | TypeScript-Fehler prüfen ohne Build |

---

## Fehlerbehebung

**`npm install` schlägt fehl**
→ Node.js-Version prüfen: muss 18+ sein (`node --version`)

**Port 5173 ist belegt**
→ Vite nimmt automatisch den nächsten freien Port (5174, 5175 …), steht im Terminal

**Seite lädt, aber 3D-Modelle erscheinen nicht**
→ Normales Verhalten beim ersten Laden — die Modelle müssen erst über den Struktur-Browser (links) geladen werden

**Weißer Bildschirm / Konsolenfehler**
→ Sicherstellen dass `npm install` durchgelaufen ist und keine Fehler hatte
→ Browser-Konsole öffnen (F12) und Fehler nachschauen
