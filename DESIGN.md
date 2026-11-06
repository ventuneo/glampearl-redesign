# GlamPearl redesign: design record (studio version)

Prototype outside Shopify. Every component maps to a future Shopify section.
Direction (06.11.2026): the owner asked for the style of a screen recording of the Good Fella studio site,
adapted to GlamPearl. We take its *style* (grounds, accent, type pairing, layout families, interactions),
never its content, logo, copy or artwork. The earlier "shade card" version stays on branch `shade-card`.

## Brief

- **Subject:** GlamPearl, a Swiss online beauty shop (CHF). 39 products from third-party makers: gel nails
  and tools, skin care, makeup, wigs, a few grooming tools.
- **Audience:** women in Switzerland, roughly 18 to 40, who want salon-looking nails, skin and hair at home.
- **Job:** sell. Primary action: add to bag. Secondary: browse a category.
- **Real material only:** product photographs, prices, variants, Judge.me ratings, the live FAQ and policies.
- **Theatre:** a shop. No loader, no WebGL, no smooth-scroll library. The craft is in type, layout, the glyph
  fields and the small answers to every hover and tap.

## Concept card

```
Idea:        A beauty shop set like a studio site: dark and light grounds in turn, one coral-red signal,
             and the products drawn in glyphs.
Metaphor:    a print shop's proof sheet: photographs turned into type, labels in a typewriter voice.
Signature:   the hero portrait (the lace front wig in profile) as a glyph field that flickers at rest,
             scans once when it appears and scrambles under the pointer (scripts/ascii.ts).
Emotion:     confident and quick; a studio, not a pharmacy shelf.
Motion verb: snap like a shutter: things trade places, clip open and settle; nothing bounces.
Screenshot:  the first screen: headline left, the glyph profile right, the orange block button.
```

Anchors that make it GlamPearl's and not the reference's: the hero and footer art are the shop's own
photographs (lace front wig, heart press-on nails); the wordmark is a dot matrix where every pixel is a pearl;
the numbers are the shop's (4.9 from 440 reviews, 50 shades, 30 days); the steps are the real gel routine.

## System

### Colour

| Role | Hex | Use |
|---|---|---|
| day | `#EFEFEF` | light ground |
| card | `#F8F8F8` | cards on day |
| night | `#141414` | dark ground |
| night-2 | `#222222` | inputs, panels on night |
| signal | `#FF4D2E` | fills, squares, small text on night (5.6:1); a coral-red lacquer |
| signal-ink | `#C0331A` | the accent as text on day (4.8:1) |
| ink / muted | `#141414` / `#626262` on day, `#EDEDED` / `#8F8F8F` on night | text |

Sections declare `data-theme="dark|light"`; role tokens swap there. The floating bar takes the theme of the
section under it (scripts/ui.ts).

### Type

- **Geist** (Google, OFL) for headings and text; **Geist Mono** for labels, buttons, meta and the glyph fields.
- Headings sentence case and end with a full stop, tracking -0.04 to -0.05 em, weight 500.
- Mono labels uppercase, 12 px, +0.01 em. They carry facts (prices, counts), never decoration.
- Slash labels (`// CHF 50.80 for all three`) only beside a heading and only with a fact.

### Layout and shape

- 12 columns, margin `clamp(16px, 2.2vw, 32px)`, gutter 12 px.
- Radius 0 everywhere except the gel shade swatches (they are round, like pearls).
- Buttons: a signal block with a mono label plus a square block (`.cta`). On hover the two trade places.
- Section families, one each: hero (text over glyph field), numbers (photo + three cards), sequence (sticky
  photo + numbered steps), index (sticky thumbnails + large photos), list (category rows), ruled grid
  (promises), accordion (FAQ), split (contact), footer (form + nav + glyph field + dot wordmark).

### Motion

- One ease: `cubic-bezier(0.23, 1, 0.32, 1)`. One clock for frame work: `gsap.ticker`.
- Hover answers: label scramble (mono), block swap (.cta), orange square slides in (lists, menu), image
  scale 1.035, view tag trails the pointer (best sellers).
- Glyph fields: idle flicker (5 glyphs every 90 ms), one scan when first visible, pointer scramble. Paused off
  screen, off under reduced motion.
- Steps and best sellers: the item crossing the middle of the screen becomes current (IntersectionObserver).
- Page transitions: 160 ms crossfade, product photograph shared into the product page.
- Reduced motion: no flicker, no scan, no swaps, everything visible.

## Genericness test

- A generic "studio" copy would reuse the reference's portrait, logo and words. Changed to: our own photographs
  as glyphs, a pearl dot wordmark, GlamPearl's real numbers and FAQ.
- A generic beauty shop would be cream and serif. Kept the reference's night and day grounds and the signal
  accent, tuned the accent towards a nail lacquer red.
