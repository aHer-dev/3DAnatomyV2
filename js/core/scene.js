// core/scene.js
import * as THREE from 'three';
import { getConfig } from '../config/config.js';

// Eine einzige Scene-Instanz erstellen und benannt exportieren
export const scene = new THREE.Scene();

// Hintergrundfarbe aus der Config lesen (initRoomSettings überschreibt sie später)
const bg = getConfig('ui.theme.background', '#0d0d0d');
scene.background = new THREE.Color(bg);