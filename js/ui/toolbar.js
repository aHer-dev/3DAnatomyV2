// js/ui/toolbar.js — Tool-State-Logik (kein DOM)
// DOM-Rendering übernimmt Toolbar.tsx (React)

import { camera } from '../core/camera.js';
import { controls } from '../core/controls.js';
import { focusOnObject } from '../core/cameraUtils.js';
import { getStore } from '../store/useStore.js';

export const TOOL = {
    SELECT: 'select',
    MULTI:  'multi',
    BOX:    'box',
    FOCUS:  'focus',
};

let _activeTool = TOOL.SELECT;
const _listeners = new Set();

export function getActiveTool() { return _activeTool; }

export function setActiveTool(tool) {
    if (!Object.values(TOOL).includes(tool)) return;
    _activeTool = tool;
    if (tool === TOOL.FOCUS) _triggerFocus();
    _listeners.forEach(fn => fn(tool));
}

export function onToolChange(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
}

function _triggerFocus() {
    const model = getStore().selected?.root || null;
    if (model) focusOnObject(camera, controls, model);
}
