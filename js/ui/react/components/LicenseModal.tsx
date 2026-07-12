import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface LicenseModalProps {
  onClose: () => void
}

interface Attribution {
  title: string
  source: React.ReactNode
  tag: string
  tagHref: string
}

// Attribution & Lizenzen — Pflichtangaben (BodyParts3D CC BY, FMA, three.js,
// Draco), Inhalt aus der gelöschten licenseContent.js. Layout: Handoff §9.10
// (zentrierte Card, Zeilen mit Lizenz-Tag rechts, Fokus-Trap, ESC schließt).
const ATTRIBUTIONS: Attribution[] = [
  {
    title: 'BodyParts3D',
    source: (
      <>© Database Center for Life Science (DBCLS), Japan — Projektattribution: „BodyParts3D, © DBCLS, CC BY 4.0”{' '}
        (<a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noopener noreferrer">Archiv-Lizenzseite</a>)</>
    ),
    tag: 'CC BY 4.0',
    tagHref: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    title: 'FMA — Foundational Model of Anatomy',
    source: (
      <>© University of Washington, Seattle — Attribution: „FMA, © University of Washington, CC BY 3.0”{' '}
        (<a href="https://obofoundry.org/ontology/fma.html" target="_blank" rel="noopener noreferrer">OBO-Eintrag</a>)</>
    ),
    tag: 'CC BY 3.0',
    tagHref: 'https://creativecommons.org/licenses/by/3.0/',
  },
  {
    title: 'three.js',
    source: 'JavaScript 3D Library, inkl. OrbitControls, GLTFLoader, DRACOLoader',
    tag: 'MIT',
    tagHref: 'https://github.com/mrdoob/three.js/blob/dev/LICENSE',
  },
  {
    title: 'Draco 3D Data Compression',
    source: (
      <>© Google LLC (<a href="https://github.com/google/draco" target="_blank" rel="noopener noreferrer">GitHub</a>)</>
    ),
    tag: 'Apache 2.0',
    tagHref: 'https://www.apache.org/licenses/LICENSE-2.0',
  },
]

export function LicenseModal({ onClose }: LicenseModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Fokus-Trap + ESC (§9.10): Fokus startet auf der Card, Tab zirkuliert
  // innerhalb des Dialogs, beim Schließen kehrt er zum Auslöser zurück.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const opener = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(card.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))

    card.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === card)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [onClose])

  // Portal an document.body: Host-Panels (Sidebar/Flyout) haben backdrop-filter
  // und bilden damit einen Containing Block, der position:fixed einfangen würde.
  return createPortal(
    <div className="lic-backdrop" onClick={onClose}>
      <div
        ref={cardRef}
        className="lic-card"
        role="dialog"
        aria-labelledby="license-title"
        aria-modal="true"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <header className="lic-header">
          <h2 id="license-title">Lizenzen &amp; Attribution</h2>
          <button type="button" className="lic-close" onClick={onClose} aria-label="Lizenzhinweise schließen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <ul className="lic-rows">
          {ATTRIBUTIONS.map(({ title, source, tag, tagHref }) => (
            <li className="lic-row" key={title}>
              <div className="lic-row__text">
                <span className="lic-row__title">{title}</span>
                <span className="lic-row__source">{source}</span>
              </div>
              <a className="lic-tag" href={tagHref} target="_blank" rel="noopener noreferrer">{tag}</a>
            </li>
          ))}
        </ul>

        <p className="lic-note">
          Diese Seite ist eine <strong>statische</strong> Auslieferung ohne Login und ohne integriertes Analyse-Tracking.
          Für die App-Funktion werden jedoch lokale Browser-Speicherungen genutzt, und bei öffentlicher Bereitstellung
          entstehen technisch notwendige Abrufe an den Hosting-Anbieter (GitHub Pages). Inhalte von fremden
          Servern werden nicht geladen.
          Mehr Details stehen unter{' '}
          <a href="./quellen-lizenzen.html">Quellen &amp; Lizenzen</a> und{' '}
          <a href="./datenschutz.html">Datenschutz</a>.
        </p>

        <footer className="lic-foot">
          <button type="button" className="lic-cta" onClick={onClose}>Schließen</button>
        </footer>
      </div>
    </div>,
    document.body
  )
}
