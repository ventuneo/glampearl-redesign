// Quick screenshots while building: node scripts/shot.mjs <path> <out-prefix> [full]
import { chromium } from 'playwright';

const [, , route = '/', out = '.shots/dev', full] = process.argv;
const base = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await chromium.launch();
for (const [label, viewport, mobile] of [
  ['1440', { width: 1440, height: 900 }, false],
  ['390', { width: 390, height: 844 }, true],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}-${label}.png`, fullPage: full === 'full' });
  // On a phone the layout viewport grows with wide content, so compare against the device width itself.
  const overflow = await page.evaluate((w) => document.documentElement.scrollWidth - w, viewport.width);
  console.log(label, 'overflow', overflow, 'errors', errors.length ? errors : 'none');
  await page.close();
}
await browser.close();
