---
title: "GitHub Actions pour Drupal : mon pipeline CI/CD de zéro à la production"
date: 2026-06-09
excerpt: "Comment j'automatise le déploiement Drupal avec GitHub Actions : tests, build des assets, mise à jour de la base de données, et rollback. Un pipeline que j'utilise en production."
tags: ["GitHub Actions", "CI/CD", "Drupal", "DevOps", "Linux"]
draft: false
---

Avant d'avoir un pipeline CI/CD, déployer Drupal ça ressemblait à ça : SSH dans le serveur, `git pull`, `composer install`, `drush cr`, `drush updb`, croiser les doigts. Parfois ça marchait. Parfois un module se comportait différemment en prod et on passait l'après-midi à déboguer.

Maintenant, un `git push` sur `main` déclenche un pipeline automatique. Les erreurs sont détectées avant que le code atteigne le serveur. Et si quelque chose part en vrille, le rollback est documenté.

Voici comment c'est construit.

## Architecture du pipeline

Le pipeline que j'utilise fait quatre choses dans l'ordre :

1. **Lint et validation** : vérification du code PHP, SCSS, JS
2. **Build des assets** : compilation SCSS, bundling JS via Vite/Webpack
3. **Déploiement** : rsync vers le serveur, `composer install`, migrations
4. **Post-déploiement** : `drush updb`, `drush cr`, smoke tests

```
push → main
    │
    ├─ [lint]        PHP CodeSniffer, ESLint
    │
    ├─ [build]       npm run build (assets)
    │
    ├─ [deploy]      rsync + composer install
    │
    └─ [post-deploy] drush updb + drush cr + health check
```

## Le fichier workflow complet

```yaml
# .github/workflows/deploy.yml
name: Deploy Drupal

on:
  push:
    branches: [main]

jobs:
  # ── Étape 1 : Lint ────────────────────────────────────────────
  lint:
    name: Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, pdo_mysql, gd
          tools: composer

      - name: Install PHP dependencies
        run: composer install --no-interaction --prefer-dist --optimize-autoloader

      - name: PHP CodeSniffer (Drupal standard)
        run: ./vendor/bin/phpcs --standard=Drupal web/modules/custom

      - name: PHP deprecations check
        run: ./vendor/bin/drupal-check web/modules/custom --drupal-root=web

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Node dependencies
        run: npm ci

      - name: ESLint
        run: npm run lint:js

  # ── Étape 2 : Build assets ───────────────────────────────────
  build:
    name: Build assets
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build CSS et JS
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: built-assets
          path: |
            web/themes/custom/my_theme/css/
            web/themes/custom/my_theme/js/dist/
          retention-days: 1

  # ── Étape 3 : Déploiement ────────────────────────────────────
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: built-assets

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H "${{ secrets.SERVER_HOST }}" >> ~/.ssh/known_hosts

      - name: Sync files avec rsync
        run: |
          rsync -avz --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.env' \
            --exclude='web/sites/*/files' \
            --exclude='web/sites/*/private' \
            ./ \
            ${{ secrets.SSH_USER }}@${{ secrets.SERVER_HOST }}:${{ secrets.DEPLOY_PATH }}

      - name: Composer install (production)
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SERVER_HOST }} \
            "cd ${{ secrets.DEPLOY_PATH }} && \
             composer install --no-interaction --no-dev --optimize-autoloader"

  # ── Étape 4 : Post-déploiement ───────────────────────────────
  post-deploy:
    name: Post-deploy
    runs-on: ubuntu-latest
    needs: deploy

    steps:
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H "${{ secrets.SERVER_HOST }}" >> ~/.ssh/known_hosts

      - name: Drush : mise à jour BDD + rebuild cache
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SERVER_HOST }} \
            "cd ${{ secrets.DEPLOY_PATH }} && \
             vendor/bin/drush updb -y && \
             vendor/bin/drush config:import -y && \
             vendor/bin/drush cr"

      - name: Health check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mon-site.fr)
          if [ "$STATUS" != "200" ]; then
            echo "Health check échoué : HTTP $STATUS"
            exit 1
          fi
          echo "Site opérationnel : HTTP $STATUS"
```

## Les secrets GitHub à configurer

Dans **Settings > Secrets and variables > Actions** du repo :

| Secret | Valeur |
|--------|--------|
| `SSH_PRIVATE_KEY` | Clé SSH privée (la clé publique est dans `~/.ssh/authorized_keys` du serveur) |
| `SERVER_HOST` | IP ou hostname du serveur |
| `SSH_USER` | Utilisateur SSH |
| `DEPLOY_PATH` | Chemin absolu du projet sur le serveur |

## Le cas multisite

Sur la plateforme 22 instances, le pipeline est légèrement différent. Un seul codebase, mais chaque site a sa propre configuration et base de données. Le `drush updb` et `drush config:import` doivent être exécutés pour chaque site :

```bash
# Post-déploiement multisite
SITES=(site-a site-b site-c site-d)

for site in "${SITES[@]}"; do
  echo "Mise à jour : $site"
  vendor/bin/drush --uri="$site.mon-domaine.fr" updb -y
  vendor/bin/drush --uri="$site.mon-domaine.fr" config:import -y
  vendor/bin/drush --uri="$site.mon-domaine.fr" cr
done
```

Dans GitHub Actions, ce bloc est dans une étape `matrix` pour paralléliser :

```yaml
strategy:
  matrix:
    site: [site-a, site-b, site-c, site-d]
```

## Rollback

Le pipeline n'a pas encore de rollback automatique (c'est sur ma liste). En attendant, le rollback manuel est documenté :

```bash
# Sur le serveur
cd /var/www/mon-site
git log --oneline -5  # Identifier le commit précédent
git checkout [commit-hash]
composer install --no-dev
vendor/bin/drush updb -y
vendor/bin/drush cr
```

Pour un rollback de base de données, j'ai un cron qui tourne toutes les 6h et exporte un dump SQL vers un bucket S3. Avant chaque déploiement en production, un dump manuel est déclenché comme filet de sécurité supplémentaire.

## Ce que ça change

Le bénéfice le plus immédiat n'est pas le gain de temps sur les déploiements. C'est la **confiance**. Savoir que le code qui atteint la prod a passé les linters, que les assets sont bien buildés, que `drush updb` s'est exécuté sans erreur : ça change la psychologie du déploiement.

On passe de "j'espère que ça va marcher" à "si le pipeline est vert, c'est bon".

Le deuxième bénéfice, c'est la documentation implicite. Un nouveau développeur qui rejoint le projet peut lire le fichier YAML et comprendre exactement ce qui se passe à chaque déploiement. C'est mieux que n'importe quel wiki.
