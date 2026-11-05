// @ts-check
import { defineConfig } from 'astro/config';

// Prototype of the GlamPearl redesign. `site` is the live shop so canonicals and OG URLs are correct after the port.
export default defineConfig({
  site: 'https://glampearl.store',
  build: { format: 'directory' },
});
