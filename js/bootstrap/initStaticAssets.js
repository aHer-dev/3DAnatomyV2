// js/bootstrap/initStaticAssets.js
// 🔧 Initialisiert Ladebilder (Sticker) und Favicon dynamisch je nach BasePath

import { withBase } from '../core/path.js';

/**
 * Setzt dynamisch Pfade für Lade-Sticker und Favicon.
 * Sorgt für korrekte Darstellung auch bei Deployment auf z. B. GitHub Pages.
 */
export function initStaticAssets() {
    ['loading-sticker', 'live-loading-sticker'].forEach(id => {
        const img = document.getElementById(id);
        if (img) {
            img.src = withBase(`images/${id}.png`);
        }
    });

    const faviconLink = document.querySelector('link[rel="icon"]');
    if (faviconLink) {
        faviconLink.href = withBase('favicon.ico');
    }

    console.log('🧩 Statische Assets initialisiert.');
}
