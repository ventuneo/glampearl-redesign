// Shared studio interactions: mono labels scramble on hover, .cta blocks trade places (widths measured
// here), and the floating bar takes the colour of the section under it.
import { gsap } from 'gsap';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/?'.split('');

/* ---------- scramble: letters run through noise and settle left to right in 360 ms ---------- */
const running = new WeakMap<HTMLElement, gsap.core.Tween>();
function scramble(el: HTMLElement) {
  const text = (el.dataset.text ??= el.textContent ?? '');
  running.get(el)?.kill();
  const state = { p: 0 };
  const tween = gsap.to(state, {
    p: 1,
    duration: 0.36,
    ease: 'none',
    onUpdate() {
      const settled = Math.floor(state.p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        out += i < settled || c === ' ' ? c : NOISE[(Math.random() * NOISE.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() {
      el.textContent = text;
    },
  });
  running.set(el, tween);
}
document.addEventListener(
  'pointerover',
  (e) => {
    if (reduce.matches || !fine.matches) return;
    const host = (e.target as HTMLElement).closest<HTMLElement>('a, button, summary');
    if (!host || host.contains(e.relatedTarget as Node)) return;
    const targets = host.matches('[data-scramble]') ? [host] : [...host.querySelectorAll<HTMLElement>('[data-scramble]')];
    targets.forEach(scramble);
  },
  { passive: true },
);

/* ---------- .cta: measure the two blocks so hover can swap them with transforms ---------- */
const ro = new ResizeObserver((entries) => {
  for (const { target } of entries) {
    const cta = target.closest<HTMLElement>('.cta');
    const label = cta?.querySelector<HTMLElement>('.cta__label');
    const sq = cta?.querySelector<HTMLElement>('.cta__sq');
    // hidden (a closed dialog): measure again when it shows
    if (!cta || !label || !sq || !label.offsetWidth) continue;
    cta.style.setProperty('--lw', `${label.offsetWidth}px`);
    cta.style.setProperty('--sw', `${sq.offsetWidth}px`);
    cta.dataset.measured = '';
  }
});
document.querySelectorAll('.cta .cta__label').forEach((l) => ro.observe(l));

/* ---------- the bar follows the ground under it ---------- */
const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')].filter((s) => s !== document.body && !s.closest('dialog, header'));
const root = document.documentElement;
if (sections.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) root.dataset.bar = (en.target as HTMLElement).dataset.theme;
    },
    // a thin line through the middle of the bar
    { rootMargin: `-38px 0px -${Math.max(0, innerHeight - 40)}px 0px` },
  );
  sections.forEach((s) => io.observe(s));
}
