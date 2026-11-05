// break-ui worst-case fixture. Shaped exactly like catalog products; enters through the same boundary
// (src/lib/catalog.ts) and only in the dev server. Values are plausible for this shop or Shopify's limits.
import type { Product } from '../lib/catalog';

const img = (e1: string) => ({
  id: 1,
  src: { '480': '/products/afro-kinky-curly-human-hair-wig/0-480.webp', '960': '/products/afro-kinky-curly-human-hair-wig/0-960.webp' },
  width: 1024,
  height: 1536,
  alt: '',
  bands: 'lr' as const,
  band: 16.67,
  e1,
  e2: e1,
  field: e1,
});

const base = {
  about: '',
  use: [] as string[],
  details: [] as [string, string][],
  includes: [] as string[],
  productType: 'Hair & Extension',
  compareAt: null,
  options: [{ name: 'Title', values: ['Default Title'] }],
};

export const worstCase: Product[] = [
  {
    ...base,
    // A supplier title pasted as the name, the way the live shop's titles look today (Shopify allows 255).
    handle: 'worst-long-title',
    name: 'fiber builder nail gel for quick nail building and repair of broken nails, soak-off uv/led gel with 10 fiberglass extension pieces',
    line: 'Soak-off builder gel to build, strengthen, shape and repair nails, ideal for extensions and do-it-yourself manicures at home, cured under any UV or LED lamp in about 60 seconds per layer.',
    titleOriginal: 'Fiber Builder Nail Gel',
    category: 'nails',
    priceMin: 1299,
    priceMax: 1299,
    compareAt: 1599,
    rating: { average: 5, count: 1 },
    variants: [{ id: 990001, title: 'Default Title', options: ['Default Title'], price: 1299, compareAt: 1599, image: 0, swatch: null }],
    images: [img('#f3e9df')],
    options: [{ name: 'Title', values: ['Default Title'] }],
  },
  {
    ...base,
    // Shortest real name in beauty retail.
    handle: 'worst-short',
    name: 'oil',
    line: '',
    titleOriginal: 'Oil',
    category: 'skin',
    priceMin: 9.9,
    priceMax: 159.9,
    rating: null,
    variants: [
      { id: 990002, title: 'Turmeric Brightening Facial Cleanser 2 pcs + Turmeric Cleansing Pads 40pcs + Turmeric & Kojic Acid Soap + Soap Bag', options: ['Turmeric Brightening Facial Cleanser 2 pcs + Turmeric Cleansing Pads 40pcs + Turmeric & Kojic Acid Soap + Soap Bag'], price: 159.9, compareAt: null, image: null, swatch: null },
      { id: 990003, title: '10ml', options: ['10ml'], price: 9.9, compareAt: null, image: null, swatch: null },
      { id: 990004, title: 'Refill-Pack-UV/LED-Fiberglass-10pcs', options: ['Refill-Pack-UV/LED-Fiberglass-10pcs'], price: 19.9, compareAt: null, image: null, swatch: null },
    ],
    options: [{ name: 'Specifications', values: ['Turmeric Brightening Facial Cleanser 2 pcs + Turmeric Cleansing Pads 40pcs + Turmeric & Kojic Acid Soap + Soap Bag', '10ml', 'Refill-Pack-UV/LED-Fiberglass-10pcs'] }],
    // Shopify allows a product with no photograph.
    images: [],
    details: [['Ingredients', 'Aqua, Glycerin, Curcuma Longa (Turmeric) Root Extract, Kojic Acid, Niacinamide, Sodium Hyaluronate, Tocopheryl Acetate, Phenoxyethanol, Ethylhexylglycerin, Parfum']],
  },
];

export const worstBag = [
  { id: 990001, handle: 'worst-long-title', name: worstCase[0].name, variant: '', price: 1299, qty: 20, img: '/products/afro-kinky-curly-human-hair-wig/0-480.webp', e1: '#f3e9df', e2: '#f3e9df', bands: 'lr', band: 16.67 },
  { id: 990002, handle: 'worst-short', name: 'oil', variant: worstCase[1].variants[0].title, price: 159.9, qty: 1, img: '', e1: '#f1edea', e2: '#f1edea', bands: 'none', band: 0 },
];
