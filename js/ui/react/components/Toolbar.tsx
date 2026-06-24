import React, { useState, useEffect } from 'react'
import { camera } from '../../../core/camera.js'
import { controls } from '../../../core/controls.js'
import { setCameraDirection } from '../../../core/cameraUtils.js'
import { requestRender } from '../../../core/renderScheduler.js'
import { TOOL, getActiveTool, setActiveTool as setTool, onToolChange } from '../../toolbar.js'
import { useReactStore } from '../useReactStore.js'
import { loadGroupByName } from '../../../features/modelLoader-core.js'
import { unloadGroupSilent } from '../../../bootstrap/initGroupLoader.js'
import { resetApp } from '../../ui-reset.js'
import { enterPhotoMode } from '../../photoMode.js'
import { toggleLabels, isLabelsActive } from '../../../features/labels.js'

// ─── Hook ─────────────────────────────────────────────────────────────────

function useActiveTool() {
  const [activeTool, setActiveToolState] = useState(getActiveTool)
  useEffect(() => {
    const unsubscribe = onToolChange(setActiveToolState)
    return () => { unsubscribe() }
  }, [])
  return activeTool
}

// ─── Kamera-Ansichten ─────────────────────────────────────────────────────

const VIEW_DIRS = [
  { id: 'anterior',  label: 'Ant',  title: 'Von anterior (vorne)' },
  { id: 'posterior', label: 'Post', title: 'Von posterior (hinten)' },
  { id: 'left',      label: 'Li',   title: 'Von links' },
  { id: 'right',     label: 'Re',   title: 'Von rechts' },
  { id: 'cranial',   label: 'Kran', title: 'Von kranial (oben)' },
  { id: 'caudal',    label: 'Kaud', title: 'Von kaudal (unten)' },
]

function handleDir(id: string) {
  setCameraDirection(camera, controls, controls.target.clone(), camera.position.distanceTo(controls.target), id)
  requestRender(4)
}

// ─── Layer-Config ─────────────────────────────────────────────────────────

const LAYER_GROUPS: Record<string, string[]> = {
  bones:   ['bones', 'cartilage', 'teeth'],
  muscles: ['muscles', 'ligaments'],
}

const LAYER_CONFIG = [
  {
    system: 'bones',
    title: 'Knochen / Knorpel / Zähne ein-/ausblenden',
    label: 'Knochen',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 3a2 2 0 0 1 0 4h6a2 2 0 0 1 0-4"/>
        <path d="M9 21a2 2 0 0 0 0-4h6a2 2 0 0 0 0 4"/>
        <line x1="9.5" y1="7" x2="9.5" y2="17"/>
        <line x1="14.5" y1="7" x2="14.5" y2="17"/>
      </svg>
    ),
  },
  {
    system: 'muscles',
    title: 'Muskeln / Bänder ein-/ausblenden',
    label: 'Muskeln',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 19c-1-2-1-5 1-8l3-6c.5-1 1.5-1 2 0l1 2c1.5-1.5 3-1 3.5 1l.5 3c.5 2 0 4-1 5.5"/>
        <path d="M7 19 Q12 22 17 19"/>
      </svg>
    ),
  },
]

// ─── Hauptkomponente ──────────────────────────────────────────────────────

interface ToolbarProps {
  browserOpen: boolean
  onToggleBrowser: () => void
  collectionOpen: boolean
  onToggleCollection: () => void
  settingsOpen: boolean
  onToggleSettings: () => void
}

