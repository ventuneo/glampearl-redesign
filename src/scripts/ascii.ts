// Glyph fields: a few glyphs flicker at rest, a scan passes once when the field first shows, and glyphs
// under the pointer scramble and settle back. One clock (gsap.ticker); paused off screen and under reduced motion.
import { gsap } from 'gsap';

const NOISE = 'glampearl+=*#%<>/:;?!'.split('');
const pick = () => NOISE[(Math.random() * NOISE.length) | 0];

type Field = {
  el: HTMLElement;
  rows: HTMLElement[];
  base: string[][];
  cur: string[][];
  until: Map<number, number>; // cell index -> time it settles back
  dirty: Set<number>;
  cells: number[]; // indices of non-empty cells, for the idle flicker
  cols: number;
  visible: boolean;
  scanAt: number; // time the scan started, or -1
  lastIdle: number;
};

const fields: Field[] = [];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

function setup(el: HTMLElement) {
  const rows = [...el.querySelectorAll<HTMLElement>('.ascii__row')];
  const cols = Number(getComputedStyle(el).getPropertyValue('--cols')) || 80;
  const base = rows.map((r) => [...(r.textContent ?? '').padEnd(cols, ' ')]);
  const cells: number[] = [];
  base.forEach((row, y) => row.forEach((c, x) => c !== ' ' && cells.push(y * cols + x)));
  const f: Field = {
    el,
    rows,
    base,
    cur: base.map((r) => [...r]),
    until: new Map(),
    dirty: new Set(),
    cells,
    cols,
    visible: false,
    scanAt: -1,
    lastIdle: 0,
  };
  fields.push(f);

  new IntersectionObserver(([entry]) => {
    f.visible = entry.isIntersecting;
    if (f.visible && f.scanAt < 0) f.scanAt = performance.now();
  }).observe(el);

  el.addEventListener('pointermove', (e) => {
    if (reduce.matches) return;
    const r = el.getBoundingClientRect();
    const cw = r.width / f.cols;
    const ch = r.height / f.rows.length;
    const cx = Math.floor((e.clientX - r.left) / cw);
    const cy = Math.floor((e.clientY - r.top) / ch);
    const now = performance.now();
    const R = 4;
    for (let y = cy - R; y <= cy + R; y++) {
      if (y < 0 || y >= f.rows.length) continue;
      for (let x = cx - R * 2; x <= cx + R * 2; x++) {
        if (x < 0 || x >= f.cols) continue;
        // cells are about 1.67 times taller than wide: an ellipse in cells is a circle on screen
        const d = Math.hypot((x - cx) / 2, y - cy);
        if (d > R || f.base[y][x] === ' ') continue;
        scramble(f, y * f.cols + x, now + 160 + Math.random() * 520);
      }
    }
  });
}

function scramble(f: Field, i: number, until: number) {
  const y = (i / f.cols) | 0;
  const x = i % f.cols;
  f.cur[y][x] = pick();
  f.until.set(i, Math.max(until, f.until.get(i) ?? 0));
  f.dirty.add(y);
}

function tick() {
  const now = performance.now();
  for (const f of fields) {
    if (!f.visible) continue;
    // idle: a handful of glyphs flicker, about 12 times a second
    if (now - f.lastIdle > 90 && f.cells.length) {
      f.lastIdle = now;
      for (let k = 0; k < 5; k++) scramble(f, f.cells[(Math.random() * f.cells.length) | 0], now + 150 + Math.random() * 400);
    }
    // the scan: a band of scrambled rows passes from top to bottom once, in 1.4 s
    if (f.scanAt >= 0) {
      const p = (now - f.scanAt) / 1400;
      if (p <= 1.1) {
        const y = Math.floor(p * f.rows.length);
        for (let yy = y - 1; yy <= y + 1; yy++) {
          if (yy < 0 || yy >= f.rows.length) continue;
          for (let x = 0; x < f.cols; x++) if (f.base[yy][x] !== ' ' && Math.random() < 0.55) scramble(f, yy * f.cols + x, now + 90 + Math.random() * 260);
        }
      }
    }
    // settle
    for (const [i, t] of f.until) {
      if (t > now) continue;
      const y = (i / f.cols) | 0;
      f.cur[y][i % f.cols] = f.base[y][i % f.cols];
      f.until.delete(i);
      f.dirty.add(y);
    }
    for (const y of f.dirty) f.rows[y].textContent = f.cur[y].join('').replace(/\s+$/, '') || ' ';
    f.dirty.clear();
  }
}

export function initAscii() {
  if (reduce.matches) return;
  document.querySelectorAll<HTMLElement>('[data-ascii]').forEach(setup);
  if (fields.length) gsap.ticker.add(tick);
}

initAscii();
