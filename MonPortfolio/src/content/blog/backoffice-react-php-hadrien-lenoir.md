---
title: "Construire un CMS sur-mesure avec React 18 et PHP vanilla"
date: 2026-04-10
excerpt: "Retour d'expérience sur le backoffice du portfolio de Hadrien Lenoir : React 18, TypeScript et une API REST PHP maison, sans framework backend."
tags: ["React", "TypeScript", "PHP", "MySQL", "API REST", "Backoffice", "Vite"]
draft: false
---

Pour le portfolio de Hadrien Lenoir, photographe professionnel, j'avais besoin d'un site vitrine propre et d'un outil de gestion de contenu que le client puisse utiliser seul, sans passer par moi à chaque modification. Drupal et WordPress pesaient trop lourd pour un besoin aussi étroit, et leur interface d'administration restait trop générique pour ce que le client avait à saisir. J'ai construit le site et son back-office de zéro.

## Le choix de la stack

Côté frontend, React 18 avec TypeScript et Vite. J'ai écarté Next.js et Remix : le site est un SPA avec React Router 7, déployé en statique sur un hébergeur Apache dont le `.htaccess` redirige tout vers `index.html`. Aucun serveur Node ne tourne en production.

Côté backend, PHP vanilla avec PDO. Une API REST maison dont le routeur dispatche les requêtes vers des handlers PHP, chacun responsable d'un domaine : accrochages, presse, tirages, actualités.

PHP vanilla s'imposait : l'hébergeur est un mutualisé Apache, Node.js n'y tourne pas, et l'API reste simple. Symfony ou Laravel auraient apporté plus de configuration que de service rendu.

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

Chaque handler lit `$_SERVER['REQUEST_METHOD']` et exécute l'opération correspondante. J'attaque la base en PDO avec des requêtes préparées, sans ORM ni conteneur d'injection.

L'authentification repose sur les sessions PHP natives. À la connexion, je vérifie le mot de passe avec `password_verify()`, je régénère l'identifiant de session et j'y stocke un flag. Un middleware contrôle ce flag avant chaque route protégée.

J'ai ajouté un rate limiter sur les routes d'authentification : il compte les tentatives par IP en base sur une fenêtre glissante de 15 minutes et bloque au-delà de 5 essais.

## Le backoffice React

L'interface d'administration est construite avec les mêmes technologies que le front public. Un contexte d'authentification global vérifie la session au chargement. Si la session est invalide, redirection vers `/admin/login`.

Les pages admin suivent toutes le même pattern : récupération des données via un client API TypeScript, affichage dans un tableau ou une liste, formulaire d'édition en modal ou en page dédiée.

La partie qui m'a demandé le plus de travail : les galeries multi-sliders des expositions. Chaque accrochage porte deux galeries distinctes, l'une pour les vues d'ensemble en paysage, l'autre pour les détails en portrait. Le client réordonne les images au drag-and-drop, via React DnD.

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

Le serveur persiste cet ordre par un `UPDATE` sur le champ `position` de chaque image.

## Gestion des uploads

La médiathèque centralisée était un point délicat. Le client upload des images depuis plusieurs sections (expositions, presse, tirages), et il fallait éviter les doublons et maintenir une référence propre.

Chaque upload génère un nom de fichier unique basé sur un hash, enregistré dans une table `media_library`. Les accrochages et les articles référencent les médias par leur identifiant en base, si bien qu'une image réutilisée à plusieurs endroits n'existe qu'en un seul exemplaire sur le disque.

Un compteur de références commande la suppression : le fichier physique ne part que lorsque plus aucune entité ne le référence.

## Ce que je referais différemment

**Les migrations de base de données.** J'ai géré les évolutions de schéma manuellement, via un endpoint `/api/migrate` qui applique des scripts SQL. C'est fonctionnel mais fragile : impossible de savoir quelle version du schéma tourne sur quel environnement. Un système de migrations versionné (même léger) aurait été mieux.

**La gestion des erreurs côté API.** Les handlers PHP retournent des JSON avec des codes HTTP corrects, mais la structure des erreurs n'est pas toujours cohérente. Certains retournent `{ error: "message" }`, d'autres `{ message: "message", success: false }`. Un type d'erreur unifié dès le début aurait simplifié le client TypeScript.

**Les tests.** Aucun test automatisé côté PHP. Sur un projet client en production, c'est un risque. Les routes critiques (auth, upload, suppression) mériteraient des tests d'intégration.

## Ce qui a bien fonctionné

La séparation franche entre le frontend public et le backoffice a rendu le développement plus simple. Deux contextes React distincts, deux ensembles de routes, deux états d'authentification. Pas de confusion entre les composants publics et privés.

Vite a rendu le développement agréable : rechargement instantané, build de production en quelques secondes, configuration minimale. Pour un projet de cette taille, c'est le bon choix.

Le client n'a eu besoin d'aucune formation technique. Il gère ses expositions, ses articles et ses médias seul depuis le lancement.

C'était l'objectif : livrer un outil que le client ouvre encore, plutôt qu'un CMS complet dont il aurait fini par délaisser l'administration.
