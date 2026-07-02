// AppShell — Overlay-Rahmen für Layout B („Angedockte Werkbank", ADR 0006).
// Icon-Rail links (Werkzeuge + ⚙) · persistente Tab-Sidebar rechts (Suche + Tabs +
// gehostete Panels + Footer) · Ansichts-Cluster unten mittig · kontextuelle Overlays.
// Werkzeug-/Kamera-Logik aus der abgelösten Toolbar.tsx übernommen.
import React, { useEffect, useState } from 'react'
import { camera } from '../../../core/camera.js'
import { controls } from '../../../core/controls.js'
import { setCameraDirection } from '../../../core/cameraUtils.js'
import { requestRender } from '../../../core/renderScheduler.js'
import { TOOL, getActiveTool, setActiveTool as setTool, onToolChange } from '../../toolbar.js'
import { loadGroupByName } from '../../../features/modelLoader-core.js'
import { unloadGroupSilent } from '../../../bootstrap/initGroupLoader.js'
import { resetApp } from '../../ui-reset.js'
import { enterPhotoMode } from '../../photoMode.js'
import { toggleLabels } from '../../../features/labels.js'
import { useReactStore } from '../useReactStore.js'

import { SearchBar } from './SearchBar.js'
import { StructureBrowser } from './StructureBrowser.js'
import { CollectionPanel } from './CollectionPanel.js'
import { InfoPanel } from './InfoPanel.js'
import { SettingsPanel } from './SettingsPanel.js'
import { Footer } from './Footer.js'
import { MultiSelectPanel } from './MultiSelectPanel.js'
import { IsolationBar } from './IsolationBar.js'

// ─── Aktiver Tool-State (imperativer toolbar.js-Kanal) ──────────────────────
function useActiveTool() {
  const [activeTool, setActiveToolState] = useState(getActiveTool)
  useEffect(() => {
    const unsubscribe = onToolChange(setActiveToolState)
    return () => { unsubscribe() }
  }, [])
  return activeTool
}

// ─── Kamera-Ansichten ───────────────────────────────────────────────────────
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

