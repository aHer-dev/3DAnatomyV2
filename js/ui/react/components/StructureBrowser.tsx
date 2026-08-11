import React, { useCallback, useState } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel, sortPanelGroups, ENABLED_GROUPS } from '../groupLabels.js'
import { loadGroupByName } from '../../../features/modelLoader-core.js'
// setGroupVisibility (features/visibility.js) fasst die Szene an UND pflegt den
// Store. Die gleichnamige Store-Aktion `setGroupVisible` legt dagegen nur einen
// Boolean um — mit der stand hier vorher das Auge, das sichtbar nichts tat.
import { setGroupVisibility } from '../../../features/visibility.js'
import { setGroupOpacity } from '../../../features/appearance.js'

// Röntgen-Slider-Grenzen (siehe handleOpacity)
const OPACITY_MIN = 0.15
const OPACITY_MAX = 1

interface GroupRowProps {
  group: string
  isLoaded: boolean
  isVisible: boolean
  opacity: number
}

function GroupRow({ group, isLoaded, isVisible, opacity }: GroupRowProps) {
  const [busy, setBusy] = useState(false)
  // „An" heißt: geladen UND sichtbar. Alles andere ist aus.
  const isOn = isLoaded && isVisible
  const label = getGroupLabel(group)

  // Ein Schalter für beides. Beim ersten Einschalten wird geladen (bei den
  // Muskeln 465 Dateien, das dauert), danach kostet Umschalten nichts mehr:
  // ausgeschaltete Gruppen bleiben im Speicher und sind sofort wieder da.
  const handleToggle = useCallback(async () => {
    if (busy) return
    if (isLoaded) {
      setGroupVisibility(group, !isOn)
      return
    }
    setBusy(true)
    try {
      await loadGroupByName(group, { centerCamera: false })
      setGroupVisibility(group, true)
    } finally {
      setBusy(false)
    }
  }, [group, isLoaded, isOn, busy])

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupOpacity(group, parseFloat(e.target.value))
  }, [group])

  // Fill-Anteil des Röntgen-Sliders (0.15–1 → 0–100 %).
  const fillPct = Math.round(((opacity - OPACITY_MIN) / (OPACITY_MAX - OPACITY_MIN)) * 100)
  // Gruppenfarbe als Token; steuert Farbpunkt + Slider-Fill.
  const rowStyle = { '--sb-fill': `var(--group-${group}, var(--group-default))` } as React.CSSProperties

  return (
    <div className="sb-item" role="listitem" data-on={isOn} data-busy={busy} style={rowStyle}>
      <div className="sb-row">
        <span className="sb-swatch" aria-hidden="true" />
        <span className="sb-label">{label}</span>
        {busy && <span className="sb-hint">lädt …</span>}
        <button
          className="sb-switch"
          role="switch"
          aria-checked={isOn}
          aria-label={`${label} ${isOn ? 'ausschalten' : 'einschalten'}`}
          title={isOn ? 'Ausschalten' : 'Einschalten'}
          disabled={busy}
          onClick={handleToggle}
        >
          <span className="sb-switch__knob" aria-hidden="true" />
        </button>
      </div>

      {/* Röntgen-Transparenz — nur wenn die Gruppe an ist, sonst regelte man Unsichtbares. */}
      {isOn && (
        <div className="sb-xray">
          <span className="sb-xray__label">Transparenz</span>
          <input
            type="range"
            className="sb-slider"
            min={OPACITY_MIN}
            max={OPACITY_MAX}
            step={0.05}
            value={opacity}
            onChange={handleOpacity}
            style={{ '--sb-pct': `${fillPct}%` } as React.CSSProperties}
            aria-label={`Transparenz ${label}`}
          />
          <span className="sb-xray__value">{Math.round(opacity * 100)}%</span>
        </div>
      )}
    </div>
  )
}

export function StructureBrowser() {
  const availableGroups = useReactStore(s => s.availableGroups)
  const groups          = useReactStore(s => s.groups)
  const groupStates     = useReactStore(s => s.groupStates)
  const groupOpacity    = useReactStore(s => s.groupOpacity)

  const sorted = sortPanelGroups(availableGroups.filter(g => ENABLED_GROUPS.has(g)))

  return (
    <div className="sb-panel" aria-label="Strukturen">
      <div className="sb-list" role="list">
        {sorted.map(group => (
          <GroupRow
            key={group}
            group={group}
            isLoaded={!!groups[group as keyof typeof groups]?.length}
            isVisible={groupStates[group] ?? false}
            opacity={groupOpacity[group] ?? 1}
          />
        ))}
        {sorted.length === 0 && (
          <p className="sb-empty">Keine Gruppen verfügbar</p>
        )}
      </div>
    </div>
  )
}
