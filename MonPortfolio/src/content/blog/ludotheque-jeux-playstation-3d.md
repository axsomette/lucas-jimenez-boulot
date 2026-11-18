---
title: "Ludothèque : ma collection de jeux PlayStation en boîtiers 3D"
date: 2026-11-18
excerpt: "Une PWA pour ranger mes jeux PS5, PS4 et PS3 physiques : une photo de la jaquette, le jeu est retrouvé, et il rejoint l'étagère dans un boîtier 3D qui s'ouvre sur son disque."
tags: ["React", "Three.js", "Supabase", "PWA", "Blender", "TypeScript"]
draft: false
ogImage: "ludotheque/og-ludotheque.jpg"
---

Je range mes jeux PS5, PS4 et PS3 physiques dans une appli que j'ai écrite cette semaine : **Ludothèque**. Je prends la jaquette en photo, l'appli retrouve le jeu, et il rejoint la collection dans un boîtier 3D que l'on peut tourner, ouvrir, et dont on sort le disque.

<figure>
  <img src="/lucas-jimenez-boulot/ludotheque/accueil.webp" width="1600" height="1000" loading="lazy" alt="Accueil de la Ludothèque : le jeu sélectionné en grand sur un fond à la couleur de sa jaquette, puis une rangée de boîtiers." />
  <figcaption>L'accueil, présenté comme sur une console. Captures faites en mode démo.</figcaption>
</figure>

## De la photo au boîtier

1. Je photographie la jaquette avec mon téléphone.
2. Le titre est lu dans le navigateur, avec Tesseract.js : la photo n'est envoyée nulle part. Le bandeau PS5, PS4 ou PS3 donne la plateforme.
3. La jaquette officielle est retrouvée sur IGDB, avec le résumé, les genres, l'éditeur et la classification PEGI.
4. Le jeu arrive sur l'accueil : le jeu sélectionné en grand, sur un fond qui prend la couleur de sa jaquette, puis des rangées par plateforme.

Le titre lu reste modifiable avant la recherche. Si le jeu est introuvable, la photo sert de jaquette.

## Un boîtier fidèle

Le boîtier n'est pas une image : c'est un objet 3D aux mesures d'un vrai boîtier Blu-ray, 135 × 171 × 15 mm. Je l'ai modélisé dans Blender par un script : deux demi-coques, une tranche à double charnière, le moyeu à griffes et les attaches du livret. Les textures du plastique sont faites dans TextureLucraft, l'app de peinture de textures de [ma suite Lucraft](/lucas-jimenez-boulot/lucraft/).

Dans l'appli, React Three Fiber l'affiche. On le fait tourner du doigt, le couvercle pivote sur sa tranche, le disque sort et tourne, et le retourner montre sa face gravée irisée. Les bandeaux sont ceux des éditions européennes, blanc pour la PS5, bleu pour la PS4, noir pour la PS3, avec les logotypes officiels dans leurs versions du domaine public.

<figure>
  <img src="/lucas-jimenez-boulot/ludotheque/disque.webp" width="1600" height="1000" loading="lazy" alt="Boîtier 3D ouvert, le disque sorti du moyeu, à côté de la fiche du jeu." />
  <figcaption>Le boîtier ouvert, disque sorti.</figcaption>
</figure>

## Le vrai dos, le vrai disque

Le dos est d'abord composé avec les données d'IGDB : captures, résumé, genres, pictogramme PEGI, éditeur. Pour aller plus loin, une fonction Supabase cherche les vrais scans du dos et du disque sur LaunchBox Games DB, en version européenne d'abord, et les copie dans le stockage de l'appli.

LaunchBox n'a pas d'API officielle : la fonction lit ses pages publiques, et des tests me préviennent si leur mise en page change. Pour un jeu absent, je peux photographier mon propre boîtier.

<figure>
  <img src="/lucas-jimenez-boulot/ludotheque/dos.webp" width="1600" height="1000" loading="lazy" alt="Dos du boîtier 3D composé automatiquement : résumé, pictogramme PEGI, mentions et code-barres." />
  <figcaption>Le dos composé avec les données d'IGDB, en attendant le vrai scan.</figcaption>
</figure>

## Sous le capot

- **Front** : Vite, React 19 et TypeScript, publié sur GitHub Pages. L'appli est une PWA : elle s'installe sur l'écran d'accueil du téléphone et son interface reste disponible hors ligne.
- **Back** : Supabase. Comptes par e-mail et mot de passe, règles RLS pour que chacun ne voie que ses jeux, stockage des jaquettes rangé par utilisateur.
- **Edge Functions** (Deno) : recherche IGDB, copie des jaquettes, récupération des scans. Les clés d'IGDB restent côté serveur, et chaque fonction vérifie la session avant de répondre.
- **Tests** : Vitest, lancés avant chaque mise en ligne. Ils couvrent les couleurs, le PEGI, la détection de la plateforme, le nettoyage du titre lu et la lecture des pages LaunchBox.

Sans configuration, l'appli démarre en mode démo : la collection reste dans le navigateur.

## Ce que j'en retire

C'est un projet perso pour un vrai usage, ma propre étagère. Il m'a fait toucher à ce que je croise peu en mission, la 3D temps réel et la modélisation, sur une stack que je connais bien. Le tout a été monté en deux jours, avec Claude comme binôme.

Le code est sur [GitHub](https://github.com/axsomette/ma-ludotheque-ps) et l'appli est [en ligne](https://axsomette.github.io/ma-ludotheque-ps/).
