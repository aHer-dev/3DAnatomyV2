import React, { useState } from 'react'
import { StructureBrowser } from './components/StructureBrowser.js'
import { SearchBar } from './components/SearchBar.js'
import { InfoPanel } from './components/InfoPanel.js'
import { MultiSelectPanel } from './components/MultiSelectPanel.js'
import { Toolbar } from './components/Toolbar.js'

export function App() {
  const [browserOpen, setBrowserOpen] = useState(false)

  return (
    <>
      <SearchBar />
      {browserOpen && <StructureBrowser onClose={() => setBrowserOpen(false)} />}
      <InfoPanel />
      <MultiSelectPanel />
      <Toolbar
        browserOpen={browserOpen}
        onToggleBrowser={() => setBrowserOpen(o => !o)}
      />
    </>
  )
}
