// CollectionPanel — Sidebar-Tab „Sammlung" (Layout B, Handoff §9.8 / Frame 2c).
// Wohnt im Tab-Body: kein Float, kein eigenes Glas. Zeilen-Klick fokussiert die
// Struktur (Kamera + Highlight) OHNE setSelection — sonst würde der Auto-Switch
// (ADR 0006) den Tab sofort auf „Info" umschalten.
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getStore } from '../../../store/useStore.js'
import { showCollectionInScene, clearCollectionAndRestore } from '../../../features/collectionView.js'
import { highlightModel } from '../../../interaction/highlightModel.js'
import { focusOnObject } from '../../../core/cameraUtils.js'
import { camera } from '../../../core/camera.js'
import { controls } from '../../../core/controls.js'
import { collectionManager } from '../../ui-collection-export.js'
import type { CollectionItem } from '../../../types/index.js'

function colorHex(n: number | undefined): string {
  if (typeof n !== 'number') return '#cccccc'
  return '#' + n.toString(16).padStart(6, '0')
}

const FocusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
  </svg>
)
const TrashIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export function CollectionPanel() {
  const collection = useReactStore(s => s.collection) as CollectionItem[]
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const flash = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const handleFocus = useCallback((item: CollectionItem) => {
    if (!item.model?.parent) return
    highlightModel(item.model)
    focusOnObject(camera, controls, item.model)
  }, [])

  const handleRemove = useCallback((id: string) => {
    getStore().removeFromCollection(id)
    document.dispatchEvent(new CustomEvent('collectionUpdated'))
  }, [])

  const handleFocusAll = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const n = await showCollectionInScene()
      flash(`${n} Objekt${n === 1 ? '' : 'e'} fokussiert`)
    } catch {
      flash('Fehler beim Fokussieren')
    }
    setBusy(false)
  }, [busy, flash])

  const handleClear = useCallback(() => {
    clearCollectionAndRestore()
    document.dispatchEvent(new CustomEvent('collectionUpdated'))
    flash('Sammlung geleert')
  }, [flash])

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    collectionManager.importCollection(e.nativeEvent)
  }, [])

  return (
    <div className="cp-panel" aria-label="Sammlung">
      <div className="cp-sectionhead">
        <span>Gespeichert</span>
        <span className="cp-count">{collection.length} {collection.length === 1 ? 'Eintrag' : 'Einträge'}</span>
      </div>

      {collection.length === 0 && (
        <p className="cp-empty">Leer — wähle eine Struktur und füge sie über den Info-Tab hinzu.</p>
      )}

      <div className="cp-list" role="list">
        {collection.map(item => (
          <div key={item.id} className="cp-row" role="listitem">
            <button className="cp-row-main" onClick={() => handleFocus(item)} title="Struktur fokussieren">
              <span className="cp-dot" style={{ background: colorHex(item.color) }} />
              <span className="cp-name">{item.name}</span>
            </button>
            <button className="cp-iconbtn" onClick={() => handleFocus(item)} aria-label="Fokussieren" title="Fokussieren">
              {FocusIcon}
            </button>
            <button className="cp-iconbtn cp-iconbtn--dim" onClick={() => handleRemove(item.id)} aria-label="Aus Sammlung entfernen" title="Entfernen">
              {TrashIcon}
            </button>
          </div>
        ))}
      </div>

      {toast && <div className="cp-toast" role="status">{toast}</div>}

      <div className="cp-actions">
        <button className="cp-cta" onClick={handleFocusAll} disabled={busy || collection.length === 0}>
          {FocusIcon}
          <span>{busy ? 'Lädt…' : 'Alle fokussieren'}</span>
        </button>
        <div className="cp-btn-row">
          <button className="cp-btn" onClick={handleClear} disabled={collection.length === 0}>Leeren</button>
          <button className="cp-btn" onClick={() => collectionManager.showSaveModal()} disabled={collection.length === 0}>Export</button>
          <button className="cp-btn" onClick={() => fileInputRef.current?.click()}>Import</button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".bluebody,application/json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </div>
  )
}
