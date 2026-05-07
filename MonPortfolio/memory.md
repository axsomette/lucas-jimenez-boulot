# Memory — MonPortfolio

> Fichier de contexte persistant — mis à jour à chaque session Claude.

---

## Identité du projet

- **Propriétaire** : Lucas Jimenez Boulot
- **Email** : lucas@kaneva.io
- **Ville** : Montpellier
- **Rôle** : Développeur Full-Stack
- **GitHub** : https://github.com/kaneva
- **LinkedIn** : https://fr.linkedin.com/in/%F0%9F%92%BB-lucas-jimenez-boulot-35629919b

---

## État actuel (2026-05-06)

### ✅ Fait
- `package.json` — Astro 5 + React + MDX
- `astro.config.mjs` — static output, intégrations react + mdx
- `tsconfig.json` — strict mode, alias `@/` → `src/`
- `.gitignore`, `.prettierrc`
- Design system complet : `tokens.css`, `layers.css`, `global.css`
- Layout : `BaseLayout.astro` (SEO, OG, fonts Inter)
- Composants : `Nav.astro` (sticky, burger mobile, lien actif), `Footer.astro`
- Sections : `Hero.astro`, `Projects.astro`, `About.astro`, `Contact.astro`
- UI : `ProjectCard.astro`
- Content collection `projects` avec schéma Zod
- 3 projets MDX (1 featured + 2 placeholders)
- Page `index.astro` (single-page portfolio)
- `public/favicon.svg` (LJB indigo)
- `.github/workflows/deploy.yml` corrigé pour sous-dossier `MonPortfolio/`

### ⏳ À faire pour lancer
1. **`npm install`** dans `MonPortfolio/` (réseau non disponible en sandbox)
2. **Remplacer les projets placeholder** par les vraies réalisations (via `/new-project`)
3. **Remplir la section About** (`src/components/sections/About.astro`) avec la vraie bio
4. Configurer `astro.config.mjs` : décommenter `base: '/MonPortfolio'` si déploiement GitHub Pages
5. Sur GitHub : Settings → Pages → Source: "GitHub Actions"

---

## Choix de design

- Style **neutre pro** : blanc/gris + accent indigo (`oklch(54% 0.165 254)`)
- Police : Inter (Google Fonts)
- Single-page avec ancres : `#hero`, `#projets`, `#apropos`, `#contact`
- Pas de formulaire de contact (statique + anti-spam) — liens LinkedIn + GitHub
- Contact privilégié : LinkedIn

---

## Architecture des fichiers

```
MonPortfolio/
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── sections/
│   │   │   ├── Hero.astro
│   │   │   ├── Projects.astro
│   │   │   ├── About.astro
│   │   │   └── Contact.astro
│   │   └── ui/
│   │       └── ProjectCard.astro
│   ├── content/
│   │   ├── config.ts           ← schéma Zod projects
│   │   └── projects/           ← fichiers MDX
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       ├── tokens.css
│       ├── layers.css
│       └── global.css
├── public/
│   └── favicon.svg
├── .github/workflows/deploy.yml
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Commandes clés

```bash
npm install          # À faire en premier
npm run dev          # http://localhost:4321
npm run build        # Build production
npm run preview      # Preview du build
```

## Commandes slash disponibles

- `/new-component [nom] [ui|section]` — créer un composant typé
- `/new-project [nom]` — ajouter un projet en MDX
- `/lighthouse-check` — audit perf/accessibilité
