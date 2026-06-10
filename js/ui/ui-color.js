// ui-color.js
import { getStore, INITIAL_COLORS } from '../store/useStore.js';
import { updateModelColors } from '../modelLoader/color.js';

export function setupColorUI() {
  const container = document.getElementById('color-controls');
  if (!container) {
    console.warn('⚠️ Kein Container für Farb-UI gefunden.');
    return;
  }

  getStore().availableGroups.forEach(group => {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = `${group}-color`;
    input.className = 'group-color';

    const colorValue = getStore().colors[group] ?? INITIAL_COLORS[group];
    if (typeof colorValue === 'number') {
      input.value = '#' + colorValue.toString(16).padStart(6, '0');
    } else {
      console.warn(`⚠️ Keine Farbe für Gruppe "${group}" gefunden`);
    }

    input.addEventListener('input', () => {
      const newColor = parseInt(input.value.replace('#', ''), 16);
      updateModelColors(group, newColor);
      getStore().setGroupColor(group, newColor);
      console.log(`🎨 Gruppe "${group}" neue Farbe: ${input.value}`);
    });

    container.appendChild(input);
  });
}
