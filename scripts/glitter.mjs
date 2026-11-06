// Turns a product photograph into glitter: one pastel flake per cell, sized and coloured by how far the
// photograph departs from its own studio ground (so the ground drops out and the product stays).
// Writes public/art/<name>-<width>.webp (static flakes) and src/data/glitter.json (cell densities, for the
// sparkles that scripts/glitter.ts draws on top).  Usage: node scripts/glitter.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const CELL = 9; // px per cell in the large image

async function densities({ src, cols, crop = [0, 0, 1, 1], gamma = 1, gain = 1, floor = 0, mode = 'dist' }) {
  const img = sharp(src);
  const { width, height } = await img.metadata();
  const [x0, y0, x1, y1] = crop;
  const cw = Math.round((x1 - x0) * width);
  const ch = Math.round((y1 - y0) * height);
  const rows = Math.round((cols * ch) / cw);
  const { data } = await img
    .extract({ left: Math.round(x0 * width), top: Math.round(y0 * height), width: cw, height: ch })
    .resize(cols, rows, { fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const border = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (x === 0 || y === 0 || x === cols - 1) border.push(y * cols + x);
  const med = [0, 1, 2].map((c) => border.map((i) => data[i * 3 + c]).sort((a, b) => a - b)[border.length >> 1]);
  const v = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    const d = Math.hypot(data[i * 3] - med[0], data[i * 3 + 1] - med[1], data[i * 3 + 2] - med[2]) / 255;
    const lum = (0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]) / 255;
    const mask = Math.min(1, Math.max(0, (d - floor) * gain));
    v[i] = Math.pow(mode === 'lum' ? mask * (0.2 + 0.8 * lum) : mask, gamma);
  }
  return { cols, rows, v };
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
// Holographic pastel: the body runs lilac (top) to rose to peach (bottom); a few flakes catch gold or mint.
const LIGHT = hex('#f7dbe6');
const STOPS = [hex('#a98bd9'), hex('#cf6f9c'), hex('#e58d78')];
const ODD = [hex('#d9a650'), hex('#6cc3a8'), hex('#8fa6e6')];

function flakes({ cols, rows, v }, seed = 11) {
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let out = '';
  for (let y = 0; y < rows; y++) {
    const t = y / (rows - 1);
    const base = t < 0.5 ? mix(STOPS[0], STOPS[1], t * 2) : mix(STOPS[1], STOPS[2], (t - 0.5) * 2);
    for (let x = 0; x < cols; x++) {
      const d = v[y * cols + x] * (0.88 + rand() * 0.24);
      if (d < 0.07) continue;
      const cx = (x + 0.5 + (rand() - 0.5) * 0.7) * CELL;
      const cy = (y + 0.5 + (rand() - 0.5) * 0.7) * CELL;
      const r = CELL * (0.12 + 0.36 * Math.min(1, d)) * (0.8 + rand() * 0.4);
      const tint = rand() < 0.1 ? ODD[(rand() * ODD.length) | 0] : base;
      const c = mix(LIGHT, tint, 0.3 + 0.7 * Math.min(1, d));
      out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="${rgb(c)}" fill-opacity="${(0.55 + 0.45 * Math.min(1, d)).toFixed(2)}"/>`;
      // a specular dot on a quarter of the flakes: the glint of a cut edge
      if (rand() < 0.25 && r > 1.6) out += `<circle cx="${(cx - r * 0.35).toFixed(1)}" cy="${(cy - r * 0.35).toFixed(1)}" r="${(r * 0.32).toFixed(2)}" fill="#fff" fill-opacity="0.85"/>`;
    }
  }
  return out;
}

const P = 'public/products/';
const jobs = {
  // the lace front wig in profile: forehead, nose, lips and neck read at once, the hair falls behind
  hero: { src: P + 'light-golden-long-straight-lace-wig/1-960.webp', cols: 120, crop: [0.12, 0.02, 0.92, 0.96], gain: 2.4, floor: 0.06, widths: [1080, 600, 420] },
  // the heart press-on nails, scattered
  footer: { src: P + 'womens-love-sweet-fake-nails/0-960.webp', cols: 160, crop: [0.04, 0.2, 0.96, 0.8], gamma: 0.9, gain: 5, floor: 0.04, mode: 'lum', widths: [1440, 720] },
};

fs.mkdirSync('public/art', { recursive: true });
const data = {};
for (const [name, job] of Object.entries(jobs)) {
  const f = await densities(job);
  const W = f.cols * CELL;
  const H = f.rows * CELL;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${flakes(f)}</svg>`);
  for (const w of job.widths) {
    const file = `public/art/${name}-${w}.webp`;
    // small files matter more than crisp flakes: the phone loads the 600 px hero first
    const q = w <= 720 ? 58 : 70;
    await sharp(svg, { density: 72 * (w / W) * 1 }).resize(w).webp({ quality: q, alphaQuality: 70, effort: 6 }).toFile(file);
    console.log(file, `${Math.round(fs.statSync(file).size / 1024)} KB`);
  }
  // densities as one digit per cell (0-9): the client places sparkles on the dense cells
  data[name] = { cols: f.cols, rows: f.rows, w: W, h: H, d: [...f.v].map((x) => Math.min(9, Math.round(x * 9))).join('') };
}
fs.writeFileSync('src/data/glitter.json', JSON.stringify(data));
console.log('src/data/glitter.json written');
