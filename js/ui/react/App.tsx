import React from 'react'
import { AppShell } from './components/AppShell.js'
import { LoadingScreen } from './components/LoadingScreen.js'
import { isMuskelfinderPreviewMode } from '../../integration/muskelfinderPreview.js'

// Overlay-UI (Layout B). Panel-/Tab-Zustand lebt im Zustand-Store (ADR 0006),
// nicht mehr als lokaler useState. Der gesamte Rahmen steckt in AppShell.
// Im Muskelfinder-Preview-Modus rendert nur der LoadingScreen (§9.11) —
// das Shell-Overlay bleibt dort bewusst weg.
export function App() {
  if (isMuskelfinderPreviewMode()) return <LoadingScreen />
  return (
    <>
      <LoadingScreen />
      <AppShell />
    </>
  )
}
