//group.js
// 📦 Laden und Verwalten von Gruppen in der 3D-Anatomie-An

import { scene } from '../core/scene.js';
import { getMeta } from '../data/meta.js';
import { getStore } from '../store/useStore.js';
import { setModelVisibility, setGroupVisibility } from '../features/visibility.js';
import { loadEntry, disposeObject3D } from '../modelLoader/index.js';
import { registerPickables, unregisterPickables } from './selection.js';


// Public: Laden per Gruppenname/Subgruppe
export async function loadGroup(groupName, subgroup = null, centerCamera = false) {
  const meta = await getMeta();
  const entries = meta.filter(entry => {
    const g = entry?.classification?.group ?? entry?.group;
    const sg = entry?.classification?.subgroup ?? entry?.subgroup ?? null;
    if (g !== groupName) return false;
    if (subgroup && sg !== subgroup) return false;
    return true;
  });

  await loadGroupFromEntries(entries, groupName);

  // Optional Kamera-Fit hier (auskommentiert lassen, bis gebraucht)
  // if (centerCamera && state.groups[groupName]?.[0]) { ... }
}

// Intern: aus Einträgen laden
export async function loadGroupFromEntries(entries, groupName) {
  if (!entries?.length) return;
  for (const entry of entries) {
    const root = await loadEntry(entry);
    root.userData.isModelRoot = true;
    root.userData.entry = entry;
    scene.add(root);
    getStore().addGroupModel(groupName, root);
    registerPickables(root);
  }
  getStore().setGroupVisible(groupName, true);
}


// Utilities
export function isGroupLoaded(groupName) {
  return (getStore().groups[groupName]?.length ?? 0) > 0;
}

export function getLoadedGroups() {
  const { groups } = getStore();
  return Object.keys(groups).filter(g => (groups[g]?.length ?? 0) > 0);
}


// Intern: komplette Gruppe hart entladen
export function unloadWholeGroup(groupName) {
  const arr = getStore().groups[groupName] ?? [];
  for (const root of arr) {
    unregisterPickables(root);
    scene.remove(root);
    disposeObject3D(root);
  }
  getStore().unloadGroup(groupName);
}

// Gruppen-Zustand restaurieren (sichtbar/unsichtbar je Modell)
export function restoreGroupState(groupName) {
  const { groups, groupStates } = getStore();
  if (!groupName || !(groupName in groups)) return;
  const models = groups[groupName];
  if (!models) return;
  const saved = groupStates?.[groupName];
  setGroupVisibility(groupName, saved !== false);
}

export function restoreAllGroupStates() {
  const { groups } = getStore();
  for (const g of Object.keys(groups)) {
    try { restoreGroupState(g); }
    catch (e) { console.warn(`restoreAllGroupStates: Fehler bei "${g}":`, e); }
  }
}

export function updateGroupVisibility(groupName, visible) {
  setGroupVisibility(groupName, visible);
}

// Public: Entladen per Gruppenname/Subgruppe (nutzt dein Cleanup)
export async function unloadGroup(groupName, subgroup = null) {
  await removeModelsByGroupOrSubgroup(groupName, subgroup);
  if (!subgroup) {
    getStore().unloadGroup(groupName);
  }
}