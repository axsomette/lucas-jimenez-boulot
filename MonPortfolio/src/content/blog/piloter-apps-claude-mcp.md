---
title: "Piloter vingt apps avec Claude : MCP, « Demander à Claude » et les fenêtres côte à côte"
date: 2026-11-11
excerpt: "Comment les apps de Lucraft se laissent piloter par Claude : un serveur MCP par app, un launcher qui les branche en un clic, et une discussion intégrée où Claude ouvre l'app dont il a besoin."
tags: ["Claude", "MCP", "Claude Code", "Lucraft", "Rust", "IA"]
draft: false
---

Une app de retouche que Claude sait utiliser, ce n'est pas un générateur d'images. Claude ouvre le vrai fichier, crée de vrais calques, applique les vrais réglages, et le résultat s'enregistre dans le format du métier. Personne ne voit la différence avec un fichier fait à la main, et on peut le reprendre à la main.

C'est l'idée de départ de [Lucraft](/lucas-jimenez-boulot/blog/lucraft-suite-apps-creatives-claude/). Voici comment elle est construite.

## Un serveur MCP par app

MCP, le Model Context Protocol, est la façon standard de donner des outils à Claude. Un serveur MCP décrit ses outils (un nom, une description, des paramètres) et Claude les appelle quand il en a besoin.

Chaque app de Lucraft embarque le sien. Ils ne sont pas tous taillés pareil, parce que les métiers ne se ressemblent pas :

- le tableur parle en cellules, avec la notation A1 ;
- la mise en page parle en points, avec des cadres et des pages ;
- le montage vidéo parle en séquences, en pistes et en images ;
- le maquettage 3D parle en volumes, qu'on pousse et qu'on tire.

Un point est commun à tous : chaque action de l'app est une commande. Un outil liste les commandes disponibles, un autre en exécute une ou plusieurs, et chaque modification se défait. Claude peut donc tout essayer sans rien casser. Pour vérifier son travail, il demande un rendu de la page ou de l'image et le regarde.

## Brancher une app en un clic

Écrire à la main la configuration MCP de vingt apps, dans Claude Desktop et dans Claude Code, serait pénible et fragile. Le launcher s'en occupe : un clic sur une app la relie à l'un ou à l'autre, ou aux deux.

Certaines apps savent aussi travailler « en direct ». Claude agit alors dans la fenêtre ouverte de l'app, et l'on voit le document changer sous ses yeux. C'est le mode le plus parlant en démonstration, et le plus utile pour corriger le tir en cours de route.

## « Demander à Claude », dans le launcher

Depuis le 10 novembre, le launcher a sa propre discussion. On y tape une demande, en français, et Claude Code la réalise avec les serveurs MCP des apps.

Sous le capot, le launcher lance Claude Code en mode non interactif et lit au fil de l'eau ce qu'il produit. Chaque ligne devient une étape affichée : ce que Claude dit, l'outil qu'il utilise et dans quelle app, si l'appel a réussi. Les étapes se replient en une ligne qu'on peut déplier. On garde ainsi le fil sans être noyé.

Quelques choix que j'ai faits :

- **le modèle** se choisit dans un menu, et la réponse affiche celui qui a vraiment répondu ;
- **les images** se glissent, se collent ou se choisissent, puis sont rangées dans les Documents sous un nom propre avant d'être données à Claude ;
- **les apps ouvertes** apparaissent en pastilles, et chaque demande dit à Claude lesquelles il pilote en direct ;
- **les limites d'usage** du compte, sur cinq heures et sur la semaine, s'affichent en haut, avec l'heure à laquelle elles repartent. Le launcher les lit dans les réponses de Claude Code et ne fait aucune requête de plus ;
- **la recherche web et mes propres skills** sont des interrupteurs, avec une explication au survol plutôt que de longs avertissements.

## Claude ouvre l'app dont il a besoin

Au début, il fallait ouvrir l'app avant de poser la question. Désormais, le serveur MCP du launcher a un outil pour ouvrir une app : on demande « décline ce visuel en story », et Claude ouvre lui-même l'app de retouche.

Reste à voir ce qu'il fait. Quand Claude commence à travailler dans une app ouverte, le launcher peut ranger les fenêtres : le launcher à gauche sur 40 % de l'écran, l'app à droite. Cette option est désactivée par défaut, et elle demande la permission Accessibilité de macOS. Le launcher la réclame avant d'en avoir besoin, quelle que soit la langue dans laquelle macOS répond.

Ce rangement m'a appris deux choses. D'abord, macOS gardait la fenêtre de l'app trop courte quand on fixait sa taille avant de la déplacer : il faut la dimensionner, la déplacer, puis la dimensionner encore. Ensuite, Claude, voyant l'option mentionnée, allait chercher une commande de rangement dans l'app elle-même. La consigne qu'il reçoit précise maintenant que le launcher s'en charge.

## Ce qui reste difficile

Piloter une app n'est pas plus simple que de l'utiliser : il faut connaître le métier, et les commandes ne disent pas tout. Les opérations longues restent le point faible. Un long rendu de motion design ou un gros import audio peut dépasser le délai d'attente du protocole, et le serveur redémarre en perdant l'état de la session. Pour ces cas-là, les apps ont aussi une ligne de commande, plus robuste.

Ce sont des limites d'aujourd'hui. Une app qui expose ses commandes de façon propre et vérifiable restera, elle, utilisable par les modèles de demain.
