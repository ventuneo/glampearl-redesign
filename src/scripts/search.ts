// Client-side product search in the search dialog.
import { openSheet } from './sheet';

type Entry = { handle: string; name: string; line: string; category: string; price: string; img: string; e1: string; terms: string };

const dialog = document.getElementById('search') as HTMLDialogElement | null;
const input = document.querySelector<HTMLInputElement>('[data-search-input]');
const results = document.querySelector<HTMLUListElement>('[data-search-results]');
const start = document.querySelector<HTMLElement>('[data-search-start]');
const countEl = document.querySelector<HTMLElement>('[data-search-count]');
const form = document.querySelector<HTMLFormElement>('[data-search-form]');
let index: Entry[] = [];
try {
  index = JSON.parse(document.getElementById('search-index')?.textContent || '[]');
} catch {
  index = [];
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function run(q: string) {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!results || !start || !countEl) return;
  if (!words.length) {
    results.innerHTML = '';
    start.hidden = false;
    countEl.textContent = '';
    return;
  }
  start.hidden = true;
  const hits = index.filter((e) => words.every((w) => e.terms.includes(w)));
  countEl.textContent = hits.length
    ? `${hits.length} ${hits.length === 1 ? 'product' : 'products'}`
    : `Nothing matches “${q.trim()}”. Try gel, wig, lip or cream.`;
  results.innerHTML = hits
    .map(
      (e, i) => `<li><a class="result" href="/products/${esc(e.handle)}" ${i === 0 ? 'aria-selected="true"' : ''}>
        <span class="field" data-bands="none" style="--e1:${esc(e.e1)}">${e.img ? `<img src="${esc(e.img)}" alt="" width="56" height="56" loading="lazy" decoding="async" />` : ""}</span>
        <span><span class="result__name">${esc(e.name)}</span><span class="result__line">${esc(e.line)}</span></span>
        <span class="t-s num">${esc(e.price)}</span>
      </a></li>`,
    )
    .join('');
}

input?.addEventListener('input', () => run(input.value));
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const first = results?.querySelector<HTMLAnchorElement>('a.result');
  if (first) window.location.href = first.href;
});

document.querySelectorAll<HTMLElement>('[data-open-search]').forEach((btn) =>
  btn.addEventListener('click', () => {
    if (!dialog) return;
    openSheet(dialog);
    input?.focus();
  }),
);
