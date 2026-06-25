import React from 'react'
import { useReactStore } from '../useReactStore.js'

/**
 * Aktionsleiste für die Einzelansicht (Isolation). Erscheint reaktiv, sobald im
 * Store ein Isolations-Modell samt actionBar gesetzt ist (siehe isolationView.js).
 * Ersetzt die frühere imperative DOM-Leiste (ADR 0004: kein paralleles DOM-Chrome).
 */
export function IsolationBar() {
  const actionBar = useReactStore(s => s.isolation.actionBar)

  if (!actionBar) return null

  return (
    <div id="isolation-actions">
      <button
        className="isolation-action-btn isolation-action-btn--primary"
        onClick={actionBar.onPrimary}
      >
        {actionBar.primaryLabel}
      </button>

      {actionBar.secondaryLabel && actionBar.onSecondary && (
        <button
          className="isolation-action-btn isolation-action-btn--secondary"
          onClick={actionBar.onSecondary}
        >
          {actionBar.secondaryLabel}
        </button>
      )}
    </div>
  )
}
