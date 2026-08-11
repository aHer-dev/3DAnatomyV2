import { describe, it, expect } from 'vitest'
import { getGroupLabel, sortGroups, sortPanelGroups, GROUP_ORDER, PANEL_GROUP_ORDER } from './groupLabels.js'

describe('getGroupLabel', () => {
  it('returns German label for known groups', () => {
    expect(getGroupLabel('bones')).toBe('Knochen')
    expect(getGroupLabel('muscles')).toBe('Muskeln')
    expect(getGroupLabel('nerves')).toBe('Nerven')
  })

  it('capitalises unknown groups as fallback', () => {
    expect(getGroupLabel('fooBar')).toBe('FooBar')
    expect(getGroupLabel('unknown')).toBe('Unknown')
  })
})

describe('sortGroups', () => {
  it('orders known groups by canonical index', () => {
    const input = ['nerves', 'bones', 'muscles']
    const result = sortGroups(input)
    expect(result).toEqual(['bones', 'muscles', 'nerves'])
  })

  it('places unknown groups after known ones, alphabetically', () => {
    const result = sortGroups(['zzz', 'bones', 'aaa'])
    expect(result[0]).toBe('bones')
    expect(result.indexOf('aaa')).toBeLessThan(result.indexOf('zzz'))
  })

  it('handles all canonical groups in order', () => {
    const shuffled = [...GROUP_ORDER].reverse()
    expect(sortGroups(shuffled)).toEqual(GROUP_ORDER)
  })

  it('does not mutate the input', () => {
    const input = ['muscles', 'bones']
    sortGroups(input)
    expect(input).toEqual(['muscles', 'bones'])
  })
})

describe('sortPanelGroups', () => {
  it('stellt Muskeln und Bänder nach oben — die beiden Gruppen, die beim Start aus sind', () => {
    const result = sortPanelGroups(['bones', 'teeth', 'muscles', 'cartilage', 'ligaments'])
    expect(result).toEqual(['muscles', 'ligaments', 'bones', 'cartilage', 'teeth'])
  })

  it('weicht bewusst von der kanonischen Reihenfolge ab', () => {
    expect(sortGroups(['muscles', 'bones'])).toEqual(['bones', 'muscles'])
    expect(sortPanelGroups(['muscles', 'bones'])).toEqual(['muscles', 'bones'])
  })

  it('hängt unbekannte Gruppen hinten an, alphabetisch', () => {
    const result = sortPanelGroups(['zzz', 'bones', 'aaa', 'muscles'])
    expect(result.slice(0, 2)).toEqual(['muscles', 'bones'])
    expect(result.indexOf('aaa')).toBeLessThan(result.indexOf('zzz'))
  })

  it('führt alle Panel-Gruppen in ihrer Reihenfolge', () => {
    const shuffled = [...PANEL_GROUP_ORDER].reverse()
    expect(sortPanelGroups(shuffled)).toEqual(PANEL_GROUP_ORDER)
  })

  it('verändert die Eingabe nicht', () => {
    const input = ['bones', 'muscles']
    sortPanelGroups(input)
    expect(input).toEqual(['bones', 'muscles'])
  })
})
