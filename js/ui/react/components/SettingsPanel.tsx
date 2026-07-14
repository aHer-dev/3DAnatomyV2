// SettingsPanel — Rail-Flyout links neben ⚙ (Handoff §9.7/§10, Frame 2f).
// Exklusivität über den openFlyout-Store-Slice (AppShell rendert bei
// openFlyout==='settings'). Raum-Zustand bleibt in roomSettings.js (kein
// Store-Slice: einziger Konsument ist dieses Panel).
import React, { useState, useEffect, useCallback } from 'react'
import {
  applyLighting,
  applyRoomColor,
  getRoomSettings,
  ROOM_DEFAULTS,
} from '../../../features/roomSettings.js'
import { resetColors } from '../../ui-reset.js'
import { loadPresetManifest, applyPreset } from '../../../features/presets.js'
import { LicenseModal } from './LicenseModal.js'

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

// Hintergrund-Swatches (§9.7) — Szenen-Farbdaten, keine UI-Tokens.
const BG_SWATCHES: { hex: string; label: string }[] = [
  { hex: '#0d0d0d', label: 'Schwarz' },
  { hex: '#34373c', label: 'Anthrazit' },
  { hex: '#0a0e27', label: 'Navy' },
]

// ─── Icons (15px, Stroke currentColor) ──────────────────────────────────────
const icGear = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const icClose = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const icSun = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
const icReset = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>

// ─── Slider-Zeile (Label + Wert + Accent-Fill wie .ip-slider) ───────────────
function SliderRow({ label, icon, value, min, max, step, onChange, ariaLabel }: {
  label: string
  icon?: React.ReactNode
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  ariaLabel: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="stp-row">
      <span className="stp-row__head">
        <span className="stp-row__label">{icon}{label}</span>
        <span className="stp-row__value">{Math.round(value * 100)} %</span>
      </span>
      <input
        className="stp-slider"
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-label={ariaLabel}
        style={{ '--stp-pct': `${pct}%` } as React.CSSProperties}
      />
    </label>
  )
}

// ─── Preset-Liste (Anatomie-Presets aus dem Manifest) ───────────────────────
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

// ─── Flyout ─────────────────────────────────────────────────────────────────
export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const initial = getRoomSettings()
  const [lighting, setLighting] = useState<number>(initial.lighting)
  const [brightness, setBrightness] = useState<number>(initial.brightness)
  const [color, setColor] = useState<string>(initial.color)
  const [licenseOpen, setLicenseOpen] = useState(false)

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

  const activeSwatch = BG_SWATCHES.find(s => s.hex === color.toLowerCase())?.hex ?? null

  return (
    <>
      <aside className="stp-flyout" aria-label="Einstellungen">
        <header className="stp-header">
          <span className="stp-header__title">
            <span className="stp-header__gear">{icGear}</span>
            Einstellungen
          </span>
          <button className="stp-close" onClick={onClose} aria-label="Schließen">{icClose}</button>
        </header>

        <div className="stp-body">
          <section className="stp-section">
            <h3 className="stp-section-title">Raum</h3>

            <SliderRow
              label="Helligkeit" icon={<span className="stp-row__icon">{icSun}</span>}
              value={lighting} min={0} max={2} step={0.05}
              onChange={onLighting} ariaLabel="Helligkeit (Beleuchtung)"
            />

            <SliderRow
              label="Umgebungslicht"
              value={brightness} min={0} max={1} step={0.01}
              onChange={onBrightness} ariaLabel="Umgebungslicht (Raumhelligkeit)"
            />

            <div className="stp-row">
              <span className="stp-row__head">
                <span className="stp-row__label">Hintergrund</span>
              </span>
              <div className="stp-swatches">
                {BG_SWATCHES.map(({ hex, label }) => (
                  <button
                    key={hex}
                    className={`stp-swatch${activeSwatch === hex ? ' stp-swatch--active' : ''}`}
                    style={{ background: hex }}
                    title={label}
                    aria-label={`Hintergrund ${label}`}
                    aria-pressed={activeSwatch === hex}
                    onClick={() => onColor(hex)}
                  />
                ))}
                <input
                  className="stp-swatch stp-swatch--custom"
                  type="color" value={color}
                  onChange={e => onColor(e.target.value)}
                  title="Eigene Farbe"
                  aria-label="Eigene Hintergrundfarbe"
                />
              </div>
            </div>

            <button className="stp-ghost" onClick={resetRoom}>Raum zurücksetzen</button>
          </section>

          <PresetSection />

          <section className="stp-section">
            <h3 className="stp-section-title">Tastenkürzel</h3>
            <div className="stp-keys">
              {SHORTCUTS.map(([key, desc]) => (
                <div className="stp-key-row" key={key}>
                  <span className="stp-key-label">{desc}</span>
                  <kbd className="stp-keycap">{key}</kbd>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="stp-foot">
          <button className="stp-foot__reset" onClick={() => resetColors()}>
            <span className="stp-foot__reset-icon">{icReset}</span>
            Farben zurücksetzen
          </button>
          <button
            className="stp-foot__licenses"
            onClick={() => setLicenseOpen(true)}
            aria-haspopup="dialog"
          >
            Lizenzen
          </button>
        </footer>
      </aside>

      {licenseOpen && <LicenseModal onClose={() => setLicenseOpen(false)} />}
    </>
  )
}
