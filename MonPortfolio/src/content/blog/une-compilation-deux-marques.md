---
title: "Une compilation, deux marques : les éditions de Lucraft"
date: 2026-11-03
excerpt: "Comment je livre la même suite d'apps sous un autre nom, avec ses propres icônes de marque et sa propre source de mises à jour, sans recompiler une seule ligne."
tags: ["macOS", "Distribution", "Marque blanche", "Bash", "Lucraft"]
draft: false
---

[Lucraft](/lucas-jimenez-boulot/blog/lucraft-suite-apps-creatives-claude/) est un projet perso. Mais une suite d'apps créatives pilotées par Claude intéresse aussi l'équipe de Kaneva, l'agence web avec laquelle je travaille. Il fallait donc pouvoir livrer la même suite sous un autre nom : **Kaneva Launcher**, avec des apps en « …Kraft », PhotoKraft, VectorKraft, FilmKraft et les autres.

La solution évidente était de compiler une seconde fois avec d'autres noms. Je ne l'ai pas retenue.

## Pourquoi ne pas recompiler

Compiler la suite pour puces Apple et pour Intel prend du temps et beaucoup de disque. Doubler ce travail pour chaque édition, c'était doubler le temps de publication et le risque d'écart entre deux versions censées être identiques.

Surtout, une app recompilée est une autre app. Les tests, les essais et les corrections de sécurité ont été faits sur un binaire précis. Je voulais que l'édition livre **exactement ce binaire-là**.

## Renommer une app déjà construite

Sur macOS, une app est un dossier : `PhotoLucraft.app`. Le nom affiché dans le Finder, le Dock et la barre des menus vient de son fichier `Info.plist`, pas du binaire.

Le script `lucraft-edition.sh` part des images disque de Lucraft déjà construites sur mon Mac. Pour chacune :

1. il ouvre l'image disque ;
2. il renomme le dossier de l'app, `PhotoLucraft.app` devenant `PhotoKraft.app` ;
3. il change les noms dans `Info.plist` ;
4. il re-signe l'app, ad hoc, en gardant ses droits d'accès (les « entitlements ») ;
5. il remet le tout dans une image disque, avec son empreinte SHA-256.

Une version déjà faite n'est pas refaite. Le script ne touche à rien d'autre : il lit les noms et les logos dans un dossier de réglages propre à l'édition.

## Ce qui ne change pas, volontairement

Certains noms restent ceux de Lucraft, et c'est voulu :

- **les identifiants d'app** (`ai.lucraft.photocraft`), qui servent à macOS pour les permissions et les préférences ;
- **les noms des exécutables** à l'intérieur des apps ;
- **les noms des serveurs MCP**, que Claude utilise pour appeler les outils ;
- **le dossier de données** du launcher.

Les changer aurait voulu dire toucher au binaire, donc recompiler, avec tout ce que je voulais éviter. Et une conversation avec Claude, ou un réglage, marche de la même façon dans les deux éditions.

La contrepartie est connue : les textes à l'intérieur des apps gardent « Lucraft ». Autre conséquence : les deux launchers partagent le même contrôle « une seule instance ». Pour essayer l'un pendant que l'autre tourne, il faut un autre compte macOS.

## Le launcher de l'édition

Le launcher reçoit, en plus, l'édition elle-même, rangée dans ses ressources : ses noms, son logo et l'adresse de ses mises à jour. Au démarrage, il la lit. Il affiche alors « Kaneva Launcher », installe les apps « …Kraft » et ne cherche ses mises à jour qu'à cette adresse.

Dans le code, deux fonctions donnent le nom d'une app : son nom affiché et le nom de son dossier `.app`. L'édition passe par elles, et le reste de l'interface en hérite.

## Une source privée

La suite Lucraft est publiée sur GitHub, en public. L'édition Kaneva est publiée sur le GitLab de l'agence, dans un dépôt privé. Le launcher de l'édition doit donc s'identifier.

Il le fait avec un jeton de déploiement, envoyé dans l'en-tête `Authorization` des requêtes, et seulement vers la source de l'édition. Le verrou réseau du launcher, qui refuse toute autre adresse, empêche ce jeton de partir ailleurs.

L'installeur est le même script que pour Lucraft. La publication de l'édition y écrit trois valeurs : l'adresse du catalogue, l'en-tête d'authentification et le nom du launcher.

## Les chartes clients

L'édition a un dernier ingrédient : les chartes graphiques des clients de l'agence. Couleurs, typographies, logos et règles d'usage sont rangés par client, et les apps comme Claude les respectent à chaque création. Elles s'ajoutent à celles de l'utilisateur sans les écraser.

## Ce que ça m'a appris

Séparer ce qui fait l'app de ce qui fait la marque rend la marque presque gratuite. Une nouvelle édition, c'est un dossier de réglages et une commande, pas une seconde chaîne de compilation.

Il faut seulement décider dès le départ ce qui appartient au produit (identifiants, protocoles, données) et ce qui appartient à la marque (noms, logos, source). Changer d'avis plus tard coûte bien plus cher.
