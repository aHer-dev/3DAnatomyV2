import { dataPath } from '../core/path.js'
import type { MuscleBoundaryData, Point3 } from './muscleBoundary.js'

function invalid(path: string, reason: string): never {
  throw new Error(`Ungültige Muskelgrenzen-Datei: ${path} ${reason}`)
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    invalid(path, 'muss ein Objekt sein.')
  }
  return value as Record<string, unknown>
}

function finite(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    invalid(path, 'muss eine endliche Zahl sein.')
  }
  return value
}

function positive(value: unknown, path: string): number {
  const number = finite(value, path)
  if (number <= 0) invalid(path, 'muss größer als 0 sein.')
  return number
}

function point(value: unknown, path: string): Point3 {
  if (!Array.isArray(value) || value.length !== 3) {
    invalid(path, 'muss genau drei endliche Koordinaten enthalten.')
  }
  for (let axis = 0; axis < 3; axis++) finite(value[axis], `${path}[${axis}]`)
  return value as Point3
}

/** Validate calculation denominators and file-coordinate references; human fields stay intact. */
export function parseMuscleBoundaryData(value: unknown): MuscleBoundaryData {
  const document = record(value, 'Dokument')
  const entries = record(document.muskeln, 'muskeln')
  for (const [filename, value] of Object.entries(entries)) {
    const path = `muskeln[${filename}]`
    const entry = record(value, path)
    const a = point(entry.bauch_a, `${path}.bauch_a`)
    const b = point(entry.bauch_b, `${path}.bauch_b`)
    const length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    if (!Number.isFinite(length) || length <= 0) {
      invalid(`${path}.bauch_a / bauch_b`, 'müssen eine endliche Bauchachse mit Länge größer als 0 bilden.')
    }
    positive(entry.uebergang, `${path}.uebergang`)
    if (entry.links !== null && (typeof entry.links !== 'string' || entry.links.length === 0)) {
      invalid(`${path}.links`, 'muss null oder ein nicht leerer Dateiname sein.')
    }
    const box = entry.pruef_bbox_gltf
    if (!Array.isArray(box) || box.length !== 2) {
      invalid(`${path}.pruef_bbox_gltf`, 'muss zwei Eckpunkte enthalten.')
    }
    const min = point(box[0], `${path}.pruef_bbox_gltf[0]`)
    const max = point(box[1], `${path}.pruef_bbox_gltf[1]`)
    for (let axis = 0; axis < 3; axis++) {
      if (min[axis] > max[axis]) invalid(`${path}.pruef_bbox_gltf`, `Minimum ist auf Achse ${axis} größer als Maximum.`)
    }
    if (entry.zwischensehnen !== undefined) {
      if (!Array.isArray(entry.zwischensehnen)) invalid(`${path}.zwischensehnen`, 'muss eine Liste sein.')
      entry.zwischensehnen.forEach((value: unknown, index: number) => {
        const stripPath = `${path}.zwischensehnen[${index}]`
        const strip = record(value, stripPath)
        finite(strip.mitte_m, `${stripPath}.mitte_m`)
        if (finite(strip.halbe_breite_m, `${stripPath}.halbe_breite_m`) < 0) {
          invalid(`${stripPath}.halbe_breite_m`, 'darf nicht negativ sein.')
        }
        positive(strip.rand_m, `${stripPath}.rand_m`)
      })
    }
    if (entry.sehnenfelder !== undefined) {
      if (!Array.isArray(entry.sehnenfelder)) invalid(`${path}.sehnenfelder`, 'muss eine Liste sein.')
      entry.sehnenfelder.forEach((value: unknown, index: number) => {
        const fieldPath = `${path}.sehnenfelder[${index}]`
        const field = record(value, fieldPath)
        point(field.mitte, `${fieldPath}.mitte`)
        const radii = point(field.radien, `${fieldPath}.radien`)
        radii.forEach((radius, axis) => positive(radius, `${fieldPath}.radien[${axis}]`))
        positive(field.rand_rel, `${fieldPath}.rand_rel`)
      })
    }
  }
  // Every required field above was checked without modifying the source document.
  return document as unknown as MuscleBoundaryData
}

let pending: Promise<MuscleBoundaryData> | undefined

export function loadMuscleBoundaryData(): Promise<MuscleBoundaryData> {
  pending ??= fetch(dataPath('muskelgrenzen.json')).then(async response => {
    if (!response.ok) throw new Error(`Muskelgrenzen laden fehlgeschlagen: HTTP ${response.status}`)
    const data: unknown = await response.json()
    return parseMuscleBoundaryData(data)
  })
  return pending
}
