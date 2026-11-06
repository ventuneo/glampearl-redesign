// Sparkles over the glitter images: a few flakes catch the light at rest, a sweep of light passes once
// when the image first shows, and the pointer makes the flakes around it flash. One clock (gsap.ticker),
// paused off screen, off under reduced motion (the still image stays).
import { gsap } from 'gsap';

type Glint = { x: number; y: number; t0: number; life: number; size: number; hue: string };
type Field = {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  dense: number[]; // cell indices bright enough to sparkle
  glints: Glint[];
  visible: boolean;
  sweepAt: number;
  lastIdle: number;
  w: number;
  h: number;
  dpr: number;
};

const HALO = ['rgba(214,112,160,0.95)', 'rgba(169,139,217,0.95)', 'rgba(229,141,120,0.95)', 'rgba(217,166,80,0.95)'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fields: Field[] = [];

function size(f: Field) {
  const r = f.el.getBoundingClientRect();
  f.dpr = Math.min(2, devicePixelRatio || 1);
  f.w = r.width;
  f.h = r.height;
  f.canvas.width = Math.round(r.width * f.dpr);
  f.canvas.height = Math.round(r.height * f.dpr);
}

function spawn(f: Field, i: number, now: number, big = 1) {
  const x = ((i % f.cols) + 0.5 + (Math.random() - 0.5) * 0.6) / f.cols;
  const y = (Math.floor(i / f.cols) + 0.5 + (Math.random() - 0.5) * 0.6) / f.rows;
  f.glints.push({
    x,
    y,
    t0: now,
    life: 520 + Math.random() * 620,
    size: (2.6 + Math.random() * 4.2) * big,
    hue: HALO[(Math.random() * HALO.length) | 0],
  });
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const k = s * 0.18; // waist of the four points
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + k, y - k, x + s, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + s);
  ctx.quadraticCurveTo(x - k, y + k, x - s, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - s);
  ctx.fill();
}

function setup(el: HTMLElement) {
  const name = el.dataset.glitter!;
  const map = document.querySelector<HTMLElement>(`[data-glitter-map="${name}"]`);
  const canvas = el.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!map || !canvas || !ctx) return;
  const { cols, rows, d } = JSON.parse(map.textContent!) as { cols: number; rows: number; d: string };
  const dense: number[] = [];
  for (let i = 0; i < d.length; i++) if (d.charCodeAt(i) - 48 >= 4) dense.push(i);
  const f: Field = { el, canvas, ctx, cols, rows, dense, glints: [], visible: false, sweepAt: -1, lastIdle: 0, w: 0, h: 0, dpr: 1 };
  size(f);
  new ResizeObserver(() => size(f)).observe(el);
  new IntersectionObserver(([en]) => {
    f.visible = en.isIntersecting;
    if (f.visible && f.sweepAt < 0) f.sweepAt = performance.now();
    if (!f.visible) f.ctx.clearRect(0, 0, f.canvas.width, f.canvas.height);
  }).observe(el);

  let px = -1;
  let py = -1;
  let last = 0;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width;
    py = (e.clientY - r.top) / r.height;
    const now = performance.now();
    if (now - last < 30) return;
    last = now;
    // flakes within a small radius of the pointer flash
    const cx = px * cols;
    const cy = py * rows;
    for (let k = 0; k < 4; k++) {
      const x = Math.round(cx + (Math.random() - 0.5) * 12);
      const y = Math.round(cy + (Math.random() - 0.5) * 12);
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      const i = y * cols + x;
      if (d.charCodeAt(i) - 48 >= 2) spawn(f, i, now, 1.25);
    }
  });
  fields.push(f);
}

function tick() {
  const now = performance.now();
  for (const f of fields) {
    if (!f.visible || !f.dense.length) continue;
    // at rest: about 18 new sparkles a second
    if (now - f.lastIdle > 55) {
      f.lastIdle = now;
      spawn(f, f.dense[(Math.random() * f.dense.length) | 0], now);
    }
    // the sweep: a diagonal band of light crosses the image once, in 1.6 s
    if (f.sweepAt >= 0) {
      const p = (now - f.sweepAt) / 1600;
      if (p <= 1) {
        for (let k = 0; k < 5; k++) {
          const i = f.dense[(Math.random() * f.dense.length) | 0];
          const x = (i % f.cols) / f.cols;
          const y = Math.floor(i / f.cols) / f.rows;
          if (Math.abs((x + y) / 2 - p) < 0.06) spawn(f, i, now, 1.1);
        }
      } else f.sweepAt = Infinity;
    }
    const { ctx, dpr } = f;
    ctx.clearRect(0, 0, f.canvas.width, f.canvas.height);
    f.glints = f.glints.filter((g) => now - g.t0 < g.life);
    for (const g of f.glints) {
      const p = (now - g.t0) / g.life;
      const a = Math.sin(Math.PI * p); // up and back down
      const s = g.size * (0.35 + 0.65 * a) * dpr;
      const x = g.x * f.w * dpr;
      const y = g.y * f.h * dpr;
      ctx.globalAlpha = a;
      ctx.shadowColor = g.hue;
      ctx.shadowBlur = 12 * dpr;
      ctx.fillStyle = '#ffffff';
      star(ctx, x, y, s * 2.2);
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

if (!reduce.matches) {
  document.querySelectorAll<HTMLElement>('[data-glitter]').forEach(setup);
  if (fields.length) gsap.ticker.add(tick);
}
