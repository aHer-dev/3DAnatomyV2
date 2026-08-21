import { describe, it, expect } from 'vitest'
import { chooseGhostMode, GHOST_MESH_BUDGET } from './ghostContext.js'

// Durchscheinen kostet einen Blend-Vorgang pro Schicht und Pixel. Oberhalb der
// Schwelle treten die anderen Strukturen deshalb gedaempft-opak zurueck.
describe('chooseGhostMode', () => {
  it('laesst kleine Szenen durchscheinen', () => {
    expect(chooseGhostMode(0)).toBe('translucent')
    expect(chooseGhostMode(GHOST_MESH_BUDGET)).toBe('translucent')
  })

  it('schaltet ueber der Schwelle auf gedaempft-opak', () => {
    expect(chooseGhostMode(GHOST_MESH_BUDGET + 1)).toBe('dimmed')
  })

  it('deckt die beiden realen Faelle ab', () => {
    // Isolation: Knochen + Zaehne + Knorpel sichtbar, Muskeln ausgeblendet.
    expect(chooseGhostMode(297)).toBe('translucent')
    // Alles sichtbar inklusive der 464 Muskeln.
    expect(chooseGhostMode(761)).toBe('dimmed')
  })
})
