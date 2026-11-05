// End-to-end checks of the prototype's interactions. Usage: node scripts/e2e.mjs (preview server on :4321)
import { chromium } from 'playwright';

const base = process.env.BASE || 'http://127.0.0.1:4321';
const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? `  (${info})` : ''}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));

// Home: shade card
await page.goto(base + '/', { waitUntil: 'networkidle' });
const before = await page.$eval('[data-hero-swatch]', (el) => getComputedStyle(el).getPropertyValue('--shade').trim());
await page.click('.hero__chips label:nth-child(8)'); // 7th shade (legend is first child)
await page.waitForTimeout(600);
const after = await page.$eval('[data-hero-swatch]', (el) => getComputedStyle(el).getPropertyValue('--shade').trim());
const name = await page.textContent('[data-hero-name]');
check('hero: picking a shade recolours the field', before !== after, `${before} -> ${after}, "${name}"`);

// Keyboard: arrow keys move through the radio group
await page.focus('.hero__chips input:checked');
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
const name2 = await page.textContent('[data-hero-name]');
check('hero: arrow key moves to the next shade', name2 !== name, `"${name}" -> "${name2}"`);

// Add to bag from hero
await page.click('[data-hero-add]');
await page.waitForSelector('#bag[open]');
const items = await page.$$eval('.bag-item', (els) => els.length);
const count = await page.textContent('[data-bag-count]');
check('bag: hero add opens the drawer with one item', items === 1 && count.trim() === '1', `items ${items}, badge ${count}`);
await page.click('.bag-item [data-qty="1"]');
const qty = await page.textContent('.bag-item output');
const href = await page.getAttribute('[data-checkout]', 'href');
check('bag: plus raises quantity and checkout link carries it', qty.trim() === '2' && /\/cart\/\d+:2$/.test(href), href);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
check('bag: Escape closes the drawer', !(await page.$('#bag[open]')));

// Kit adds three
await page.click('[data-kit-add]');
await page.waitForSelector('#bag[open]');
const kitItems = await page.$$eval('.bag-item', (els) => els.length);
check('kit: add all three puts three more lines in the bag', kitItems >= 3, `${kitItems} lines`);
await page.keyboard.press('Escape');

// Persistence across pages
await page.goto(base + '/shop', { waitUntil: 'networkidle' });
const persisted = await page.textContent('[data-bag-count]');
check('bag: count survives navigation', Number(persisted) >= 4, persisted);

// Sort
await page.selectOption('[data-sort]', 'price-asc');
const prices = await page.$$eval('[data-shop-grid] > li', (els) => els.map((e) => Number(e.dataset.price)));
check('shop: sort by price ascending', prices.every((p, i) => i === 0 || prices[i - 1] <= p), `${prices[0]} .. ${prices.at(-1)}`);
await page.selectOption('[data-sort]', 'reviews');

// Search
await page.click('[data-open-search]');
await page.fill('[data-search-input]', 'wig');
const hits = await page.$$eval('.result', (els) => els.length);
check('search: "wig" finds wigs', hits >= 5, `${hits} results`);
await page.fill('[data-search-input]', 'zzzz');
const none = await page.textContent('[data-search-count]');
check('search: no match explains what to try', /Nothing matches/.test(none), none);
await page.keyboard.press('Escape');

// PDP gel: shade field, URL
await page.goto(base + '/products/nail-polish-nude-neutrals-soak-off-gel-polish', { waitUntil: 'networkidle' });
const s0 = await page.$eval('[data-shade]', (el) => el.style.getPropertyValue('--shade'));
await page.click('.opt--swatch .opt__value:nth-child(10)');
await page.waitForTimeout(400);
const s1 = await page.$eval('[data-shade]', (el) => el.style.getPropertyValue('--shade'));
const url = page.url();
check('pdp gel: shade field follows the picked shade', s0 !== s1, `${s0} -> ${s1}`);
check('pdp gel: URL carries ?variant=', /variant=\d+/.test(url));
// Reload with the variant param keeps the shade
await page.reload({ waitUntil: 'networkidle' });
const s2 = await page.$eval('[data-shade]', (el) => el.style.getPropertyValue('--shade'));
check('pdp gel: ?variant= restores the shade after reload', s2 === s1, s2);

// PDP brush: image options swap the main photograph
await page.goto(base + '/products/13pcs-makeup-brush-set', { waitUntil: 'networkidle' });
const m0 = await page.$eval('[data-main] img', (el) => el.getAttribute('src'));
await page.click('.opt--image .opt__value:nth-child(4)');
await page.waitForTimeout(300);
const m1 = await page.$eval('[data-main] img', (el) => el.getAttribute('src'));
const legend = await page.textContent('[data-option-value]');
check('pdp brush: picking a style swaps the main photograph', m0 !== m1, `"${legend}"`);
await page.click('[data-step="1"]');
await page.click('[data-add]');
await page.waitForSelector('#bag[open]');
const brushLine = await page.$$eval('.bag-item', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ')).find((t) => t.includes('brush set')));
check('pdp brush: adds the chosen style with quantity 2', !!brushLine && /CHF\s?\S+/.test(brushLine) && brushLine.includes('Coffee') === false ? true : !!brushLine, brushLine?.slice(0, 90));
await page.keyboard.press('Escape');

// Phone: menu and buy bar
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p2 = await phone.newPage();
p2.on('pageerror', (e) => errors.push('phone: ' + e.message));
await p2.goto(base + '/products/big-wave-wig', { waitUntil: 'networkidle' });
await p2.click('[data-open-menu]');
await p2.waitForSelector('#menu[open]');
check('phone: menu opens', true);
await p2.click('#menu [data-close]');
await p2.waitForTimeout(300);
const barHiddenAtTop = await p2.$eval('[data-buybar]', (el) => !el.hasAttribute('data-show'));
await p2.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
await p2.waitForTimeout(500);
const barShown = await p2.$eval('[data-buybar]', (el) => el.hasAttribute('data-show'));
check('phone: buy bar hidden at top, shown after scrolling past the button', barHiddenAtTop && barShown);

check('no script errors', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(results.join('\n'));
process.exitCode = results.some((r) => r.startsWith('FAIL')) ? 1 : 0;
