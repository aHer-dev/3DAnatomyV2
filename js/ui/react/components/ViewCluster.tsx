// ViewCluster — schwebende Kamera-Ansichts-Leiste unten-mittig im freien
// Canvas (Handoff §9.1/§10, Frames 2a–2e). Eigene Achse, getrennt von der
// Icon-Rail; ruft bestehende Kamera-Actions unverändert auf.
import React from 'react'
import { camera } from '../../../core/camera.js'
import { controls } from '../../../core/controls.js'
import { setCameraDirection } from '../../../core/cameraUtils.js'
import { requestRender } from '../../../core/renderScheduler.js'
import { resetApp } from '../../ui-reset.js'

const VIEW_DIRS = [
  { id: 'anterior',  label: 'Vorne',  title: 'Von anterior (vorne)' },
  { id: 'posterior', label: 'Hinten', title: 'Von posterior (hinten)' },
  { id: 'left',      label: 'Links',  title: 'Von links' },
  { id: 'right',     label: 'Rechts', title: 'Von rechts' },
  { id: 'cranial',   label: 'Oben',   title: 'Von kranial (oben)' },
  { id: 'caudal',    label: 'Unten',  title: 'Von kaudal (unten)' },
]

function handleDir(id: string) {
  setCameraDirection(camera, controls, controls.target.clone(), camera.position.distanceTo(controls.target), id)
  requestRender(4)
}

interface ViewClusterProps {
  /** Reset mitzeichnen. Der Desktop gibt ihn an die Icon-Rail ab (dort ist er
   *  auch bei ausgeblendeter Leiste erreichbar); das Handy-Sheet braucht ihn
   *  weiter selbst, weil es dort keine Rail gibt. */
  showReset?: boolean
}

export function ViewCluster({ showReset = true }: ViewClusterProps = {}) {
  return (
    <div className="vc-bar" role="toolbar" aria-label="Kamera-Ansichten">
      <span className="vc-label">Ansicht</span>
      {VIEW_DIRS.map(({ id, label, title }) => (
        <button key={id} className="vc-btn" title={title} onClick={() => handleDir(id)}>{label}</button>
      ))}
      {showReset && (
        <>
          <span className="vc-sep" aria-hidden="true" />
          <button
            className="vc-btn vc-btn--icon"
            title="Alles zurücksetzen"
            aria-label="Alles zurücksetzen"
            onClick={() => resetApp()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </>
      )}
    </div>
  )
}
