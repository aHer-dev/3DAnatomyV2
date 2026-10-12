// Bestehendes Bundle hat bei FJ801 zwei Dreiecke verloren (BBox +1,312 mm).
// Ausschließlich das geprüfte Original verwenden; keine GLB neu exportieren.
export function preferOriginalModel(filename: string): boolean {
  return filename === 'FJ801.glb'
}

/** Static SPA hosts may answer a missing bundle with index.html and HTTP 200. */
export function isModelResponse(response: Pick<Response, 'ok' | 'headers'>): boolean {
  return response.ok && !(response.headers.get('content-type') ?? '').toLowerCase().includes('text/html')
}
