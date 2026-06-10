// ============================================
// meta.js - Bereinigte Version
// ============================================
import { dataPath } from '../core/path.js';
import { getStore, INITIAL_COLORS, DEFAULT_COLOR } from '../store/useStore.js';
import { decorateStructureEntry } from '../utils/anatomyLabels.js';

let cachedMeta = null;

/**
 * Lädt meta.json nur einmal und cached das Ergebnis
 */
export async function getMeta() {
    if (!cachedMeta) {
        try {
            // WICHTIG: dataPath() als Funktion aufrufen!
            const url = dataPath('meta.json');
            console.log('📂 Lade Meta von:', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            cachedMeta = (await response.json()).map((entry) => decorateStructureEntry(entry));
            console.log(`✅ meta.json geladen – ${cachedMeta.length} Einträge`);
        } catch (error) {
            console.error("❌ Fehler beim Laden der Metadaten:", error);
            cachedMeta = [];
        }
    }
    return cachedMeta;
}

/**
 * Initialisiert Gruppen aus Meta-Daten
 */
export async function initializeGroupsFromMeta() {
    const meta = await getMeta();

    if (!meta || !meta.length) {
        console.warn('⚠️ Keine Meta-Daten vorhanden');
        return;
    }

    const basename = (s) => { try { return s.split('/').pop(); } catch { return s; } };
    const stripExt = (s) => s.replace(/\.[^/.]+$/, '');

    // 1) Gruppieren nach classification.group
    const groupedMeta = meta.reduce((acc, entry) => {
        const g = entry?.classification?.group || 'other';
        (acc[g] ||= []).push(entry);
        return acc;
    }, {});
    const availableGroups = Object.keys(groupedMeta);

    // 2) Lookup-Indizes erstellen
    const metaById = Object.create(null);
    const metaByFile = Object.create(null);

    for (const entries of Object.values(groupedMeta)) {
        for (const entry of entries) {
            const id = (entry?.id || entry?.fma || '').toString().trim();
            if (id) {
                metaById[id] = entry;
                const fmaId = (entry?.info?.links?.fma || '').toString().trim();
                if (fmaId && fmaId !== id) metaById[fmaId] = entry;
            }

            const current = entry?.model?.current || 'draco';
            const variant = entry?.model?.variants?.[current];
            const candidates = [variant?.filename, entry?.filename]
                .filter(v => typeof v === 'string' && v.length > 0);
            if (candidates.length) {
                const file = basename(candidates[0]);
                metaByFile[file] = entry;
                metaByFile[stripExt(file)] = entry;
            }
        }
    }

    // 3) Alles auf einmal in den Store schreiben
    getStore().setMetaData({ groupedMeta, availableGroups, metaById, metaByFile });

    // 4) Gruppenfarben initialisieren (nur wo noch nicht gesetzt)
    const { colors } = getStore();
    for (const g of availableGroups) {
        if (!(g in colors)) {
            getStore().setGroupColor(g, INITIAL_COLORS[g] ?? DEFAULT_COLOR);
        }
        // Sichtbarkeit auf false (wird beim Laden aktiviert)
        if (!(g in getStore().groupStates)) {
            getStore().setGroupVisible(g, false);
        }
    }

    console.log('✅ Gruppen initialisiert:', availableGroups);
    console.log('🧭 Meta-Index:',
        Object.keys(metaById).length, 'IDs,',
        Object.keys(metaByFile).length, 'Dateinamen'
    );
}

/**
 * Helper-Funktionen für Meta-Zugriff
 */
export function getMetaById(id) {
    if (!id) return null;
    return getStore().metaById?.[id] ?? null;
}

export function getMetaByFile(filename) {
    if (!filename) return null;
    const file = filename.split('/').pop();
    const base = file.replace(/\.[^/.]+$/, '');
    const { metaByFile } = getStore();
    return metaByFile?.[file] ?? metaByFile?.[base] ?? null;
}

export function getMetaByGroup(group) {
    return getStore().groupedMeta?.[group] ?? [];
}

export function getSubgroupsForGroup(group) {
    const entries = getMetaByGroup(group);
    const subgroups = new Set();

    entries.forEach(entry => {
        const subgroup = entry?.classification?.subgroup;
        if (subgroup) subgroups.add(subgroup);
    });

    return Array.from(subgroups).sort();
}
