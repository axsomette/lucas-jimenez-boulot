import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://axsomette.github.io/lucas-jimenez-boulot',
  base: '/lucas-jimenez-boulot',
  trailingSlash: 'always',
  integrations: [react(), mdx(), sitemap()],
});
