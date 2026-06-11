import React, { useEffect, useState, useCallback } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel } from '../groupLabels.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { getMuskelfinderDetailsForMeta } from '../../../integration/muskelfinderDetails.js'
import { getStore } from '../../../store/useStore.js'
import { clearHighlight } from '../../../interaction/highlightModel.js'
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

export function InfoPanel() {
  const selected = useReactStore(s => s.selected)
  const meta = selected.meta as MetaEntry | null

  const [mfDetails, setMfDetails] = useState<MfDetails | null>(null)

  // Load Muskelfinder details when a muscle is selected
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
  useEffect(() => {
    if (!meta) return
    let startY = 0
    const panel = document.getElementById('ip-panel')
    if (!panel) return

    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onTouchEnd   = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - startY
      if (dy > 80) close()
    }
    panel.addEventListener('touchstart', onTouchStart, { passive: true })
    panel.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      panel.removeEventListener('touchstart', onTouchStart)
      panel.removeEventListener('touchend',   onTouchEnd)
    }
  }, [meta, close])

  if (!meta) return null

  const displayLabel = getStructureDisplayLabel(meta)
  const deLabel = meta.labels?.de
  const group = meta.classification?.group ?? 'other'
  const description = (meta.info?.description?.de || meta.info?.description?.en || '').trim()

  return (
    <aside
      id="ip-panel"
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
      </div>
    </aside>
  )
}
