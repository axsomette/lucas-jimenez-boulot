import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// Mode de déploiement :
// - 'static'  → GitHub Pages, Apache, Nginx, CDN (défaut)
// - 'server'  → Serveur Node.js avec fonctionnalités dynamiques (SSR)
// - 'hybrid'  → Mix static + SSR (pages statiques par défaut, certaines en SSR)
const OUTPUT_MODE = process.env.OUTPUT_MODE || 'static';

export default defineConfig({
  site: 'https://kaneva.github.io',

  // base uniquement pour GitHub Pages — commenter pour un serveur normal
  // base: '/MonPortfolio',

  output: OUTPUT_MODE,

  // Adaptateur Node.js activé uniquement en mode server/hybrid
  ...(OUTPUT_MODE !== 'static' && {
    adapter: node({ mode: 'standalone' }),
  }),

  integrations: [
    react(),
    mdx(),
    sitemap(),
  ],

  build: {
    assets: '_assets',
  },

  vite: {
    css: {
      transformer: 'lightningcss',
    },
  },
});
