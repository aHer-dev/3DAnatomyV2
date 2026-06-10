// ui-loading.js
import { getConfig } from '../config/config.js';

export function setupLoadingUI() {
  const loadingColorPicker = document.createElement('input');
  loadingColorPicker.type = 'color';
  loadingColorPicker.id = 'loading-color';
  loadingColorPicker.value = getConfig('ui.theme.loadingScreen', '#0b1020');

  loadingColorPicker.addEventListener('input', (e) => {
    const newColor = e.target.value;
    const screen = document.getElementById('initial-loading-screen');
    if (screen) screen.style.backgroundColor = newColor;
  });

  const container = document.getElementById('room-dropdown-content');
  if (container) {
    const label = document.createElement('label');
    label.textContent = 'Ladefarbe: ';
    label.appendChild(loadingColorPicker);
    container.appendChild(label);
  } else {
    console.warn('⚠️ ui-loading: room-dropdown-content nicht gefunden.');
  }

  console.log('⏳ ui-loading initialisiert.');
}
