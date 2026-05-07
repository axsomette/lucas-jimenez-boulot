# Architecture Technique — MonPortfolio

## Choix technologiques

### Pourquoi Astro ?
Astro est le framework le plus adapté pour un portfolio statique en 2025/2026 :
- **Zero-JS par défaut** : les pages ne chargent pas de JavaScript sauf là où c'est nécessaire
- **Astro Islands** : les composants interactifs (React/Vue/Svelte) sont hydratés de façon sélective
- **GitHub Pages natif** : output 100% statique, déploiement trivial
- **Performance exceptionnelle** : Lighthouse > 95 facilement atteignable
- **Content Collections** : gestion typée des données (projets, blog) avec Zod
- **MDX** : écriture de contenu enrichi en Markdown + composants

### Pourquoi TypeScript strict ?
- Typage complet des props de composants
- Autocomplétion IDE optimale
- Détection d'erreurs au build plutôt qu'au runtime
- Meilleure maintenabilité long terme

### Pourquoi CSS moderne (sans Tailwind) ?
- **CSS Custom Properties** : design tokens natifs, thémabilité facile (dark mode)
- **Cascade Layers** : organisation claire et prévisible des styles
- **Container Queries** : responsive basé sur le conteneur, plus flexible
- Pas de dépendance externe, moins de maintenance

## Structure des fichiers

```
MonPortfolio/
├── .astro/                  # Cache Astro (auto-généré, gitignore)
├── .claude/                 # Config Claude Code
│   ├── CLAUDE.md            # Règles du projet
│   ├── settings.json        # Permissions et paramètres
│   ├── skills/              # Skills installés
│   └── commands/            # Commandes slash personnalisées
├── .continue/               # Config Continue (JetBrains/VS Code)
│   └── config.yaml          # Modèles, contexte, règles
├── .cortex/                 # Config Cortex Code
│   └── skills/
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD GitHub Pages
├── public/                  # Assets statiques (copiés tels quels)
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/              # Composants UI génériques (Button, Card...)
│   │   └── sections/        # Sections de pages (Hero, Projects, About...)
│   ├── content/             # Content Collections
│   │   ├── config.ts        # Schémas Zod des collections
│   │   ├── projects/        # Fichiers MDX des projets
│   │   └── experiences/     # Fichiers MDX des expériences
│   ├── layouts/
│   │   └── BaseLayout.astro # Layout principal (head, nav, footer)
│   ├── pages/               # Pages (routing basé sur fichiers)
│   │   ├── index.astro      # Page d'accueil
│   │   ├── about.astro      # À propos
│   │   ├── projects/        # Pages projets
│   │   └── contact.astro    # Contact
│   └── styles/
│       ├── global.css       # Reset + base styles
│       ├── tokens.css       # CSS Custom Properties (design tokens)
│       └── layers.css       # Définition des cascade layers
├── astro.config.mjs         # Configuration Astro
├── tsconfig.json            # Configuration TypeScript
├── package.json
├── CLAUDE.md                # Règles Claude (racine)
├── ARCHITECTURE.md          # Ce fichier
└── README.md                # Documentation utilisateur
```

## Patterns importants

### Astro Islands
Les composants React ne sont hydratés que si nécessaire :
```astro
<!-- Statique — pas de JS -->
<ProjectCard title="Mon projet" />

<!-- Interactif — hydraté au chargement -->
<ContactForm client:load />

<!-- Interactif — hydraté quand visible -->
<AnimatedSection client:visible />
```

### Content Collections
Les projets et expériences sont gérés comme des collections typées :
```typescript
// src/content/config.ts
const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    date: z.date(),
    featured: z.boolean().default(false),
  }),
});
```

### Design Tokens CSS
```css
/* src/styles/tokens.css */
:root {
  --color-primary-500: oklch(60% 0.15 260);
  --spacing-section: clamp(4rem, 10vw, 8rem);
  --font-display: 'Inter Variable', system-ui, sans-serif;
}
```

## Déploiement

### Local
```bash
npm install
npm run dev    # http://localhost:4321
```

### Mode 1 — Statique (GitHub Pages ou serveur web classique)
Le mode statique génère des fichiers HTML/CSS/JS dans `dist/` — compatibles avec **n'importe quel hébergement** : GitHub Pages, Apache, Nginx, OVH, Infomaniak, CDN, etc.

```bash
# Build standard (serveur web classique, sans sous-dossier)
npm run build

# Build spécifique GitHub Pages (avec base /MonPortfolio)
npm run build:github
```

**Déploiement sur serveur Apache/Nginx :**
```bash
npm run build
# Copier dist/ sur le serveur
rsync -avz dist/ user@monserveur.com:/var/www/portfolio/
```

**Déploiement GitHub Pages :**
1. Push sur `main` → GitHub Actions s'occupe de tout automatiquement
2. Settings → Pages → Source: "GitHub Actions"

### Mode 2 — SSR Node.js (serveur avec fonctionnalités dynamiques)
Activer quand tu as besoin de : formulaire de contact backend, auth, BDD, API dynamique.

```bash
# Build en mode serveur
npm run build:server

# Lancer le serveur Node.js
npm run start   # → http://localhost:4321
```

Nécessite Node.js >= 20 sur le serveur. Peut être déployé avec PM2 :
```bash
pm2 start dist/server/entry.mjs --name portfolio
```

### Mode 3 — Hybrid (recommandé à terme)
Pages statiques par défaut + certaines pages en SSR. Le meilleur des deux mondes.
```bash
npm run build:hybrid
```

### Résumé des modes
| Mode | Hébergement | Fonctionnalités dynamiques | Commande |
|------|-------------|---------------------------|----------|
| static | Partout (GitHub Pages, Apache, Nginx...) | Non | `npm run build` |
| server | Node.js requis (VPS, PM2...) | Oui | `npm run build:server` |
| hybrid | Node.js requis | Oui (certaines pages) | `npm run build:hybrid` |
