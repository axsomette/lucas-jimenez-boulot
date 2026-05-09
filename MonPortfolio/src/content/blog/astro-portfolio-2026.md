---
title: "Pourquoi j'ai construit mon portfolio avec Astro 5 plutôt que Next.js"
date: 2026-06-16
excerpt: "Le choix d'un framework pour un portfolio n'est pas anodin. Voici pourquoi Astro s'est imposé face à Next.js, et ce que ça m'a appris sur le développement web moderne."
tags: ["Astro", "Next.js", "Performance", "JavaScript", "Portfolio"]
draft: false
---

Quand j'ai décidé de refaire mon portfolio, la question du stack est arrivée immédiatement. J'avais deux candidats sérieux : **Next.js** que je connais bien côté React, et **Astro** dont j'avais lu du bien mais que je n'avais jamais utilisé en production.

J'ai choisi Astro. Voici pourquoi : et ce que ça m'a appris.

## Le problème avec Next.js pour un portfolio

Next.js est excellent. Pour une app avec authentification, des données qui changent en temps réel, des routes API, de l'ISR : c'est un excellent choix.

Un portfolio, c'est différent. Le contenu est statique. Il n'y a pas d'utilisateurs connectés. Pas de panier, pas de notifications, pas de données temps réel. C'est une vitrine.

Et là, Next.js apporte un overhead qui n'est pas justifié :

**Le bundle JavaScript**. Next.js hydrate les pages côté client même pour du contenu statique. Mon portfolio avec Next.js chargeait ~200 Ko de JavaScript pour afficher du texte et des images. C'est absurde.

**La complexité**. App Router, Server Components, Client Components, les frontières `"use client"`, les metadata API... Pour un portfolio de 5 sections, c'est beaucoup de surface à maîtriser.

**Le déploiement**. Next.js veut Vercel ou un serveur Node. Pour GitHub Pages (gratuit, simple, adapté à un portfolio statique), c'est compliqué.

## Astro : le bon outil pour le bon job

Astro repose sur un principe simple : **zéro JavaScript par défaut**. Le serveur génère du HTML statique. Si un composant a besoin d'interactivité, on l'opt-in explicitement avec `client:load` ou `client:visible`.

Pour un portfolio :
- Les sections Hero, About, Experience, Projects sont 100% statiques → zéro JS
- Quelques animations scroll via Motion One → quelques Ko, chargés en différé
- Pas de composants interactifs lourds → résultat final proche de l'HTML pur

**Résultat concret sur mon portfolio :**
- Lighthouse Performance : 98/100
- LCP : 0.8s
- JavaScript total : ~65 Ko gzippé (vs ~200 Ko avec Next.js)
- Déploiement : GitHub Pages, gratuit, push = live

## La syntaxe Astro : familière si tu connais HTML

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

Pas de JSX obligatoire. Pas de `useState` pour du contenu statique. Le CSS est scopé automatiquement. C'est rafraîchissant.

## Les Content Collections : la killer feature

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

Si un fichier Markdown a un frontmatter invalide (date manquante, mauvais type), le build échoue avec un message clair. C'est du typage au niveau du contenu, pas juste du code.

## Les "îlots" : l'interactivité à la carte

Quand j'ai besoin d'un composant React interactif, Astro permet de l'intégrer avec une directive de chargement :

```astro
---
import ContactForm from '../components/ContactForm.tsx';
---

<!-- Chargé uniquement quand l'élément devient visible -->
<ContactForm client:visible />
```

`client:visible` charge le composant React seulement quand il entre dans le viewport. Pour un formulaire en bas de page, c'est idéal : les visiteurs qui ne scrollent pas jusqu'au contact ne paient pas le coût du JS.

## Ce qui m'a surpris

**La vitesse de build.** Astro est rapide. Mon portfolio avec 5 sections, 3 projets, 3 expériences et plusieurs articles de blog builden en ~3 secondes. Next.js était plus lent, même sur un projet plus simple.

**La compatibilité multi-framework.** Astro supporte React, Vue, Svelte, et Solid dans le même projet. En pratique, je n'utilise que React pour les îlots interactifs, mais la flexibilité est là.

**Le support Markdown natif.** Les articles de blog en Markdown sont compilés en HTML statique avec les types vérifiés. Pas de plugin à configurer, pas de `remark` à brancher manuellement.

## Quand je choisirais Next.js quand même

Astro n'est pas le bon choix partout. Je reviendrai sur Next.js pour :

- Une application avec des utilisateurs connectés
- Des données qui changent fréquemment (dashboard, e-commerce)
- Des routes API complexes côté serveur
- Un projet où l'équipe connaît déjà bien le React/Next.js écosystème

Pour tout ce qui est vitrine, portfolio, blog, documentation, site marketing : Astro est supérieur dans presque toutes les dimensions.

## Conclusion

Le meilleur framework est celui qui correspond à la nature du projet. Un portfolio est un document statique avec quelques interactions légères. Astro est fait pour ça.

Ce site que vous lisez en ce moment tourne sur Astro 5. Le score Lighthouse est dans le vert, le déploiement sur GitHub Pages prend 90 secondes, et la maintenance est simple. C'est exactement ce que je voulais.

Si vous montez un portfolio ou un site statique, essayez Astro. Vous serez surpris par sa légèreté.
