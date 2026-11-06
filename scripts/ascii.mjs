// Turns a product photograph into a glyph field (the hero and footer art). Brightness of each cell is the
// distance of the photograph from its own studio ground, so the ground drops out and the product stays.
// Usage: node scripts/ascii.mjs  (writes src/data/ascii.json)
import fs from 'node:fs';
import sharp from 'sharp';

export const RAMP = ' .·:-+=oO0@';
const CELL = 1 / 0.6 / 1.0; // Geist Mono: advance 0.6 em, line height 1.0 em

async function field({ src, cols, crop, gamma = 1, gain = 1, floor = 0, mode = "dist", cap = 1, jitter = 0 }) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const img = sharp(src);
  const { width, height } = await img.metadata();
  const [x0, y0, x1, y1] = crop ?? [0, 0, 1, 1];
  const cw = Math.round((x1 - x0) * width), ch = Math.round((y1 - y0) * height);
  const rows = Math.round((cols * ch) / cw / CELL);
  const { data } = await img
    .extract({ left: Math.round(x0 * width), top: Math.round(y0 * height), width: cw, height: ch })
    .resize(cols, rows, { fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Studio ground = the median of the border cells.
  const border = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (x === 0 || y === 0 || x === cols - 1) border.push(y * cols + x);
  const med = [0, 1, 2].map((c) => border.map((i) => data[i * 3 + c]).sort((a, b) => a - b)[border.length >> 1]);
  const lines = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 3;
      const d = Math.hypot(data[i] - med[0], data[i + 1] - med[1], data[i + 2] - med[2]) / 255;
      const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      const mask = Math.min(1, Math.max(0, (d - floor) * gain));
      let v = mode === "lum" ? mask * (0.15 + 0.85 * lum) : mask;
      v = Math.pow(v, gamma);
      // a little seeded noise before quantising: printed texture instead of flat bands of one glyph
      if (v > 0.04) v = Math.min(1, Math.max(0, v * cap + (rand() - 0.5) * jitter));
      line += RAMP[Math.round(v * (RAMP.length - 1))];
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return { cols, rows, lines };
}

const preview = process.argv[2];
export { field };
const jobs = {
  // the lace front wig in profile: forehead, nose, lips and neck read at once, the hair falls behind
  hero: { src: 'public/products/light-golden-long-straight-lace-wig/1-960.webp', cols: 110, crop: [0.12, 0.02, 0.92, 0.96], gain: 2.4, floor: 0.06, cap: 0.84, jitter: 0.24 },
  footer: { src: 'public/products/womens-love-sweet-fake-nails/0-960.webp', cols: 120, crop: [0.04, 0.2, 0.96, 0.8], gamma: 0.9, gain: 5, floor: 0.04, mode: 'lum' },
};
if (process.argv[1].endsWith('ascii.mjs')) {
const out = {};
for (const [k, job] of Object.entries(jobs)) {
  if (preview && preview !== k) continue;
  out[k] = await field(job);
}
if (preview) console.log(out[preview].lines.join('\n'));
else {
  fs.writeFileSync('src/data/ascii.json', JSON.stringify(out));
  for (const [k, v] of Object.entries(out)) console.log(k, `${v.cols}x${v.rows}`);
}
}
