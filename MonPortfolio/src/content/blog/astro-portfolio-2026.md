---
title: "Pourquoi j'ai construit mon portfolio avec Astro 5 plutôt que Next.js"
date: 2025-11-20
excerpt: "Pourquoi Astro l'a emporté sur Next.js pour mon portfolio : bundle JavaScript, complexité et contraintes de déploiement, chiffres à l'appui."
tags: ["Astro", "Next.js", "Performance", "JavaScript", "Portfolio"]
draft: false
---

Quand j'ai décidé de refaire mon portfolio, la question du stack est arrivée immédiatement. J'avais deux candidats sérieux : **Next.js** que je connais bien côté React, et **Astro** dont j'avais lu du bien mais que je n'avais jamais utilisé en production.

J'ai choisi Astro, pour trois raisons que je détaille ci-dessous.

## Le problème avec Next.js pour un portfolio

Next.js est excellent. Pour une app avec authentification, des données qui changent en temps réel, des routes API, de l'ISR : c'est un excellent choix.

Un portfolio ne coche aucune de ces cases : contenu statique, aucun utilisateur connecté, aucune donnée qui bouge en temps réel. C'est une vitrine.

Et là, Next.js apporte un overhead qui n'est pas justifié :

**Le bundle JavaScript**. Next.js hydrate les pages côté client même quand le contenu ne bouge pas. Ma version Next.js chargeait environ 200 Ko de JavaScript pour afficher du texte et des images.

**La complexité**. App Router, Server Components, Client Components, les frontières `"use client"`, les metadata API... Pour un portfolio de 5 sections, c'est beaucoup de surface à maîtriser.

**Le déploiement**. Next.js veut Vercel ou un serveur Node. Pour GitHub Pages (gratuit, simple, adapté à un portfolio statique), c'est compliqué.

## Ce qu'Astro fait différemment

Astro applique un principe : **zéro JavaScript par défaut**. Le build génère du HTML statique, et je réclame l'interactivité composant par composant avec `client:load` ou `client:visible`.

Pour un portfolio :
- Les sections Hero, About, Experience, Projects sont 100% statiques → zéro JS
- Quelques animations scroll via Motion One → quelques Ko, chargés en différé
- Pas de composants interactifs lourds → résultat final proche de l'HTML pur

**Résultat concret sur mon portfolio :**
- Lighthouse Performance : 98/100
- LCP : 0.8s
- JavaScript total : ~65 Ko gzippé (vs ~200 Ko avec Next.js)
- Déploiement : GitHub Pages, gratuit, push = live

## La syntaxe, proche du HTML

Un composant Astro ressemble à du HTML avec un bloc de logique en frontmatter :

```astro
---
// Frontmatter : s'exécute côté serveur au build
import { getCollection } from 'astro:content';
const projects = await getCollection('projects');
---

<!-- Template : HTML pur avec quelques expressions -->
<section class="projects">
  {projects.map(p => (
    <article class="card">
      <h3>{p.data.title}</h3>
      <p>{p.data.description}</p>
    </article>
  ))}
</section>

<style>
  /* CSS scopé au composant */
  .card { background: var(--color-surface); }
</style>
```

Le JSX devient facultatif, `useState` disparaît du contenu statique, et Astro scope le CSS au composant sans que j'aie à le demander.

## Les Content Collections, l'argument décisif

Pour gérer les projets, expériences et articles de blog, Astro propose les **Content Collections** avec validation Zod :

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:   z.string(),
    date:    z.date(),
    excerpt: z.string(),
    tags:    z.array(z.string()),
    draft:   z.boolean().default(false),
  }),
});
```

Un frontmatter Markdown invalide, date manquante ou mauvais type, fait échouer le build avec un message explicite. Le typage descend jusqu'au contenu.

## Les "îlots" : l'interactivité à la carte

Quand j'ai besoin d'un composant React interactif, Astro permet de l'intégrer avec une directive de chargement :

```astro
---
import ContactForm from '../components/ContactForm.tsx';
---

<!-- Chargé uniquement quand l'élément devient visible -->
<ContactForm client:visible />
```

`client:visible` charge le composant React quand il entre dans le viewport. Pour un formulaire en bas de page, les visiteurs qui ne descendent jamais jusqu'au contact ne paient pas son JavaScript.

## Ce qui m'a surpris

**La vitesse de build.** Mon portfolio, 5 sections, 3 projets, 3 expériences et plusieurs articles de blog, se construit en 3 secondes environ. Next.js mettait plus longtemps sur un projet plus simple.

**La compatibilité multi-framework.** Astro accepte React, Vue, Svelte et Solid dans le même projet. Je m'en tiens à React pour mes îlots interactifs, sans avoir eu à trancher au démarrage.

**Le support Markdown natif.** Astro compile les articles Markdown en HTML statique avec les types vérifiés, sans plugin à configurer ni `remark` à brancher soi-même.

## Quand je choisirais Next.js quand même

Astro n'est pas le bon choix partout. Je reviendrai sur Next.js pour :

- Une application avec des utilisateurs connectés
- Des données qui changent fréquemment (dashboard, e-commerce)
- Des routes API complexes côté serveur
- Un projet où l'équipe maîtrise déjà l'écosystème React et Next.js

Sur une vitrine, un portfolio, un blog ou une documentation, Astro livre moins de JavaScript pour le même rendu, et se déploie sur n'importe quel hébergeur statique.

## Conclusion

Un portfolio reste un document statique avec quelques interactions légères, et Astro vise exactement ce cas.

Le site que vous lisez tourne sur Astro 5. Le score Lighthouse est dans le vert, le déploiement sur GitHub Pages prend 90 secondes, et je n'ai rien à maintenir entre deux publications.

Si vous montez un portfolio ou un site statique, Astro mérite le détour avant Next.js.
