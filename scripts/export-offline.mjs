// Offline export: turns dist/ into a folder that works by double-clicking index.html (no server).
// Browsers block module scripts and root-relative paths on file://, so for every page this script:
//   - bundles all of the page's module scripts into one inline module (esbuild, shared code once),
//   - inlines the stylesheets,
//   - adds <base href> pointing at the export root and makes every internal URL relative to it,
//   - points page links at .../index.html and keeps #anchors on the current page.
// Usage: npm run build && node scripts/export-offline.mjs [outDir]
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const DIST = path.resolve('dist');
const OUT = path.resolve(process.argv[2] || 'export/GlamPearl-Redesign');
const COPY = ['products', 'fonts', 'favicon.svg', 'favicon-48.png', 'apple-touch-icon.png', 'og.jpg'];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'dev' ? [] : walk(p);
    return e.name.endsWith('.html') ? [p] : [];
  });

const pageTarget = (p) => {
  const clean = p.replace(/^\//, '').replace(/[?#].*$/, '');
  const suffix = p.slice(p.replace(/[?#].*$/, '').length);
  if (clean === '') return `index.html${suffix}`;
  return `${clean.replace(/\/?$/, '/')}index.html${suffix}`;
};
const hasExt = (p) => /\.[a-z0-9]{2,5}([?#].*)?$/i.test(p);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const item of COPY) {
  const from = path.join(DIST, item);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(OUT, item), { recursive: true, filter: (f) => !f.endsWith('.html') });
}

const pages = walk(DIST);
let count = 0;
for (const file of pages) {
  const rel = path.relative(DIST, file).split(path.sep).join('/'); // e.g. products/gel/index.html
  const depth = rel.split('/').length - 1;
  const base = depth ? '../'.repeat(depth) : './';
  let html = fs.readFileSync(file, 'utf8');

  // 1. Stylesheets inline, font URLs relative to the root.
  html = html.replace(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)">/g, (_, href) => {
    const css = fs.readFileSync(path.join(DIST, href), 'utf8').replace(/url\(\/(fonts\/[^)]+)\)/g, 'url($1)');
    return `<style>${css}</style>`;
  });
  html = html.replace(/<link rel="preload" href="\/fonts\/[^"]+"[^>]*>/g, '');

  // 2. All module scripts of the page (external and inline) become one bundled inline module.
  const sources = [];
  html = html.replace(/<script type="module"(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g, (_, src, inline) => {
    sources.push(src ? { file: path.join(DIST, src) } : { code: inline });
    return '';
  });
  if (sources.length) {
    const tmp = path.join(DIST, '_astro', `__offline_${count}.js`);
    const inlineFiles = [];
    const entry = sources
      .map((s, i) => {
        if (s.file) return `import ${JSON.stringify('./' + path.basename(s.file))};`;
        const f = path.join(DIST, '_astro', `__inline_${count}_${i}.js`);
        fs.writeFileSync(f, s.code);
        inlineFiles.push(f);
        return `import ${JSON.stringify('./' + path.basename(f))};`;
      })
      .join('\n');
    fs.writeFileSync(tmp, entry);
    const result = await esbuild.build({ entryPoints: [tmp], bundle: true, format: 'esm', minify: true, write: false, logLevel: 'silent' });
    fs.rmSync(tmp);
    inlineFiles.forEach((f) => fs.rmSync(f));
    const code = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
    // A replacer function, not a string: minified code can contain "$&", which a replacement string would expand.
    html = html.replace('</body>', () => `<script type="module">${code}</script></body>`);
  }

  // 3. Base and offline flag first in <head>.
  html = html.replace(/<head>/, `<head><base href="${base}"><script>window.__offline=true</script>`);

  // 4. Internal URLs relative to the root; page links end in index.html.
  html = html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, p) => {
    const full = '/' + p;
    return `${attr}="${hasExt(full) ? p : pageTarget(full)}"`;
  });
  html = html.replace(/srcset="([^"]+)"/g, (_, set) => `srcset="${set.replace(/(^|,\s*)\//g, '$1')}"`);
  // #anchors stay on this page despite <base>.
  html = html.replace(/href="#([^"]*)"/g, (_, id) => `href="${rel}#${id}"`);
  // Paths inside JSON blocks (search index, hero, kit, product data).
  html = html.replace(/(<script type="application\/(?:ld\+)?json"[^>]*>)([\s\S]*?)(<\/script>)/g, (_, a, json, c) => `${a}${json.replace(/"\/(products|fonts)\//g, '"$1/')}${c}`);
  // Inline styles carrying url(/...).
  html = html.replace(/url\(\/(?!\/)/g, 'url(');

  const target = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  count++;
}

const size = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`${count} pages exported to ${path.relative(process.cwd(), OUT)} (${(size(OUT) / 1e6).toFixed(1)} MB)`);
