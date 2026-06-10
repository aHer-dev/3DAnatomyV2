
// groupToggle.js - ERWEITERTE VERSION
import { getStore } from '../store/useStore.js';
import { loadGroupByName } from './modelLoader-core.js';
import { scene } from '../core/scene.js';
import { disposeObject3D } from '../modelLoader/cleanup.js';
import { unregisterPickables } from './selection.js';




export async function toggleGroup(groupName) {
    const isLoaded = (getStore().groups[groupName]?.length ?? 0) > 0;

    if (isLoaded) {
        console.log(`🔻 Entlade Gruppe "${groupName}"...`);

        const models = getStore().groups[groupName] ?? [];
        for (const model of models) {
            unregisterPickables(model);
            scene.remove(model);
            disposeObject3D(model);
        }

        getStore().unloadGroup(groupName);
        getStore().setGroupVisible(groupName, false);

        const btn = document.getElementById(`btn-load-${groupName}`);
        if (btn) {
            btn.style.backgroundColor = '';
            btn.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1) + ' ▼';
        }

        console.log(`✅ Gruppe "${groupName}" entladen`);

    } else {
        console.log(`🔺 Lade Gruppe "${groupName}"...`);

        await loadGroupByName(groupName, { centerCamera: false });
        getStore().setGroupVisible(groupName, true);

        const btn = document.getElementById(`btn-load-${groupName}`);
        if (btn) {
            btn.style.backgroundColor = '#2a5a2a';
            btn.textContent = '✓ ' + groupName.charAt(0).toUpperCase() + groupName.slice(1) + ' ▼';
        }

        console.log(`✅ Gruppe "${groupName}" geladen`);
    }

    return !isLoaded;
}

export function setupGroupToggle() {
    const groups = [
        'bones', 'teeth', 'muscles', 'tendons', 'arteries',
        'brain', 'cartilage', 'ear', 'eyes', 'glands',
        'heart', 'ligaments', 'lungs', 'nerves', 'organs',
        'skin_hair', 'veins'
    ];

    groups.forEach(group => {
        const btn = document.getElementById(`btn-load-${group}`);
        if (!btn) return;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => toggleGroup(group));
    });

    // ❌ Nichts mit loadedGroups initialisieren oder resetten
    // ❌ Kein resetGroupStates-Listener nötig
}

export function getLoadedGroupsDebug() {
    const { groups } = getStore();
    return Object.keys(groups).filter(g => (groups[g]?.length ?? 0) > 0);
}