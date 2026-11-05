# GlamPearl redesign (prototype)

A complete redesign of glampearl.store as a clickable prototype outside Shopify, built with Astro.
Real products, prices, variants, photographs and Judge.me ratings come from the live shop. Checkout goes
to the live Shopify checkout through a cart link, so the flow can be clicked through to the payment page.

Design record: [`DESIGN.md`](DESIGN.md). Text changes for Shopify: [`TEXTE.md`](TEXTE.md).

## Run

```bash
npm install
npx playwright install chromium   # only for the checks below
npm run build
npx astro preview --host 127.0.0.1 --port 4321
```

Open http://127.0.0.1:4321.

## Data

```bash
node scripts/fetch-products.mjs data-raw/handles.txt   # products and ratings from the live shop (slow on purpose)
node scripts/build-catalog.mjs                         # photographs, colour fields, gel shades -> src/data/catalog.json
node scripts/texte.mjs                                 # TEXTE.md from src/data/copy.json
node scripts/make-og.mjs                               # share image and favicons (preview server running)
```

New names and one-line descriptions live in `src/data/copy.json`.

## Checks

```bash
node scripts/e2e.mjs                 # 18 interaction checks (bag, shade card, variants, search, phone)
node scripts/shot.mjs / .shots/home  # screenshots at 1440 and 390
```

`npx astro dev` adds a worst-case data harness at `/dev/break-ui` (never part of a build).

## Shopify port

Each component names its future Shopify file in its first comment, e.g. `sections/ShadeHero.astro` →
`sections/hero-shade-card.liquid`. Design tokens in `src/styles/global.css` carry over unchanged.
