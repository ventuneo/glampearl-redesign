// Fetch every product of glampearl.store (public Shopify endpoints) into data-raw/.
// Polite: one request at a time, a pause between requests, long backoff on HTTP 429.
// Usage: node scripts/fetch-products.mjs <handles.txt>
import fs from 'node:fs';
import path from 'node:path';

const STORE = 'https://glampearl.store';
const UA = 'glampearl-redesign-prototype/1.0';
const OUT = path.resolve('data-raw');
const PAUSE_MS = 4000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const handles = fs.readFileSync(process.argv[2], 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
fs.mkdirSync(path.join(OUT, 'products'), { recursive: true });
const ratingsFile = path.join(OUT, 'ratings.json');
const ratings = fs.existsSync(ratingsFile) ? JSON.parse(fs.readFileSync(ratingsFile, 'utf8')) : {};

async function get(url) {
  for (let attempt = 0; attempt < 12; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA } });
    } catch (e) {
      console.log(`network error (${e.message}), retry`);
      await sleep(10000);
      continue;
    }
    if (res.status === 429) {
      const wait = Math.min(30000 * 2 ** attempt, 300000);
      console.log(`429 on ${url}, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }
  throw new Error(`gave up on ${url}`);
}

function parseRating(html) {
  const avg = /data-average-rating=['"]([\d.]+)['"]/.exec(html);
  const num = /data-number-of-reviews=['"](\d+)['"]/.exec(html);
  if (avg && num) return { average: Number(avg[1]), count: Number(num[1]) };
  const ld = /"aggregateRating"\s*:\s*\{[^}]*"ratingValue"\s*:\s*"?([\d.]+)"?[^}]*"(?:reviewCount|ratingCount)"\s*:\s*"?(\d+)"?/.exec(html);
  if (ld) return { average: Number(ld[1]), count: Number(ld[2]) };
  return null;
}

let done = 0;
for (const handle of handles) {
  const jsonFile = path.join(OUT, 'products', `${handle}.json`);
  if (!fs.existsSync(jsonFile)) {
    const body = await get(`${STORE}/products/${handle}.json`);
    fs.writeFileSync(jsonFile, body);
    await sleep(PAUSE_MS);
  }
  if (!(handle in ratings)) {
    const html = await get(`${STORE}/products/${handle}`);
    ratings[handle] = parseRating(html);
    fs.writeFileSync(ratingsFile, JSON.stringify(ratings, null, 1));
    await sleep(PAUSE_MS);
  }
  done++;
  console.log(`${done}/${handles.length} ${handle} rating=${JSON.stringify(ratings[handle])}`);
}
console.log('ALL DONE');
