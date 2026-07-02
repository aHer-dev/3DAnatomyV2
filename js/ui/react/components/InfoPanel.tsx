import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel } from '../groupLabels.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { getMuskelfinderDetailsForMeta } from '../../../integration/muskelfinderDetails.js'
import { setModelColor, setModelOpacity } from '../../../features/appearance.js'
import { setModelVisibility, isModelVisible } from '../../../features/visibility.js'
import { enterIsolatedView, exitIsolatedView, getIsolatedModel } from '../../../interaction/isolationView.js'
import { enterGhostContext, isGhostContextActive } from '../../../features/ghostContext.js'
import { getStore } from '../../../store/useStore.js'
import { requestRender } from '../../../core/renderScheduler.js'
import type { MetaEntry } from '../../../types/index.js'

// ─── Icons (inline, keine externen Icon-Sets) ───────────────────────────────
const Icon = {
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
    </svg>
  ),
  ring: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
}

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

const SIDE_RE = /\s+(dexter|sinister|dextra|sinistra|dextrum|sinistrum)$/i

function StructureLabel({ label }: { label: string }) {
  const match = label.match(SIDE_RE)
  if (!match) return <>{label}</>
  const main = label.slice(0, label.length - match[0].length)
  return <>{main}<span className="ip-title__side"> {match[1]}</span></>
}

function MuscleSections({ details }: { details: MfDetails }) {
  if (!details.sections.length) return null
  return (
    <details className="ip-details">
      <summary className="ip-details__summary">
        <span>Details</span>
        <svg className="ip-details__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
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

function readModelOpacity(model: any): number {
  let opacity = 1
  model.traverse((child: any) => {
    if (child.isMesh && child.material) {
      opacity = child.material.opacity ?? 1
    }
  })
  return opacity
}

function ModelActions({ model, meta }: ModelActionsProps) {
  const initialColor = useRef('#ffffff')
  const collection = useReactStore(s => s.collection)
  const inCollection = collection.some((c: any) => c.id === meta.id)
  const [visible, setVisible] = useState(() => isModelVisible(model))
  const [opacity, setOpacity] = useState(() => readModelOpacity(model))
  const isolatedModel = useReactStore(s => s.isolation.model)
  const isolated = isolatedModel === model
  const [ghostActive, setGhostActive] = useState(false)
  const [recentColors, setRecentColors] = useState<string[]>(getRecentColors)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    initialColor.current = readModelColor(model)
  }, [model])

  const handleColor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setModelColor(model, e.target.value)
    requestRender()
  }, [model])

  const handleColorCommit = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    addRecentColor(e.target.value)
    setRecentColors(getRecentColors())
  }, [])

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setOpacity(v)
    setModelOpacity(model, v)
    requestRender()
  }, [model])

  const handleVisibility = useCallback(() => {
    const next = !isModelVisible(model)
    setModelVisibility(model, next)
    setVisible(next)
    requestRender()
  }, [model])

  const handleIsolate = useCallback(() => {
    if (getIsolatedModel() === model) {
      exitIsolatedView()
    } else {
      enterIsolatedView(model)
    }
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
    showToast(inCollection ? 'Aus Sammlung entfernt' : 'Zur Sammlung hinzugefügt')
  }, [model, meta, inCollection, showToast])

  const opacityPct = `${Math.round(opacity * 100)}%`

  return (
    <div className="ip-actions">
      {/* Deckkraft (§9.4) */}
      <div className="ip-opacity">
        <div className="ip-opacity__head">
          <span>Deckkraft</span>
          <span>{opacityPct}</span>
        </div>
        <input
          type="range"
          className="ip-slider"
          min="0" max="1" step="0.01"
          value={opacity}
          onChange={handleOpacity}
          style={{ '--ip-pct': opacityPct } as React.CSSProperties}
          aria-label="Deckkraft"
        />
      </div>

      {/* 3 Aktionen (gleich breit) */}
      <div className="ip-actions-grid">
        <button className="ip-act" onClick={handleVisibility}>
          {visible ? Icon.eyeOff : Icon.eye}
          <span>{visible ? 'Ausblenden' : 'Anzeigen'}</span>
        </button>
        <button className={`ip-act${isolated ? ' is-active' : ''}`} onClick={handleIsolate}>
          {Icon.target}
          <span>{isolated ? 'Isolation' : 'Isolieren'}</span>
        </button>
        <button
          className={`ip-act${ghostActive ? ' is-active' : ''}`}
          onClick={handleGhost}
          title="Kontext-Ansicht: Rest transparent"
        >
          {Icon.ring}
          <span>Kontext</span>
        </button>
      </div>

      {/* CTA */}
      <button
        className={`ip-cta${inCollection ? ' is-active' : ''}`}
        onClick={handleCollection}
      >
        {Icon.bookmark}
        <span>{inCollection ? 'Aus Sammlung entfernen' : 'Zur Sammlung'}</span>
      </button>

      {/* Farbe (sekundär — aus Layout A beibehalten, nicht Teil von §9.4) */}
      <div className="ip-color">
        <label className="ip-color__row" title="Farbe ändern">
          <span>Farbe</span>
          <input type="color" className="ip-color-input" defaultValue={initialColor.current} onChange={handleColor} onBlur={handleColorCommit} aria-label="Modellfarbe" />
        </label>
        {recentColors.length > 0 && (
          <div className="ip-recent">
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
      </div>

      {toast && <div className="ip-toast">{toast}</div>}
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

  if (!meta) return null

  const displayLabel = getStructureDisplayLabel(meta)
  const group        = meta.classification?.group ?? 'other'
  const description  = (meta.info?.description?.de || meta.info?.description?.en || '').trim()
  const groupStyle   = { '--ip-group': `var(--group-${group}, var(--group-default))` } as React.CSSProperties

  return (
    <div className="ip-panel" aria-label={`Info: ${displayLabel}`}>
      <header className="ip-header">
        <h2 className="ip-title__primary"><StructureLabel label={displayLabel} /></h2>
        <span className="ip-badge" style={groupStyle}>
          <span className="ip-badge__dot" aria-hidden="true" />
          {getGroupLabel(group)}
        </span>
      </header>

      <div className="ip-body">
        {description && <p className="ip-description">{description}</p>}
        {mfDetails && <MuscleSections details={mfDetails} />}
        {model && <ModelActions key={meta.id} model={model} meta={meta} />}
      </div>
    </div>
  )
}
