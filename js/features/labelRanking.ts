// js/features/labelRanking.ts
// Welche Strukturen ein Label bekommen — die Regel allein, ohne Szene.
//
// Liegt getrennt von labels.js, weil dieses Modul three, Kamera und Szene
// hochzieht (und damit `window`). Die Regel selbst ist reine Rechnung und
// gehoert prueffbar, nicht in einen Renderer eingebacken.

/** So viele Beschriftungen bleiben auf einem Handy-Bildschirm lesbar. */
export const MAX_LABELS = 12

export interface LabelCandidate<T> {
  root: T
  /** Quadrierter Abstand zur Kamera — Wurzel ziehen lohnt zum Sortieren nicht. */
  d: number
}

/**
 * Angeheftete zuerst (Auswahl/Isolation — sie sind der Grund, warum jemand
 * gerade hinschaut, egal wie weit weg sie stehen), dann nach Kameranaehe
 * auffuellen bis `max`.
 *
 * Der Deckel ist keine Bequemlichkeit: CSS2D kennt keine Verdeckung, jedes
 * Label liegt ueber dem Modell. Ohne Grenze sind das in der Isolation rund 297
 * Kaesten uebereinander.
 */
export function rankLabelTargets<T>(
  pinned: readonly T[],
  scored: readonly LabelCandidate<T>[],
  max: number = MAX_LABELS
): T[] {
  const picked = pinned.slice(0, max)
  for (const { root } of [...scored].sort((a, b) => a.d - b.d)) {
    if (picked.length >= max) break
    picked.push(root)
  }
  return picked
}
