// js/interaction/hoverTooltip.js
// Zeigt Strukturname als Tooltip beim Überfahren des Canvas.

import { pickAt } from '../core/raycaster.js';
import { getStructureDisplayLabel } from '../utils/anatomyLabels.js';

const OFFSET_X = 14;
const OFFSET_Y = -28;

let _tooltip = null;
let _rafPending = false;
let _lastX = 0;
let _lastY = 0;

function _getTooltip() {
    if (!_tooltip) _tooltip = document.getElementById('tooltip');
    return _tooltip;
}

function _show(text, x, y) {
    const el = _getTooltip();
    if (!el) return;
    el.textContent = text;
    el.style.left = `${x + OFFSET_X}px`;
    el.style.top  = `${y + OFFSET_Y}px`;
    el.style.display = 'block';
}

function _hide() {
    const el = _getTooltip();
    if (el) el.style.display = 'none';
}

function _update() {
    _rafPending = false;
    const sel = pickAt(_lastX, _lastY);
    if (!sel?.root) { _hide(); return; }

    const label = getStructureDisplayLabel(sel.root);
    if (label) {
        _show(label, _lastX, _lastY);
    } else {
        _hide();
    }
}

export function setupHoverTooltip(domElement) {
    domElement.addEventListener('pointermove', (e) => {
        _lastX = e.clientX;
        _lastY = e.clientY;
        if (!_rafPending) {
            _rafPending = true;
            requestAnimationFrame(_update);
        }
    }, { passive: true });

    domElement.addEventListener('pointerleave', _hide, { passive: true });

    // Auch beim Klick ausblenden (InfoPanel übernimmt dann)
    domElement.addEventListener('pointerdown', _hide, { passive: true });
}
