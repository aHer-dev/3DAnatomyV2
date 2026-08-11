// AppShell — Overlay-Rahmen für Layout B („Angedockte Werkbank", ADR 0006).
// Icon-Rail links (Werkzeuge + ⚙) · persistente Tab-Sidebar rechts (Suche + Tabs +
// gehostete Panels + Footer) · ViewCluster unten mittig · kontextuelle Overlays.
// Werkzeug-Logik aus der abgelösten Toolbar.tsx übernommen; Kamera-Ansichten
// + Reset leben in ViewCluster.tsx (S5, Handoff §10).
import React, { useEffect, useState } from 'react'
import { assetPath } from '../../../core/path.js'
import { requestRender } from '../../../core/renderScheduler.js'
import { TOOL, getActiveTool, setActiveTool as setTool, onToolChange } from '../../toolbar.js'
import { loadGroupByName, unloadGroupSilent } from '../../../features/modelLoader-core.js'
import { setGroupVisibility } from '../../../features/visibility.js'
import { applyThemeRoomColor } from '../../../features/roomSettings.js'
import { enterPhotoMode } from '../../photoMode.js'
import { toggleLabels } from '../../../features/labels.js'
import { useReactStore } from '../useReactStore.js'

import { SearchBar } from './SearchBar.js'
import { ViewCluster } from './ViewCluster.js'
import { StructureBrowser } from './StructureBrowser.js'
import { CollectionPanel } from './CollectionPanel.js'
import { InfoPanel } from './InfoPanel.js'
import { SettingsPanel } from './SettingsPanel.js'
import { Footer } from './Footer.js'
import { MultiSelectPanel } from './MultiSelectPanel.js'
import { IsolationBanner, IsolationSubtitle } from './IsolationBar.js'

// ─── Aktiver Tool-State (imperativer toolbar.js-Kanal) ──────────────────────
function useActiveTool() {
  const [activeTool, setActiveToolState] = useState(getActiveTool)
  useEffect(() => {
    const unsubscribe = onToolChange(setActiveToolState)
    return () => { unsubscribe() }
  }, [])
  return activeTool
}

// ─── Layer-Konfiguration ────────────────────────────────────────────────────
// Bänder gehören nicht mehr zum Muskel-Schalter: sie sind seit dem neuen
// Startbild von Anfang an geladen. Bliebe die Kopplung, hielte sich der
// Rail-Knopf schon beim Start für „an" und sein erster Klick würfe die
// Bänder weg statt die Muskeln zu laden.
const LAYER_GROUPS: Record<string, string[]> = {
  bones:   ['bones', 'cartilage', 'teeth'],
  muscles: ['muscles'],
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
  layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  cube: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  photo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
}

const TABS: { id: 'structures' | 'collection' | 'info'; label: string }[] = [
  { id: 'structures', label: 'Strukturen' },
  { id: 'collection', label: 'Sammlung' },
  { id: 'info',       label: 'Info' },
]

// Schmal-Screen = derselbe Breakpoint wie die Sheet-Media-Query (responsive.css).
// Nur zum Auto-Öffnen des Panel-Sheets bei Auswahl; das übrige Umschalten ist CSS-only.
const MOBILE_QUERY = '(max-width: 768px)'
function isNarrowScreen(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_QUERY).matches
}

// Fokus auf das erste SICHTBARE Element eines Selektors (Rail vs. Tab-Leiste sind
// je nach Breakpoint display:none). Für die Fokus-Rückgabe beim ESC-Schließen.
function focusVisible(selector: string): void {
  const el = Array.from(document.querySelectorAll<HTMLElement>(selector))
    .find(e => e.offsetParent !== null)
  el?.focus()
}

