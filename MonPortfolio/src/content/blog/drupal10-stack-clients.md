---
title: "Ma stack Drupal 10 pour les projets clients : pourquoi ces choix"
date: 2026-03-15
excerpt: "Sur Umaniti, Seaty et Charles & Alice, j'ai convergé vers la même stack Drupal 10. Ce que Radix, Paragraphs, Gin et Config Split apportent, et ce qu'ils coûtent."
tags: ["Drupal 10", "PHP", "Paragraphs", "Gin", "Architecture", "Composer"]
draft: false
---

Trois projets Drupal 10 m'ont mené à la même stack : un coliving (Umaniti), une plateforme de réservation (Seaty) et un mini-site promotionnel (Charles & Alice). Cette combinaison de modules revient parce qu'elle couvre les besoins qui reviennent eux aussi d'un client à l'autre.

## Le socle : Radix comme base de thème

Radix est mon point de départ pour tous les thèmes custom. Il fournit une structure de fichiers, des classes utilitaires et une intégration avec le système de composants Drupal, à charge pour moi d'écrire le reste.

Sur Umaniti, le thème custom hérite de Radix et ne surcharge que ce dont il a besoin. J'obtiens un thème léger, sans la dette technique d'un thème pensé pour tous les cas d'usage.

Radix vaut surtout pour la cohérence qu'il impose. Quand je reprends un projet six mois plus tard, je sais où sont les templates, les bibliothèques JS et les surcharges de variables.

## Paragraphs pour la flexibilité éditoriale

Paragraphs est incontournable dès qu'un client a besoin de pages à mise en page variable. Une page d'accueil avec un hero, une section texte-image, un carousel, puis un bloc de témoignages : sans Paragraphs, ça demande soit un éditeur WYSIWYG ingérable, soit des champs custom pour chaque variante.

Avec Paragraphs, le client assemble ses pages à partir de blocs prédéfinis. Chaque type de paragraphe est une unité éditoriale avec ses propres champs et son propre template Twig.

La gestion des révisions m'a demandé du temps. Drupal suit les révisions des nœuds, mais celles des entités Paragraphs vivent à part. Mal configuré, le comportement de révision laisse des orphelins en base et casse les rollbacks. `paragraph_view_mode` aide à piloter l'affichage sans dupliquer les templates.

## Gin pour l'interface d'administration

L'interface admin Drupal par défaut est fonctionnelle mais pas agréable. Gin la remplace par une interface moderne, claire, avec une sidebar de navigation plus intuitive. Pour un client non-technique qui saisit son contenu chaque jour, l'écart se sent dès la première prise en main.

Gin + Gin Toolbar + Gin Login couvrent toute l'expérience : page de connexion personnalisable, toolbar cohérente, vue d'ensemble claire. Admin Toolbar complète avec l'arbre de menus déroulant qui évite les allers-retours entre pages.

Gin encaisse aussi les formulaires complexes générés par Paragraphs et Field Group, là où d'autres thèmes admin les rendent illisibles.

## Config Split pour les environnements

Sur chaque projet, il y a au moins trois environnements : local, preprod, prod. Certaines configurations ne doivent exister qu'en développement (le module Devel, les logs verbeux, Shield pour protéger la preprod). D'autres sont propres à la prod (URLs canoniques, configuration email réelle).

Config Split permet de définir des ensembles de configuration qui s'activent selon l'environnement. En pratique :

- Un split `dev` contient Devel, les niveaux de log, les configurations de développement
- Un split `preprod` contient Shield et ses identifiants
- La config de base contient tout ce qui est commun

La synchronisation de configuration via `drush config:import` reste simple, et les surcharges d'environnement sont explicites et versionnées.

## SEO : le trio Metatag + Pathauto + Simple Sitemap

Sur chaque projet, ces trois modules forment un socle SEO minimal mais suffisant.

Pathauto dérive des URLs propres depuis les titres des nœuds, selon des patterns configurables, ce qui évite les `/node/42` en production.

Metatag laisse le client surcharger les balises `title`, `description` et Open Graph nœud par nœud, sans toucher au code. Je définis les valeurs par défaut au niveau du type de contenu, avec des tokens.

Simple Sitemap produit le `sitemap.xml`, avec contrôle de la priorité et de la fréquence par type de contenu. Il se branche sur les entités Drupal sans configuration lourde.

## Webform + Honeypot pour les formulaires

Webform est le module de formulaires Drupal le plus complet. Trop complet, parfois : il peut être surdimensionné pour un simple formulaire de contact. Mais dès qu'un client demande des téléchargements de fichiers, de la logique conditionnelle ou des exports CSV des soumissions, aucun autre module ne tient la comparaison.

Honeypot est systématique dès qu'il y a un formulaire public. C'est un module léger qui ajoute deux mécanismes anti-spam : un champ caché en CSS (les bots le remplissent, les humains non) et une vérification du délai de soumission (un bot soumet en millisecondes, un humain met au moins quelques secondes). Combiné avec reCAPTCHA sur les formulaires sensibles, c'est suffisant pour la grande majorité des cas.

## Ce que j'ai appris à travers ces projets

Je choisis la stack selon le client plutôt que selon le projet. Seaty va continuer d'évoluer : j'ai passé plus de temps sur l'architecture de configuration et les tests de déploiement. Umaniti est un site institutionnel stable : l'effort est parti dans le thème et l'expérience éditoriale. Charles & Alice avait une durée de vie limitée : même stack, sans les modules d'optimisation.

Quatre modules ne bougent jamais : Config Split, Gin, Pathauto et Metatag. Leur temps de configuration se rembourse en maintenance.

Les autres dépendent du cahier des charges : Paragraphs devient inutile sur des structures de page figées, Webform ne se justifie que sur un formulaire à logique conditionnelle, et les modules de vues (Better Exposed Filters, Infinite Scroll) suivent les besoins de filtrage.

Drupal 10 a nettement amélioré le quotidien du développeur : Composer se comporte mieux, les APIs sont mieux documentées et l'écosystème de modules a rattrapé la transition. Je repars de cette stack sur chaque nouveau projet, et elle se maintient bien dans le temps.
