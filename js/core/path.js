// Basis-URL von Vite — '/' lokal, '/3DAnatomyV2/' auf GitHub Pages
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export function withBase(path) {
  if (!path) return BASE;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return BASE ? `${BASE}/${cleanPath}` : cleanPath;
}

export function dataPath(file) {
  return withBase(`data/${file}`);
}

export function modelPath(filename, group = '') {
  return group
    ? withBase(`models/${group}/${filename}`)
    : withBase(`models/${filename}`);
}

export function texturePath(filename) {
  return withBase(`textures/${filename}`);
}

export function dracoPath(file = '') {
  const base = `${import.meta.env.BASE_URL}draco/`;
  return file ? base + file : base;
}

export function assetPath(filename) {
  return withBase(`assets/${filename}`);
}

export function isAbsolutePath(path) {
  return /^https?:\/\//.test(path);
}

export function normalizePath(path) {
  return path.replace(/\/+/g, '/').replace(/\/$/, '');
}

export function getBase() {
  return BASE;
}

export function toFullUrl(path) {
  if (isAbsolutePath(path)) return path;
  const base = window.location.origin;
  const pathname = window.location.pathname.replace(/\/[^/]*$/, '');
  return `${base}${pathname}/${withBase(path)}`;
}