// ─── Layer-Konfiguration ────────────────────────────────────────────────────
const LAYER_GROUPS: Record<string, string[]> = {
  bones:   ['bones', 'cartilage', 'teeth'],
  muscles: ['muscles', 'ligaments'],
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const I = {
  select: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z"/></svg>,
  multi: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-7 1-4 7z"/><circle cx="18" cy="6" r="4" fill="currentColor" stroke="none"/><line x1="16" y1="6" x2="20" y2="6"/><line x1="18" y1="4" x2="18" y2="8"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>,
  focus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M3 12h2M19 12h2M12 3v2M12 19v2"/><path d="M5.6 5.6l1.4 1.4M16.9 16.9l1.5 1.5M5.6 18.4l1.4-1.4M16.9 7.1l1.5-1.5"/></svg>,
  bones: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 3a2 2 0 0 1 0 4h6a2 2 0 0 1 0-4"/><path d="M9 21a2 2 0 0 0 0-4h6a2 2 0 0 0 0 4"/><line x1="9.5" y1="7" x2="9.5" y2="17"/><line x1="14.5" y1="7" x2="14.5" y2="17"/></svg>,
  muscles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 19c-1-2-1-5 1-8l3-6c.5-1 1.5-1 2 0l1 2c1.5-1.5 3-1 3.5 1l.5 3c.5 2 0 4-1 5.5"/><path d="M7 19 Q12 22 17 19"/></svg>,
  labels: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  photo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  reset: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

const TABS: { id: 'structures' | 'collection' | 'info'; label: string }[] = [
  { id: 'structures', label: 'Strukturen' },
  { id: 'collection', label: 'Sammlung' },
  { id: 'info',       label: 'Info' },
]

// ─── Komponente ─────────────────────────────────────────────────────────────
export function AppShell() {
  const activeTool = useActiveTool()
  const [labelsOn, setLabelsOn] = useState(false)
  const [loadingLayer, setLoadingLayer] = useState<string | null>(null)

  const groups          = useReactStore(s => s.groups)
  const collectionCount = useReactStore(s => s.collection.length)
  const selectedRoot    = useReactStore(s => s.selected.root)
  const sidebarTab      = useReactStore(s => s.sidebarTab)
  const openFlyout      = useReactStore(s => s.openFlyout)
  const setSidebarTab       = useReactStore(s => s.setSidebarTab)
  const openFlyoutExclusive = useReactStore(s => s.openFlyoutExclusive)
  const closeFlyout         = useReactStore(s => s.closeFlyout)

  // Auto-Switch: Auswahl → „Info", Aufhebung → „Strukturen" (ADR 0006).
  useEffect(() => {
    setSidebarTab(selectedRoot ? 'info' : 'structures')
  }, [selectedRoot, setSidebarTab])

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

  const railBtn = (key: string, on: boolean, label: string, onClick: () => void, extra?: string) => (
    <button
      key={key}
      className={`shell-rail__btn${on ? ' shell-rail__btn--active' : ''}${extra ? ' ' + extra : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={on}
      disabled={extra === 'is-loading' || (!!loadingLayer && key.startsWith('layer-'))}
      onClick={onClick}
    >
      {I[key.replace('layer-', '') as keyof typeof I]}
    </button>
  )

  const toggleSettings = () =>
    openFlyout === 'settings' ? closeFlyout() : openFlyoutExclusive('settings')

  return (
    <>
      {/* ── Icon-Rail (links) ── */}
      <nav className="shell-rail" aria-label="Werkzeuge">
        <img className="shell-rail__logo" src="/assets/af-logo.png" alt="Anatomie Fokus" width={36} height={36} />

        <div className="shell-rail__group">
          {railBtn('select', activeTool === TOOL.SELECT, 'Einzelauswahl', () => setTool(TOOL.SELECT))}
          {railBtn('multi',  activeTool === TOOL.MULTI,  'Mehrfachauswahl', () => setTool(TOOL.MULTI))}
          {railBtn('box',    activeTool === TOOL.BOX,    'Rechteck-Auswahl', () => setTool(TOOL.BOX))}
          {railBtn('focus',  activeTool === TOOL.FOCUS,  'Auf Auswahl fokussieren', () => setTool(TOOL.FOCUS))}
        </div>

        <div className="shell-rail__sep" />

        <div className="shell-rail__group">
          {railBtn('layer-bones',   LAYER_GROUPS.bones.some(g => (groups[g]?.length ?? 0) > 0),   'Knochen / Knorpel / Zähne', () => handleLayerToggle('bones'),   loadingLayer === 'bones' ? 'is-loading' : undefined)}
          {railBtn('layer-muscles', LAYER_GROUPS.muscles.some(g => (groups[g]?.length ?? 0) > 0), 'Muskeln / Bänder',          () => handleLayerToggle('muscles'), loadingLayer === 'muscles' ? 'is-loading' : undefined)}
        </div>

        <div className="shell-rail__sep" />

        <div className="shell-rail__group">
          {railBtn('labels', labelsOn, 'Beschriftungen', () => setLabelsOn(toggleLabels()))}
          {railBtn('photo',  false,    'Fotomodus',        () => enterPhotoMode())}
          {railBtn('reset',  false,    'Ansicht zurücksetzen', () => resetApp())}
        </div>

        <button
          className={`shell-rail__btn shell-rail__settings${openFlyout === 'settings' ? ' shell-rail__btn--active' : ''}`}
          title="Einstellungen"
          aria-label="Einstellungen"
          aria-pressed={openFlyout === 'settings'}
          onClick={toggleSettings}
        >
          {I.settings}
        </button>
      </nav>

      {/* ── Tab-Sidebar (rechts) ── */}
      <aside className="shell-sidebar" aria-label="Inhalt">
        <div className="shell-sidebar__head">
          <div className="shell-searchhost"><SearchBar /></div>
          <div className="shell-tabs" role="tablist" aria-label="Ansicht">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={sidebarTab === id}
                className={`shell-tab${sidebarTab === id ? ' shell-tab--active' : ''}`}
                onClick={() => setSidebarTab(id)}
              >
                {label}
                {id === 'collection' && collectionCount > 0 && (
                  <span className="shell-tab__badge">{collectionCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="shell-sidebar__body" role="tabpanel">
          {sidebarTab === 'structures' && <StructureBrowser />}
          {sidebarTab === 'collection' && (
            <div className="shell-host"><CollectionPanel onClose={() => setSidebarTab('structures')} /></div>
          )}
          {sidebarTab === 'info' && (
            selectedRoot
              ? <InfoPanel />
              : <p className="shell-empty">Struktur auswählen, um Details zu sehen.</p>
          )}
        </div>

        <div className="shell-sidebar__foot"><Footer /></div>
      </aside>

      {/* ── Ansichts-Cluster (unten mittig) — S5 formalisiert als ViewCluster ── */}
      <div className="shell-viewcluster" role="toolbar" aria-label="Kamera-Ansichten">
        {VIEW_DIRS.map(({ id, label, title }) => (
          <button key={id} className="shell-viewbtn" title={title} onClick={() => handleDir(id)}>{label}</button>
        ))}
      </div>

      {/* ── Kontextuelle Overlays (S7 baut Multi/Isolation in den Info-Tab um) ── */}
      <MultiSelectPanel />
      <IsolationBar />

      {/* ── Settings-Flyout (S8 dockt es an die Rail) ── */}
      {openFlyout === 'settings' && <SettingsPanel onClose={closeFlyout} />}
    </>
  )
}
