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
Idea:        A beauty shop set like a studio site, softened: pastel grounds under gradient light, a
             blush accent, and the products drawn in glitter.
Metaphor:    glitter gel and pearl: flakes that catch the light, nacre that shifts from pink to lilac.
Signature:   the hero portrait (the lace front wig in profile) made of pastel glitter flakes; flakes
             sparkle at rest, a sweep of light crosses it once, the pointer makes flakes flash
             (scripts/glitter.mjs builds the flakes, scripts/glitter.ts draws the sparkles).
Emotion:     soft, light and a little magical; still confident.
Motion verb: glide and settle: blocks trade places, glows drift, sparkles rise and fade.
Screenshot:  the first screen: headline left, the glitter profile right in a blush and lilac glow.
```

Anchors that make it GlamPearl's and not the reference's: the hero and footer art are the shop's own
photographs (lace front wig, heart press-on nails); the wordmark is a dot matrix where every pixel is a pearl;
the numbers are the shop's (4.9 from 440 reviews, 50 shades, 30 days); the steps are the real gel routine.

## System

### Colour (06.11.2026, second pass: "pastel, softer, with gradient light")

| Role | Hex | Use |
|---|---|---|
| pearl | `#FBF8F6` | main ground |
| haze | `#F4EDF5` | second ground, a lilac haze |
| card | white at 72% | cards over the glow |
| plum | `#3A2E39` | ink; never black |
| muted | `#6E5C68` | meta (5.8:1 on pearl, 5.1:1 on haze) |
| blush to peach | `#F7B7CC` to `#F9D1BD` | the accent as a gradient fill: buttons, marks, tags |
| rose ink | `#A3456E` | the accent as text (5.4:1 on pearl) |
| glows | blush, lilac, peach, mint radials | gradient light over every ground |

Sections declare `data-theme="pearl|haze"`. The bar is frosted white in both.

### Type (fixed for all future work on this project; owner, 06.11.2026)

- **Besley** (Google, OFL) for headings, big names, numbers and the menu; weight 400 only.
- **Albert Sans** (Google, OFL) for everything else: text 400, labels and buttons 500.
- Chosen with the taste skill (`start.mjs deal --page product`, three deals, seven pairings): Besley / Albert
  Sans because a warm serif reads like a cosmetics label and neither face is a default of generated sites.
  Turned down: Fraunces, Bricolage Grotesque and Instrument Serif (the usual faces of generated sites),
  Archivo (hardware), Hanken Grotesk and Figtree (too plain for a beauty brand).
- **Never** Geist, Inter, Space Grotesk, Manrope, Poppins, Montserrat, DM Sans, Plus Jakarta Sans, any mono face
  or the system look. A change of face needs the owner's word.
- Sizes (skill): h1 72/38, h2 48/30, h3 28/24, card titles 20/18, body 16, small 14, labels 13 at 500.
  Sentence case everywhere, no tracked capitals. Headings end with a full stop. Display tracking
  -2.6% at h1, -2% at h2, -1.5% at h3.
- At most four font files (both faces, latin and latin-ext).

### Layout and shape

- 12 columns, margin `clamp(16px, 2.2vw, 32px)`, gutter 12 px.
- Soft shapes: photographs and cards 18 px radius, small images 12 px, buttons and the bar are pills,
  marks and the plus button are circles (pearls).
- Buttons: a blush pill with a mono label plus a round plus button (`.cta`). On hover the two trade places.
- Section families, one each: hero (text over glitter), numbers (photo + three cards), sequence (sticky
  photo + numbered steps), index (sticky thumbnails + large photos), list (category rows), ruled grid
  (promises), accordion (FAQ), split (contact), footer (form + nav + glitter + pearl wordmark).

### Motion

- One ease: `cubic-bezier(0.23, 1, 0.32, 1)`. One clock for frame work: `gsap.ticker`.
- Hover answers: block swap (.cta), blush circle slides in (lists, menu), image
  scale 1.035, view tag trails the pointer (best sellers).
- Glitter: about 18 sparkles a second at rest, one diagonal sweep when first visible, flashes under the
  pointer. Paused off screen. The hero glow drifts over 14 s. All off under reduced motion; the still
  glitter image stays.
- Steps and best sellers: the item crossing the middle of the screen becomes current (IntersectionObserver).
- Page transitions: 160 ms crossfade, product photograph shared into the product page.

## Genericness test

- A generic "studio" copy would reuse the reference's portrait, logo and words. Changed to: our own photographs
  as glyphs, a pearl dot wordmark, GlamPearl's real numbers and FAQ.
- A generic pastel shop would be a flat pink page with a serif. Kept the studio structure, the mono voice and
  the block swap; the softness comes from light (glows) and the product colours (glitter), not from blur alone.
