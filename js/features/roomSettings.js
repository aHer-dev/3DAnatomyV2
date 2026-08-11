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
  color: '#0d0d0d', // Rückfall, falls kein Theme bekannt ist
});

// Bühnenfarbe je Theme. Die Bühne bleibt in BEIDEN Themes dunkel — Knochen und
// Muskeln lesen sich auf dunklem Grund klarer. Im Light-Modus aber warm statt
// neutralschwarz: rgb(82,74,66) nimmt den Papierton der hellen Oberfläche auf,
// ohne dem Modell Kontrast zu nehmen.
export const ROOM_COLOR_BY_THEME = Object.freeze({
  light: '#524a42',   // rgb(82, 74, 66) — warmes Taupe
  dark:  '#0d0d0d',   // rgb(13, 13, 13)
});

let _lighting = ROOM_DEFAULTS.lighting;
let _brightness = ROOM_DEFAULTS.brightness;
let _color = ROOM_DEFAULTS.color;

// Sobald jemand selbst eine Raumfarbe wählt, hört der Theme-Wechsel auf, sie zu
// überschreiben. Sonst würde ein Klick auf Sonne/Mond die eigene Einstellung
// stillschweigend wegwerfen.
let _colorChosenByUser = false;

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
  _colorChosenByUser = true;
  setRoomColorInternal(hex, brightness);
}

/**
 * Bühnenfarbe auf den Standard des Themes setzen — aber nur, solange niemand
 * selbst eine gewählt hat. Wird beim Theme-Wechsel gerufen.
 * @param {'light'|'dark'} theme
 */
export function applyThemeRoomColor(theme) {
  if (_colorChosenByUser) return;
  setRoomColorInternal(ROOM_COLOR_BY_THEME[theme] ?? ROOM_DEFAULTS.color, _brightness);
}

/** Zurück auf den Theme-Standard — gibt die Hoheit ans Theme zurück. */
export function resetRoomColor(theme) {
  _colorChosenByUser = false;
  setRoomColorInternal(ROOM_COLOR_BY_THEME[theme] ?? ROOM_DEFAULTS.color, _brightness);
}

function setRoomColorInternal(hex, brightness) {
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

/**
 * Beim App-Start einmalig die Defaults anwenden (ersetzt setupRoomUI-Init).
 * Die Bühnenfarbe kommt aus dem Theme — bewusst NICHT über `applyRoomColor`,
 * das würde den Start als eigene Wahl verbuchen und den Theme-Wechsel für den
 * Rest der Sitzung stillstellen.
 * @param {'light'|'dark'} [theme]
 */
export function initRoomSettings(theme = 'light') {
  applyLighting(_lighting);
  setRoomColorInternal(ROOM_COLOR_BY_THEME[theme] ?? ROOM_DEFAULTS.color, _brightness);
}
