import { getStore, INITIAL_COLORS, DEFAULT_COLOR } from '../store/useStore.js';

export function updateModelColors(group, hexColor) {
  const { groups, colors } = getStore();
  if (!groups[group]) {
    console.warn(`⚠️ Gruppe "${group}" nicht im Store gefunden.`);
    return;
  }
  const resolved = hexColor ?? colors?.[group] ?? INITIAL_COLORS[group] ?? DEFAULT_COLOR;
  groups[group].forEach(model => {
    model.traverse(child => {
      if (child.isMesh && child.material) child.material.color.setHex(resolved);
    });
  });
  getStore().setGroupColor(group, resolved);
  console.log(`🎨 Farbe für Gruppe "${group}" gesetzt: 0x${resolved.toString(16).padStart(6, '0')}`);
}

export function resetGroupColor(group) {
  updateModelColors(group, INITIAL_COLORS[group] ?? DEFAULT_COLOR);
}
