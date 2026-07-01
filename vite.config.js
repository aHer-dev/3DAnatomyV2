import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  // './' = relative Pfade → funktioniert auf GitHub Pages egal unter welchem Pfad
  base: './',

  build: {
    outDir: 'dist',
    // Modelle sind groß — Chunk-Size-Warnung erst ab 2 MB
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // index.html allein reicht nicht: Footer/LicenseModal verlinken auf die
      // eigenständigen Rechtsseiten — ohne expliziten Input fehlten sie im
      // dist/-Output und damit auf der deployten Seite (404).
      input: {
        main: resolve(__dirname, 'index.html'),
        'quellen-lizenzen': resolve(__dirname, 'quellen-lizenzen.html'),
        datenschutz: resolve(__dirname, 'datenschutz.html'),
      },
    },
  },

  server: {
    // Erlaubt dem Dev-Server Dateien aus dem gesamten Projektverzeichnis zu lesen
    fs: {
      allow: ['.'],
    },
  },
})
