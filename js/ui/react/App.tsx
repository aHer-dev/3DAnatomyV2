import React from 'react'
import { AppShell } from './components/AppShell.js'

// Overlay-UI (Layout B). Panel-/Tab-Zustand lebt im Zustand-Store (ADR 0006),
// nicht mehr als lokaler useState. Der gesamte Rahmen steckt in AppShell.
export function App() {
  return <AppShell />
}
