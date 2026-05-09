# Configuration du formulaire de contact

## 1. Formspree (réception des emails)

1. Va sur [formspree.io](https://formspree.io) et crée un compte gratuit
2. Clique **New Form**, donne-lui un nom (ex: "Portfolio Contact")
3. Copie l'**ID du formulaire** — c'est la partie après `/f/` dans l'URL (ex: `xyzabcde`)
4. Dans les settings du formulaire, active **reCAPTCHA / Turnstile** si tu utilises Cloudflare Turnstile

## 2. Cloudflare Turnstile (anti-bot)

1. Va sur [dash.cloudflare.com](https://dash.cloudflare.com) > **Turnstile**
2. Clique **Add widget**, choisis le type **Managed** (invisible pour l'UX)
3. Ajoute ton domaine : `axsomette.github.io`
4. Copie la **Site Key** (publique) — tu en auras besoin pour le .env

> Note : Turnstile est facultatif. Si tu ne le configures pas, le formulaire
> fonctionne quand même via Formspree (qui a sa propre protection anti-spam).

## 3. Variables d'environnement

Crée un fichier `.env` à la racine du projet (déjà dans `.gitignore`) :

```env
# Formspree — ID du formulaire (obligatoire pour activer le formulaire)
PUBLIC_FORMSPREE_ID=xyzabcde

# Cloudflare Turnstile — Site Key (facultatif)
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAAxxxxxxxxxxxxx
```

> Les variables `PUBLIC_` sont baked dans le bundle au build. Ce sont des clés
> publiques, elles peuvent apparaître dans le code source — c'est normal.

## 4. Test local

```bash
npm run dev
```

Remplis le formulaire sur `http://localhost:4321/#contact` et vérifie que
Formspree reçoit le message (onglet **Submissions** dans le dashboard Formspree).

## 5. Déploiement GitHub Pages

Pour que les variables soient disponibles au build GitHub Actions :

1. Va sur ton repo GitHub > **Settings** > **Secrets and variables** > **Actions**
2. Clique **New repository variable** (pas Secret, ce sont des clés publiques)
3. Ajoute `PUBLIC_FORMSPREE_ID` et `PUBLIC_TURNSTILE_SITE_KEY`
4. Dans `.github/workflows/deploy.yml`, vérifie que le step build expose les variables :

```yaml
- name: Build
  run: npm run build
  env:
    PUBLIC_FORMSPREE_ID: ${{ vars.PUBLIC_FORMSPREE_ID }}
    PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.PUBLIC_TURNSTILE_SITE_KEY }}
```

## Comportement du formulaire sans configuration

Si `PUBLIC_FORMSPREE_ID` n'est pas défini, la section Contact affiche un
message discret indiquant que le formulaire n'est pas encore configuré.
Le lien LinkedIn reste visible et fonctionnel dans tous les cas.
