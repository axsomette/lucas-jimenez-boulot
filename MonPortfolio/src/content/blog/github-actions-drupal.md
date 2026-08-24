---
title: "GitHub Actions pour Drupal : mon pipeline CI/CD de zéro à la production"
date: 2025-10-30
excerpt: "Comment j'automatise le déploiement Drupal avec GitHub Actions : tests, build des assets, mise à jour de la base de données, et rollback. Un pipeline que j'utilise en production."
tags: ["GitHub Actions", "CI/CD", "Drupal", "DevOps", "Linux"]
draft: false
---

Avant le pipeline, je déployais Drupal en SSH : `git pull`, `composer install`, `drush cr`, `drush updb`, puis j'attendais de voir. Il arrivait qu'un module se comporte autrement en production, et j'y passais l'après-midi.

Aujourd'hui, un `git push` sur `main` lance le pipeline. Les linters attrapent les erreurs avant que le code touche le serveur, et je dispose d'une procédure de rollback écrite.

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

Sur la plateforme à 22 instances, le pipeline change sur un point. Le codebase est unique, mais chaque site porte sa configuration et sa base. Je rejoue donc `drush updb` et `drush config:import` site par site :

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

Une étape `matrix` parallélise ce bloc dans GitHub Actions :

```yaml
strategy:
  matrix:
    site: [site-a, site-b, site-c, site-d]
```

## Rollback

Le pipeline ne sait pas encore revenir en arrière tout seul, et c'est la prochaine chose que j'y ajouterai. En attendant, je suis cette procédure manuelle :

```bash
# Sur le serveur
cd /var/www/mon-site
git log --oneline -5  # Identifier le commit précédent
git checkout [commit-hash]
composer install --no-dev
vendor/bin/drush updb -y
vendor/bin/drush cr
```

Côté base de données, un cron exporte un dump SQL vers un bucket S3 toutes les 6 heures. Je déclenche en plus un dump manuel juste avant chaque déploiement en production.

## Ce que ça change

Le gain de temps compte moins que la **confiance**. Le code qui arrive en production a passé les linters, ses assets sont compilés et `drush updb` s'est exécuté sans erreur. Un pipeline vert vaut désormais feu vert, là où je relisais chaque étape à la main.

Le fichier YAML sert aussi de documentation. Un développeur qui rejoint le projet y lit la séquence exacte de chaque déploiement, là où un wiki aurait déjà divergé du réel.
