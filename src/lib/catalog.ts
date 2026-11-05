// Catalogue access for pages and components. Mirrors what Shopify's `product` and `collection` objects give a theme.
import data from '../data/catalog.json';
import { inkOn } from './colour';

export type Img = {
  id: number;
  src: Record<string, string>;
  width: number;
  height: number;
  alt: string;
  bands: 'tb' | 'lr' | 'none';
  band: number;
  e1: string;
  e2: string;
  field: string;
};

export type Variant = {
  id: number;
  title: string;
  options: string[];
  price: number;
  compareAt: number | null;
  image: number | null;
  /** Real shade colour read from the maker's swatch photograph (gel polish only). */
  swatch: string | null;
};

export type Product = {
  handle: string;
  name: string;
  line: string;
  about: string;
  use: string[];
  details: [string, string][];
  includes: string[];
  titleOriginal: string;
  category: CategorySlug;
  productType: string;
  priceMin: number;
  priceMax: number;
  compareAt: number | null;
  rating: { average: number; count: number } | null;
  options: { name: string; values: string[] }[];
  variants: Variant[];
  images: Img[];
};

export type CategorySlug = 'nails' | 'skin' | 'makeup' | 'hair';

export const STORE = 'https://glampearl.store';

export const CATEGORIES: { slug: CategorySlug; name: string; line: string }[] = [
  { slug: 'nails', name: 'nails', line: 'Gel shades, builder gel, the lamp and the tools.' },
  { slug: 'skin', name: 'skin', line: 'Cleanse, treat, moisturise, protect.' },
  { slug: 'makeup', name: 'makeup', line: 'Eyes, brows, lips, cheeks and the brushes.' },
  { slug: 'hair', name: 'hair', line: 'Wigs, hair care and clippers.' },
];

export const products = data as unknown as Product[];

export const byHandle = (handle: string) => products.find((p) => p.handle === handle);

export const inCategory = (slug: CategorySlug) => products.filter((p) => p.category === slug);

export const money = (n: number) => `CHF ${n.toFixed(2)}`;

export const priceLabel = (p: Product) => (p.priceMin === p.priceMax ? money(p.priceMin) : `from ${money(p.priceMin)}`);

/** Real Judge.me numbers only: count-weighted average and total over all products. */
export function reviewTotals() {
  let count = 0;
  let sum = 0;
  for (const p of products) {
    if (!p.rating) continue;
    count += p.rating.count;
    sum += p.rating.average * p.rating.count;
  }
  return { count, average: count ? sum / count : 0 };
}

/** Ordered by number of reviews, then rating: the closest public signal to "best sellers". */
export function bestsellers(n = 8) {
  return [...products]
    .filter((p) => p.rating)
    .sort((a, b) => b.rating!.count - a.rating!.count || b.rating!.average - a.rating!.average)
    .slice(0, n);
}

export function related(p: Product, n = 4) {
  return products.filter((x) => x.category === p.category && x.handle !== p.handle).slice(0, n);
}

const OPTION_NAMES: Record<string, string> = {
  color: 'colour',
  colour: 'colour',
  'color classification': 'colour',
  specifications: 'type',
  specification: 'type',
  'product specification': 'type',
  style: 'style',
  styles: 'style',
  quantity: 'quantity',
  size: 'size',
  model: 'model',
};
export const optionLabel = (name: string) => OPTION_NAMES[name.trim().toLowerCase()] ?? name.trim().toLowerCase();

export type OptionView = {
  index: number;
  label: string;
  kind: 'swatch' | 'image' | 'text';
  values: { value: string; swatch?: string; image?: Img }[];
};

/** Options worth choosing (more than one value), and how to show each: colour dots, photographs or words. */
export function optionViews(p: Product): OptionView[] {
  return p.options
    .map((o, index) => ({ o, index }))
    .filter(({ o }) => o.values.length > 1)
    .map(({ o, index }) => {
      const first = (val: string) => p.variants.find((v) => v.options[index] === val);
      const swatches = o.values.map((val) => first(val)?.swatch ?? null);
      const images = o.values.map((val) => first(val)?.image ?? null);
      const distinctImages = new Set(images.filter((x) => x != null)).size === o.values.length;
      const kind: OptionView['kind'] = swatches.every(Boolean) ? 'swatch' : distinctImages && o.values.length <= 20 ? 'image' : 'text';
      return {
        index,
        label: optionLabel(o.name),
        kind,
        values: o.values.map((value, i) => ({
          value,
          swatch: swatches[i] ?? undefined,
          image: images[i] != null ? p.images[images[i]!] : undefined,
        })),
      };
    });
}

/** Data the browser needs for the bag and the variant picker; kept small. */
export function clientProduct(p: Product) {
  return {
    handle: p.handle,
    name: p.name,
    variants: p.variants.map((v) => ({
      id: v.id,
      title: v.title,
      options: v.options,
      price: v.price,
      compareAt: v.compareAt,
      image: v.image,
      swatch: v.swatch,
      ink: v.swatch ? inkOn(v.swatch) : null,
    })),
    images: p.images.map((im) => ({ src: im.src, bands: im.bands, band: im.band, e1: im.e1, e2: im.e2, width: im.width, height: im.height })),
  };
}

export function searchIndex() {
  return products.map((p) => ({
    handle: p.handle,
    name: p.name,
    line: p.line,
    category: p.category,
    price: priceLabel(p),
    img: p.images[0]?.src['480'] ?? '',
    e1: p.images[0]?.e1 ?? '#f1edea',
    terms: `${p.name} ${p.line} ${p.titleOriginal} ${p.category}`.toLowerCase(),
  }));
}
