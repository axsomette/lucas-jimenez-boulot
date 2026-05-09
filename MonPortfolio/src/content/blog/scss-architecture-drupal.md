---
title: "SCSS Architecture dans Drupal : BEM, Cascade Layers, et design tokens"
date: 2026-06-02
excerpt: "Comment j'organise le CSS dans mes projets Drupal : de la feuille de styles en vrac à une architecture maintenable avec BEM, Cascade Layers et des tokens de design."
tags: ["SCSS", "CSS", "Drupal", "BEM", "Architecture Front-End"]
draft: false
---

Le CSS d'un projet Drupal qui a quelques années ressemble souvent à ça : une dizaine de fichiers `style.css`, des sélecteurs avec cinq niveaux de profondeur, des `!important` pour écraser les styles du thème parent, et personne qui sait vraiment ce qu'on peut modifier sans tout casser.

J'ai hérité de cette situation plusieurs fois. Voici comment je l'évite maintenant : et comment je restructure quand c'est déjà arrivé.

## Pourquoi l'architecture CSS est critique dans Drupal

Drupal génère un balisage HTML complexe. Les modules contrib ajoutent leurs propres classes. Le thème parent (souvent Olivero, Claro, ou Bartik pour les vieux projets) apporte sa feuille de styles. Le thème custom surcharge par-dessus.

Sans structure, on se retrouve vite dans une guerre de spécificité. Sans tokens, on a des valeurs de couleur hardcodées à 15 endroits différents.

## La structure que j'utilise

Pour un thème Drupal custom, voici l'arborescence SCSS que j'ai adoptée :

```
my_theme/
├── css/
│   └── (fichiers compilés : pas touchés à la main)
├── scss/
│   ├── 00-tokens/
│   │   ├── _colors.scss
│   │   ├── _typography.scss
│   │   └── _spacing.scss
│   ├── 01-base/
│   │   ├── _reset.scss
│   │   └── _base.scss
│   ├── 02-layout/
│   │   ├── _grid.scss
│   │   └── _containers.scss
│   ├── 03-components/
│   │   ├── _card.scss
│   │   ├── _button.scss
│   │   ├── _nav.scss
│   │   └── _form.scss
│   ├── 04-utilities/
│   │   └── _utilities.scss
│   └── main.scss
└── my_theme.libraries.yml
```

Le préfixe numéroté impose un ordre de compilation naturel. `main.scss` importe tout dans cet ordre.

## Les design tokens d'abord

Avant d'écrire une seule règle de style, je définis les tokens :

```scss
// 00-tokens/_colors.scss
$color-bg:         #0f0f0f;
$color-surface:    #1a1a1a;
$color-text:       #f0f0f0;
$color-text-muted: #888888;
$color-accent:     #6366f1;

// Convertis en CSS custom properties
:root {
  --color-bg:         #{$color-bg};
  --color-surface:    #{$color-surface};
  --color-text:       #{$color-text};
  --color-text-muted: #{$color-text-muted};
  --color-accent:     #{$color-accent};
}
```

```scss
// 00-tokens/_spacing.scss
$space-unit: 0.25rem; // = 4px

@function space($multiplier) {
  @return $space-unit * $multiplier;
}

// Exemples : space(4) = 1rem, space(8) = 2rem
```

Pourquoi les SCSS variables ET les CSS custom properties ? Les variables SCSS sont utiles pour les calculs au build. Les custom properties permettent de surcharger au runtime (thème clair/sombre, composants dynamiques).

## BEM pour les composants

BEM (Block-Element-Modifier) donne une convention de nommage qui survit aux rotations d'équipe :

```scss
// 03-components/_card.scss

// Block
.card {
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;

  // Element
  &__header {
    padding: space(6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  &__body {
    padding: space(6);
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }

  &__meta {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-top: space(2);
  }

  // Modifier
  &--featured {
    border-color: rgba(99, 102, 241, 0.45);

    &::before {
      content: '';
      display: block;
      height: 2px;
      background: var(--color-accent);
    }
  }

  &--compact {
    .card__header,
    .card__body {
      padding: space(4);
    }
  }
}
```

Dans les templates Twig, c'est lisible immédiatement :

```twig
<article class="card card--featured">
  <div class="card__header">
    <h2 class="card__title">{{ node.title.value }}</h2>
    <p class="card__meta">{{ node.created.value|date('d/m/Y') }}</p>
  </div>
  <div class="card__body">
    {{ content.body }}
  </div>
</article>
```

## Cascade Layers pour gérer la spécificité

CSS Cascade Layers (disponibles depuis 2022 dans tous les navigateurs modernes) règlent définitivement la guerre de spécificité :

```scss
// main.scss
@layer reset, base, layout, components, utilities;

@layer reset {
  @use '01-base/reset';
}

@layer base {
  @use '01-base/base';
}

@layer layout {
  @use '02-layout/grid';
  @use '02-layout/containers';
}

@layer components {
  @use '03-components/card';
  @use '03-components/button';
  @use '03-components/nav';
  @use '03-components/form';
}

@layer utilities {
  @use '04-utilities/utilities';
}
```

Une règle dans `utilities` l'emporte toujours sur une règle dans `components`, peu importe la spécificité du sélecteur. Plus besoin de `!important` pour les classes utilitaires.

## Surcharger le thème parent proprement

Dans Drupal, on surcharge souvent des styles du thème parent. Avec les layers, ça devient prévisible :

```scss
// Thème parent : .node--type-article { padding: 2rem; }
// Ma surcharge dans le layer 'components' :

@layer components {
  .node--type-article {
    padding: space(6); // gagne toujours sur le thème parent (pas dans un layer)
  }
}
```

Les styles du thème parent non-layerisés ont une spécificité "entre" les layers. En mettant mes surcharges dans `components`, je m'assure qu'elles prennent le dessus proprement.

## Intégration avec les libraries Drupal

Drupal charge le CSS via le système de libraries. Pour profiter de la compilation SCSS, j'utilise un build step :

```yaml
# my_theme.libraries.yml
global-styles:
  css:
    theme:
      css/main.css: {}
```

```json
// package.json
{
  "scripts": {
    "build:css":  "sass scss/main.scss css/main.css --style=compressed",
    "watch:css":  "sass --watch scss/main.scss:css/main.css",
    "build":      "npm run build:css"
  }
}
```

Vite peut remplacer Sass directement si le projet utilise déjà un bundler front-end. Pour des projets Drupal qui n'ont pas encore de bundler, Sass CLI reste le choix le plus simple.

## Ce que ça change concrètement

Sur un projet de refonte Drupal où j'ai appliqué cette approche sur un codebase existant de ~8000 lignes de CSS :

- Temps pour retrouver le style d'un composant : de 15 minutes à 2 minutes
- Nombre de `!important` : de 47 à 0
- Conflits de spécificité lors des mises à jour du thème parent : de fréquents à inexistants
- Taille du CSS compilé après nettoyage des règles orphelines : -40%

L'architecture CSS n'est pas sexy. C'est exactement pour ça qu'elle est souvent négligée : et que les projets qui l'ont finissent par être beaucoup plus faciles à maintenir.
