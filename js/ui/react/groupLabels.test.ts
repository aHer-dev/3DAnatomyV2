import { describe, it, expect } from 'vitest'
import { getGroupLabel, sortGroups, GROUP_ORDER } from './groupLabels.js'

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
