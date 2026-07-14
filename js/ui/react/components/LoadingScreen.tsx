// LoadingScreen — vollflächiger Marken-Ladebildschirm (Handoff §9.11, ADR 0008).
// Rendert den loading-Store-Slice; gefüllt wird der vom progress.js-Adapter
// der Lade-Pipeline (showLoadingCircle/updateLoadingCircle/hideLoadingCircle).
import React from 'react'
import { assetPath } from '../../../core/path.js'
import { useReactStore } from '../useReactStore.js'

export function LoadingScreen() {
  const loading = useReactStore(s => s.loading)
  if (!loading.active) return null

  const pct = Math.round(loading.progress)

  return (
    <div
      className={`lds-screen${pct >= 100 ? ' lds-screen--done' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Ladebildschirm"
    >
      <div className="lds-emblem">
        <svg className="lds-ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="98" />
        </svg>
        <img className="lds-logo" src={assetPath('af-logo.png')} alt="" width={132} height={132} />
      </div>

      <h1 className="lds-wordmark">Anatomie <span>Fokus</span></h1>
      <p className="lds-tagline">Anatomie verstehen. Wissen anwenden.</p>

      <div className="lds-progress">
        <div className="lds-progress__track">
          <div className="lds-progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="lds-progress__label">{loading.label} {pct} %</p>
      </div>
    </div>
  )
}
