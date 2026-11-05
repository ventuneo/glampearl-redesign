// Product page: variant picking, gallery, quantity, add to bag, phone buy bar.
// Shopify port: the same logic reading product.variants from the section's JSON.
import { addToBag } from './bag';

type Img = { src: Record<string, string>; bands: string; band: number; e1: string; e2: string; width: number; height: number };
type Variant = { id: number; title: string; options: string[]; price: number; compareAt: number | null; image: number | null; swatch: string | null; ink: string | null };
type Data = { handle: string; name: string; variants: Variant[]; images: Img[] };

const data = JSON.parse(document.getElementById('product-data')!.textContent!) as Data;
const root = document.querySelector<HTMLElement>('[data-product]')!;
const form = root.querySelector<HTMLFormElement>('[data-form]')!;
const priceEl = root.querySelector<HTMLElement>('[data-price]');
const addBtn = root.querySelector<HTMLButtonElement>('[data-add]')!;
const unavailable = root.querySelector<HTMLElement>('[data-unavailable]');
const qtyEl = root.querySelector<HTMLOutputElement>('[data-qty]')!;
const main = root.querySelector<HTMLElement>('[data-main] .field');
const mainImg = main?.querySelector<HTMLImageElement>('img');
const bar = document.querySelector<HTMLElement>('[data-buybar]');
const barPrice = document.querySelector<HTMLElement>('[data-bar-price]');
const barAdd = document.querySelector<HTMLButtonElement>('[data-bar-add]');

const shade = root.querySelector<HTMLElement>('[data-shade]');
const shadeName = root.querySelector<HTMLElement>('[data-shade-name]');
const variantThumb = root.querySelector<HTMLButtonElement>('[data-variant-thumb]');

const CHF = new Intl.NumberFormat('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => `CHF ${CHF.format(n).replace(/'/g, '’')}`;
let qty = 1;

function setFieldImage(field: HTMLElement, img: HTMLImageElement, im: Img) {
  field.dataset.bands = im.bands;
  field.style.setProperty('--e1', im.e1);
  field.style.setProperty('--e2', im.e2);
  field.style.setProperty('--band', String(im.band));
  img.srcset = `${im.src['480']} 480w, ${im.src['960']} 960w`;
  img.src = im.src['960'];
  img.width = im.width;
  img.height = im.height;
}

// Shade products: the colour field follows the variant, the maker's swatch photograph sits in the last thumbnail.
function showShade(v: Variant) {
  if (!shade || !shadeName || !v.swatch) return;
  shade.style.setProperty('--shade', v.swatch);
  shade.style.setProperty('--shade-ink', v.ink ?? '#34302d');
  shadeName.classList.add('is-swapping');
  window.setTimeout(() => {
    shadeName.textContent = v.title.toLowerCase();
    shadeName.classList.remove('is-swapping');
  }, 120);
  if (variantThumb && v.image != null) {
    const wasShown = variantThumb.getAttribute('aria-pressed') === 'true';
    variantThumb.dataset.thumb = String(v.image);
    const f = variantThumb.querySelector<HTMLElement>('.field');
    const i = variantThumb.querySelector<HTMLImageElement>('img');
    if (f && i) setFieldImage(f, i, data.images[v.image]);
    if (wasShown) {
      shownImage = -1;
      showImage(v.image);
    }
  }
}
let current: Variant | undefined = data.variants[0];
let shownImage = -1;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function showImage(index: number) {
  if (!main || !mainImg || index === shownImage) return;
  const im = data.images[index];
  if (!im) return;
  shownImage = index;
  // Crossfade instead of a hard cut (find-animation-opportunities #1). The next photograph is decoded first,
  // so the transition never fades to an empty frame. Browsers without view transitions swap instantly.
  const swap = () => setFieldImage(main, mainImg, im);
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !reduceMotion.matches) {
    const pre = new Image();
    pre.src = im.src['960'];
    pre
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (shownImage === index) doc.startViewTransition!(swap);
      });
  } else swap();
  root.querySelectorAll<HTMLButtonElement>('[data-thumb]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.thumb) === index)));
}

function selected(): string[] {
  // Start from the current variant so options with a single value keep it.
  const values = [...(current?.options ?? data.variants[0].options)];
  form.querySelectorAll<HTMLFieldSetElement>('[data-option]').forEach((fs) => {
    const i = Number(fs.dataset.option);
    const checked = fs.querySelector<HTMLInputElement>('input:checked');
    if (checked) values[i] = checked.value;
  });
  return values;
}

function update(fromUrl = false) {
  const values = selected();
  current = data.variants.find((v) => v.options.every((o, i) => o === values[i]));
  form.querySelectorAll<HTMLElement>('[data-option-value]').forEach((el) => {
    el.textContent = values[Number(el.dataset.optionValue)]?.toLowerCase() ?? '';
  });
  if (!current) {
    addBtn.disabled = true;
    if (unavailable) unavailable.hidden = false;
    return;
  }
  addBtn.disabled = false;
  if (unavailable) unavailable.hidden = true;
  if (priceEl) priceEl.textContent = money(current.price);
  if (barPrice) barPrice.textContent = money(current.price);
  if (shade) showShade(current);
  else if (current.image != null) showImage(current.image);
  if (!fromUrl && data.variants.length > 1) {
    const url = new URL(location.href);
    url.searchParams.set('variant', String(current.id));
    history.replaceState(null, '', url);
  }
}

// ?variant=<id>, as Shopify links to a variant.
const fromParam = Number(new URL(location.href).searchParams.get('variant'));
const initial = data.variants.find((v) => v.id === fromParam);
if (initial) {
  current = initial;
  form.querySelectorAll<HTMLFieldSetElement>('[data-option]').forEach((fs) => {
    const i = Number(fs.dataset.option);
    const input = [...fs.querySelectorAll<HTMLInputElement>('input')].find((x) => x.value === initial.options[i]);
    if (input) input.checked = true;
  });
}
shownImage = Number(root.querySelector<HTMLButtonElement>('[data-thumb][aria-pressed="true"]')?.dataset.thumb ?? -1);
update(true);

form.addEventListener('change', () => update());

root.querySelectorAll<HTMLButtonElement>('[data-thumb]').forEach((b) =>
  b.addEventListener('click', () => {
    shownImage = -1;
    showImage(Number(b.dataset.thumb));
  }),
);

root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) =>
  b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(20, qty + Number(b.dataset.step)));
    qtyEl.textContent = String(qty);
  }),
);

function add() {
  if (!current) return;
  const im: Img | undefined = data.images[current.image ?? 0] ?? data.images[0];
  const variant = data.variants.length > 1 ? current.title : '';
  addToBag(
    { id: current.id, handle: data.handle, name: data.name, variant, price: current.price, img: im?.src['480'] ?? '', e1: im?.e1 ?? '#f1edea', e2: im?.e2 ?? '#f1edea', bands: im?.bands ?? 'none', band: im?.band ?? 0 },
    qty,
  );
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  add();
});
barAdd?.addEventListener('click', add);

// Phone buy bar: shows once the real button is above the screen, hides again when it comes back.
// The root reaches far below the screen, so "not intersecting" means "above it", even after a fast fling
// that jumps straight past the button.
if (bar && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    ([entry]) => {
      const passed = !entry.isIntersecting;
      bar.toggleAttribute('data-show', passed);
      bar.toggleAttribute('inert', !passed);
      bar.setAttribute('aria-hidden', String(!passed));
      barAdd?.setAttribute('tabindex', passed ? '0' : '-1');
    },
    { threshold: 0, rootMargin: '0px 0px 100000px 0px' },
  );
  io.observe(addBtn);
}
