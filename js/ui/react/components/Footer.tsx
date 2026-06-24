import React, { useState } from 'react'
import { LicenseModal } from './LicenseModal.js'

const LEARN_URL = 'https://aher-dev.github.io/Muskelfinder/index.html'

// Ersetzt den alten DOM-Footer + die doppelten Rechtliches-Blöcke aus #controls.
export function Footer() {
  const [licenseOpen, setLicenseOpen] = useState(false)

  return (
    <>
      <footer className="ft-bar" role="contentinfo">
        <a className="ft-link ft-link--learn" href={LEARN_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Lernen
        </a>
        <span className="ft-sep" aria-hidden="true" />
        <button type="button" className="ft-link" onClick={() => setLicenseOpen(true)} aria-haspopup="dialog">
          Lizenz
        </button>
        <a className="ft-link" href="./quellen-lizenzen.html">Quellen &amp; Lizenzen</a>
        <a className="ft-link" href="./datenschutz.html">Datenschutz</a>
        <span className="ft-attribution">BodyParts3D, © DBCLS, CC BY 4.0</span>
      </footer>

      {licenseOpen && <LicenseModal onClose={() => setLicenseOpen(false)} />}
    </>
  )
}