export function Toolbar({ browserOpen, onToggleBrowser, collectionOpen, onToggleCollection, settingsOpen, onToggleSettings }: ToolbarProps) {
  const activeTool = useActiveTool()
  const [expanded, setExpanded] = useState(false)
  const [dirOpen, setDirOpen] = useState(false)
  const [loadingLayer, setLoadingLayer] = useState<string | null>(null)
  const [labelsOn, setLabelsOn] = useState(false)
  const groups = useReactStore(s => s.groups)
  const collectionCount = useReactStore(s => s.collection.length)

  async function handleLayerToggle(system: string) {
    if (loadingLayer) return
    const groupList = LAYER_GROUPS[system]
    const isLoaded = groupList.some(g => (groups[g]?.length ?? 0) > 0)
    setLoadingLayer(system)
    try {
      if (isLoaded) {
        for (const g of groupList) await unloadGroupSilent(g)
      } else {
        for (const g of groupList) await loadGroupByName(g, { centerCamera: false })
      }
      requestRender()
    } catch (e) {
      console.warn('Layer-Toggle Fehler:', e)
    }
    setLoadingLayer(null)
  }

  return (
    <>
      {/* Richtungs-Panel — einklappbar */}
      <div id="toolbar-dir-panel">
        {dirOpen && VIEW_DIRS.map(({ id, label, title }) => (
          <button key={id} className="dir-btn" title={title} onClick={() => handleDir(id)}>
            {label}
          </button>
        ))}
        <button
          className={`dir-toggle-btn${dirOpen ? ' dir-toggle-btn--open' : ''}`}
          title={dirOpen ? 'Ansichten ausblenden' : 'Kamera-Ansichten'}
          aria-label="Kamera-Ansichten ein-/ausblenden"
          aria-expanded={dirOpen}
          onClick={() => setDirOpen(o => !o)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      </div>

      <div id="anatomy-toolbar" role="toolbar" aria-label="Werkzeuge">
        {/* ── Werkzeug-Auswahl ── */}
        <button
          className={`toolbar-btn${activeTool === TOOL.SELECT ? ' active' : ''}`}
          title="Einzelauswahl (Klick)"
          aria-label="Einzelauswahl"
          aria-pressed={activeTool === TOOL.SELECT}
          onClick={() => setTool(TOOL.SELECT)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3l14 9-7 1-4 7z"/>
          </svg>
          <span className="toolbar-label">Auswählen</span>
        </button>

        <button
          id="toolbar-toggle"
          className={`toolbar-toggle-btn${expanded ? ' toolbar-toggle-btn--open' : ''}`}
          title="Weitere Werkzeuge"
          aria-label="Weitere Werkzeuge ein-/ausblenden"
          onClick={() => setExpanded(e => !e)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {expanded && (
          <>
            <button
              className={`toolbar-btn${activeTool === TOOL.MULTI ? ' active' : ''}`}
              title="Mehrfachauswahl (Klick zum Hinzufügen)"
              aria-label="Mehrfachauswahl"
              aria-pressed={activeTool === TOOL.MULTI}
              onClick={() => setTool(TOOL.MULTI)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 3l14 9-7 1-4 7z"/>
                <circle cx="18" cy="6" r="4" fill="currentColor" stroke="none"/>
                <line x1="16" y1="6" x2="20" y2="6"/>
                <line x1="18" y1="4" x2="18" y2="8"/>
              </svg>
              <span className="toolbar-label">Mehrfach</span>
            </button>

            <button
              className={`toolbar-btn${activeTool === TOOL.BOX ? ' active' : ''}`}
              title="Rechteck-Auswahl (Ziehen)"
              aria-label="Rechteck-Auswahl"
              aria-pressed={activeTool === TOOL.BOX}
              onClick={() => setTool(TOOL.BOX)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
                <rect x="4" y="4" width="16" height="16" rx="1"/>
              </svg>
              <span className="toolbar-label">Rechteck</span>
            </button>

            <button
              className={`toolbar-btn${activeTool === TOOL.FOCUS ? ' active' : ''}`}
              title="Auf Auswahl fokussieren"
              aria-label="Auf Auswahl fokussieren"
              aria-pressed={activeTool === TOOL.FOCUS}
              onClick={() => setTool(TOOL.FOCUS)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
                <path d="M5.6 5.6l1.4 1.4M16.9 16.9l1.5 1.5M5.6 18.4l1.4-1.4M16.9 7.1l1.5-1.5"/>
              </svg>
              <span className="toolbar-label">Fokus</span>
            </button>
          </>
        )}

        <div className="toolbar-sep" />

        {/* ── Layer-Buttons ── */}
        {LAYER_CONFIG.map(({ system, title, label, icon }) => {
          const isLoaded = LAYER_GROUPS[system].some(g => (groups[g]?.length ?? 0) > 0)
          const isLoading = loadingLayer === system
          return (
            <button
              key={system}
              className={`toolbar-btn toolbar-layer-btn${isLoaded ? ' layer-active' : ''}${isLoading ? ' toolbar-btn--loading' : ''}`}
              data-system={system}
              title={title}
              aria-label={title}
              aria-pressed={isLoaded}
              disabled={!!loadingLayer}
              onClick={() => handleLayerToggle(system)}
            >
              {icon}
              <span className="toolbar-label">
                {isLoading ? (isLoaded ? 'Entlade…' : 'Lade…') : label}
              </span>
            </button>
          )
        })}

        <div className="toolbar-sep" />

        {/* ── Struktur-Browser ── */}
        <button
          className={`toolbar-btn${browserOpen ? ' active' : ''}`}
          title="Alle Strukturen ein-/ausblenden"
          aria-label="Strukturen"
          aria-pressed={browserOpen}
          onClick={onToggleBrowser}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
          </svg>
          <span className="toolbar-label">Strukturen</span>
        </button>

        {/* ── Sammlung ── */}
        <button
          className={`toolbar-btn${collectionOpen ? ' active' : ''}`}
          title="Sammlung öffnen"
          aria-label="Sammlung"
          aria-pressed={collectionOpen}
          onClick={onToggleCollection}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/>
            <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
          </svg>
          <span className="toolbar-label">Sammlung</span>
          {collectionCount > 0 && <span className="toolbar-badge">{collectionCount}</span>}
        </button>

        <div className="toolbar-sep" />

        {/* ── Aktionen ── */}
        <button
          className="toolbar-btn"
          title="Ansicht zurücksetzen"
          aria-label="Ansicht zurücksetzen"
          onClick={() => resetApp()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span className="toolbar-label">Reset</span>
        </button>

        <button
          className="toolbar-btn"
          title="Fotomodus aktivieren"
          aria-label="Fotomodus aktivieren"
          onClick={() => enterPhotoMode()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="toolbar-label">Foto</span>
        </button>

        <button
          className={`toolbar-btn${labelsOn ? ' active' : ''}`}
          title="Strukturbeschriftungen ein-/ausblenden"
          aria-label="Beschriftungen"
          aria-pressed={labelsOn}
          onClick={() => setLabelsOn(toggleLabels())}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span className="toolbar-label">Labels</span>
        </button>

        <button
          className={`toolbar-btn${settingsOpen ? ' active' : ''}`}
          title="Einstellungen (Raum, Farben, Presets, Tastenkürzel)"
          aria-label="Einstellungen"
          aria-pressed={settingsOpen}
          onClick={onToggleSettings}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span className="toolbar-label">Optionen</span>
        </button>
      </div>
    </>
  )
}
