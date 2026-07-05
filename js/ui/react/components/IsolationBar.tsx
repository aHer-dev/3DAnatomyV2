// Isolation — Layout B (Handoff §9.6 / Frame 2e): Banner oben in der Sidebar
// (statt floatender Bar) + Untertitel-Overlay unten-mittig im freien Canvas.
// Der Banner reagiert auf den Store-Isolationszustand (isolationView.js);
// die Aktions-Callbacks (actionBar) bleiben unverändert — auch Deeplink-Flows
// (z. B. „← Zurück zum Muskelfinder") rendern hier ihren eigenen Primär-Label.
import React from 'react'
import { useReactStore } from '../useReactStore.js'
import { getStructureDisplayLabel } from '../../../utils/anatomyLabels.js'
import { getGroupLabel } from '../groupLabels.js'
import { enterGhostContext } from '../../../features/ghostContext.js'

const TargetIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
  </svg>
)
const RingIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" />
  </svg>
)
const CloseIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

/** Banner in der Sidebar (zwischen Kopf und Tab-Body gemountet). */
export function IsolationBanner() {
  const isolation = useReactStore(s => s.isolation)
  const model = isolation.model as any | null
  if (!model) return null

  const title = isolation.label || getStructureDisplayLabel(model)

  return (
    <div className="iso-banner" role="status" aria-label={`Isolation aktiv: ${title}`}>
      <div className="iso-banner__box">
        <span className="iso-banner__icon" aria-hidden="true">{TargetIcon}</span>
        <div className="iso-banner__text">
          <div className="iso-banner__title">Isolation aktiv</div>
          <div className="iso-banner__sub">Nur {title} sichtbar</div>
        </div>
      </div>

      <button className="iso-btn" onClick={() => enterGhostContext(model)}>
        {RingIcon}<span>Kontext einblenden</span>
      </button>
      {isolation.actionBar && (
        <button className="iso-btn iso-btn--primary" onClick={isolation.actionBar.onPrimary}>
          {CloseIcon}<span>{isolation.actionBar.primaryLabel}</span>
        </button>
      )}
    </div>
  )
}

/** Untertitel unten-mittig im freien Canvas — ersetzt dort den ViewCluster (Frame 2e). */
export function IsolationSubtitle() {
  const isolation = useReactStore(s => s.isolation)
  const model = isolation.model as any | null
  if (!model) return null

  const title = isolation.label || getStructureDisplayLabel(model)
  const group = model.userData?.meta?.classification?.group
  const sub = isolation.label ? 'Mehrfachauswahl' : (group ? getGroupLabel(group) : null)

  return (
    <div className="iso-subtitle" aria-hidden="true">
      <div className="iso-subtitle__name">{title}</div>
      {sub && <div className="iso-subtitle__sub">{sub}</div>}
    </div>
  )
}
