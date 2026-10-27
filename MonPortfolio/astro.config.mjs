import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://axsomette.github.io/lucas-jimenez-boulot',
  base: '/lucas-jimenez-boulot',
  trailingSlash: 'always',
  // Astro 7 passe par défaut aux règles d'espaces JSX ('jsx') : un retour à la ligne entre un mot et une balise
  // inline est supprimé (« du<strong>Drupal</strong> »). Les gabarits suivent les règles HTML : on garde la
  // compression sans perte d'Astro 6.
  compressHTML: true,
  integrations: [react(), mdx(), sitemap()],
});
