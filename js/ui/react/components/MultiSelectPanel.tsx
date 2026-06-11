import React, { useCallback, useRef } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { removeFromMultiSelect, clearMultiSelect } from '../../../interaction/multiSelect.js'
import { setModelColor, setModelOpacity } from '../../../features/appearance.js'
import { requestRender } from '../../../core/renderScheduler.js'

export function MultiSelectPanel() {
  const multiSelected = useReactStore(s => s.multiSelected)
  const models = Array.from(multiSelected)

  const handleRemove = useCallback((model: any) => {
    removeFromMultiSelect(model)
    requestRender()
  }, [])

  const handleClear = useCallback(() => {
    clearMultiSelect()
    requestRender()
  }, [])

  const handleBatchColor = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    for (const m of multiSelected) {
      setModelColor(m as any, hex)
    }
    requestRender()
  }, [multiSelected])

  const handleBatchOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    for (const m of multiSelected) {
      setModelOpacity(m as any, v)
    }
    requestRender()
  }, [multiSelected])

  if (!models.length) return null

  return (
    <aside
      className="msp-panel"
      role="dialog"
      aria-modal="false"
      aria-label={`Mehrfachauswahl: ${models.length} Strukturen`}
    >
      <header className="msp-header">
        <span className="msp-title">{models.length} ausgewählt</span>
        <button className="ip-close" onClick={handleClear} aria-label="Auswahl aufheben">✕</button>
      </header>

      <ul className="msp-list">
        {models.map((model: any) => {
          const label = getStructureDisplayLabel(model)
          return (
            <li key={model.uuid ?? model.id ?? label} className="msp-item">
              <span className="msp-item-name" title={label}>{label}</span>
              <button
                className="msp-remove"
                onClick={() => handleRemove(model)}
                aria-label={`${label} aus Auswahl entfernen`}
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>

      <div className="msp-actions">
        <label className="ip-action-row" title="Farbe für alle ändern">
          <span>Farbe</span>
          <input type="color" className="ip-color-input" onChange={handleBatchColor} aria-label="Farbe für alle" />
        </label>
        <label className="ip-action-row" title="Transparenz für alle">
          <span>Opazität</span>
          <input
            type="range"
            className="ip-opacity-slider"
            min="0" max="1" step="0.01"
            defaultValue="1"
            onChange={handleBatchOpacity}
            aria-label="Transparenz für alle"
          />
        </label>
      </div>
    </aside>
  )
}
