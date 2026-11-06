// URLs built in the browser. The offline export (scripts/export-offline.mjs) sets window.__offline and a
// <base> pointing at the site root, so pages are opened as files: links need an explicit index.html and
// asset paths must be relative. On a server both helpers return the path unchanged.
const offline = typeof window !== 'undefined' && (window as unknown as { __offline?: boolean }).__offline === true;

export const pageHref = (path: string) => {
  if (!offline) return path;
  const p = path.replace(/^\//, '').replace(/\/?$/, '/');
  return p === '/' ? 'index.html' : `${p}index.html`;
};

export const assetSrc = (path: string) => (offline ? path.replace(/^\//, '') : path);
