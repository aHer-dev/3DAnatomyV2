import { setupResetUI } from './ui-reset.js';
import { setupControlsUI } from './ui-controls.js';
import { setupRoomUI } from './ui-room.js';
import { toggleLicense } from './license.js';
import { licenseHTML } from './licenseContent.js';
import { initPhotoMode } from './photoMode.js';
import { setupPresetsUI } from './ui-presets.js';

export function setupUI() {
  try {
    setupResetUI();
    setupControlsUI();
    setupRoomUI();
    initPhotoMode();
    setupPresetsUI();

    const toggleButton = document.getElementById('btn-toggle-license');
    const legalToggleButton = document.getElementById('btn-toggle-legal');
    const legalMenu = document.getElementById('legal-menu');
    const licenseInfo = document.getElementById('license-info');
    let closeLegalMenu = () => {};
    
    if (licenseInfo) {
      licenseInfo.innerHTML = licenseHTML || '<p>⚠️ Lizenztext fehlt</p>';
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', (event) => {
        closeLegalMenu();
        toggleLicense(event);
      });
    }

    if (legalToggleButton && legalMenu) {
      closeLegalMenu = () => {
        legalMenu.classList.add('hidden');
        legalMenu.classList.remove('active');
        legalMenu.setAttribute('aria-hidden', 'true');
        legalToggleButton.setAttribute('aria-expanded', 'false');
      };

      const openLegalMenu = () => {
        legalMenu.classList.remove('hidden');
        legalMenu.classList.add('active');
        legalMenu.setAttribute('aria-hidden', 'false');
        legalToggleButton.setAttribute('aria-expanded', 'true');
      };

      legalToggleButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isHidden = legalMenu.classList.contains('hidden');
        if (isHidden) openLegalMenu(); else closeLegalMenu();
      });

      legalMenu.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      document.addEventListener('click', () => {
        closeLegalMenu();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeLegalMenu();
        }
      });
    }

    const menuLicenseButton = document.getElementById('btn-toggle-license-menu');
    if (menuLicenseButton) {
      menuLicenseButton.addEventListener('click', (event) => {
        closeLegalMenu();
        toggleLicense(event);
      });
    }
  } catch (err) {
    console.error('❌ Fehler bei UI-Setup:', err);
  }
}
