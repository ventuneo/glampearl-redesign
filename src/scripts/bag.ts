// Bag: state in localStorage, drawer UI, checkout through the live store's cart permalink.
// Shopify port: replace storage with /cart/add.js and /cart.js; the markup and drawer stay.
import { openSheet } from './sheet';
import { assetSrc, pageHref } from './url';

export type BagItem = {
  id: number;
  handle: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  img: string;
  e1: string;
  e2: string;
  bands: string;
  band: number;
};

const KEY = 'gp-bag-v1';
const STORE = 'https://glampearl.store';
const MAX_QTY = 20;

const CHF = new Intl.NumberFormat('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => `CHF ${CHF.format(n).replace(/'/g, '’')}`;

function load(): BagItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as BagItem[]) : [];
    return Array.isArray(items) ? items.filter((i) => i && typeof i.id === 'number' && i.qty > 0) : [];
  } catch {
    return [];
  }
}

let items = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode: the bag still works for this page view */
  }
}

const dialog = document.getElementById('bag') as HTMLDialogElement | null;
const list = document.querySelector<HTMLUListElement>('[data-bag-list]');
const empty = document.querySelector<HTMLElement>('[data-bag-empty]');
const foot = document.querySelector<HTMLElement>('[data-bag-foot]');
const subtotalEl = document.querySelector<HTMLElement>('[data-bag-subtotal]');
const checkout = document.querySelector<HTMLAnchorElement>('[data-checkout]');
const live = document.querySelector<HTMLElement>('[data-bag-live]');

const count = () => items.reduce((n, i) => n + i.qty, 0);

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function render() {
  const n = count();
  document.querySelectorAll<HTMLElement>('[data-bag-count]').forEach((el) => {
    el.textContent = String(n);
    el.setAttribute('aria-label', `${n} ${n === 1 ? 'item' : 'items'}`);
    el.toggleAttribute('data-empty', n === 0);
  });
  const text = document.querySelector<HTMLElement>('[data-bag-count-text]');
  if (text) text.textContent = n ? `(${n})` : '';
  if (!list) return;
  list.innerHTML = items
    .map(
      (i) => `
    <li class="bag-item" data-id="${i.id}">
      <a href="${esc(pageHref(`/products/${i.handle}`))}" tabindex="-1" aria-hidden="true">
        <span class="field" data-bands="${esc(i.bands)}" style="--e1:${esc(i.e1)};--e2:${esc(i.e2)};--band:${i.band}">
          ${i.img ? `<img src="${esc(assetSrc(i.img))}" alt="" width="76" height="76" loading="lazy" decoding="async" />` : ""}
        </span>
      </a>
      <div>
        <a class="bag-item__name" href="${esc(pageHref(`/products/${i.handle}`))}">${esc(i.name)}</a>
        ${i.variant ? `<p class="bag-item__variant">${esc(i.variant)}</p>` : ''}
        <p class="t-s num">${money(i.price * i.qty)}</p>
        <div class="bag-item__row">
          <div class="qty" role="group" aria-label="Quantity of ${esc(i.name)}">
            <button type="button" data-qty="-1" aria-label="One less">−</button>
            <output aria-live="polite">${i.qty}</output>
            <button type="button" data-qty="1" aria-label="One more" ${i.qty >= MAX_QTY ? 'disabled' : ''}>+</button>
          </div>
          <button class="bag-item__remove" type="button" data-remove>Remove</button>
        </div>
      </div>
    </li>`,
    )
    .join('');
  const isEmpty = items.length === 0;
  if (empty) empty.hidden = !isEmpty;
  if (foot) foot.hidden = isEmpty;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (checkout) checkout.href = isEmpty ? `${STORE}/cart` : `${STORE}/cart/${items.map((i) => `${i.id}:${i.qty}`).join(',')}`;
}

export function addToBag(item: Omit<BagItem, 'qty'>, qty = 1) {
  const existing = items.find((i) => i.id === item.id);
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  else items.push({ ...item, qty: Math.min(MAX_QTY, qty) });
  save();
  render();
  if (live) live.textContent = `Added ${item.name}${item.variant ? `, ${item.variant},` : ''} to your bag.`;
  if (dialog) openSheet(dialog);
}

list?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const row = target.closest<HTMLElement>('.bag-item');
  if (!row) return;
  const id = Number(row.dataset.id);
  const item = items.find((i) => i.id === id);
  if (!item) return;
  const step = target.closest<HTMLElement>('[data-qty]');
  if (step) {
    item.qty = Math.max(0, Math.min(MAX_QTY, item.qty + Number(step.dataset.qty)));
  } else if (target.closest('[data-remove]')) {
    item.qty = 0;
  } else return;
  const index = items.indexOf(item);
  items = items.filter((i) => i.qty > 0);
  save();
  render();
  // Keep focus inside the drawer after a row disappears.
  if (item.qty === 0) {
    const rows = list.querySelectorAll<HTMLElement>('.bag-item');
    const next = rows[Math.min(index, rows.length - 1)]?.querySelector<HTMLElement>('[data-qty="1"]');
    (next ?? dialog?.querySelector<HTMLElement>('[data-close]'))?.focus();
    if (live) live.textContent = `Removed ${item.name} from your bag.`;
  } else if (step) {
    // The list re-rendered: put focus back on the same stepper button.
    list.querySelector<HTMLElement>(`[data-id="${id}"] [data-qty="${step.dataset.qty}"]`)?.focus();
  }
});

document.querySelectorAll<HTMLElement>('[data-open-bag]').forEach((btn) =>
  btn.addEventListener('click', () => dialog && openSheet(dialog)),
);

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    items = load();
    render();
  }
});

render();