// ─── Komponente ─────────────────────────────────────────────────────────────
export function AppShell() {
  const activeTool = useActiveTool()
  const [labelsOn, setLabelsOn] = useState(false)
  const [loadingLayer, setLoadingLayer] = useState<string | null>(null)

  const groups          = useReactStore(s => s.groups)
  const collectionCount = useReactStore(s => s.collection.length)
  const selectedRoot    = useReactStore(s => s.selected.root)
  const multiCount      = useReactStore(s => s.multiSelected.size)
  const isolationActive = useReactStore(s => s.isolation.model !== null)
  const sidebarTab      = useReactStore(s => s.sidebarTab)
  const sidebarCollapsed = useReactStore(s => s.sidebarCollapsed)
  const openFlyout      = useReactStore(s => s.openFlyout)
  const mobileSheet     = useReactStore(s => s.mobileSheet)
  const setSidebarTab       = useReactStore(s => s.setSidebarTab)
  const setSidebarCollapsed    = useReactStore(s => s.setSidebarCollapsed)
  const toggleSidebarCollapsed = useReactStore(s => s.toggleSidebarCollapsed)
  const theme       = useReactStore(s => s.theme)
  const toggleTheme = useReactStore(s => s.toggleTheme)

  // Das Theme lebt als [data-theme] auf <html>; variables.css hängt die
  // Token-Sätze daran. Die Bühne bleibt in beiden Themes dunkel, wechselt aber
  // den Ton mit — es sei denn, jemand hat selbst eine Raumfarbe gewählt.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    applyThemeRoomColor(theme)
  }, [theme])
  const openFlyoutExclusive = useReactStore(s => s.openFlyoutExclusive)
  const closeFlyout         = useReactStore(s => s.closeFlyout)
  const openMobileSheet     = useReactStore(s => s.openMobileSheet)
  const closeMobileSheet    = useReactStore(s => s.closeMobileSheet)

  // Auto-Switch: Auswahl (einzeln oder mehrfach) → „Info", Aufhebung → „Strukturen" (ADR 0006).
  // Auf Schmal-Screens poppt die Auswahl zusätzlich das Panel-Sheet auf (Frame „Info-Sheet").
  // Auf Desktop klappt eine eingeklappte Sidebar wieder auf — die Details wären sonst
  // hinter einem zweiten Klick versteckt, obwohl der Tab bereits auf „Info" steht.
  useEffect(() => {
    const selecting = !!selectedRoot || multiCount > 0
    setSidebarTab(selecting ? 'info' : 'structures')
    if (!selecting) return
    if (isNarrowScreen()) openMobileSheet('panel')
    else setSidebarCollapsed(false)
  }, [selectedRoot, multiCount, setSidebarTab, openMobileSheet, setSidebarCollapsed])

  // A11y (§14): ESC schließt das offene Settings-Flyout bzw. Mobile-Sheet und gibt
  // den Fokus an das auslösende Bedienelement zurück (Rail-⚙ / Tab-Leiste). Nur aktiv,
  // solange etwas offen ist. Das LicenseModal hat einen eigenen Trap (fängt ESC vorher ab).
  useEffect(() => {
    if (openFlyout !== 'settings' && mobileSheet === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (openFlyout === 'settings')       { closeFlyout();      focusVisible('[aria-label="Einstellungen"]') }
      else if (mobileSheet === 'panel')    { closeMobileSheet(); focusVisible('[aria-label="Strukturen"]') }
      else if (mobileSheet === 'view')     { closeMobileSheet(); focusVisible('[aria-label="Ansicht"]') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openFlyout, mobileSheet, closeFlyout, closeMobileSheet])

  async function handleLayerToggle(system: string) {
    if (loadingLayer) return
    const groupList = LAYER_GROUPS[system]
    const isLoaded = groupList.some(g => (groups[g]?.length ?? 0) > 0)
    setLoadingLayer(system)
    try {
      if (isLoaded) {
        for (const g of groupList) await unloadGroupSilent(g)
      } else {
        for (const g of groupList) {
          await loadGroupByName(g, { centerCamera: false })
          // Sichtbarkeit ausdrücklich setzen, sonst kennt der Store die Gruppe
          // als „geladen, aber unsichtbar" — der Schalter im Tab „Strukturen"
          // stünde auf aus, während das Modell längst in der Szene liegt.
          setGroupVisibility(g, true)
        }
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
        {/* Zwei Logo-Dateien, eine pro Theme — dieselbe Wahl wie im Muskelfinder
            (BrandMark.tsx): die weiße Marke verschwindet auf hellem Glas, die
            dunkle auf schwarzem. */}
        <img
          className="shell-rail__logo"
          src={assetPath(theme === 'dark' ? 'af-logo.png' : 'af-logo-dark.png')}
          alt="Anatomie Fokus"
          width={36}
          height={36}
        />

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
        </div>

        <button
          className="shell-rail__btn shell-rail__theme"
          title={theme === 'light' ? 'Dunkles Design' : 'Helles Design'}
          aria-label={theme === 'light' ? 'Zu dunklem Design wechseln' : 'Zu hellem Design wechseln'}
          onClick={toggleTheme}
        >
          {theme === 'light' ? I.moon : I.sun}
        </button>

        <button
          className={`shell-rail__btn${openFlyout === 'settings' ? ' shell-rail__btn--active' : ''}`}
          title="Einstellungen"
          aria-label="Einstellungen"
          aria-pressed={openFlyout === 'settings'}
          onClick={toggleSettings}
        >
          {I.settings}
        </button>
      </nav>

      {/* ── Tab-Sidebar (rechts) · mobil: Bottom-Sheet (--open steuert Slide) ── */}
      <aside
        id="shell-sidebar"
        className={`shell-sidebar${mobileSheet === 'panel' ? ' shell-sidebar--open' : ''}${sidebarCollapsed ? ' shell-sidebar--collapsed' : ''}`}
        aria-label="Inhalt"
        // Eingeklappt liegt die Leiste außerhalb des Bildes: kein Tab-Fokus, keine
        // Vorlesung durch Screenreader. Das offene Mobile-Sheet hat Vorrang, sonst
        // wäre es nach einem Wechsel Desktop→Mobil tot.
        inert={sidebarCollapsed && mobileSheet !== 'panel'}
      >
        <div className="shell-sidebar__head">
          <div className="shell-sidebar__headrow">
            <div className="shell-searchhost"><SearchBar /></div>
            <button
              className="shell-collapse"
              title="Leiste ausblenden"
              aria-label="Leiste ausblenden"
              aria-expanded={true}
              aria-controls="shell-sidebar"
              onClick={toggleSidebarCollapsed}
            >
              {I.chevronRight}
            </button>
          </div>
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

        <IsolationBanner />

        <div className="shell-sidebar__body" role="tabpanel">
          {sidebarTab === 'structures' && <StructureBrowser />}
          {sidebarTab === 'collection' && <CollectionPanel />}
          {sidebarTab === 'info' && (
            multiCount > 0
              ? <MultiSelectPanel />
              : selectedRoot
                ? <InfoPanel />
                : <p className="shell-empty">Struktur auswählen, um Details zu sehen.</p>
          )}
        </div>

        <div className="shell-sidebar__foot"><Footer /></div>
      </aside>

      {/* ── Griff am rechten Rand — einziger Rest der eingeklappten Leiste.
             Nur Desktop; mobil blendet responsive.css ihn aus (dort regelt die
             Tab-Leiste das Öffnen). ── */}
      {sidebarCollapsed && (
        <button
          className="shell-grip"
          title="Leiste einblenden"
          aria-label="Leiste einblenden"
          aria-expanded={false}
          aria-controls="shell-sidebar"
          onClick={toggleSidebarCollapsed}
        >
          {I.chevronLeft}
        </button>
      )}

      {/* ── Unten-mittig: Ansichts-Cluster, in der Isolation der Untertitel (Frame 2e).
             Mobil ist der Float-Cluster ausgeblendet (→ „Ansicht"-Sheet). Er steht fest
             in der Fenstermitte und weicht nichts mehr aus — siehe view-cluster.css. ── */}
      {isolationActive ? <IsolationSubtitle /> : <ViewCluster />}

      {/* ── Settings-Flyout links neben der Rail (S8, Frame 2f) · mobil als Sheet ── */}
      {openFlyout === 'settings' && <SettingsPanel onClose={closeFlyout} />}

      {/* ── Mobile: Backdrop hinter offenen Sheets (Desktop via CSS unsichtbar) ── */}
      {(mobileSheet !== null || openFlyout === 'settings') && (
        <div
          className="sheet-backdrop"
          aria-hidden="true"
          onClick={() => { closeMobileSheet(); closeFlyout() }}
        />
      )}

      {/* ── Mobile: Ansicht-Sheet (Kamera-Cluster, wiederverwendet als Sheet-Inhalt) ── */}
      {mobileSheet === 'view' && (
        <div className="vc-sheet" role="dialog" aria-label="Ansicht">
          <ViewCluster />
        </div>
      )}

      {/* ── Mobile: untere Tab-Leiste statt Rail (§13) — Desktop via CSS ausgeblendet ── */}
      <nav className="shell-tabbar" aria-label="Navigation">
        <button
          className={`shell-tabbar__btn${activeTool === TOOL.SELECT && mobileSheet === null && openFlyout !== 'settings' ? ' shell-tabbar__btn--active' : ''}`}
          aria-label="Auswählen"
          onClick={() => { setTool(TOOL.SELECT); closeMobileSheet(); closeFlyout() }}
        >
          {I.select}
        </button>
        <button
          className={`shell-tabbar__btn${mobileSheet === 'panel' ? ' shell-tabbar__btn--active' : ''}`}
          aria-label="Strukturen"
          aria-pressed={mobileSheet === 'panel'}
          onClick={() => (mobileSheet === 'panel' ? closeMobileSheet() : openMobileSheet('panel'))}
        >
          {I.layers}
        </button>
        <button
          className={`shell-tabbar__btn${labelsOn ? ' shell-tabbar__btn--active' : ''}`}
          aria-label="Beschriftungen"
          aria-pressed={labelsOn}
          onClick={() => setLabelsOn(toggleLabels())}
        >
          {I.labels}
        </button>
        <button
          className={`shell-tabbar__btn${mobileSheet === 'view' ? ' shell-tabbar__btn--active' : ''}`}
          aria-label="Ansicht"
          aria-pressed={mobileSheet === 'view'}
          onClick={() => (mobileSheet === 'view' ? closeMobileSheet() : openMobileSheet('view'))}
        >
          {I.cube}
        </button>
        <button
          className={`shell-tabbar__btn${openFlyout === 'settings' ? ' shell-tabbar__btn--active' : ''}`}
          aria-label="Einstellungen"
          aria-pressed={openFlyout === 'settings'}
          onClick={toggleSettings}
        >
          {I.settings}
        </button>
      </nav>
    </>
  )
}
