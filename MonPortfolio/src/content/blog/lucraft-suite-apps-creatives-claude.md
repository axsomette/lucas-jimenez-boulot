---
title: "Lucraft : vingt apps de création et d'architecture pour Mac, pilotées par Claude"
date: 2026-11-12
excerpt: "Ma suite d'apps créatives pour Mac : des logiciels libres repris, renommés, sécurisés et reliés à Claude, réunis derrière un launcher qui les installe et les met à jour tout seul."
tags: ["Lucraft", "Claude", "MCP", "Rust", "macOS", "Open Source"]
draft: false
---

Depuis la mi-octobre, je construis un projet perso : **Lucraft**, une suite d'apps créatives pour Mac. Photo, vecteur, vidéo, mise en page, son, présentations, tableur, et depuis peu de l'architecture. Vingt apps sont publiées aujourd'hui : treize disponibles et sept en bêta.

Je n'ai pas écrit ces apps de zéro. J'ai repris des logiciels créatifs libres, je les ai renommés, sécurisés, reliés à Claude et réunis dans une suite. Ce billet présente ce que j'y ai ajouté et pourquoi.

## Ce qu'il y a dans la suite

Les apps couvrent le travail d'une petite équipe de création : retouche d'images, illustration vectorielle, montage vidéo, développement photo, édition de PDF, motion design, mise en page, traitement de texte, présentations, tableur, dessin technique, son, design d'interfaces. Les bêta ajoutent la peinture de textures 3D, les matériaux procéduraux, l'animation 2D, et trois apps d'architecture :

- **ArchiLucraft** ouvre, relit et corrige des maquettes BIM au format IFC ;
- **ConstructLucraft** sert à concevoir un bâtiment ;
- **ModelLucraft**, arrivée cette semaine, fait du maquettage 3D direct : dessiner, pousser, tirer, grouper, exporter.

Les apps sont écrites en Rust, sans Electron. Elles démarrent vite et tournent hors ligne. Elles lisent et écrivent les formats du métier : PSD, EPS, PDF, DOCX, PPTX, XLSX, DXF, IFC, SVG.

## Un launcher pour toute la suite

Installer vingt apps une par une, puis les tenir à jour, personne ne le ferait. Le cœur du projet est donc **Lucraft Launcher**, une app Rust qui installe la suite et la met à jour.

Il s'installe avec une seule ligne dans le Terminal. Ensuite, un clic installe une app, et les mises à jour arrivent toutes seules, celles du launcher comprises. Chaque téléchargement est vérifié par son empreinte SHA-256 avant d'être installé, pour les Mac à puce Apple comme pour les Mac Intel. Je détaille ce système dans [un billet dédié](/lucas-jimenez-boulot/blog/distribuer-apps-mac-sans-app-store/).

Le launcher filtre aussi les apps par métier, et chaque fiche dit ce que Lucraft ajoute à l'app d'origine.

## Claude aux commandes

C'est la raison d'être de Lucraft. Chaque app embarque un serveur MCP, le protocole qui permet à Claude d'utiliser des outils. Le launcher relie une app à Claude Desktop ou à Claude Code en un clic. Claude peut alors ouvrir un document, le modifier et l'exporter dans la vraie app, pas dans une copie simplifiée.

Le launcher a aussi sa propre zone de discussion, « Demander à Claude ». On y tape une demande, Claude ouvre l'app dont il a besoin et on le voit travailler dans sa fenêtre. J'en raconte les coulisses dans [Piloter vingt apps avec Claude](/lucas-jimenez-boulot/blog/piloter-apps-claude-mcp/).

## La sécurité d'abord

Reprendre un logiciel, c'est aussi reprendre ses failles. Je les corrige ou les évalue une par une. Celle, critique, de la bibliothèque zip est corrigée dans six apps, alors que la version d'origine ne l'était pas encore au 9 novembre 2026.

Les apps sont hors ligne par défaut, et les fonctions en ligne passent par une liste fermée de services. Les liens vers les services en ligne de l'origine et ses propres mises à jour automatiques sont retirés. Le launcher, lui, ne parle qu'à sa source : un verrou réseau refuse toute autre adresse.

## Une reprise chaque semaine

Les projets d'origine avancent vite, et je veux leurs nouveautés. Chaque semaine, une reprise automatisée récupère la nouvelle version, la renomme, la teste et la publie. Elle passe plus de 60 000 tests. Quand l'origine sort une nouvelle app, elle rejoint la suite dans la journée.

Le renommage est un vrai chantier : noms affichés, menus, textes, icônes, liens. Une erreur laisserait un nom d'origine dans une app ou cesserait de proposer les mises à jour. La reprise vérifie donc ce qu'elle produit avant que je publie.

## Ce que j'en retire

Lucraft ne remplace pas les logiciels de référence de chaque métier. Il montre ce que l'on peut faire aujourd'hui avec du logiciel libre bien choisi, un peu d'outillage et Claude comme collègue : une suite cohérente, sûre et à jour, montée par un développeur seul, avec Claude, en quelques semaines.

Tout est publié sur [GitHub](https://github.com/axsomette/lucraft-releases), avec la ligne d'installation et la liste des apps. La [page du projet](/lucas-jimenez-boulot/lucraft/) en donne une vue plus visuelle.
