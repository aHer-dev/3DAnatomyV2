// js/core/renderScheduler.js
// Late-init singleton so modules can call requestRender without
// importing startApp.js (which would create circular deps).
// startApp.js calls registerRequestRender() once during boot.

let _impl = null;

export function registerRequestRender(fn) {
    _impl = fn;
}

export function requestRender(frames) {
    _impl?.(frames);
}
