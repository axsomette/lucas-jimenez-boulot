---
title: "Drupal 9→11 : Migration réussie d'une plateforme 22 instances"
date: 2026-05-12
excerpt: "Retour d'expérience sur la migration d'une plateforme Drupal multisite complexe. Lessons learned, solutions, et pièges à éviter."
tags: ["Drupal", "PHP", "Migration", "Multisite", "DevOps"]
draft: false
---

Migrer une plateforme Drupal multisite avec 22 instances vers Drupal 11 : ça ressemble à un projet bien balisé sur le papier. En pratique, c'est une accumulation de décisions techniques, de modules cassés, et de surprises en prod. Voici ce que j'ai appris.

## Pourquoi c'est aussi complexe

Une instance Drupal, ça se migre. Vingt-deux instances qui partagent un même codebase, des configurations différentes, des modules surcharges, et des données clients hétérogènes, c'est une autre histoire.

Les défis principaux :

- **Compatibilité des modules** : pas tous disponibles en Drupal 11 au moment de la migration
- **Surcharges par site** : chaque instance a ses propres overrides de configuration, templates, et parfois des hooks custom
- **Données en production** : pas question de casser une base de données active
- **Pas de downtime acceptable** : les sites servent du trafic quotidien

L'objectif n'était pas seulement de "faire tourner" Drupal 11. C'était d'avoir une plateforme stable, maintenable, et prête pour les années à venir.

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

`better_exposed_filters` avait des incompatibilités avec les vues complexes qu'on avait en place. Plusieurs vues utilisaient des filtres exposés avec des comportements custom. Solution : réécriture des handlers concernés avec l'API Views native de Drupal 11.

### Geolocation Field

Le module `geolocation` avait changé son API entre D9 et D11. Les champs existants stockaient des données dans un format légèrement différent. On a écrit une migration custom via `hook_update_N()` pour normaliser les données existantes sans perdre les coordonnées.

### Hooks dépréciés

Drupal 11 a supprimé plusieurs hooks qui étaient encore disponibles en D9/D10. La commande `drush analyze:deprecations` (via `drupal-check`) a été notre meilleure alliée pour identifier les 200+ dépréciations à corriger dans les modules custom.

## La stratégie de migration

On a découpé la migration en 4 phases :

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

La clé du succès a été la **combinaison d'outils** :

```bash
# Détection précoce des problèmes
./vendor/bin/drupal-check web/modules/custom --drupal-root=web

# Migration de la configuration
drush config:import --diff

# Vérification post-déploiement
drush status && drush cr && drush updb -y
```

Et surtout : des environnements de staging fidèles à la prod, avec des données réelles anonymisées.

## Recommandations pour toi qui lis ça

Si tu t'attaques à une migration similaire :

1. **Commence par D10, pas D11 direct.** Le chemin D9→D10→D11 est plus sûr et mieux documenté.
2. **Lance `drupal-check` dès maintenant.** N'attends pas la veille de la migration pour découvrir tes 300 dépréciations.
3. **Isole les modules critiques.** Purge, Webform, Search API, Paragraphs : vérifie leur compatibilité en premier.
4. **Prépare un rollback plan.** Un snapshot de base de données avant chaque déploiement. Toujours.
5. **Teste avec de vraies données.** Les migrations de données sont souvent le point de défaillance silencieux.
6. **Planifie la communication.** Tes clients / utilisateurs méritent d'être prévenus si un service peut être perturbé.

## Conclusion

La migration s'est faite sur 4 mois, avec une équipe réduite. Pas d'incident majeur en production. Ce qui a fait la différence : une approche progressive, des outils d'analyse intégrés dans le workflow dès le début, et une documentation rigoureuse à chaque étape.

Drupal 11 apporte des améliorations réelles, notamment sur les performances de rendu et l'API Recipes. L'investissement de la migration vaut le coup, à condition de ne pas la précipiter.

Des questions sur un point spécifique ? N'hésitez pas à me contacter sur LinkedIn.
