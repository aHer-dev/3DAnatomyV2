import { describe, expect, it } from 'vitest'
import { isModelResponse, preferOriginalModel } from './modelSourcePolicy.js'

describe('original model and bundle source selection', () => {
  it('selects only the known invalid FJ801 bundle entry', () => {
    expect(preferOriginalModel('FJ801.glb')).toBe(true)
    expect(preferOriginalModel('FJ605.glb')).toBe(false)
    expect(preferOriginalModel('FJ1595.glb')).toBe(false)
  })
  it('falls back to individual files when a SPA returns HTML with HTTP 200', () => {
    expect(isModelResponse(new Response('<html>', { headers: { 'content-type': 'text/html; charset=utf-8' } }))).toBe(false)
    expect(isModelResponse(new Response(null, { status: 404 }))).toBe(false)
    expect(isModelResponse(new Response(null, { headers: { 'content-type': 'model/gltf-binary' } }))).toBe(true)
    expect(isModelResponse(new Response(null, { headers: { 'content-type': 'application/octet-stream' } }))).toBe(true)
  })
})
