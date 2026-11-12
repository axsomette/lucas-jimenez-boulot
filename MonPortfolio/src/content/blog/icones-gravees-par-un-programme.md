---
title: "Des icônes gravées sur bois, calculées par un programme et sans IA"
date: 2026-11-10
excerpt: "Pour les icônes de Lucraft, j'ai écrit un graveur : des objets modélisés en volumes simples, éclairés par une seule lumière et rendus en tailles-douces, en Python et sans aucune image générée."
tags: ["Design", "Icônes", "SVG", "Python", "Lucraft", "Génératif"]
draft: false
---

Une suite d'apps se reconnaît d'abord à ses icônes. Dans le Dock, au lancement, dans le launcher : c'est ce qu'on voit le plus souvent. Pour [Lucraft](/lucas-jimenez-boulot/blog/lucraft-suite-apps-creatives-claude/), je voulais une famille qui se lise comme un tout, avec une app reconnaissable au premier coup d'œil, et surtout sans image générée par IA.

La réponse a été un programme : un petit graveur qui dessine chaque icône comme une gravure sur bois.

## Un objet du métier par app

Chaque app a un objet de son métier, sur une tuile de couleur à elle :

- un objectif pour la retouche photo, une bobine pour la vidéo, un compte-fils sur une diapositive pour le développement photo ;
- une plume pour le traitement de texte, un chevalet pour les présentations, un boulier pour le tableur ;
- un caractère en plomb pour la mise en page, un prisme pour le motion design, un gramophone pour le son ;
- un compas pour le dessin technique, une colonne dorique et une truelle pour l'architecture ;
- un zootrope pour l'animation, des engrenages pour l'app qui étudie les autres.

Un objet plutôt qu'un symbole abstrait : on comprend l'app avant d'avoir lu son nom, et la gravure donne à l'ensemble un air d'atelier qui va bien avec des outils de création.

## Modéliser au lieu de dessiner

Le graveur ne part pas d'une image. Chaque objet est construit avec quelques surfaces 3D simples, décrites par des formules :

- des **solides de révolution** pour l'objectif, le fût de la colonne ou le pavillon du gramophone ;
- des **disques** pour les flasques de la bobine ou le sceau de cire de la page ;
- des **boîtes** pour le caractère en plomb ou la base de la colonne ;
- des **prismes** pour la lame de la truelle ;
- des **plaques** pour la page et la toile du chevalet.

Tout est vu en projection orthogonale, sur une toile de 1024 pixels, sous une seule lumière qui vient d'en haut à gauche. Le script calcule, point par point, combien chaque surface reçoit de lumière.

## Graver la lumière

Une gravure ne connaît pas le gris : elle n'a que des traits. L'ombre se rend par l'épaisseur et la densité des tailles. Le graveur suit donc trois règles :

1. **Les traits suivent la forme** : méridiens et parallèles sur un solide de révolution, anneaux et rayons sur un disque. C'est ce qui donne le volume.
2. **Les traits gonflent dans l'ombre** et s'amincissent vers la lumière.
3. **Une seconde famille de traits, croisée, apparaît dans les zones sombres**, comme une contre-taille au burin.

Toutes les icônes partagent la même lumière, le même écart entre les traits et les mêmes épaisseurs. C'est ce qui en fait une famille, alors qu'aucune ne ressemble à une autre.

## Des couleurs choisies, pas tirées au sort

Les tuiles sont de couleurs sourdes : ardoise, lie-de-vin, sapin, ocre… Elles sont réparties sur tout le cercle des teintes, et sur deux ou trois niveaux de clarté, pour que deux apps voisines ne se confondent jamais. Le calcul se fait dans l'espace OKLCH, où une même clarté paraît vraiment aussi claire d'une teinte à l'autre, ce qui n'est pas le cas en RVB.

## Ce que le code apporte

Les outils tiennent en un peu moins de 2 400 lignes de Python, sans dépendance externe. Le script écrit des SVG, puis ImageMagick les décline en PNG, de 1024 à 16 pixels. Vingt-deux icônes en sortent aujourd'hui.

Cette approche a trois avantages que je n'avais pas avec des images faites à la main ou générées :

- **la cohérence est garantie** : une nouvelle app reçoit la même lumière et les mêmes tailles que les autres, sans effort ;
- **tout se reprend** : changer l'épaisseur des traits ou la direction de la lumière, c'est changer un paramètre et relancer le script ;
- **l'origine est claire** : chaque trait vient d'une formule écrite dans le dépôt, sans question de droits sur des images d'entraînement.

Avant d'être validée, la série a été vérifiée sur des planches : à 128 pixels, la taille du launcher, puis à 64, 32 et 16 pixels, sur fond clair et sur fond sombre comme dans le Dock.

Les nouvelles icônes sont arrivées dans les apps et dans le launcher le 10 novembre. On peut toutes les voir sur la [page du projet](/lucas-jimenez-boulot/lucraft/).
