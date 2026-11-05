// Build src/data/catalog.json from the raw Shopify product JSON (data-raw/) and our copy (src/data/copy.json).
// Downloads every product image once, writes WebP sizes to public/products/<handle>/, and samples the
// colour of each photograph's edges so a tile can continue the photograph's own ground (DESIGN.md, "fields").
// Usage: node scripts/build-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('.');
const RAW = path.join(ROOT, 'data-raw');
const CACHE = path.join(RAW, 'images');
const PUB = path.join(ROOT, 'public', 'products');
const OUT = path.join(ROOT, 'src', 'data', 'catalog.json');
const COPY_FILE = path.join(ROOT, 'src', 'data', 'copy.json');
const WIDTHS = [480, 960];
const TILE_RATIO = 1; // square tiles: 234 of 254 photographs are square, so most need no band at all
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CATEGORY_BY_TYPE = {
  'nail essentials': 'nails',
  nails: 'nails',
  'skin care': 'skin',
  skincare: 'skin',
  'make up': 'makeup',
  makeup: 'makeup',
  'hair extensions': 'hair',
  hair: 'hair',
  wigs: 'hair',
  'hair care': 'hair',
  'hair & extension': 'hair',
  grooming: 'hair',
};

const copy = fs.existsSync(COPY_FILE) ? JSON.parse(fs.readFileSync(COPY_FILE, 'utf8')) : {};
const ratings = JSON.parse(fs.readFileSync(path.join(RAW, 'ratings.json'), 'utf8'));
fs.mkdirSync(CACHE, { recursive: true });

const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function download(url, file) {
  if (fs.existsSync(file)) return;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'glampearl-redesign-prototype/1.0' } });
    if (res.ok) {
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      await sleep(250);
      return;
    }
    if (res.status === 429) {
      await sleep(20000 * (attempt + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`gave up on ${url}`);
}

// Median colour of a strip along one edge of the photograph.
async function edges(file) {
  const size = 160;
  const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).resize(size, size, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const strip = (coords) => {
    const rs = [], gs = [], bs = [];
    for (const [x, y] of coords) {
      const [r, g, b] = px(x, y);
      rs.push(r); gs.push(g); bs.push(b);
    }
    return hex(median(rs), median(gs), median(bs));
  };
  const band = 3;
  const top = [], bottom = [], left = [], right = [];
  for (let d = 0; d < band; d++) {
    for (let i = 0; i < size; i++) {
      top.push([i, d]);
      bottom.push([i, size - 1 - d]);
      left.push([d, i]);
      right.push([size - 1 - d, i]);
    }
  }
  return { t: strip(top), b: strip(bottom), l: strip(left), r: strip(right) };
}

// Where the maker's swatch photographs show the painted nail (fractions of width/height).
// Used to read each shade's real colour for the shade card. Verified by eye on the contact sheet.
const SWATCH_BOX = {
  'nail-polish-nude-neutrals-soak-off-gel-polish': { x0: 0.57, x1: 0.65, y0: 0.4, y1: 0.56 },
};

async function swatchColour(file, box) {
  const meta = await sharp(file).metadata();
  const left = Math.round(meta.width * box.x0);
  const top = Math.round(meta.height * box.y0);
  const width = Math.round(meta.width * (box.x1 - box.x0));
  const height = Math.round(meta.height * (box.y1 - box.y0));
  const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true });
  const rs = [], gs = [], bs = [];
  for (let i = 0; i < data.length; i += info.channels) {
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
  }
  return hex(median(rs), median(gs), median(bs));
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&times;/g, '×')
    .replace(/\s+/g, ' ')
    .trim();
const strip = (s) => decode(s.replace(/<[^>]+>/g, ' '));

const SECTION = [
  [/^how to use$/, 'use'],
  [/^(size\/material|size\/options|size guide|size|type|options|product information)$/, 'details'],
  [/^(package includes|packing list)$/, 'includes'],
  [/^set (\d+) includes$/, 'set'],
];

