import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel } from '../groupLabels.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { getMuskelfinderDetailsForMeta } from '../../../integration/muskelfinderDetails.js'
import { setModelColor, setModelOpacity } from '../../../features/appearance.js'
import { setModelVisibility, isModelVisible } from '../../../features/visibility.js'
import { enterIsolatedView } from '../../../interaction/isolationView.js'
import { enterGhostContext, isGhostContextActive } from '../../../features/ghostContext.js'
import { getStore } from '../../../store/useStore.js'
import { clearHighlight } from '../../../interaction/highlightModel.js'
import { requestRender } from '../../../core/renderScheduler.js'
import type { MetaEntry } from '../../../types/index.js'

// In-memory recent colors (session-only, no localStorage)
const MAX_RECENT = 5
let _recentColors: string[] = []
function addRecentColor(hex: string) {
  const norm = hex.toLowerCase()
  _recentColors = [norm, ..._recentColors.filter(c => c !== norm)].slice(0, MAX_RECENT)
}
function getRecentColors() { return _recentColors }

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

interface ModelActionsProps {
  model: NonNullable<ReturnType<typeof getStore>['selected']['root']>
  meta: MetaEntry
}

function readModelColor(model: any): string {
  let hex = '#ffffff'
  model.traverse((child: any) => {
    if (child.isMesh && child.material?.color) {
      hex = '#' + child.material.color.getHexString()
    }
  })
  return hex
}

function ModelActions({ model, meta }: ModelActionsProps) {
  const initialOpacity = useRef(1)
  const initialColor   = useRef('#ffffff')
  const collection = useReactStore(s => s.collection)
  const inCollection = collection.some((c: any) => c.id === meta.id)
  const [visible, setVisible] = useState(() => isModelVisible(model))
  const [ghostActive, setGhostActive] = useState(false)
  const [recentColors, setRecentColors] = useState<string[]>(getRecentColors)

  useEffect(() => {
    initialColor.current = readModelColor(model)
    model.traverse((child: any) => {
      if (child.isMesh && child.material && initialOpacity.current === 1) {
        initialOpacity.current = child.material.opacity ?? 1
      }
    })
  }, [model])

  const handleColor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setModelColor(model, hex)
    addRecentColor(hex)
    setRecentColors(getRecentColors())
    requestRender()
  }, [model])

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setModelOpacity(model, parseFloat(e.target.value))
    requestRender()
  }, [model])

  const handleVisibility = useCallback(() => {
    const next = !isModelVisible(model)
    setModelVisibility(model, next)
    setVisible(next)
    requestRender()
  }, [model])

  const handleIsolate = useCallback(() => {
    enterIsolatedView(model)
  }, [model])

  const handleGhost = useCallback(() => {
    enterGhostContext(model)
    setGhostActive(isGhostContextActive())
  }, [model])

  const handleCollection = useCallback(() => {
    const store = getStore()
    if (inCollection) {
      store.removeFromCollection(meta.id)
    } else {
      let color = 0xffffff
      let opacity = 1
      model.traverse((child: any) => {
        if (child.isMesh && child.material) {
          color = child.material.color?.getHex?.() ?? color
          opacity = child.material.opacity ?? opacity
        }
      })
      store.addToCollection({
        id: meta.id,
        name: getStructureDisplayLabel(meta),
        group: meta.classification?.group ?? 'other',
        meta: meta as any,
        color,
        opacity,
        visible: isModelVisible(model),
        model,
        addedAt: Date.now(),
        source: 'infoPanel',
      })
    }
    document.dispatchEvent(new CustomEvent('collectionUpdated'))
  }, [model, meta, inCollection])

  return (
    <div className="ip-actions">
      <label className="ip-action-row" title="Farbe ändern">
        <span>Farbe</span>
        <input type="color" className="ip-color-input" defaultValue={initialColor.current} onChange={handleColor} aria-label="Modellfarbe" />
      </label>
      {recentColors.length > 0 && (
        <div className="ip-recent-colors">
          {recentColors.map(hex => (
            <button
              key={hex}
              className="ip-recent-color"
              style={{ background: hex }}
              title={hex}
              aria-label={`Farbe ${hex}`}
              onClick={() => { setModelColor(model, hex); requestRender() }}
            />
          ))}
        </div>
      )}
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
        <button className="ip-btn" onClick={handleVisibility}>
          {visible ? 'Ausblenden' : 'Anzeigen'}
        </button>
        <button className="ip-btn" onClick={handleIsolate}>Isolieren</button>
        <button
          className={`ip-btn${ghostActive ? ' ip-btn--active' : ''}`}
          onClick={handleGhost}
          title="Kontext-Ansicht: Rest transparent"
        >
          Kontext
        </button>
      </div>
      <button
        className={`ip-btn ip-btn--full${inCollection ? ' ip-btn--active' : ''}`}
        onClick={handleCollection}
      >
        {inCollection ? 'Aus Sammlung entfernen' : 'Zur Sammlung hinzufügen'}
      </button>
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
          <span className="ip-title__group">{getGroupLabel(group)}</span>
        </div>
        <button className="ip-close" onClick={close} aria-label="Info-Panel schließen">✕</button>
      </header>

      <div className="ip-body">
        {description && <p className="ip-description">{description}</p>}
        {mfDetails && <MuscleSections details={mfDetails} />}
        {model && <ModelActions model={model} meta={meta} />}
      </div>
    </aside>
  )
}
