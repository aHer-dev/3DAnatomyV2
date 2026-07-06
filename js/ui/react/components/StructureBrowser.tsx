import React, { useCallback, useTransition } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel, sortGroups, ENABLED_GROUPS } from '../groupLabels.js'
import { loadGroupByName, unloadGroupSilent } from '../../../features/modelLoader-core.js'
import { setGroupOpacity } from '../../../features/appearance.js'
import { getStore } from '../../../store/useStore.js'

// Röntgen-Slider-Grenzen (siehe handleOpacity)
const OPACITY_MIN = 0.15
const OPACITY_MAX = 1

// Auge / Auge-durchgestrichen (§9.3), Inline-SVG statt Emoji — keine externen Icons.
const EyeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOffIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

interface GroupRowProps {
  group: string
  isLoaded: boolean
  isVisible: boolean
  opacity: number
}

function GroupRow({ group, isLoaded, isVisible, opacity }: GroupRowProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = useCallback(() => {
    startTransition(async () => {
      if (isLoaded) {
        await unloadGroupSilent(group)
      } else {
        await loadGroupByName(group, { centerCamera: false })
      }
    })
  }, [group, isLoaded])

  const handleVisibility = useCallback(() => {
    getStore().setGroupVisible(group, !isVisible)
  }, [group, isVisible])

  const handleOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupOpacity(group, parseFloat(e.target.value))
  }, [group])

  const label = getGroupLabel(group)
  // Fill-Anteil des Röntgen-Sliders (0.15–1 → 0–100 %).
  const fillPct = Math.round(((opacity - OPACITY_MIN) / (OPACITY_MAX - OPACITY_MIN)) * 100)
  // Gruppenfarbe als Token; steuert Farbpunkt + Slider-Fill.
  const rowStyle = { '--sb-fill': `var(--group-${group}, var(--group-default))` } as React.CSSProperties

  return (
    <div
      className="sb-row"
      role="listitem"
      data-loaded={isLoaded}
      data-visible={isVisible}
      data-pending={isPending}
      style={rowStyle}
    >
      {/* Sichtbarkeits-Auge (nur wenn geladen) */}
      {isLoaded && (
        <button
          className="sb-eye"
          role="switch"
          aria-checked={isVisible}
          onClick={handleVisibility}
          aria-label={isVisible ? `${label} ausblenden` : `${label} einblenden`}
          title={isVisible ? 'Ausblenden' : 'Einblenden'}
        >
          {isVisible ? EyeIcon : EyeOffIcon}
        </button>
      )}

      {/* Farbpunkt (Gruppenfarbe) */}
      <span className="sb-swatch" aria-hidden="true" />

      {/* Label */}
      <span className="sb-label">{label}</span>

      {/* Röntgen-Slider (nur wenn geladen & sichtbar) */}
      {isLoaded && isVisible && (
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
          title={`Transparenz ${Math.round(opacity * 100)}%`}
        />
      )}

      {/* Laden / Entladen */}
      <button
        className={`sb-load${isLoaded ? ' is-loaded' : ''}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-label={isLoaded ? `${label} entladen` : `${label} laden`}
        title={isLoaded ? 'Entladen' : 'Laden'}
      >
        {isPending ? '…' : isLoaded ? '✕' : '+'}
      </button>
    </div>
  )
}

export function StructureBrowser() {
  const availableGroups = useReactStore(s => s.availableGroups)
  const groups          = useReactStore(s => s.groups)
  const groupStates     = useReactStore(s => s.groupStates)
  const groupOpacity    = useReactStore(s => s.groupOpacity)

  const sorted = sortGroups(availableGroups.filter(g => ENABLED_GROUPS.has(g)))

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
