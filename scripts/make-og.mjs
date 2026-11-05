// Render public/og.jpg (1200x630) from real product fields with the site's own font, and the favicons.
// Usage: node scripts/make-og.mjs   (preview server on :4321 for fonts and photographs)
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';

const base = process.env.BASE || 'http://127.0.0.1:4321';
const catalog = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const pick = (h) => catalog.find((p) => p.handle === h).images[0];
const gel = pick('nail-polish-nude-neutrals-soak-off-gel-polish');
const wig = pick('light-golden-long-straight-lace-wig');
const field = (im) =>
  `<div class="f" style="background:${im.e1}"><img src="${base}${im.src['960']}" style="object-fit:cover"></div>`;

const html = `<!doctype html><html><head><style>
@font-face{font-family:F;src:url(${base}/fonts/familjen-grotesk-latin.woff2) format('woff2');font-weight:400 700}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#fff;font-family:F;color:#34302d;display:grid;grid-template-columns:420px 1fr;gap:12px;padding:40px}
.t{display:flex;flex-direction:column;justify-content:space-between}
.w{font-size:68px;font-weight:600;letter-spacing:-.045em;line-height:1}
.h{font-size:40px;font-weight:500;letter-spacing:-.03em;line-height:1.02}
.s{font-size:22px;color:#716a65;margin-top:16px}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.f{position:relative;overflow:hidden}
.f img{position:absolute;inset:0;width:100%;height:100%}
.sw{background:#ce9ba2;display:flex;align-items:flex-end;padding:20px;font-size:34px;font-weight:500;letter-spacing:-.025em}
</style></head><body>
<div class="t"><div class="w">glampearl</div><div><div class="h">At-home gel nails, skin care and wigs</div><div class="s">50 gel shades at CHF 19.90. Returns within 30 days.</div></div></div>
<div class="g">${field(gel)}<div class="sw">dusty rose</div>${field(wig)}</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(base + '/robots.txt'); // same origin, so the web font may load
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile('public/og.jpg');

// Favicon: one shade on the card.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#ce9ba2"/><circle cx="16" cy="16" r="14.5" fill="none" stroke="#34302d" stroke-opacity=".14"/></svg>`;
fs.writeFileSync('public/favicon.svg', svg);
await sharp(Buffer.from(svg)).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(svg)).resize(48, 48).png().toFile('public/favicon-48.png');
console.log('og.jpg, favicon.svg, apple-touch-icon.png written');
