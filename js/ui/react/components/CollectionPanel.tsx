import React, { useState, useRef, useCallback } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel, sortGroups } from '../groupLabels.js'
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

interface CollectionPanelProps {
  onClose: () => void
}

export function CollectionPanel({ onClose }: CollectionPanelProps) {
  const collection = useReactStore(s => s.collection) as CollectionItem[]
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const handleSelect = useCallback((item: CollectionItem) => {
    if (!item.model?.parent) return
    highlightModel(item.model)
    getStore().setSelection({ meta: item.meta as any })
    focusOnObject(camera, controls, item.model)
  }, [])

  const handleRemove = useCallback((id: string) => {
    getStore().removeFromCollection(id)
    document.dispatchEvent(new CustomEvent('collectionUpdated'))
  }, [])

  const handleShow = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const n = await showCollectionInScene()
      flash(`${n} Objekt${n === 1 ? '' : 'e'} angezeigt`)
    } catch {
      flash('Fehler beim Anzeigen')
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

  // Gruppieren nach Anatomie-Gruppe
  const grouped = new Map<string, CollectionItem[]>()
  for (const item of collection) {
    const g = item.group || 'other'
    if (!grouped.has(g)) grouped.set(g, [])
    grouped.get(g)!.push(item)
  }
  const sortedGroups = sortGroups([...grouped.keys()])

  return (
    <aside className="cp-panel" aria-label="Meine Sammlung">
      <div className="cp-header">
        <span>Sammlung{collection.length > 0 ? ` (${collection.length})` : ''}</span>
        <button className="cp-close" onClick={onClose} aria-label="Schließen">✕</button>
      </div>

      <div className="cp-list" role="list">
        {collection.length === 0 && (
          <p className="cp-empty">Leer — wähle eine Struktur und füge sie über das Info-Panel hinzu.</p>
        )}

        {sortedGroups.map(group => (
          <div key={group} className="cp-group">
            <div className="cp-group-title">
              {getGroupLabel(group)} ({grouped.get(group)!.length})
            </div>
            {grouped.get(group)!.map(item => (
              <div key={item.id} className="cp-item" role="listitem">
                <button className="cp-item-main" onClick={() => handleSelect(item)} title="Auswählen & fokussieren">
                  <span className="cp-dot" style={{ background: colorHex(item.color) }} />
                  <span className="cp-item-name">{item.name}</span>
                </button>
                <button
                  className="cp-item-remove"
                  onClick={() => handleRemove(item.id)}
                  aria-label="Aus Sammlung entfernen"
                  title="Entfernen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {toast && <div className="cp-toast">{toast}</div>}

      <div className="cp-actions">
        <button className="cp-btn cp-btn--primary" onClick={handleShow} disabled={busy || collection.length === 0}>
          {busy ? 'Lädt…' : 'Nur Sammlung anzeigen'}
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
    </aside>
  )
}
