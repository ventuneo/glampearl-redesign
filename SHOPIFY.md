# Umsetzung in Shopify

Was es braucht, damit aus der Vorschau das echte Theme von glampearl.store wird. Nichts davon ist gemacht:
Es fehlt der Zugang zum Shop, und Live-Änderungen brauchen dein OK.

## Vorgehen

1. Zugang zum Shop-Admin mit Theme-Rechten (Besitzer oder Mitarbeiterkonto).
2. Das heutige Theme als Kopie sichern: Online Store → Themes → «Duplicate».
3. Neues Theme auf Basis von Shopifys Referenz-Theme «Dawn» oder «Horizon» anlegen. Dawn und Sense stammen aus
   derselben Familie, darum laufen Warenkorb, Varianten, Filter und Judge.me sofort. Danach jede Section unten
   nachbauen. Farben, Schrift und Abstände kommen 1:1 aus `src/styles/global.css`.
4. Unveröffentlicht hochladen, über den Vorschau-Link prüfen, dieselben Checks laufen lassen (Audit, Screenshots,
   Jury), erst dann veröffentlichen.

## Bausteine → Shopify

| Vorschau | Shopify |
|---|---|
| `layouts/Base.astro` | `layout/theme.liquid` |
| `components/Header.astro`, `MenuSheet.astro` | `sections/announcement-bar.liquid`, `sections/header.liquid` (Menü-Schublade) |
| `components/Footer.astro` | `sections/newsletter.liquid`, `sections/footer.liquid` |
| `components/Field.astro` | `snippets/field.liquid` |
| `components/ProductTile.astro` | `snippets/product-tile.liquid` |
| `components/BagDrawer.astro` + `scripts/bag.ts` | `snippets/cart-drawer.liquid`, mit `/cart/add.js` und `/cart.js` statt localStorage |
| `components/SearchDialog.astro` | Predictive Search (`/search/suggest.json`) im gleichen Dialog |
| `sections/ShadeHero.astro` | `sections/hero-shade-card.liquid`, Einstellung: Produkt (die Gel-Farben) |
| `sections/Bestsellers.astro` | `sections/featured-collection.liquid` |
| `sections/Categories.astro` | `sections/collection-list.liquid` |
| `sections/GelKit.astro` | `sections/product-bundle.liquid`, drei Produkt-Einstellungen |
| `sections/Facts.astro` | `sections/facts.liquid`, Zahlen aus den Judge.me-Metafeldern |
| `pages/products/[handle].astro` + `scripts/product.ts` | `templates/product.json`, `sections/main-product.liquid`, `sections/related-products.liquid` |
| `components/ShopGrid.astro` | `sections/main-collection.liquid` |
| `pages/help.astro` | `templates/page.help.json` mit FAQ-Section |
| `pages/404.astro` | `templates/404.json` |

## Daten, die im Shop angelegt werden müssen

| Was | Wo in Shopify | Woher |
|---|---|---|
| Neue Produktnamen | Produkt → Titel | `TEXTE.md` |
| Beschreibungszeile | Metafeld `custom.line` (Text, einzeilig) | `TEXTE.md` |
| Farbton jeder Gel-Farbe | Varianten-Metafeld `custom.swatch` (Farbe) | `src/data/catalog.json`, Feld `swatch` |
| Feldfarbe jedes Fotos | Metafeld oder beim Hochladen berechnet | `src/data/catalog.json`, Felder `e1`/`e2`/`bands` |
| Vier Kategorien | Collections `nails`, `skin`, `makeup`, `hair`; 4 Produkte wechseln nach `hair` | `TEXTE.md` |
| Menü | Navigation: shop all, nails, skin, makeup, hair, help | Header |

## Nur mit Zugang prüfbar

- Ob der Newsletter (Klaviyo) den 10%-Code nach der Anmeldung verschickt.
- Lagerbestand und «ausverkauft»: Die für die Vorschau abgerufenen Daten (`/products/<handle>.json`) enthalten ihn
  nicht, die Vorschau zeigt darum alles als bestellbar. Das neue Theme muss ausverkaufte Varianten deaktivieren,
  wie es Dawn tut.
- Versandkosten und Steuern im Checkout.
