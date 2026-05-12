---
title: "Ma stack Drupal 10 pour les projets clients : pourquoi ces choix"
date: 2026-03-15
excerpt: "Sur plusieurs projets (Umaniti, Seaty, Charles & Alice), j'ai convergé vers une stack Drupal 10 cohérente. Radix, Paragraphs, Gin, Config Split : voici pourquoi ces outils, et ce qu'ils apportent vraiment."
tags: ["Drupal 10", "PHP", "Paragraphs", "Gin", "Architecture", "Composer"]
draft: false
---

En travaillant sur plusieurs projets Drupal 10 — un coliving (Umaniti), une plateforme de réservation (Seaty), un mini-site promotionnel (Charles & Alice) — j'ai convergé vers une stack de modules et de choix d'architecture qui se répète d'un projet à l'autre. Pas par habitude, mais parce que cette combinaison répond bien aux besoins récurrents des projets clients.

Voici ce que j'utilise et pourquoi.

## Le socle : Radix comme base de thème

Radix est mon point de départ pour tous les thèmes custom. Ce n'est pas un thème prêt à l'emploi : c'est une base qui fournit une structure de fichiers, des classes utilitaires, et une intégration avec le système de composants Drupal.

Sur un projet comme Umaniti, le thème custom hérite de Radix et surcharge uniquement ce dont il a besoin. Résultat : un thème léger, bien structuré, sans la dette technique d'un thème conçu pour être générique.

La vraie valeur de Radix est dans la cohérence qu'il impose. Quand on revient sur un projet six mois plus tard, on sait où trouver les templates, les bibliothèques JS, les surcharges de variables.

## Paragraphs pour la flexibilité éditoriale

Paragraphs est incontournable dès qu'un client a besoin de pages à mise en page variable. Une page d'accueil avec un hero, une section texte-image, un carousel, puis un bloc de témoignages : sans Paragraphs, ça demande soit un éditeur WYSIWYG ingérable, soit des champs custom pour chaque variante.

Avec Paragraphs, le client assemble ses pages à partir de blocs prédéfinis. Chaque type de paragraphe est une unité éditoriale avec ses propres champs et son propre template Twig.

Ce qui m'a pris du temps à intégrer : la gestion des révisions. Drupal track les révisions des nœuds, mais les révisions des entités Paragraphs sont séparées. Si on ne configure pas correctement le comportement de révision, on peut se retrouver avec des orphelins en base ou des problèmes de rollback. `paragraph_view_mode` aide à contrôler l'affichage sans dupliquer les templates.

## Gin pour l'interface d'administration

L'interface admin Drupal par défaut est fonctionnelle mais pas agréable. Gin la remplace par une interface moderne, claire, avec une sidebar de navigation plus intuitive. Pour un client non-technique qui va gérer son contenu quotidiennement, c'est un vrai apport.

Gin + Gin Toolbar + Gin Login couvrent toute l'expérience : page de connexion personnalisable, toolbar cohérente, vue d'ensemble claire. Admin Toolbar complète avec l'arbre de menus déroulant qui évite les allers-retours entre pages.

Un détail qui compte : Gin gère bien les formulaires complexes générés par Paragraphs et Field Group. Sur d'autres thèmes admin, ces formulaires peuvent devenir illisibles. Avec Gin, ils restent utilisables.

## Config Split pour les environnements

Sur chaque projet, il y a au moins trois environnements : local, preprod, prod. Certaines configurations ne doivent exister qu'en développement (le module Devel, les logs verbeux, Shield pour protéger la preprod). D'autres sont propres à la prod (URLs canoniques, configuration email réelle).

Config Split permet de définir des ensembles de configuration qui s'activent selon l'environnement. En pratique :

- Un split `dev` contient Devel, les niveaux de log, les configurations de développement
- Un split `preprod` contient Shield et ses identifiants
- La config de base contient tout ce qui est commun

La synchronisation de configuration via `drush config:import` reste simple, et les surcharges d'environnement sont explicites et versionnées.

## SEO : le trio Metatag + Pathauto + Simple Sitemap

Sur chaque projet, ces trois modules forment un socle SEO minimal mais suffisant.

Pathauto génère des URLs propres automatiquement depuis les titres des nœuds, selon des patterns configurables. Fini les `/node/42` en production.

Metatag permet au client de surcharger les balises `title`, `description`, et Open Graph nœud par nœud, sans toucher au code. Les valeurs par défaut sont définies au niveau du type de contenu et peuvent utiliser des tokens.

Simple Sitemap génère le `sitemap.xml` automatiquement, avec contrôle de la priorité et de la fréquence par type de contenu. Il s'intègre avec les entités Drupal sans configuration complexe.

## Webform + Honeypot pour les formulaires

Webform est le module de formulaires Drupal le plus complet. Trop complet, parfois : il peut être surdimensionné pour un simple formulaire de contact. Mais quand un client a besoin de téléchargements de fichiers, de logique conditionnelle, ou d'exports CSV des soumissions, rien ne l'égale.

Honeypot est systématique dès qu'il y a un formulaire public. C'est un module léger qui ajoute deux mécanismes anti-spam : un champ caché en CSS (les bots le remplissent, les humains non) et une vérification du délai de soumission (un bot soumet en millisecondes, un humain met au moins quelques secondes). Combiné avec reCAPTCHA sur les formulaires sensibles, c'est suffisant pour la grande majorité des cas.

## Ce que j'ai appris à travers ces projets

La stack se choisit en fonction du client, pas du projet. Seaty est une plateforme qui va évoluer régulièrement : j'ai investi plus de temps sur l'architecture de configuration et les tests de déploiement. Umaniti est un site institutionnel plus stable : l'essentiel de l'effort est allé sur le thème et l'expérience éditoriale. Charles & Alice est un mini-site avec une durée de vie limitée : la stack est identique mais simplifiée, sans les modules d'optimisation avancés.

Ce qui ne change pas d'un projet à l'autre : Config Split, Gin, Pathauto, Metatag. Ces outils ont un rapport qualité/coût (en temps de configuration et de maintenance) qui justifie leur inclusion par défaut.

Ce qui change selon le besoin : Paragraphs (pas toujours nécessaire pour des structures simples), Webform (uniquement si le formulaire est complexe), les modules de vues avancées (Better Exposed Filters, Infinite Scroll) selon les besoins de filtrage.

Drupal 10 a beaucoup amélioré l'expérience développeur par rapport aux versions précédentes. Le travail avec Composer est plus stable, les APIs sont mieux documentées, et l'écosystème de modules a bien rattrapé la transition. La stack décrite ici fonctionne, se maintient bien dans le temps, et s'adapte à des équipes et des clients variés.
