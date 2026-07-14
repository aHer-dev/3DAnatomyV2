// js/features/roomSettings.js
// Imperative 3D-Logik für Raum-/Lichteinstellungen.
// Portiert aus der gelöschten ui-room.js (DOM-frei) — React SettingsPanel ruft
// diese Funktionen direkt auf, der Store hält keinen Raum-Zustand.

import * as THREE from 'three';
import { scene } from '../core/scene.js';
import { renderer } from '../core/renderer.js';
import { setLightIntensity } from '../lights.js';
import { requestRender } from '../core/renderScheduler.js';

export const ROOM_DEFAULTS = Object.freeze({
  lighting: 0.85,   // 0..2  (Beleuchtung)
  brightness: 1.0,  // 0..1  (Raumhelligkeit) — 1.0 = Raumfarbe unverfälscht
  color: '#0d0d0d', // Raumfarbe = sichtbarer Start-Hintergrund rgb(13,13,13)
});

let _lighting = ROOM_DEFAULTS.lighting;
let _brightness = ROOM_DEFAULTS.brightness;
let _color = ROOM_DEFAULTS.color;

/**
 * Beleuchtungsstärke setzen (0..2).
 * @param {number} intensity
 */
export function applyLighting(intensity) {
  _lighting = intensity;
  renderer.toneMappingExposure = 0.65 * intensity;
  setLightIntensity(intensity);
  if (scene.environment) scene.environmentIntensity = 0.3 * intensity;
  requestRender();
}

/**
 * Raumfarbe + Helligkeit als Szenen-Hintergrund setzen.
 * @param {string} [hex]
 * @param {number} [brightness]
 */
export function applyRoomColor(hex = _color, brightness = _brightness) {
  _color = hex;
  _brightness = brightness;

  const base = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  hsl.l = Math.max(0, Math.min(1, hsl.l * brightness));

  const final = new THREE.Color();
  final.setHSL(hsl.h, hsl.s, hsl.l);
  scene.background = final;
  requestRender();
}

/** Aktuelle Werte (für die React-Initialisierung der Regler). */
export function getRoomSettings() {
  return { lighting: _lighting, brightness: _brightness, color: _color };
}

/** Beim App-Start einmalig die Defaults anwenden (ersetzt setupRoomUI-Init). */
export function initRoomSettings() {
  applyLighting(_lighting);
  applyRoomColor(_color, _brightness);
}
