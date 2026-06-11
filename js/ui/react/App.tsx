import React, { useState } from 'react'
import { StructureBrowser } from './components/StructureBrowser.js'
import { SearchBar } from './components/SearchBar.js'
import { InfoPanel } from './components/InfoPanel.js'
import { MultiSelectPanel } from './components/MultiSelectPanel.js'
import { CollectionPanel } from './components/CollectionPanel.js'
import { Toolbar } from './components/Toolbar.js'

export function App() {
  const [browserOpen, setBrowserOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)

  return (
    <>
      <SearchBar />
      {browserOpen && <StructureBrowser onClose={() => setBrowserOpen(false)} />}
      {collectionOpen && <CollectionPanel onClose={() => setCollectionOpen(false)} />}
      <InfoPanel />
      <MultiSelectPanel />
      <Toolbar
        browserOpen={browserOpen}
        onToggleBrowser={() => { setBrowserOpen(o => !o); setCollectionOpen(false) }}
        collectionOpen={collectionOpen}
        onToggleCollection={() => { setCollectionOpen(o => !o); setBrowserOpen(false) }}
      />
    </>
  )
}
