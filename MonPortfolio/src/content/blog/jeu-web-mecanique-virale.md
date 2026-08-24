---
title: "Concevoir un jeu web interactif avec mécanique virale"
date: 2026-02-18
excerpt: "Pour une opération marketing Planet Boissons, j'ai développé un jeu à 4 niveaux progressifs avec une mécanique d'invitation par email pour débloquer la suite. Retour sur les choix techniques et les pièges rencontrés."
tags: ["PHP", "MySQL", "JavaScript", "Jeu web", "Architecture", "Sécurité"]
draft: false
---

Planet Boissons voulait un jeu web pour une opération marketing, en français et en anglais, avec des récompenses réparties sur plusieurs niveaux. La viralité était au cœur du dispositif : pour passer au niveau suivant, le joueur devait inviter d'autres personnes par email.

Le cahier des charges tient en un paragraphe. Les cas limites, eux, ont occupé l'essentiel du développement.

## Architecture générale

Le jeu repose sur PHP 8 côté serveur et du JavaScript vanilla côté client. Chaque niveau est une page PHP qui génère son HTML selon l'état du joueur, sans framework frontend. MySQL stocke les sessions de jeu, la progression par niveau et les relations d'invitation.

Les sessions PHP portent l'authentification. Le joueur s'inscrit, et j'associe son identifiant de session à son identifiant en base. Chaque action de jeu recontrôle cette correspondance côté serveur.

La structure de tables reste courte :

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

Quand le joueur a trouvé tous les objets, ou que le temps s'est écoulé, le client envoie ses résultats en POST. Le serveur contrôle la cohérence du délai, refuse par exemple un niveau de 30 secondes bouclé en 5, enregistre le résultat et renvoie le statut.

## La mécanique virale

C'est la partie la plus délicate. Pour passer du niveau 1 au niveau 2, le joueur doit inviter un certain nombre d'autres personnes par email. Chaque invitation génère un token unique :

```php
$token = bin2hex(random_bytes(32));
// Envoi de l'email avec un lien contenant ce token
// Enregistrement en base : sender_id, recipient_email, token, level_unlocked
```

Dès que le destinataire clique sur le lien, s'inscrit et termine le niveau 1, le serveur passe l'invitation en `accepted`. L'expéditeur débloque le niveau 2 quand son compteur d'invitations acceptées atteint le seuil.

Deux problèmes que j'ai rencontrés :

**Les boucles d'invitation.** Rien n'empêche A d'inviter B, puis B d'inviter A : les deux se débloquent mutuellement sans avoir touché personne d'autre. Je vérifie donc que le destinataire ne figure pas déjà dans la table `invitations` comme expéditeur ayant invité le joueur courant.

**Les faux emails.** Des joueurs ont tenté d'inviter des adresses invalides pour gonfler leur compteur. J'ai ajouté une validation de format côté serveur avec `FILTER_VALIDATE_EMAIL`, doublée d'un contrôle : le même joueur ne peut pas réinviter la même adresse dans les 24 heures.

## Sécurité et anti-triche

Dès qu'il y a des lots à gagner, quelqu'un tente de tricher. Quatre garde-fous encadrent la progression.

**Validation séquentielle.** Le serveur refuse d'enregistrer un niveau tant que le précédent n'est pas terminé, et il relit la base à chaque requête plutôt que de se fier à l'état en session.

**Délai minimum.** Un niveau calibré pour 2 minutes ne peut pas tomber en 10 secondes. Je stocke le timestamp de début en session côté serveur, hors de portée du client, et je compare l'écart.

**Rate limiting par IP.** Les inscriptions et les soumissions de score sont limitées à un certain nombre par IP par heure. Ça ne bloque pas un attaquant déterminé, mais ça filtre les tentatives automatisées basiques.

**Whitelist d'IP pour l'administration.** Les endpoints d'administration (export des participants, gestion des lots) ne sont accessibles que depuis des IPs autorisées.

## Ce que j'aurais fait différemment

**Le système d'emails.** J'ai utilisé `mail()` avec un template HTML. Sur certains hébergeurs, ces messages atterrissent en spam, et une invitation en spam casse toute la mécanique virale. Un service transactionnel comme Mailjet ou Brevo aurait tenu la charge.

**La gestion des fuseaux horaires.** L'opération était disponible dans plusieurs pays, mais toutes les dates sont stockées sans timezone en base. Sur une opération aussi courte, ça n'a pas posé de problème réel, mais c'est une dette que j'aurais dû éviter dès le départ.

**Des tests automatisés.** Le jeu implique une logique métier assez précise : séquencement des niveaux, comptage des invitations, validation des délais. Ces règles auraient mérité des tests unitaires. En l'absence de tests, les régressions se découvrent en production.

## Ce qui a bien fonctionné

J'ai traité la double langue avec deux dossiers `/fr` et `/en`, chacun portant ses fichiers PHP et ses templates traduits, plutôt qu'un système i18n complet. Sur un projet de cette durée de vie, l'investissement aurait dépassé le bénéfice.

La mécanique virale a produit l'engagement attendu : obliger le joueur à inviter des amis pour progresser a généré du partage organique, et l'opération a atteint ses objectifs de participation.

Le jeu a aussi tenu la charge sur toute la durée de l'opération, pics de trafic compris, sur une pile PHP et MySQL correctement configurée.
