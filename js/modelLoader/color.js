import { getStore, INITIAL_COLORS, DEFAULT_COLOR } from '../store/useStore.js';
import { getGroupBatch } from '../core/groupBatch.js';

export function updateModelColors(group, hexColor) {
  const { groups, colors } = getStore();
  const batch = getGroupBatch(group);
  if (!groups[group] && !batch) {
    console.warn(`⚠️ Gruppe "${group}" nicht im Store gefunden.`);
    return;
  }
  const resolved = hexColor ?? colors?.[group] ?? INITIAL_COLORS[group] ?? DEFAULT_COLOR;
  const bellyColor = group === 'muscles' ? resolved : colors?.muscles ?? INITIAL_COLORS.muscles;
  batch?.setGroupColor(resolved, bellyColor);
  (groups[group] ?? []).forEach(model => {
    model.traverse(child => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => material.color?.setHex(material.weighted ? bellyColor : resolved));
      }
    });
  });
  // Some measured muscles are filed under eyes. They share the belly palette,
  // while the actual eyes and every group default retain their existing colors.
  if (group === 'muscles') for (const [otherGroup, models] of Object.entries(groups)) {
    if (otherGroup === group) continue;
    getGroupBatch(otherGroup)?.setGroupColor(colors?.[otherGroup] ?? DEFAULT_COLOR, bellyColor);
    models.forEach(model => model.traverse(child => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        if (material?.weighted) material.color.setHex(bellyColor);
      });
    }));
  }
  getStore().setGroupColor(group, resolved);
  console.log(`🎨 Farbe für Gruppe "${group}" gesetzt: 0x${resolved.toString(16).padStart(6, '0')}`);
}

export function resetGroupColor(group) {
  updateModelColors(group, INITIAL_COLORS[group] ?? DEFAULT_COLOR);
}
