import { describe, it, expect } from 'vitest'
import { rankLabelTargets, MAX_LABELS } from './labelRanking.js'

const near = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ root: `s${i}`, d: (n - i) * 10 }))

// Beschriftet werden Auswahl/Isolation plus die kameranaechsten sichtbaren
// Strukturen — gedeckelt, weil CSS2D keine Verdeckung kennt und hunderte
// Kaesten uebereinander liegen wuerden.
describe('rankLabelTargets', () => {
  it('fuellt nach Naehe auf: der kleinste Abstand zuerst', () => {
    const picked = rankLabelTargets([], near(4), 10)
    expect(picked).toEqual(['s3', 's2', 's1', 's0'])
  })

  it('deckelt bei max', () => {
    expect(rankLabelTargets([], near(50)).length).toBe(MAX_LABELS)
  })

  it('nimmt Angeheftete mit, egal wie weit weg sie stehen', () => {
    const picked = rankLabelTargets(['weit-weg'], near(50))
    expect(picked[0]).toBe('weit-weg')
    expect(picked.length).toBe(MAX_LABELS)
  })

  it('laesst mehr Angeheftete als max nicht ueberlaufen', () => {
    const many = Array.from({ length: 20 }, (_, i) => `p${i}`)
    expect(rankLabelTargets(many, near(50)).length).toBe(MAX_LABELS)
  })

  it('kommt ohne Kandidaten aus', () => {
    expect(rankLabelTargets([], [])).toEqual([])
  })
})
