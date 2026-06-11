import React from 'react'
import { StructureBrowser } from './components/StructureBrowser.js'
import { SearchBar } from './components/SearchBar.js'
import { InfoPanel } from './components/InfoPanel.js'
import { MultiSelectPanel } from './components/MultiSelectPanel.js'

export function App() {
  return (
    <>
      <SearchBar />
      <StructureBrowser />
      <InfoPanel />
      <MultiSelectPanel />
    </>
  )
}
