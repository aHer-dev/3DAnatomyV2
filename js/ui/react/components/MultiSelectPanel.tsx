// MultiSelectPanel — Sammel-Ansicht des Info-Tabs bei Mehrfachauswahl
// (Layout B, Handoff §9.5 / Frame 2d). Wohnt im Tab-Body: kein Float mehr.
// AppShell rendert diese Variante, sobald multiSelected nicht leer ist.
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { removeFromMultiSelect, clearMultiSelect } from '../../../interaction/multiSelect.js'
import { enterIsolatedView } from '../../../interaction/isolationView.js'
import { setModelColor, setModelOpacity } from '../../../features/appearance.js'
import { setModelVisibility, isModelVisible } from '../../../features/visibility.js'
import { getStore } from '../../../store/useStore.js'
import { requestRender } from '../../../core/renderScheduler.js'
import type { MetaEntry } from '../../../types/index.js'

const Icon = {
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  bookmark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
}

function readColorHex(model: any): string {
  let hex = '#cccccc'
  model.traverse((child: any) => {
    if (child.isMesh && child.material?.color) {
      hex = '#' + child.material.color.getHexString()
    }
  })
  return hex
}

export function MultiSelectPanel() {
  const multiSelected = useReactStore(s => s.multiSelected)
  const models = Array.from(multiSelected) as any[]
  const n = models.length

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const flash = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const handleRemove = useCallback((model: any) => {
    removeFromMultiSelect(model)
    requestRender()
  }, [])

  // Aufheben/Ausblenden beenden den Multi-Modus: auch die Einzel-Selektion
  // räumen, denn pickAt() setzt bei JEDEM Canvas-Klick selected.root als
  // Nebeneffekt (raycaster.js) — sonst hält der Auto-Switch den Info-Tab
  // mit leerem Inhalt offen.
  const handleClear = useCallback(() => {
    clearMultiSelect()
    getStore().clearSelection()
    requestRender()
  }, [])

  const handleIsolateAll = useCallback(() => {
    if (!models.length) return
    enterIsolatedView(models[0], {
      structuralGroups: [],
      label: models.length > 1 ? `${models.length} Strukturen` : null,
    })
    for (const m of models.slice(1)) setModelVisibility(m, true)
    requestRender()
  }, [models])

  const handleHideAll = useCallback(() => {
    for (const m of models) setModelVisibility(m, false)
    clearMultiSelect()
    getStore().clearSelection()
    requestRender()
  }, [models])

  const handleCollectAll = useCallback(() => {
    const store = getStore()
    let added = 0
    for (const model of models) {
      const meta = (model.userData?.meta || model.userData?.entry) as MetaEntry | undefined
      if (!meta?.id || store.collection.some((c: any) => c.id === meta.id)) continue
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
        source: 'multiSelect',
      })
      added++
    }
    document.dispatchEvent(new CustomEvent('collectionUpdated'))
    flash(added > 0 ? `${added} zur Sammlung hinzugefügt` : 'Bereits in der Sammlung')
  }, [models, flash])

  const handleBatchColor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    for (const m of models) setModelColor(m, e.target.value)
    requestRender()
  }, [models])

  const handleBatchOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    for (const m of models) setModelOpacity(m, v)
    requestRender()
  }, [models])

  if (!n) return null

  return (
    <div className="msp-panel" aria-label={`Mehrfachauswahl: ${n} Strukturen`}>
      <header className="msp-head">
        <span className="msp-count">{n}</span>
        <span className="msp-title">{n === 1 ? 'Struktur gewählt' : 'Strukturen gewählt'}</span>
      </header>

      <ul className="msp-chips">
        {models.map((model: any) => {
          const label = getStructureDisplayLabel(model)
          return (
            <li key={model.uuid ?? label} className="msp-chip">
              <span className="msp-dot" style={{ background: readColorHex(model) }} />
              <span className="msp-chip__name" title={label}>{label}</span>
              <button
                className="msp-chip__remove"
                onClick={() => handleRemove(model)}
                aria-label={`${label} aus Auswahl entfernen`}
              >
                {Icon.close}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="msp-batch">
        <div className="msp-batch__label">Für alle {n}</div>
        <div className="msp-batch__row">
          <button className="msp-act" onClick={handleIsolateAll}>{Icon.target}<span>Isolieren</span></button>
          <button className="msp-act" onClick={handleHideAll}>{Icon.eyeOff}<span>Ausblenden</span></button>
        </div>
        <button className="msp-cta" onClick={handleCollectAll}>
          {Icon.bookmark}<span>Zur Sammlung hinzufügen</span>
        </button>

        {/* Sekundär: Batch-Farbe/-Deckkraft (Bestand aus Layout A, nicht Teil von §9.5) */}
        <div className="msp-tune">
          <label className="msp-tune__row" title="Farbe für alle ändern">
            <span>Farbe</span>
            <input type="color" className="msp-color-input" onChange={handleBatchColor} aria-label="Farbe für alle" />
          </label>
          <label className="msp-tune__row" title="Deckkraft für alle">
            <span>Deckkraft</span>
            <input
              type="range"
              className="msp-range"
              min="0" max="1" step="0.01"
              defaultValue="1"
              onChange={handleBatchOpacity}
              aria-label="Deckkraft für alle"
            />
          </label>
        </div>
      </div>

      {toast && <div className="msp-toast" role="status">{toast}</div>}

      <button className="msp-clear" onClick={handleClear}>
        {Icon.close}<span>Auswahl aufheben</span>
      </button>
    </div>
  )
}
