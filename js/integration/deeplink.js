// js/integration/deeplink.js
// URL-Deep-Links: ?s=femur  →  Struktur laden + fokussieren
//                 ?view=anterior  →  Kameraansicht setzen
// URL wird bei Auswahl automatisch aktualisiert (history.replaceState).

import { getStore, subscribeStore } from '../store/useStore.js';
import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { setCameraDirection, focusOnObject } from '../core/cameraUtils.js';
import { requestRender } from '../core/renderScheduler.js';
import { loadGroupByName } from '../features/modelLoader-core.js';
import { highlightModel } from '../interaction/highlightModel.js';

const VALID_VIEWS = ['anterior', 'posterior', 'left', 'right', 'cranial', 'caudal'];

// ─── Lesen ────────────────────────────────────────────────────────────────────

function _findMetaByQuery(query) {
    const q = query.toLowerCase().trim();
    const { metaById } = getStore();
    if (!metaById) return null;

    // 1) Direkte ID-Match
    if (metaById[q]) return metaById[q];

    // 2) Suche in allen Einträgen nach Label (Latin / Deutsch / Englisch)
    for (const entry of Object.values(metaById)) {
        const la = entry.labels?.la?.toLowerCase() ?? '';
        const de = entry.labels?.de?.toLowerCase() ?? '';
        const en = entry.labels?.en?.toLowerCase() ?? '';
        if (la === q || de === q || en === q) return entry;
    }

    // 3) Substring-Match (Fallback)
    for (const entry of Object.values(metaById)) {
        const la = entry.labels?.la?.toLowerCase() ?? '';
        const de = entry.labels?.de?.toLowerCase() ?? '';
        if (la.includes(q) || de.includes(q)) return entry;
    }

    return null;
}

async function _loadAndSelect(entry) {
    const group = entry.classification?.group ?? 'other';
    await loadGroupByName(group, { centerCamera: false });

    const model = getStore().groups[group]?.find(
        m => (m.userData?.meta?.id ?? m.userData?.entry?.id ?? m.name) === entry.id
    );
    if (!model) return;

    highlightModel(model);
    getStore().setSelection({ root: model, meta: entry });
    focusOnObject(camera, controls, model);
}

export async function processDeeplink() {
    const params = new URLSearchParams(window.location.search);

    const view = params.get('view');
    if (view && VALID_VIEWS.includes(view)) {
        const center = controls.target.clone();
        const radius = camera.position.distanceTo(controls.target);
        setCameraDirection(camera, controls, center, radius, view);
        requestRender(4);
    }

    const query = params.get('s');
    if (!query) return;

    const entry = _findMetaByQuery(query);
    if (entry) {
        await _loadAndSelect(entry);
    } else {
        console.warn(`[deeplink] Keine Struktur gefunden für: "${query}"`);
    }
}

// ─── Schreiben ────────────────────────────────────────────────────────────────

export function setupDeeplinkSync() {
    subscribeStore((state, prev) => {
        if (state.selected?.meta === prev.selected?.meta) return;
        const meta = state.selected?.meta;
        const params = new URLSearchParams(window.location.search);
        if (meta?.id) {
            params.set('s', meta.id);
        } else {
            params.delete('s');
        }
        const newUrl = params.toString()
            ? `${window.location.pathname}?${params}`
            : window.location.pathname;
        history.replaceState(null, '', newUrl);
    });
}
