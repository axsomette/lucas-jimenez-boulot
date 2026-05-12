---
title: "Concevoir un jeu web interactif avec mécanique virale"
date: 2026-02-18
excerpt: "Pour une opération marketing Planet Boissons, j'ai développé un jeu à 4 niveaux progressifs avec une mécanique d'invitation par email pour débloquer la suite. Retour sur les choix techniques et les pièges rencontrés."
tags: ["PHP", "MySQL", "JavaScript", "Jeu web", "Architecture", "Sécurité"]
draft: false
---

Le brief était clair : créer un jeu web interactif pour une opération marketing Planet Boissons, disponible en français et en anglais, avec un système de récompenses distribué sur plusieurs niveaux. L'opération devait générer de la viralité : pour passer au niveau suivant, le joueur devait inviter d'autres personnes par email.

C'est le genre de projet qui paraît simple en surface et qui cache pas mal de complexité dès qu'on commence à réfléchir aux cas limites.

## Architecture générale

Le jeu repose sur PHP 8 côté serveur et du JavaScript vanilla côté client. Pas de framework frontend : les niveaux sont des pages PHP qui génèrent le HTML dynamiquement selon l'état du joueur. La base de données MySQL stocke les sessions de jeu, la progression par niveau, et les relations d'invitation.

L'authentification est gérée par sessions PHP. Un joueur s'inscrit, crée un compte, et son identifiant de session est lié à son identifiant en base. Chaque action de jeu vérifie cette correspondance côté serveur.

La structure de tables est relativement simple :

```sql
CREATE TABLE game_level_1 (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  completed_at DATETIME,
  score INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  accepted_at DATETIME,
  level_unlocked INT NOT NULL
);
```

## La mécanique d'objets cachés

Le niveau 1 est un jeu d'objets cachés avec un chronomètre. L'utilisateur doit trouver plusieurs éléments dans une image avant la fin du temps imparti. Côté JavaScript, chaque zone cliquable est définie par des coordonnées relatives à l'image (en pourcentage, pour s'adapter à toutes les tailles d'écran).

```javascript
const targets = [
  { id: 'obj1', x: 23.5, y: 41.2, radius: 4.8 },
  { id: 'obj2', x: 67.1, y: 28.9, radius: 3.2 },
  // ...
];

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  checkClick(x, y);
});
```

La validation côté serveur est simple : quand tous les objets sont trouvés (ou le temps écoulé), le client envoie une requête POST avec les résultats. Le serveur vérifie que le délai est cohérent (anti-cheat basique : impossible de terminer un niveau 30 secondes en moins de 5 secondes), enregistre le résultat, et retourne le statut.

## La mécanique virale

C'est la partie la plus délicate. Pour passer du niveau 1 au niveau 2, le joueur doit inviter un certain nombre d'autres personnes par email. Chaque invitation génère un token unique :

```php
$token = bin2hex(random_bytes(32));
// Envoi de l'email avec un lien contenant ce token
// Enregistrement en base : sender_id, recipient_email, token, level_unlocked
```

Quand le destinataire clique sur le lien, s'inscrit, et complète le niveau 1, l'invitation est marquée comme `accepted`. Quand le joueur expéditeur atteint le nombre requis d'invitations acceptées, le niveau 2 se déverrouille.

Deux problèmes que j'ai rencontrés :

**Les boucles d'invitation.** Rien n'empêche techniquement A d'inviter B, puis B d'inviter A. Les deux se débloqueraient mutuellement. Solution : vérifier que le destinataire n'est pas déjà dans la table `invitations` comme expéditeur ayant invité le joueur courant.

**Les faux emails.** Certains joueurs tentaient d'inviter des adresses invalides pour gonfler leur compteur. Solution : validation de format côté serveur (filtre PHP `FILTER_VALIDATE_EMAIL`), plus une vérification que l'email n'a pas déjà été invité par le même joueur dans les dernières 24h.

## Sécurité et anti-triche

Sur un jeu avec des récompenses réelles (lots distribués), la triche est inévitable. Voici les mesures en place.

**Validation séquentielle.** Le serveur refuse d'enregistrer la progression d'un niveau si le niveau précédent n'est pas complété. Cette vérification se fait à chaque requête : l'état en session ne suffit pas, on vérifie la base de données.

**Délai minimum.** Un niveau qui prend normalement 2 minutes ne peut pas être complété en 10 secondes. Le timestamp de début de jeu est stocké en session côté serveur (pas côté client), et on vérifie que la différence est réaliste.

**Rate limiting par IP.** Les inscriptions et les soumissions de score sont limitées à un certain nombre par IP par heure. Ça ne bloque pas un attaquant déterminé, mais ça filtre les tentatives automatisées basiques.

**Whitelist d'IP pour l'administration.** Les endpoints d'administration (export des participants, gestion des lots) ne sont accessibles que depuis des IPs autorisées.

## Ce que j'aurais fait différemment

**Le système d'emails.** J'ai utilisé `mail()` de PHP avec un template HTML. Sur certains hébergeurs, les emails envoyés via `mail()` finissent en spam. Un service transactionnel dédié (Mailjet, Brevo) aurait été plus fiable. C'est une erreur que je ne referai pas.

**La gestion des fuseaux horaires.** L'opération était disponible dans plusieurs pays, mais toutes les dates sont stockées sans timezone en base. Sur une opération aussi courte, ça n'a pas posé de problème réel, mais c'est une dette que j'aurais dû éviter dès le départ.

**Des tests automatisés.** Le jeu implique une logique métier assez précise : séquencement des niveaux, comptage des invitations, validation des délais. Ces règles auraient mérité des tests unitaires. En l'absence de tests, les régressions se découvrent en production.

## Ce qui a bien fonctionné

La double langue (FR/EN) a été gérée simplement : deux dossiers `/fr` et `/en`, chacun avec ses propres fichiers PHP incluant les templates traduits. Pas de système i18n complexe. Sur un projet de cette durée de vie, c'était le bon niveau de complexité.

La mécanique virale a bien fonctionné en termes d'engagement : le fait de devoir inviter des amis pour progresser a généré du partage organique. L'opération a atteint ses objectifs de participation.

Et surtout : le jeu a tenu en charge sans problème sur la durée de l'opération. PHP + MySQL bien configuré, c'est robuste, même pour des pics de trafic simultané.
