---
title: "Drupal 9→11 : Migration réussie d'une plateforme 22 instances"
date: 2025-07-22
excerpt: "Retour d'expérience sur la migration d'une plateforme Drupal multisite de 22 instances : les modules qui ont bloqué, la stratégie en quatre phases et les pièges à éviter."
tags: ["Drupal", "PHP", "Migration", "Multisite", "DevOps"]
draft: false
---

Sur le papier, migrer une plateforme Drupal multisite de 22 instances vers Drupal 11 ressemble à un chantier balisé. En pratique, j'y ai passé quatre mois entre modules incompatibles, arbitrages techniques et surprises en production.

## Pourquoi c'est aussi complexe

Migrer une instance Drupal reste une opération connue. Vingt-deux instances qui partagent un codebase mais divergent par leurs configurations, leurs surcharges de modules et leurs données clients posent un problème d'une autre nature.

Les défis principaux :

- **Compatibilité des modules** : pas tous disponibles en Drupal 11 au moment de la migration
- **Surcharges par site** : chaque instance a ses propres overrides de configuration, templates, et parfois des hooks custom
- **Données en production** : pas question de casser une base de données active
- **Pas de downtime acceptable** : les sites servent du trafic quotidien

Je visais une plateforme stable et maintenable dans la durée, au-delà du simple fait de démarrer sous Drupal 11.

## Architecture initiale

La plateforme était organisée autour d'un multisite Drupal classique :

```
web/sites/
├── default/          # config partagée
├── site-client-a/    # instance 1
├── site-client-b/    # instance 2
...
├── site-client-v/    # instance 22
```

Chaque site avait sa propre base de données, ses propres fichiers uploadés, et une configuration synchronisée via `config_split`. Le codebase partagé contenait environ 40 modules contrib et une dizaine de modules custom.

## Les blockers rencontrés

### Module Purge et le cache invalidation

`purge` et `purge_drush` ne supportaient pas Drupal 11 au moment de notre migration. Ce module est critique pour l'invalidation de cache Varnish/CDN. Contournement : désactivation temporaire avec fallback sur le cache natif de Drupal, puis migration vers un fork maintenu en interne.

### Better Exposed Filters (BEF)

`better_exposed_filters` cassait sur les vues complexes déjà en place, dont plusieurs utilisaient des filtres exposés au comportement custom. J'ai réécrit les handlers concernés avec l'API Views native de Drupal 11.

### Geolocation Field

Le module `geolocation` a changé son API entre D9 et D11, et les champs existants stockaient les données dans un format différent. J'ai écrit une migration custom via `hook_update_N()` pour normaliser l'existant sans perdre les coordonnées.

### Hooks dépréciés

Drupal 11 a supprimé plusieurs hooks encore disponibles en D9 et D10. `drush analyze:deprecations`, via `drupal-check`, a sorti les quelque 200 dépréciations à corriger dans les modules custom.

## La stratégie de migration

J'ai découpé la migration en 4 phases.

**Phase 1 : préparation du codebase**
- Mise à jour Drupal 10 d'abord (D9 → D10 est plus simple que D9 → D11 direct)
- Audit des modules avec `drupal-check`
- Remplacement des modules incompatibles par des alternatives

**Phase 2 : migration D10 → D11 sur env de développement**
- Fork de la branche principale
- Mise à jour du `composer.json`
- Correction des dépréciations une par une
- Tests sur une instance représentative

**Phase 3 : tests par batch d'instances**
- Déploiement sur 3 instances pilotes (les moins critiques)
- Monitoring 72h
- Documentation des problèmes spécifiques à chaque config

**Phase 4 : déploiement progressif**
- Migration des 19 instances restantes par groupes de 4-5
- Rollback plan prêt à chaque étape
- Communication avec les clients concernés

## Solutions clés

Trois commandes ont porté l'essentiel du travail :

```bash
# Détection précoce des problèmes
./vendor/bin/drupal-check web/modules/custom --drupal-root=web

# Migration de la configuration
drush config:import --diff

# Vérification post-déploiement
drush status && drush cr && drush updb -y
```

Le staging comptait autant que l'outillage : des environnements fidèles à la production, alimentés par des données réelles anonymisées.

## Six recommandations

Si vous vous attaquez à une migration comparable :

1. **Passez par D10 avant D11.** Le chemin D9→D10→D11 est mieux documenté que le saut direct.
2. **Lancez `drupal-check` maintenant.** Découvrir deux cents dépréciations la veille du déploiement coûte bien plus cher que de les traiter au fil de l'eau.
3. **Traitez les modules critiques en premier.** Purge, Webform, Search API et Paragraphs conditionnent tout le reste.
4. **Préparez un plan de rollback.** Un snapshot de base de données avant chaque déploiement, sans exception.
5. **Testez avec de vraies données.** Les migrations de données cassent en silence, et le staging vide ne le montre pas.
6. **Prévenez les clients.** Ils méritent de savoir qu'un service peut être perturbé.

## Conclusion

La migration a duré 4 mois avec une équipe réduite, sans incident majeur en production. Le déploiement par vagues, l'analyse statique branchée dès le premier jour et la documentation tenue à chaque étape expliquent ce résultat.

Drupal 11 apporte de vrais gains sur les performances de rendu et l'API Recipes. La migration se rentabilise, à condition de ne pas la précipiter.

Écrivez-moi sur LinkedIn si vous voulez le détail d'un point précis.
