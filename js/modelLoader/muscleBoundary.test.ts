import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  bauchGewicht,
  findMuscleBoundary,
  type MuscleBoundaryData,
  type MuscleBoundaryEntry,
  type Point3,
} from './muscleBoundary'

const straight: MuscleBoundaryEntry = {
  links: 'left.glb',
  bauch_a: [0, 0, 0],
  bauch_b: [0, 1, 0],
  uebergang: 0.1,
  pruef_bbox_gltf: [[0, 0, 0], [1, 1, 1]],
}

// Pinned external specification: exactly the JavaScript reference in the
// teacher's AUFTRAG_App_Sehnenfarbe.md (12.10.2026), independent of app code.
const assignmentReference = new Function('p', 'e', 'links', `
const glatt = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const s = links ? -1 : 1;
const a = [s * e.bauch_a[0], e.bauch_a[1], e.bauch_a[2]];
const b = [s * e.bauch_b[0], e.bauch_b[1], e.bauch_b[2]];
const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
const L = Math.hypot(d[0], d[1], d[2]);
const u = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1] + (p[2] - a[2]) * d[2]) / L;
const k = e.uebergang;
let w = glatt((u + k) / (2 * k)) - glatt((u - (L - k)) / (2 * k));
w = Math.min(1, Math.max(0, w));
for (const z of e.zwischensehnen ?? []) {
  w *= glatt((Math.abs(u - z.mitte_m) - z.halbe_breite_m) / (2 * z.rand_m) + 0.5);
}
for (const f of e.sehnenfelder ?? []) {
  const m = [s * f.mitte[0], f.mitte[1], f.mitte[2]];
  const q = Math.hypot((p[0] - m[0]) / f.radien[0], (p[1] - m[1]) / f.radien[1], (p[2] - m[2]) / f.radien[2]);
  w *= glatt((q - 1) / (2 * f.rand_rel) + 0.5);
}
return w;
`) as (p: Point3, entry: MuscleBoundaryEntry, links: boolean) => number

describe('teacher-verified muscle belly weights', () => {
  it.each([
    [-0.1, 0],
    [0, 0.5],
    [0.1, 1],
    [0.5, 1],
    [0.9, 1],
    [1, 0.5],
    [1.1, 0],
  ])('has the prescribed end transition at y=%s', (y, weight) => {
    expect(bauchGewicht([0, y, 0], straight)).toBeCloseTo(weight, 12)
  })

  it('applies transverse tendons inside the belly', () => {
    const entry: MuscleBoundaryEntry = {
      ...straight,
      zwischensehnen: [{ mitte_m: 0.5, halbe_breite_m: 0.1, rand_m: 0.05 }],
    }
    expect(bauchGewicht([0, 0.5, 0], entry)).toBe(0)
    expect(bauchGewicht([0, 0.6, 0], entry)).toBeCloseTo(0.5, 12)
    expect(bauchGewicht([0, 0.4, 0], entry)).toBeCloseTo(0.5, 12)
    expect(bauchGewicht([0, 0.65, 0], entry)).toBeCloseTo(1, 12)
  })

  it('applies ellipsoid tendon plates and mirrors their center with the belly axis', () => {
    const entry: MuscleBoundaryEntry = {
      ...straight,
      bauch_a: [0.2, 0, 0],
      bauch_b: [0.2, 1, 0],
      sehnenfelder: [{ mitte: [0.2, 0.5, 0], radien: [0.1, 0.2, 0.1], rand_rel: 0.1 }],
    }
    expect(bauchGewicht([0.2, 0.5, 0], entry)).toBe(0)
    expect(bauchGewicht([0.3, 0.5, 0], entry)).toBeCloseTo(0.5, 12)
    expect(bauchGewicht([0.4, 0.5, 0], entry)).toBe(1)
    expect(bauchGewicht([-0.2, 0.5, 0], entry, true)).toBe(0)
    expect(bauchGewicht([-0.3, 0.5, 0], entry, true)).toBeCloseTo(0.5, 12)
    expect(bauchGewicht([-0.4, 0.5, 0], entry, true)).toBe(1)
  })

  it('matches the pinned assignment formula for every current entry and both sides', () => {
    const data = JSON.parse(readFileSync(
      resolve(import.meta.dirname, '../../public/data/muskelgrenzen.json'), 'utf8',
    )) as MuscleBoundaryData
    let seed = 247
    const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (const [filename, entry] of Object.entries(data.muskeln)) {
      const points: Point3[] = [entry.bauch_a, entry.bauch_b, ...entry.pruef_bbox_gltf]
      for (let sample = 0; sample < 12; sample++) {
        points.push(entry.pruef_bbox_gltf[0].map((min, axis) => {
          const max = entry.pruef_bbox_gltf[1][axis]
          return min + (max - min) * random()
        }) as Point3)
      }
      for (const links of [false, true]) for (const point of points) {
        const weight = bauchGewicht(point, entry, links)
        expect(weight, `${filename}: finite belly weight`).toBeGreaterThanOrEqual(0)
        expect(weight, `${filename}: finite belly weight`).toBeLessThanOrEqual(1)
        expect(weight, `${filename}: exact external formula`).toBe(assignmentReference(point, entry, links))
      }
    }
  })
})

describe('filename and explicit left-model association', () => {
  it('uses the explicit left filename even when its suffix differs from M', () => {
    const data: MuscleBoundaryData = {
      muskeln: { 'right.glb': { ...straight, links: 'FJ_other.glb' } },
    }
    expect(findMuscleBoundary(data, 'right.glb')).toEqual({ entry: data.muskeln['right.glb'], links: false })
    expect(findMuscleBoundary(data, 'FJ_other.glb')).toEqual({ entry: data.muskeln['right.glb'], links: true })
    expect(findMuscleBoundary(data, 'rightM.glb')).toBeUndefined()
  })

  it('treats null links and explicitly keyed left-only files directly', () => {
    const data: MuscleBoundaryData = {
      muskeln: {
        'unpaired.glb': { ...straight, links: null },
        'FJ_leftOnly.glb': { ...straight, links: null },
      },
    }
    expect(findMuscleBoundary(data, 'unpaired.glb')?.links).toBe(false)
    expect(findMuscleBoundary(data, 'FJ_leftOnly.glb')?.links).toBe(false)
    expect(findMuscleBoundary(data, 'unpairedM.glb')).toBeUndefined()
  })

  it('gives a direct key precedence over another entry referencing it as left', () => {
    const data: MuscleBoundaryData = {
      muskeln: {
        'right.glb': { ...straight, links: 'left.glb' },
        'left.glb': { ...straight, links: null, uebergang: 0.02 },
      },
    }
    expect(findMuscleBoundary(data, 'left.glb')).toEqual({ entry: data.muskeln['left.glb'], links: false })
  })

  it('keeps same-FMA files separate by filename and returns no entry for unmeasured muscles', () => {
    const first: MuscleBoundaryEntry = { ...straight, links: null }
    const second: MuscleBoundaryEntry = { ...straight, links: null, uebergang: 0.03 }
    const data: MuscleBoundaryData = { muskeln: { 'first.glb': first, 'second.glb': second } }
    expect(findMuscleBoundary(data, 'first.glb')?.entry).toBe(first)
    expect(findMuscleBoundary(data, 'second.glb')?.entry).toBe(second)
    expect(findMuscleBoundary(data, 'unknown.glb')).toBeUndefined()
  })
})
