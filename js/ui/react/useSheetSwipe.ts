// useSheetSwipe — Bottom-Sheets nach unten wegwischen (mobil, §13).
//
// Griff ist alles am Sheet AUSSER seinem scrollenden Körper und den
// Bedienelementen darin: dort gehört die vertikale Geste dem Inhalt bzw. dem
// Regler. Das Sheet folgt dem Finger und fährt beim Loslassen entweder zu Ende
// oder schnappt zurück — es springt nie erst auf die Ausgangslage zurück, um
// dann geschlossen zu werden.
//
// Die Entscheidung „schließen oder zurück" liegt als reine Funktion daneben
// (`shouldDismiss`), damit sie prüfbar ist, ohne Zeiger zu simulieren.
import { useEffect, useRef } from 'react'

const MOBILE_QUERY   = '(max-width: 768px)'
const START_SLOP     = 8     // px, bevor aus einem Tipper eine Geste wird
const CLOSE_DISTANCE = 96    // px Zugweg, ab dem Loslassen = Schließen bedeutet
const CLOSE_VELOCITY = 0.55  // px/ms — ein kurzer Schnipser reicht auch
const FLICK_MIN      = 24    // px, damit ein Zucken nicht als Schnipser zählt

// Geschlossene Lage aus responsive.css. Steht hier ausgeschrieben, weil der
// Zug von seiner Endposition dorthin weiterfahren soll statt zurückzuspringen.
const CLOSED_TRANSFORM = 'translateY(calc(100% + 40px))'

// Bedienelemente sind kein Griff, und der scrollende Körper behält seine
// vertikale Geste — sonst zöge man das Sheet weg, während man blättern will.
const CONTROLS   = 'input, textarea, select, button, a, [role="tab"], [role="slider"]'
const SCROLLERS  = '.shell-sidebar__body, .stp-body'

/** Zugweg (px, nach unten positiv) und Dauer (ms) → schließen? */
export function shouldDismiss(dy: number, dt: number): boolean {
  if (dy >= CLOSE_DISTANCE) return true
  return dt > 0 && dy > FLICK_MIN && dy / dt > CLOSE_VELOCITY
}

export function useSheetSwipe<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let startX = 0, startY = 0, startT = 0
    let armed = false     // Zeiger liegt auf einem gültigen Griff
    let dragging = false
    let cleanupTimer = 0

    const release = () => {
      armed = false
      dragging = false
      el.classList.remove('sheet-dragging')
    }

    const onDown = (e: PointerEvent) => {
      if (dragging || !window.matchMedia(MOBILE_QUERY).matches) return
      const target = e.target as HTMLElement | null
      if (!target || target.closest(CONTROLS) || target.closest(SCROLLERS)) return
      armed = true
      startX = e.clientX; startY = e.clientY; startT = e.timeStamp
    }

    const onMove = (e: PointerEvent) => {
      if (!armed) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (!dragging) {
        // Quer heißt: die Geste galt etwas anderem (etwa der Chip-Reihe).
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > START_SLOP) { armed = false; return }
        if (dy < START_SLOP) return
        dragging = true
        el.classList.add('sheet-dragging')
        el.setPointerCapture(e.pointerId)
      }
      // Nach oben gibt das Sheet nur gedämpft nach — dort hat es nichts zu zeigen.
      el.style.transform = `translateY(${dy > 0 ? dy : dy / 4}px)`
    }

    const onUp = (e: PointerEvent) => {
      if (!dragging) { armed = false; return }
      const dy = e.clientY - startY
      release()
      if (!shouldDismiss(dy, e.timeStamp - startT)) {
        el.style.transform = ''   // CSS-Kurve holt es zurück
        return
      }
      // Weiterfahren statt zurückschnappen: die Inline-Angabe deckt sich mit der
      // geschlossenen Lage aus dem CSS, das spätere Aufräumen ist deshalb
      // unsichtbar. (Die beiden anderen Sheets hängen sich ohnehin aus.)
      el.style.transform = CLOSED_TRANSFORM
      closeRef.current()
      cleanupTimer = window.setTimeout(() => { el.style.transform = '' }, 400)
    }

    const onCancel = () => { release(); el.style.transform = '' }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    return () => {
      window.clearTimeout(cleanupTimer)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
      onCancel()
    }
  }, [])

  return ref
}