// Split the shop's description HTML into about / use / details / includes (both formats the shop uses).
function parseBody(html) {
  const out = { about: '', use: [], details: [], includes: [] };
  if (!html) return out;
  const clean = html
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<(\/?)b>/gi, '<$1strong>')
    .replace(/\s(class|start|data-[\w-]+)="[^"]*"/gi, '');
  const blocks = [...clean.matchAll(/<(p|ol|ul)>([\s\S]*?)<\/\1>/gi)];
  let section = 'about';
  let set = null; // { label, items }
  const flushSet = () => {
    if (set && set.items.length) out.includes.push(`${set.label}: ${set.items.join(', ')}`);
    set = null;
  };
  const sectionOf = (text) => {
    const label = text.replace(/:\s*$/, '').trim().toLowerCase();
    for (const [re, name] of SECTION) {
      const m = re.exec(label);
      if (m) return { name, label: name === 'set' ? `Set ${m[1]}` : '' };
    }
    return null;
  };
  let first = true;
  for (const [, tag, inner] of blocks) {
    if (tag.toLowerCase() !== 'p') {
      const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => strip(m[1])).filter(Boolean);
      if (section === 'use') out.use.push(...items);
      else if (section === 'includes') out.includes.push(...items);
      continue;
    }
    // Work line by line: a line that is only a known heading switches the section.
    const rawLines = inner.split(/<br>/i);
    for (const [i, raw] of rawLines.entries()) {
      const text = strip(raw);
      if (!text) continue;
      const head = sectionOf(text);
      if (head) {
        flushSet();
        section = head.name;
        if (head.name === 'set') set = { label: head.label, items: [] };
        continue;
      }
      // "Heading: value" on one line, e.g. "Product information:" handled above; "Size: Net Content: 60g" here.
      const lead = /^([A-Za-z/ ]{3,24}):\s*(.+)$/.exec(text);
      // Only a heading when it opens a new section and still carries "key: value" after it.
      const leadHead = lead && /:/.test(lead[2]) ? sectionOf(lead[1]) : null;
      if (leadHead) {
        flushSet();
        section = leadHead.name;
      }
      const body = leadHead ? lead[2] : text;
      if (section === 'about') {
        // The shop repeats the product title as a bold first line: drop it.
        const isTitle = first && i === 0 && /^\s*<strong>/i.test(raw) && rawLines.length > 1 && !/[.!?]$/.test(text) && text.length < 90;
        if (!isTitle) out.about = [out.about, body].filter(Boolean).join(' ');
      } else if (section === 'use') out.use.push(body);
      else if (section === 'includes') out.includes.push(body);
      else if (section === 'set') set?.items.push(body);
      else if (section === 'details') {
        const kv = /^([^:]{2,40}):\s*(.*)$/.exec(body);
        if (kv && kv[2]) out.details.push([kv[1].trim(), kv[2].trim()]);
        else if (kv) out.details.push([kv[1].trim(), '']);
        else if (out.details.length && !out.details[out.details.length - 1][1]) out.details[out.details.length - 1][1] = body;
        else out.details.push(['', body]);
      }
    }
    first = false;
  }
  flushSet();
  out.details = out.details.filter(([k, v]) => v && !/^as (the )?pictures? show/i.test(v));
  return out;
}

const files = fs.readdirSync(path.join(RAW, 'products')).filter((f) => f.endsWith('.json')).sort();
const catalog = [];

for (const f of files) {
  const { product: p } = JSON.parse(fs.readFileSync(path.join(RAW, 'products', f), 'utf8'));
  const dir = path.join(PUB, p.handle);
  fs.mkdirSync(dir, { recursive: true });

  const images = [];
  const cachedFiles = [];
  for (const [i, img] of p.images.entries()) {
    const ext = (/\.(png|jpe?g|webp)/i.exec(img.src)?.[1] || 'jpg').toLowerCase();
    const cached = path.join(CACHE, `${p.handle}-${i}.${ext}`);
    cachedFiles.push(cached);
    const url = img.src + (img.src.includes('?') ? '&' : '?') + 'width=1200';
    await download(url, cached);
    const meta = await sharp(cached).metadata();
    const out = {};
    for (const w of WIDTHS) {
      const name = `${i}-${w}.webp`;
      const target = path.join(dir, name);
      if (!fs.existsSync(target)) {
        await sharp(cached).flatten({ background: '#ffffff' }).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
      }
      out[w] = `/products/${p.handle}/${name}`;
    }
    const e = await edges(cached);
    const ratio = meta.width / meta.height;
    let bands = 'none', band = 0;
    if (ratio > TILE_RATIO + 0.01) {
      bands = 'tb';
      band = ((1 - TILE_RATIO / ratio) / 2) * 100; // each band, % of tile height
    } else if (ratio < TILE_RATIO - 0.01) {
      bands = 'lr';
      band = ((1 - ratio / TILE_RATIO) / 2) * 100; // each band, % of tile width
    }
    images.push({
      id: img.id,
      src: out,
      width: meta.width,
      height: meta.height,
      alt: img.alt || '',
      bands,
      band: Number(band.toFixed(2)),
      e1: bands === 'lr' ? e.l : e.t,
      e2: bands === 'lr' ? e.r : e.b,
      field: e.t,
    });
  }

  const c = copy[p.handle] || {};
  const type = (p.product_type || '').trim().toLowerCase();
  const category = c.category || CATEGORY_BY_TYPE[type] || 'other';
  const prices = p.variants.map((v) => Number(v.price));
  const imgIndex = Object.fromEntries(images.map((im, i) => [im.id, i]));
  const body = parseBody(p.body_html || '');

  catalog.push({
    handle: p.handle,
    name: c.name || p.title.toLowerCase(),
    line: c.line || '',
    about: c.about || body.about,
    use: c.use || body.use,
    details: c.details || body.details,
    includes: c.includes || body.includes,
    titleOriginal: p.title,
    category,
    productType: p.product_type,
    tags: p.tags,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    compareAt: p.variants[0].compare_at_price ? Number(p.variants[0].compare_at_price) : null,
    rating: ratings[p.handle] || null,
    options: p.options.map((o) => ({ name: o.name, values: o.values })),
    variants: await Promise.all(
      p.variants.map(async (v) => {
        const image = v.image_id != null && v.image_id in imgIndex ? imgIndex[v.image_id] : null;
        const box = SWATCH_BOX[p.handle];
        return {
          id: v.id,
          title: v.title,
          options: [v.option1, v.option2, v.option3].filter((x) => x != null),
          price: Number(v.price),
          compareAt: v.compare_at_price ? Number(v.compare_at_price) : null,
          image,
          swatch: box && image != null ? await swatchColour(cachedFiles[image], box) : null,
        };
      }),
    ),
    images,
  });
  console.log(`${p.handle}: ${images.length} images, ${p.variants.length} variants, ${category}`);
}

fs.writeFileSync(OUT, JSON.stringify(catalog, null, 1));
console.log(`wrote ${catalog.length} products to ${path.relative(ROOT, OUT)}`);
