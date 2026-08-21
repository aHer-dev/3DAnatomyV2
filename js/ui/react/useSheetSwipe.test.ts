import { describe, it, expect } from 'vitest'
import { shouldDismiss } from './useSheetSwipe.js'

// Die Schwelle steht bei 96px Zugweg bzw. 0.55px/ms Schnipser-Tempo (ab 24px).
describe('shouldDismiss', () => {
  it('schließt bei langem Zug, egal wie langsam', () => {
    expect(shouldDismiss(96, 2000)).toBe(true)
    expect(shouldDismiss(300, 5000)).toBe(true)
  })

  it('schnappt bei kurzem, langsamem Zug zurück', () => {
    expect(shouldDismiss(95, 2000)).toBe(false)
    expect(shouldDismiss(40, 400)).toBe(false)
  })

  it('nimmt den schnellen Schnipser auch auf kurzem Weg', () => {
    expect(shouldDismiss(40, 50)).toBe(true)
  })

  it('wertet ein Zucken nicht als Schnipser', () => {
    // 20px in 1ms wäre rasend schnell, ist aber unter dem Mindestweg.
    expect(shouldDismiss(20, 1)).toBe(false)
  })

  it('ignoriert Züge nach oben', () => {
    expect(shouldDismiss(-120, 200)).toBe(false)
  })

  it('teilt nicht durch eine Dauer von null', () => {
    expect(shouldDismiss(50, 0)).toBe(false)
  })
})
