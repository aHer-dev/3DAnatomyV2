// js/features/collectionView.js
// DOM-freie Kernlogik der Sammlung: Modelle auflösen und nur die Sammlung anzeigen.
// Die UI (React CollectionPanel) ruft diese Funktionen auf.

import { getStore } from '../store/useStore.js';
import { loadGroupByName } from './modelLoader-core.js';
import { showModel, hideModel } from './visibility.js';
import { setModelColor, setModelOpacity } from './appearance.js';
import { requestRender } from '../core/renderScheduler.js';

// ─── Modell-Auflösung ───────────────────────────────────────────────────────

function buildModelIndex() {
    const index = new Map();
    for (const models of Object.values(getStore().groups || {})) {
        for (const model of models) {
            const ids = [
                model.userData?.meta?.id,
                model.userData?.meta?.fma,
                model.userData?.entry?.id,
                model.userData?.entry?.fma,
                model.name,
            ];
            for (const id of ids) {
                if (id && !index.has(String(id))) index.set(String(id), model);
            }
        }
    }
    return index;
}

/**
 * Stellt sicher, dass jedes Sammlungs-Item auf ein aktuell geladenes Modell zeigt.
 * Nötig, weil Modelle beim Gruppen-Reload neu erzeugt werden.
 */
function synchronizeCollection() {
    const index = buildModelIndex();
    let notFound = 0;

    for (const item of getStore().collection) {
        const valid = item.model?.parent && !item.model.parent.userData?.disposed;
        if (valid) continue;

        const found = index.get(String(item.id));
        if (found) item.model = found;
        else notFound++;
    }

    if (notFound > 0) console.warn(`collectionView: ${notFound} Modelle nicht gefunden`);
}

// ─── Sammlung anzeigen ──────────────────────────────────────────────────────

/**
 * Lädt fehlende Gruppen, blendet alles aus und zeigt nur die Sammlung.
 * @returns {Promise<number>} Anzahl angezeigter Objekte
 */
export async function showCollectionInScene() {
    const collection = getStore().collection;
    if (!collection || collection.length === 0) return 0;

    // Fehlende Gruppen nachladen (zeigt je eigene Ladeanzeige)
    const requiredGroups = [...new Set(collection.map(i => i.group).filter(Boolean))];
    const loadedGroups = Object.keys(getStore().groups || {})
        .filter(g => (getStore().groups[g] || []).length > 0);
    const missing = requiredGroups.filter(g => !loadedGroups.includes(g));

    for (const group of missing) {
        try {
            await loadGroupByName(group, { centerCamera: false });
        } catch (err) {
            console.error(`collectionView: Fehler beim Laden von "${group}":`, err);
        }
    }

    synchronizeCollection();

    // Alles ausblenden …
    for (const models of Object.values(getStore().groups || {})) {
        for (const model of models) hideModel(model);
    }

    // … dann nur die Sammlung mit ihren gespeicherten Farben/Opazitäten zeigen
    let shown = 0;
    for (const item of collection) {
        if (!item.model?.parent) continue;
        if (item.color !== undefined) setModelColor(item.model, item.color);
        if (item.opacity !== undefined && item.opacity < 1) setModelOpacity(item.model, item.opacity);
        showModel(item.model);
        shown++;
    }

    requestRender();
    return shown;
}

/**
 * Leert die Sammlung und stellt die Standard-Sichtbarkeit aller Modelle wieder her.
 */
export function clearCollectionAndRestore() {
    getStore().clearCollection();
    for (const models of Object.values(getStore().groups || {})) {
        for (const model of models) showModel(model);
    }
    requestRender();
}
