// Shared interactions: .cta blocks trade places on hover (widths measured here), and the floating bar
// notes which ground is under it.
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
