export type Point3 = [number, number, number]

export interface MuscleBoundaryEntry {
  links: string | null
  bauch_a: Point3
  bauch_b: Point3
  uebergang: number
  pruef_bbox_gltf: [Point3, Point3]
  zwischensehnen?: { mitte_m: number; halbe_breite_m: number; rand_m: number }[]
  sehnenfelder?: { mitte: Point3; radien: Point3; rand_rel: number }[]
}

export interface MuscleBoundaryData {
  muskeln: Record<string, MuscleBoundaryEntry>
}

const glatt = (x: number) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

// Unveränderte Blender-Referenzrechnung aus AUFTRAG_App_Sehnenfarbe.md.
export function bauchGewicht(p: Point3, e: MuscleBoundaryEntry, links = false) {
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
}

const indices = new WeakMap<MuscleBoundaryData, Map<string, { entry: MuscleBoundaryEntry; links: boolean }>>()

export function findMuscleBoundary(data: MuscleBoundaryData, filename: string) {
  let index = indices.get(data)
  if (!index) {
    index = new Map()
    for (const [file, entry] of Object.entries(data.muskeln)) {
      if (entry.links) index.set(entry.links, { entry, links: true })
    }
    // Ein Schlüssel (auch ein ausschließlich linkes Modell) gilt immer direkt.
    for (const [file, entry] of Object.entries(data.muskeln)) {
      index.set(file, { entry, links: false })
    }
    indices.set(data, index)
  }
  return index.get(filename)
}
