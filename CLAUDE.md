# MonPortfolio — Règles & Contexte Claude

## ⚠️ PREMIÈRE OUVERTURE — À faire avant tout

Si `node_modules/` n'existe pas encore, commence par :

```bash
npm install
```

Ensuite, ouvre `astro.config.mjs` et vérifie ces deux points :
1. **Remplace** `kaneva.github.io` par ton vrai nom d'utilisateur GitHub sur la ligne `site:`
2. **Mode de déploiement** :
   - Si tu déploies sur **GitHub Pages** : décommente la ligne `base: '/MonPortfolio'`
   - Si tu déploies sur un **serveur classique** (Apache/Nginx/OVH…) : laisse `base` commenté

Une fois fait, lance le serveur de développement :
```bash
npm run dev   # → http://localhost:4321
```

---

## Présentation du projet
Portfolio personnel de développeur, construit avec **Astro 5 + TypeScript + CSS moderne**.
Déployé automatiquement sur **GitHub Pages** via GitHub Actions.

## Stack technique
- **Framework** : Astro 5 (static output, zero-JS par défaut)
- **Langage** : TypeScript strict
- **Styles** : CSS moderne (custom properties, container queries, cascade layers)
- **Animations** : Motion One (légère) + GSAP (avancées)
- **3D/WebGL** : Three.js (section hero optionnelle)
- **Tests** : Vitest + Testing Library
- **Composants interactifs** : React (îlots Astro)
- **Déploiement** : GitHub Pages via GitHub Actions

## Architecture
```
src/
  components/     # Composants Astro (.astro) et React (.tsx) réutilisables
  layouts/        # Layouts de pages (BaseLayout.astro)
  pages/          # Pages Astro (routing basé sur fichiers)
  content/        # Collections de contenu (projets, expériences) en Markdown/MDX
  styles/         # CSS global, tokens de design, utilities
public/           # Assets statiques (images, fonts, favicon)
.github/workflows/ # CI/CD GitHub Actions
```

## Conventions de code

### TypeScript
- Mode `strict` activé obligatoirement
- Interfaces préférées aux `type` pour les objets
- Pas de `any` — utiliser `unknown` si nécessaire
- Imports avec chemins absolus via alias `@/`

### CSS
- Utiliser les **CSS Custom Properties** pour tous les tokens (couleurs, spacing, typography)
- Organiser avec **Cascade Layers** : `@layer reset, base, layout, components, utilities`
- CSS moderne : container queries, `:has()`, `subgrid`, `oklch()` pour les couleurs
- Pas de CSS-in-JS ni de frameworks utilitaires (Tailwind)
- Mobile-first

### Astro
- `.astro` pour les composants statiques/de présentation
- `.tsx` (React) uniquement pour les composants nécessitant de l'interactivité (`client:load`, `client:visible`)
- Utiliser les **Content Collections** pour les données structurées (projets, blog)
- Frontmatter typé avec Zod schemas

### Nommage
- Composants : `PascalCase` (ex: `ProjectCard.astro`)
- Pages : `kebab-case` (ex: `about.astro`)
- Variables CSS : `--token-category-variant` (ex: `--color-primary-500`)
- Fonctions : `camelCase`

## Règles Claude

### À FAIRE
- Toujours typer explicitement les props et retours de fonctions
- Préférer `const` à `let`, jamais `var`
- Utiliser les composants Astro natifs (`<Image />`, `<Picture />`) pour les médias
- Optimiser pour le Core Web Vitals (LCP, CLS, FID)
- Documenter les composants complexes avec des commentaires JSDoc
- Vérifier la compatibilité GitHub Pages (output static uniquement)

### À ÉVITER
- Pas de SSR (Server-Side Rendering) — GitHub Pages ne supporte que le static
- Pas d'appels API au runtime — tout doit être résolu au build
- Pas d'imports circulaires
- Pas de `console.log` en production
- Pas de dépendances inutiles — bundle size matters pour un portfolio

### Qualité
- Accessibilité WCAG 2.1 AA minimum (aria-labels, contraste, navigation clavier)
- Score Lighthouse > 95 sur toutes les métriques
- Support navigateurs : Chrome/Firefox/Safari dernières 2 versions

## Commandes utiles
```bash
npm run dev          # Serveur de développement
npm run build        # Build production (output: dist/)
npm run preview      # Preview du build
npm run test         # Tests unitaires
npm run lint         # ESLint + TypeScript check
npm run format       # Prettier
```

## Déploiement GitHub Pages
Le déploiement est automatique via `.github/workflows/deploy.yml` sur push vers `main`.
URL de production : `https://[username].github.io/MonPortfolio/`
