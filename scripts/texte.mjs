// Write TEXTE.md: every text change (old -> new) for entering in Shopify later. Usage: node scripts/texte.mjs
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const copy = JSON.parse(fs.readFileSync('src/data/copy.json', 'utf8'));
const cat = { nails: 'Nails', skin: 'Skin', makeup: 'Makeup', hair: 'Hair' };
const esc = (s) => String(s).replace(/\|/g, '\\|');

const rows = [...catalog]
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  .map((p) => `| ${esc(p.titleOriginal)} | **${esc(p.name)}** | ${esc(p.line)} | ${cat[p.category]}${copy[p.handle]?.category ? ' (geändert)' : ''} |`);

const about = Object.entries(copy)
  .filter(([, c]) => c.about)
  .map(([h, c]) => `- **${catalog.find((p) => p.handle === h).name}:** ${c.about}`);

const md = `# Texte für Shopify: alt → neu

Stand: ${new Date().toLocaleDateString('de-CH')}. Erzeugt aus \`src/data/copy.json\` mit \`node scripts/texte.mjs\`.
Alles auf Englisch wie im Live-Shop. Nichts davon ist im Shop geändert, das passiert erst nach deinem OK.

## Produktnamen und Beschreibungszeile (${catalog.length} Produkte)

In Shopify: Produkt öffnen → **Titel** = neuer Name. Die **Zeile** gehört in ein Metafeld (z. B. \`custom.line\`),
das das neue Theme unter dem Namen anzeigt. Die Handles (URLs) bleiben gleich, damit keine Links brechen.

| Bisheriger Titel | Neuer Name | Neue Zeile | Kategorie |
|---|---|---|---|
${rows.join('\n')}

## Neu geschriebene Beschreibungen

Alle anderen Produkte behalten ihre bisherige Beschreibung. Das neue Theme gliedert sie nur neu: About, How to use, Details, In the box.

${about.join('\n')}

## Kategorien

Vier Kategorien statt fünf Collections:
- **nails:** gel, builder gel, lamp, tools
- **skin:** cleanse, treat, moisturise, protect
- **makeup:** eyes, brows, lips, cheeks, brushes
- **hair:** wigs, hair care, clippers

Verschoben nach **hair**, weil sie im Shop als «skin care» geführt sind:
- cordless clipper
- mini shaver
- hair and scalp oil
- scalp treatment

## Startseite

| Stelle | Text |
|---|---|
| Hinweisleiste | Sign up for 10% off your first order |
| Hero-Überschrift | At-home gel nails, skin care and wigs |
| Hero-Text | Pick from 50 soak-off gel shades at CHF 19.90 each and cure them under a pocket-size USB lamp. Unused items can go back within 30 days. |
| Hero-Knöpfe | Add to bag · See all 50 shades |
| Best sellers | The products with the most reviews right now. |
| 3 Schritte | Gel nails at home in three steps: Build, Colour, Cure |
| Fakten | 4.9 out of 5 (440 reviews) · 30 days to return unused items · prices from CHF 11.90 |
| Newsletter | 10% off your first order. New shades, restocks and beauty tips by email. No spam, and you can unsubscribe any time. |

## Zu klären, bevor es live geht

1. **«Butter Light Protection Cream»:** Die Fotos zeigen eine *Hoygi Face & Body Sunscreen SPF 50*. Titel und Beschreibung
   sprechen von einer «nourishing body cream». Was ist es wirklich? Der neue Name «face and body cream» passt zu beidem.
   Falls es Sonnenschutz ist, gehören SPF und Anwendung in die Beschreibung.
2. **Antwortzeit des Supports:** Der Shop verspricht nur «a real person will get back to you». Wenn es eine feste Zeit gibt,
   z. B. 1 Werktag, kann sie in den Footer.
3. **Newsletter-Rabatt:** Die Vorschau schickt die Anmeldung an das normale Shopify-Kundenformular. Ob der 10%-Code danach
   automatisch kommt (Klaviyo), lässt sich nur im Shop-Admin prüfen.
`;

fs.writeFileSync('TEXTE.md', md);
console.log(`TEXTE.md: ${rows.length} products, ${about.length} rewritten descriptions`);
