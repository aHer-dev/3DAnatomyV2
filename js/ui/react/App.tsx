import React, { useState } from 'react'
import { StructureBrowser } from './components/StructureBrowser.js'
import { SearchBar } from './components/SearchBar.js'
import { InfoPanel } from './components/InfoPanel.js'
import { MultiSelectPanel } from './components/MultiSelectPanel.js'
import { CollectionPanel } from './components/CollectionPanel.js'
import { SettingsPanel } from './components/SettingsPanel.js'
import { Footer } from './components/Footer.js'
import { Toolbar } from './components/Toolbar.js'
import { IsolationBar } from './components/IsolationBar.js'

export function App() {
  const [browserOpen, setBrowserOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const closeAll = () => { setBrowserOpen(false); setCollectionOpen(false); setSettingsOpen(false) }

  return (
    <>
      <SearchBar />
      {browserOpen && <StructureBrowser onClose={() => setBrowserOpen(false)} />}
      {collectionOpen && <CollectionPanel onClose={() => setCollectionOpen(false)} />}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      <InfoPanel />
      <MultiSelectPanel />
      <IsolationBar />
      <Footer />
      <Toolbar
        browserOpen={browserOpen}
        onToggleBrowser={() => { const v = !browserOpen; closeAll(); setBrowserOpen(v) }}
        collectionOpen={collectionOpen}
        onToggleCollection={() => { const v = !collectionOpen; closeAll(); setCollectionOpen(v) }}
        settingsOpen={settingsOpen}
        onToggleSettings={() => { const v = !settingsOpen; closeAll(); setSettingsOpen(v) }}
      />
    </>
  )
}
