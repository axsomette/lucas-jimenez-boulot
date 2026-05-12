---
title: "Construire un CMS sur-mesure avec React 18 et PHP vanilla"
date: 2026-04-10
excerpt: "Retour d'expérience sur le développement du backoffice complet du portfolio de Hadrien Lenoir : React 18, TypeScript, PHP REST API maison, sans framework backend. Ce qui marche, ce qui m'a surpris."
tags: ["React", "TypeScript", "PHP", "MySQL", "API REST", "Backoffice", "Vite"]
draft: false
---

Pour le portfolio de Hadrien Lenoir, photographe professionnel, j'avais besoin d'un site vitrine propre et d'un outil de gestion de contenu que le client puisse utiliser seul, sans passer par moi à chaque modification. L'option CMS classique (Drupal, WordPress) ne correspondait pas : trop lourd pour un besoin aussi ciblé, trop générique pour une interface aussi spécifique. J'ai donc construit les deux from scratch.

Voici ce que j'ai appris.

## Le choix de la stack

Côté frontend, React 18 avec TypeScript et Vite. Pas de Next.js, pas de Remix : le site est un SPA classique avec React Router 7, déployé en statique sur un hébergeur Apache avec un `.htaccess` qui redirige tout vers `index.html`. Simple, rapide, sans serveur Node en production.

Côté backend, PHP vanilla avec PDO. Pas de Symfony, pas de Laravel. Une API REST maison avec un routeur custom qui dispatche les requêtes vers des handlers PHP, chacun responsable d'un domaine (accrochages, presse, tirages, actualités, etc.).

Le choix de PHP vanilla m'a semblé logique : l'hébergeur est un mutualisé Apache classique, Node.js n'est pas disponible, et les besoins de l'API sont relativement simples. Symfony aurait été surdimensionné. Laravel, idem.

## Architecture de l'API

Le routeur principal reçoit toutes les requêtes, extrait le premier segment de l'URI, et inclut le handler correspondant :

```php
$route = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'))[1] ?? '';

match($route) {
    'auth'        => require 'routes/auth.php',
    'accrochages' => require 'routes/accrochages.php',
    'press'       => require 'routes/press.php',
    'tirages'     => require 'routes/tirages.php',
    'actualites'  => require 'routes/actualites.php',
    'upload'      => require 'routes/upload.php',
    // ...
    default       => http_response_code(404),
};
```

Chaque handler lit `$_SERVER['REQUEST_METHOD']` et exécute l'opération correspondante. Pas de magie, pas d'injection de dépendances, pas d'ORM. PDO avec des prepared statements, c'est tout.

L'authentification repose sur les sessions PHP natives. À la connexion, on vérifie le mot de passe avec `password_verify()`, on régénère l'identifiant de session, et on stocke un flag en session. Un middleware vérifie ce flag avant chaque route protégée.

Un rate limiter simple a été ajouté sur les routes d'authentification : comptage des tentatives par IP en base de données sur une fenêtre glissante de 15 minutes, blocage temporaire au-delà de 5 tentatives.

## Le backoffice React

L'interface d'administration est construite avec les mêmes technologies que le front public. Un contexte d'authentification global vérifie la session au chargement. Si la session est invalide, redirection vers `/admin/login`.

Les pages admin suivent toutes le même pattern : récupération des données via un client API TypeScript, affichage dans un tableau ou une liste, formulaire d'édition en modal ou en page dédiée.

L'aspect le plus intéressant techniquement : la gestion des galeries multi-sliders pour les expositions. Chaque accrochage (exposition) peut avoir deux galeries distinctes — une pour les vues d'ensemble en mode paysage, une pour les détails en portrait. Chaque image a un ordre, modifiable par drag-and-drop avec React DnD.

```tsx
const [, drop] = useDrop({
  accept: 'IMAGE',
  hover: (dragged: { index: number }) => {
    if (dragged.index !== index) {
      moveImage(dragged.index, index);
      dragged.index = index;
    }
  },
});
```

L'ordre est persisté côté serveur avec une requête `UPDATE` sur le champ `position` de chaque image. Simple, efficace.

## Gestion des uploads

La médiathèque centralisée était un point délicat. Le client upload des images depuis plusieurs sections (expositions, presse, tirages), et il fallait éviter les doublons et maintenir une référence propre.

J'ai opté pour une approche simple : chaque upload génère un nom de fichier unique basé sur un hash, stocké dans une table `media_library`. Les entités (accrochages, articles) référencent les médias par leur identifiant en base. Si un média est utilisé dans plusieurs endroits, on ne stocke qu'une copie.

La suppression est gérée par un compteur de références : on ne supprime le fichier physique que si plus aucune entité n'y fait référence.

## Ce que je referais différemment

**Les migrations de base de données.** J'ai géré les évolutions de schéma manuellement, via un endpoint `/api/migrate` qui applique des scripts SQL. C'est fonctionnel mais fragile : impossible de savoir facilement quelle version du schéma est en place sur quel environnement. Un système de migrations versionné (même léger) aurait été mieux.

**La gestion des erreurs côté API.** Les handlers PHP retournent des JSON avec des codes HTTP corrects, mais la structure des erreurs n'est pas toujours cohérente. Certains retournent `{ error: "message" }`, d'autres `{ message: "message", success: false }`. Un type d'erreur unifié dès le début aurait simplifié le client TypeScript.

**Les tests.** Aucun test automatisé côté PHP. Sur un projet client en production, c'est un risque. Les routes critiques (auth, upload, suppression) mériteraient des tests d'intégration.

## Ce qui a bien fonctionné

La séparation franche entre le frontend public et le backoffice a rendu le développement plus simple. Deux contextes React distincts, deux ensembles de routes, deux états d'authentification. Pas de confusion entre les composants publics et privés.

Vite a rendu le développement agréable : rechargement instantané, build de production en quelques secondes, configuration minimale. Pour un projet de cette taille, c'est le bon choix.

Le client n'a eu besoin d'aucune formation technique. L'interface admin est suffisamment intuitive pour qu'il gère ses expositions, ses articles et ses médias de façon autonome depuis le lancement.

C'est au fond l'objectif principal : un outil que le client utilise vraiment, pas un CMS qu'il trouve trop complexe et finit par ignorer.
