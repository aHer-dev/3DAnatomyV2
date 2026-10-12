import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseMuscleBoundaryData } from './muscleBoundaryData'

function validEntry(): Record<string, unknown> {
  return {
    links: null,
    bauch_a: [0, 0, 0],
    bauch_b: [0, 1, 0],
    uebergang: 0.01,
    pruef_bbox_gltf: [[0, 0, 0], [1, 1, 1]],
  }
}

function document(entry = validEntry()) {
  return { muskeln: { 'example.glb': entry } }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('runtime muscle boundary validation', () => {
  it('accepts all 247 current entries and preserves the human-readable fields', () => {
    const source: unknown = JSON.parse(readFileSync(
      resolve(import.meta.dirname, '../../public/data/muskelgrenzen.json'), 'utf8',
    ))
    const parsed = parseMuscleBoundaryData(source)
    expect(Object.keys(parsed.muskeln)).toHaveLength(247)
    expect(parsed).toEqual(source)
    expect(parseMuscleBoundaryData({ ...document(), note: 'human metadata', another: [1, 2] }))
      .toEqual({ ...document(), note: 'human metadata', another: [1, 2] })
  })

  it('rejects invalid documents and missing or non-object entries with a descriptive field path', () => {
    for (const source of [null, [], {}, { muskeln: null }, { muskeln: [] }, { muskeln: 'wrong' }]) {
      expect(() => parseMuscleBoundaryData(source)).toThrow(/Ungültige Muskelgrenzen-Datei/)
    }
    for (const entry of [null, [], 123]) {
      expect(() => parseMuscleBoundaryData({ muskeln: { 'example.glb': entry } }))
        .toThrow(/muskeln.*example\.glb/)
    }
  })

  it('requires three finite components for each belly endpoint', () => {
    for (const field of ['bauch_a', 'bauch_b']) {
      for (const value of [undefined, [0, 1], [0, 1, 2, 3], [0, NaN, 0], [0, Infinity, 0], [0, '1', 0]]) {
        expect(() => parseMuscleBoundaryData(document({ ...validEntry(), [field]: value })))
          .toThrow(new RegExp(field))
      }
    }
  })

  it('rejects zero-length axes and nonpositive or nonfinite transition denominators', () => {
    expect(() => parseMuscleBoundaryData(document({ ...validEntry(), bauch_b: [0, 0, 0] })))
      .toThrow(/bauch_a.*bauch_b|Bauchachse/)
    for (const uebergang of [undefined, 0, -0.01, NaN, Infinity, '0.01']) {
      expect(() => parseMuscleBoundaryData(document({ ...validEntry(), uebergang })))
        .toThrow(/uebergang/)
    }
  })

  it('requires an ordered finite two-corner reference bounding box', () => {
    for (const pruef_bbox_gltf of [
      undefined, [], [[0, 0, 0]], [[0, 0], [1, 1, 1]],
      [[0, 0, 0], [1, 1, NaN]], [[0, 2, 0], [1, 1, 1]],
    ]) {
      expect(() => parseMuscleBoundaryData(document({ ...validEntry(), pruef_bbox_gltf })))
        .toThrow(/pruef_bbox_gltf/)
    }
  })

  it('accepts explicit left filenames and null, and rejects missing or invalid left references', () => {
    expect(parseMuscleBoundaryData(document({ ...validEntry(), links: 'unusual-left.glb' }))
      .muskeln['example.glb'].links).toBe('unusual-left.glb')
    expect(parseMuscleBoundaryData(document()).muskeln['example.glb'].links).toBeNull()
    for (const links of [undefined, false, 12, {}, '']) {
      expect(() => parseMuscleBoundaryData(document({ ...validEntry(), links }))).toThrow(/links/)
    }
  })

  it('validates optional transverse tendon widths and their positive smoothing denominator', () => {
    const strip = { mitte_m: 0.5, halbe_breite_m: 0, rand_m: 0.01 }
    expect(() => parseMuscleBoundaryData(document({ ...validEntry(), zwischensehnen: [strip] })))
      .not.toThrow()
    for (const zwischensehnen of [
      {}, [null], [{ ...strip, mitte_m: NaN }], [{ ...strip, halbe_breite_m: -0.01 }],
      [{ ...strip, rand_m: 0 }], [{ ...strip, rand_m: Infinity }],
    ]) {
      expect(() => parseMuscleBoundaryData(document({ ...validEntry(), zwischensehnen })))
        .toThrow(/zwischensehnen/)
    }
  })

  it('validates optional ellipsoid centers and positive radii and transition denominators', () => {
    const field = { mitte: [0, 0.5, 0], radien: [0.1, 0.2, 0.1], rand_rel: 0.1 }
    expect(() => parseMuscleBoundaryData(document({ ...validEntry(), sehnenfelder: [field] })))
      .not.toThrow()
    for (const sehnenfelder of [
      {}, [null], [{ ...field, mitte: [0, 0] }], [{ ...field, radien: [0.1, 0, 0.1] }],
      [{ ...field, radien: [0.1, -0.1, 0.1] }], [{ ...field, rand_rel: 0 }],
      [{ ...field, rand_rel: Infinity }],
    ]) {
      expect(() => parseMuscleBoundaryData(document({ ...validEntry(), sehnenfelder })))
        .toThrow(/sehnenfelder/)
    }
  })

  it('shares one successful fetch and its validated data across concurrent callers', async () => {
    vi.resetModules()
    const source = document()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => source })
    vi.stubGlobal('fetch', fetchMock)
    const { loadMuscleBoundaryData } = await import('./muscleBoundaryData')
    const first = loadMuscleBoundaryData()
    const second = loadMuscleBoundaryData()
    expect(first).toBe(second)
    expect(await first).toEqual(source)
    expect(await loadMuscleBoundaryData()).toEqual(source)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toMatch(/data\/muskelgrenzen\.json$/)
  })

  it('rejects HTTP failures and malformed fetched data instead of returning fallback measurements', async () => {
    vi.resetModules()
    const failedFetch = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    vi.stubGlobal('fetch', failedFetch)
    const failedLoader = await import('./muscleBoundaryData')
    await expect(failedLoader.loadMuscleBoundaryData()).rejects.toThrow(/HTTP 503/)
    expect(failedFetch).toHaveBeenCalledTimes(1)
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => document({ ...validEntry(), uebergang: 0 }),
    }))
    const malformedLoader = await import('./muscleBoundaryData')
    await expect(malformedLoader.loadMuscleBoundaryData()).rejects.toThrow(/uebergang/)
  })
})
