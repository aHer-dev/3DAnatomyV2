import React, { useState } from 'react'
import { LicenseModal } from './LicenseModal.js'

const LEARN_URL = 'https://aher-dev.github.io/Muskelfinder/index.html'

// Footer-Links im Sidebar-Fuß (Handoff §9.9): Lernen · Lizenz · Quellen ·
// Datenschutz + BodyParts3D-Attribution (CC BY 4.0, Pflicht — ADR 0005).
export function Footer() {
  const [licenseOpen, setLicenseOpen] = useState(false)

  return (
    <>
      <footer className="ft-foot" role="contentinfo">
        <nav className="ft-links" aria-label="Rechtliches und Lernen">
          <a className="ft-link" href={LEARN_URL} target="_blank" rel="noopener noreferrer">Lernen</a>
          <span className="ft-dot" aria-hidden="true">·</span>
          <button type="button" className="ft-link" onClick={() => setLicenseOpen(true)} aria-haspopup="dialog">
            Lizenz
          </button>
          <span className="ft-dot" aria-hidden="true">·</span>
          <a className="ft-link" href="./quellen-lizenzen.html">Quellen</a>
          <span className="ft-dot" aria-hidden="true">·</span>
          <a className="ft-link" href="./datenschutz.html">Datenschutz</a>
        </nav>
        <p className="ft-attribution">BodyParts3D, © DBCLS, CC BY 4.0</p>
      </footer>

      {licenseOpen && <LicenseModal onClose={() => setLicenseOpen(false)} />}
    </>
  )
}
