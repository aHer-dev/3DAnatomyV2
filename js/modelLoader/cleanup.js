// cleanup.js
import { scene } from '../core/scene.js';
import useStore, { getStore } from '../store/useStore.js';

/**
 * Vollständige Entsorgung von Three.js Objekten und Ressourcen
 * @param {THREE.Object3D} root - Wurzelobjekt zum Entsorgen
 */
export function disposeObject3D(root) {
  if (!root) return;

  root.traverse(child => {
    if (child.isMesh) {
      // Geometrie
      if (child.geometry) {
        child.geometry.dispose();
      }

      // Material(ien)
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach(mat => {
        if (!mat) return;

        // Alle Texturen
        ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach(mapName => {
          if (mat[mapName]) {
            mat[mapName].dispose();
          }
        });

        mat.dispose();
      });
    }
  });

  // Aus Parent entfernen
  if (root.parent) {
    root.parent.remove(root);
  }
}

/**
 * Entfernt alle Modelle einer Gruppe oder einer Subgruppe aus der Szene.
 *
 * @param {string} groupName - z. B. "muscles"
 * @param {string|null} subgroupName - z. B. "arm-schulter", oder null für ganze Gruppe
 */
export async function removeModelsByGroupOrSubgroup(groupName, subgroupName = null) {
  const models = getStore().groups[groupName];
  if (!models) return;

  const remaining = [];
  for (const model of models) {
    const subgroup = model.userData.meta?.subgroup ?? null;
    if (subgroupName === null || subgroup === subgroupName) {
      disposeObject3D(model);
      scene.remove(model);
    } else {
      remaining.push(model);
    }
  }

  const currentGroups = getStore().groups;
  useStore.setState({ groups: { ...currentGroups, [groupName]: remaining } });

  console.log(`🧹 Modelle aus Gruppe "${groupName}"${subgroupName ? `, Subgruppe "${subgroupName}"` : ''} entfernt.`);
}

/**
 * Entfernt ein einzelnes Modell anhand seines Dateinamens.
 *
 * @param {string} filename - z. B. "fj7285_bp2121_fma7234_draco.glb"
 * @param {string} groupName - z. B. "muscles"
 */
export function removeModelByFilename(filename, groupName) {
  const models = getStore().groups[groupName];
  if (!models) {
    console.warn(`⚠️ Gruppe "${groupName}" nicht im Store gefunden.`);
    return;
  }

  const index = models.findIndex(m => m.name === filename);
  if (index === -1) {
    console.warn(`⚠️ Modell "${filename}" nicht in Gruppe "${groupName}" gefunden.`);
    return;
  }

  disposeObject3D(models[index]);
  scene.remove(models[index]);

  const remaining = models.filter((_, i) => i !== index);
  const currentGroups = getStore().groups;
  useStore.setState({ groups: { ...currentGroups, [groupName]: remaining } });

  console.log(`🗑️ Modell "${filename}" erfolgreich aus Gruppe "${groupName}" entfernt.`);
}