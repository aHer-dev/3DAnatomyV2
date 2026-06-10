import { defineConfig } from 'vite'

export default defineConfig({
  // './' = relative Pfade → funktioniert auf GitHub Pages egal unter welchem Pfad
  base: './',

  build: {
    outDir: 'dist',
    // Modelle sind groß — Chunk-Size-Warnung erst ab 2 MB
    chunkSizeWarningLimit: 2000,
  },

  server: {
    // Erlaubt dem Dev-Server Dateien aus dem gesamten Projektverzeichnis zu lesen
    fs: {
      allow: ['.'],
    },
  },
})
