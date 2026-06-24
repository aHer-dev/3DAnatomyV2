import React, { useState, useEffect, useCallback } from 'react'
import {
  applyLighting,
  applyRoomColor,
  getRoomSettings,
  ROOM_DEFAULTS,
} from '../../../features/roomSettings.js'
import { resetColors } from '../../ui-reset.js'
import { loadPresetManifest, applyPreset } from '../../../features/presets.js'

interface Preset {
  name: string
  file: string
  description?: string
  category?: string
}

interface SettingsPanelProps {
  onClose: () => void
}

const SHORTCUTS: [string, string][] = [
  ['/', 'Suche öffnen'],
  ['G', 'Ghost (durchsichtig)'],
  ['H', 'Verstecken'],
  ['S', 'Anzeigen'],
  ['Esc', 'Auswahl aufheben'],
  ['Strg+Klick', 'Mehrfachauswahl'],
]

// ─── Preset-Liste ───────────────────────────────────────────────────────────

function PresetSection() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadPresetManifest().then(list => {
      if (alive) { setPresets(list as Preset[]); setLoading(false) }
    })
    return () => { alive = false }
  }, [])

  const handleApply = useCallback(async (preset: Preset) => {
    if (progress) return
    setError(null)
    setProgress(`Lade: ${preset.name}`)
    try {
      await applyPreset(preset, text => setProgress(text))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }, [progress])

  return (
    <section className="stp-section">
      <h3 className="stp-section-title">Presets</h3>
      {loading && <p className="stp-hint">Lädt…</p>}
      {!loading && presets.length === 0 && <p className="stp-hint">Keine Presets vorhanden</p>}
      <ul className="stp-preset-list" role="listbox" aria-label="Preset auswählen">
        {presets.map(p => (
          <li key={p.file} role="option" aria-selected={false}>
            <button className="stp-preset-item" onClick={() => handleApply(p)} disabled={!!progress}>
              <span className="stp-preset-name">{p.name}</span>
              {p.description && <span className="stp-preset-desc">{p.description}</span>}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="stp-error">Fehler: {error}</p>}
      {progress && (
        <div className="stp-overlay" role="status">
          <div className="stp-spinner" />
          <p>{progress}</p>
        </div>
      )}
    </section>
  )
}

// ─── Hauptpanel ─────────────────────────────────────────────────────────────

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const initial = getRoomSettings()
  const [lighting, setLighting] = useState<number>(initial.lighting)
  const [brightness, setBrightness] = useState<number>(initial.brightness)
  const [color, setColor] = useState<string>(initial.color)

  const onLighting = useCallback((v: number) => {
    setLighting(v)
    applyLighting(v)
  }, [])

  const onBrightness = useCallback((v: number) => {
    setBrightness(v)
    applyRoomColor(color, v)
  }, [color])

  const onColor = useCallback((hex: string) => {
    setColor(hex)
    applyRoomColor(hex, brightness)
  }, [brightness])

  const resetRoom = useCallback(() => {
    setLighting(ROOM_DEFAULTS.lighting)
    setBrightness(ROOM_DEFAULTS.brightness)
    setColor(ROOM_DEFAULTS.color)
    applyLighting(ROOM_DEFAULTS.lighting)
    applyRoomColor(ROOM_DEFAULTS.color, ROOM_DEFAULTS.brightness)
  }, [])

  return (
    <aside className="stp-panel" aria-label="Einstellungen">
      <div className="stp-header">
        <span>Einstellungen</span>
        <button className="stp-close" onClick={onClose} aria-label="Schließen">✕</button>
      </div>

      <div className="stp-body">
        <section className="stp-section">
          <h3 className="stp-section-title">Raum</h3>

          <label className="stp-control">
            <span className="stp-control-label">Beleuchtung <em>{Math.round(lighting * 100)}%</em></span>
            <input
              type="range" min={0} max={2} step={0.05} value={lighting}
              onChange={e => onLighting(parseFloat(e.target.value))}
              aria-label="Beleuchtung"
            />
          </label>

          <label className="stp-control">
            <span className="stp-control-label">Helligkeit <em>{Math.round(brightness * 100)}%</em></span>
            <input
              type="range" min={0} max={1} step={0.01} value={brightness}
              onChange={e => onBrightness(parseFloat(e.target.value))}
              aria-label="Raumhelligkeit"
            />
          </label>

          <label className="stp-control stp-control--row">
            <span className="stp-control-label">Raumfarbe</span>
            <input
              type="color" value={color}
              onChange={e => onColor(e.target.value)}
              aria-label="Raumfarbe"
            />
          </label>

          <button className="stp-btn" onClick={resetRoom}>
            Raum zurücksetzen
          </button>
        </section>

        <section className="stp-section">
          <h3 className="stp-section-title">Modellfarben</h3>
          <button className="stp-btn" onClick={() => resetColors()}>
            Modellfarben zurücksetzen
          </button>
        </section>

        <PresetSection />

        <section className="stp-section">
          <h3 className="stp-section-title">Tastenkürzel</h3>
          <table className="stp-shortcuts">
            <tbody>
              {SHORTCUTS.map(([key, desc]) => (
                <tr key={key}>
                  <td><kbd>{key}</kbd></td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </aside>
  )
}
