# GlamPearl redesign: design record

Prototype outside Shopify. Every component maps to a future Shopify section.
Reference for attitude (not for copying): rhodeskin.com.

## Brief

- **Subject:** GlamPearl, a Swiss online beauty shop (CHF, ships from CH storefront). 39 products from
  third-party makers: gel nails and nail tools, skin care, makeup, wigs, a few grooming tools.
- **Audience:** women in Switzerland, roughly 18 to 40, who want salon-looking nails, skin and hair
  at home without salon prices (CHF 11.90 to 99).
- **Job:** sell. Primary action: **Add to bag**. Secondary: browse a category.
- **Real material:** product photographs (clean studio shots, mixed backgrounds), real prices and
  variants, Judge.me ratings, Klaviyo signup (10% off first order), 30-day returns.
- **Language:** English, as the live shop.
- **Kind (taste skill):** product (physical goods sold online, nothing happens at a door).
  Consequence: photographs lead, flat grounds, no shader effects, no scroll reveals, no violet.
- **Theatre (awwwards):** a shop earns the craft in type, layout and motion, but no loader, no
  WebGL, no page transitions. Speed is part of the luxury.

## Concepts

| | A. Shade card (material) | B. Nacre (name) | C. Salon menu (process) |
|---|---|---|---|
| Idea | The shop is a shade card: every product sits in its own colour field, and choosing a shade changes the field | A pearl is built layer on layer; so is a gel manicure and a skin routine. Products are shown as the layer they add | The range is set like a salon's treatment menu: what you would book, and what you need to do it at home |
| Anchor | The catalogue is shade-heavy: 50 gel shades, 16 strip styles, 9 lip liners, 8 eye shadows, wigs in 10+ colours; and the photographs already sit on colour grounds | the name *pearl* and the layered routines (base, colour, top coat) | the live shop's promise "salon results at home" |
| Layout rule | grid of colour fields, one product per field, field colour = the photograph's own ground | stacked bands, each band a layer, numbered only where it is a real sequence | text-led lists, prices on the right like a menu |
| Motion verb | settle: colour eases into place, nothing bounces | build up: thin layers slide over each other | none to speak of, menu stays still |
| Type voice | quiet lowercase names, sentence-case descriptors | same, plus step numbers | serif menu voice |
| Signature | pick a shade, and the field and photograph change together | a routine builder that stacks layers | price list with hover photographs |
| Screenshot | a wall of fields, one shade chip pressed, the whole field turned that colour | three translucent layers over a hand | the menu |
| O / F / Fe / P | 4 / 5 / 5 / 3 | 4 / 3 / 3 / 3 | 3 / 3 / 5 / 4 |

**Pick A, the shade card.** It is the best fit and solves the real problem: the photographs have
mixed grounds. When each tile takes its photograph's own edge colour, the differences read as a
deliberate palette instead of an accident. Steal from B for one detail: the gel kit section may
show base, colour and top coat as a real sequence.

## System

### Colour (page; the fields bring the rest)

| Role | Hex | Use |
|---|---|---|
| ground | `#FFFFFF` | page |
| ink | `#34302D` | text, buttons (a soft oyster charcoal, chosen, not a stand-in for black) |
| muted | `#716A65` | descriptors, meta (AA on white and on nacre) |
| line | `#E6E1DD` | hairlines, input borders |
| nacre | `#F1EDEA` | default field, panels, footer |
| rose | `#8F5B56` | sale price, focus ring, the one accent; never a whole surface |

Product fields: sampled per photograph at build time (`scripts/tile-colors.mjs`), stored on the
product, so the photograph bleeds into its tile with no visible edge.

### Type

- One family: **Familjen Grotesk** (Google, OFL), variable 400 to 700. Its single-story g and
  open a carry the name *glampearl*; no second family needed.
- Product names: lowercase, 500. Descriptors: sentence case, 400, muted.
- Scale (fluid): display `clamp(2.75rem, 1.6rem + 4.6vw, 6.5rem)`, l `clamp(1.75rem, 1.3rem + 1.6vw, 2.75rem)`,
  m `clamp(1.125rem, 1rem + 0.4vw, 1.375rem)`, body 1rem to 1.0625rem, s 0.875rem, xs 0.8125rem.
- Display tracking -0.035em, leading 0.95. Body leading 1.5, measure under 65ch.
- No uppercase labels, no eyebrows, no middle-dot meta strings, no arrows appended to links.

### Layout

- 12-column grid, outer margin `clamp(16px, 3vw, 40px)`, gutter 12px (tight, like Rhode's fields).
- Radius: 0 on photographs and fields (they are printed swatches), 999px on chips and buttons.
- Product tiles 4:5, always. One aspect family.
- Every section starts with its heading on the left edge; nothing centred except the empty bag.

### Motion

- One ease: `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out). 160 to 240ms for UI, 420ms for
  field colour.
- Hover: photograph scales 1.03 inside its frame; buttons darken and press to 0.97 on active.
- Bag drawer slides from the right (clip of 100% to 0), scrim fades; Esc and scrim close it.
- Shade change: field colour and photograph crossfade together (the signature).
- Under reduced motion: no scale, no slide, instant colour.

## Principles

1. The product is the picture. Big, whole, in its own colour.
2. Words are short. A name, one line of what it is, a price.
3. One loud thing per screen; everything else is quiet.
4. Nothing invented: ratings, prices and claims come from the live shop.

## Genericness test

- Generic beauty default would be cream ground, serif display, terracotta accent. Changed to: pure
  white ground, one grotesk, colour only from the products' own fields.
- Generic shop default would be identical rounded cards with soft shadows. Changed to: square
  colour fields edge to edge, no shadows, no card borders.
- A copy of Rhode would be their type, their beige panels and their campaign layout. Changed to:
  our own family, colour fields sampled from our photographs, and a shade mechanic Rhode does not have.
