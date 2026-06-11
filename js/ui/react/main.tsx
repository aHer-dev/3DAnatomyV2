import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'

export function mountReactUI() {
  const container = document.getElementById('ui-root')
  if (!container) {
    console.warn('⚠️ #ui-root nicht gefunden — React UI wird nicht gemountet')
    return
  }
  createRoot(container).render(<App />)
}
