import React, { useState, useCallback, useTransition } from 'react'
import { useReactStore } from '../useReactStore.js'
import { getGroupLabel, sortGroups } from '../groupLabels.js'
import { loadGroupByName } from '../../../features/modelLoader-core.js'
import { unloadGroupSilent } from '../../../bootstrap/initGroupLoader.js'
import { getStore } from '../../../store/useStore.js'

// Hex color from store number
function colorHex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0')
}

interface GroupRowProps {
  group: string
  isLoaded: boolean
  isVisible: boolean
  modelCount: number
  color: number | undefined
}

function GroupRow({ group, isLoaded, isVisible, modelCount, color }: GroupRowProps) {
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

  const label = getGroupLabel(group)
  const swatch = color !== undefined ? colorHex(color) : '#888'

  return (
    <div className="sb-row" data-loaded={isLoaded} data-pending={isPending}>
      {/* Color swatch */}
      <span className="sb-swatch" style={{ background: swatch }} aria-hidden="true" />

      {/* Label + count */}
      <span className="sb-label">{label}</span>
      {isLoaded && modelCount > 0 && (
        <span className="sb-count">{modelCount}</span>
      )}

      {/* Visibility toggle (only when loaded) */}
      {isLoaded && (
        <button
          className={`sb-btn sb-btn--vis ${isVisible ? 'is-visible' : 'is-hidden'}`}
          onClick={handleVisibility}
          aria-label={isVisible ? `${label} ausblenden` : `${label} einblenden`}
          title={isVisible ? 'Ausblenden' : 'Einblenden'}
        >
          {isVisible ? '👁' : '🙈'}
        </button>
      )}

      {/* Load / Unload button */}
      <button
        className={`sb-btn sb-btn--load ${isLoaded ? 'is-loaded' : ''}`}
        onClick={handleToggle}
        disabled={isPending}
        aria-label={isLoaded ? `${label} entladen` : `${label} laden`}
        title={isLoaded ? 'Entladen' : 'Laden'}
      >
        {isPending ? '⏳' : isLoaded ? '✕' : '+'}
      </button>
    </div>
  )
}

interface StructureBrowserProps {
  onClose: () => void
}

export function StructureBrowser({ onClose }: StructureBrowserProps) {
  const availableGroups = useReactStore(s => s.availableGroups)
  const groups          = useReactStore(s => s.groups)
  const groupStates     = useReactStore(s => s.groupStates)
  const colors          = useReactStore(s => s.colors)

  const sorted = sortGroups(availableGroups)

  return (
    <aside className="sb-panel" aria-label="Strukturen">
      <div className="sb-header">
        <span>Strukturen</span>
        <button className="sb-close" onClick={onClose} aria-label="Schließen">✕</button>
      </div>

      <div className="sb-list" role="list">
        {sorted.map(group => (
          <GroupRow
            key={group}
            group={group}
            isLoaded={!!groups[group as keyof typeof groups]?.length}
            isVisible={groupStates[group] ?? false}
            modelCount={groups[group as keyof typeof groups]?.length ?? 0}
            color={colors[group]}
          />
        ))}
        {sorted.length === 0 && (
          <p className="sb-empty">Keine Gruppen verfügbar</p>
        )}
      </div>
    </aside>
  )
}
