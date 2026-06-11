import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel } from '../groupLabels.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { getMuskelfinderDetailsForMeta } from '../../../integration/muskelfinderDetails.js'
import { setModelColor, setModelOpacity } from '../../../features/appearance.js'
import { setModelVisibility } from '../../../features/visibility.js'
import { enterIsolatedView } from '../../../interaction/isolationView.js'
import { enterGhostContext, isGhostContextActive } from '../../../features/ghostContext.js'
import { getStore } from '../../../store/useStore.js'
import { clearHighlight } from '../../../interaction/highlightModel.js'
import { requestRender } from '../../../core/renderScheduler.js'
import type { MetaEntry } from '../../../types/index.js'

interface MfSection {
  label: string
  items: { label: string; text: string }[]
}
interface MfDetails {
  sections: MfSection[]
}

function MuscleSections({ details }: { details: MfDetails }) {
  if (!details.sections.length) return null
  return (
    <details className="ip-details">
      <summary className="ip-details__summary">Details</summary>
      <div className="ip-details__body">
        {details.sections.map((sec, i) => (
          <section key={i} className="ip-details__section">
            <strong className="ip-details__section-title">{sec.label}</strong>
            {sec.items.map((item, j) => (
              <p key={j} className="ip-details__line">
                {item.label && <strong>{item.label}: </strong>}
                {item.text}
              </p>
            ))}
          </section>
        ))}
      </div>
    </details>
  )
}

function ModelActions({ model }: { model: NonNullable<ReturnType<typeof getStore>['selected']['root']> }) {
  const initialOpacity = useRef(1)

  // Read initial opacity from first mesh material
  useEffect(() => {
    model.traverse((child: any) => {
      if (child.isMesh && child.material && initialOpacity.current === 1) {
        initialOpacity.current = child.material.opacity ?? 1
      }
    })
  }, [model])

  const handleColor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setModelColor(model, e.target.value)
    requestRender()
  }, [model])

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setModelOpacity(model, v)
    requestRender()
  }, [model])

  const handleHide = useCallback(() => {
    setModelVisibility(model, false)
    requestRender()
  }, [model])

  const handleIsolate = useCallback(() => {
    enterIsolatedView(model)
  }, [model])

  const [ghostActive, setGhostActive] = useState(false)
  const handleGhost = useCallback(() => {
    enterGhostContext(model)
    setGhostActive(isGhostContextActive())
  }, [model])

  return (
    <div className="ip-actions">
      <label className="ip-action-row" title="Farbe ändern">
        <span>Farbe</span>
        <input type="color" className="ip-color-input" onChange={handleColor} aria-label="Modellfarbe" />
      </label>
      <label className="ip-action-row" title="Transparenz">
        <span>Opazität</span>
        <input
          type="range"
          className="ip-opacity-slider"
          min="0" max="1" step="0.01"
          defaultValue={String(initialOpacity.current)}
          onChange={handleOpacity}
          aria-label="Transparenz"
        />
      </label>
      <div className="ip-action-btns">
        <button className="ip-btn" onClick={handleHide}>Ausblenden</button>
        <button className="ip-btn" onClick={handleIsolate}>Isolieren</button>
        <button
          className={`ip-btn${ghostActive ? ' ip-btn--active' : ''}`}
          onClick={handleGhost}
          title="Kontext-Ansicht: Rest transparent"
        >
          Kontext
        </button>
      </div>
    </div>
  )
}

export function InfoPanel() {
  const selected = useReactStore(s => s.selected)
  const meta  = selected.meta  as MetaEntry | null
  const model = selected.root  as any | null

  const [mfDetails, setMfDetails] = useState<MfDetails | null>(null)

  useEffect(() => {
    setMfDetails(null)
    if (!meta || meta.classification?.group !== 'muscles') return
    let cancelled = false
    getMuskelfinderDetailsForMeta(meta).then((d: MfDetails | null) => {
      if (!cancelled) setMfDetails(d)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [meta])

  const close = useCallback(() => {
    clearHighlight()
    getStore().clearSelection()
  }, [])

  // Swipe-down to close on mobile
  const panelRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!meta || !panelRef.current) return
    let startY = 0
    const el = panelRef.current
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onEnd   = (e: TouchEvent) => { if (e.changedTouches[0].clientY - startY > 80) close() }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend',   onEnd,   { passive: true })
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  }, [meta, close])

  if (!meta) return null

  const displayLabel = getStructureDisplayLabel(meta)
  const deLabel      = meta.labels?.de
  const group        = meta.classification?.group ?? 'other'
  const description  = (meta.info?.description?.de || meta.info?.description?.en || '').trim()

  return (
    <aside
      ref={panelRef}
      className="ip-panel"
      role="dialog"
      aria-modal="false"
      aria-label={`Info: ${displayLabel}`}
    >
      <header className="ip-header">
        <div className="ip-title">
          <span className="ip-title__primary">{displayLabel}</span>
          {deLabel && deLabel !== displayLabel && (
            <span className="ip-title__secondary">{deLabel}</span>
          )}
          <span className="ip-title__group">{getGroupLabel(group)}</span>
        </div>
        <button className="ip-close" onClick={close} aria-label="Info-Panel schließen">✕</button>
      </header>

      <div className="ip-body">
        {description && <p className="ip-description">{description}</p>}
        {mfDetails && <MuscleSections details={mfDetails} />}
        {model && <ModelActions model={model} />}
      </div>
    </aside>
  )
}
