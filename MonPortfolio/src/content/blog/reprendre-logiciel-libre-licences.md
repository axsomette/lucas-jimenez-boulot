---
title: "Reprendre un logiciel libre dans les règles : MIT, Apache 2.0 et GPL"
date: 2026-11-12
excerpt: "Ce que les licences libres permettent quand on reprend un logiciel pour en faire le sien, ce qu'elles exigent en retour, et comment je l'applique dans Lucraft."
tags: ["Open Source", "Licences", "GPL", "Apache 2.0", "MIT", "Lucraft"]
draft: false
---

Les apps de [Lucraft](/lucas-jimenez-boulot/blog/lucraft-suite-apps-creatives-claude/) sont des logiciels libres que j'ai repris, renommés, sécurisés et reliés à Claude. C'est permis, à condition de respecter les licences. Elles ne disent pas toutes la même chose, et la différence compte dès qu'on distribue le résultat.

Ce billet résume ce que j'ai retenu en lisant les textes. Je ne suis pas juriste : pour un projet commercial, faites relire votre cas.

## Ce que toutes ces licences permettent

MIT, Apache 2.0 et GPL ont un point commun : elles autorisent à utiliser, copier, modifier et redistribuer le logiciel, y compris dans une version modifiée et sous un autre nom. Reprendre un projet libre pour en faire sa propre version n'a donc rien d'un détournement. C'est exactement ce que ces licences prévoient.

Les différences portent sur ce qu'on doit faire en retour.

## MIT : garder le nom des auteurs

La licence MIT est la plus courte. Sa seule vraie exigence : l'avis de copyright et le texte de la licence doivent accompagner toute copie du logiciel, ou de toute partie substantielle. On peut changer le nom de l'app, son icône, son code, et même la vendre. On ne peut pas effacer qui l'a écrite.

## Apache 2.0 : la même chose, en plus précis

Apache 2.0 reprend cette logique et la détaille :

- fournir une copie de la licence avec le logiciel ;
- conserver les avis de copyright, de brevet et d'attribution ;
- si le projet a un fichier NOTICE, le livrer avec les versions redistribuées ;
- signaler de façon visible les fichiers qu'on a modifiés.

Elle ajoute deux choses que MIT ne dit pas. Chaque contributeur accorde une licence sur les brevets liés à sa contribution. Et la licence ne donne **aucun droit sur les marques** : le nom du projet n'en fait pas partie. Pour une reprise distribuée sous son propre nom, c'est une raison de plus de renommer.

Beaucoup de projets Rust sont publiés sous « MIT ou Apache 2.0, au choix ». On choisit alors celle des deux qu'on respecte.

## GPL : partager à son tour

La GPL change la donne. Elle autorise tout ce qui précède, mais quiconque distribue une version modifiée doit :

- la distribuer sous la même licence ;
- fournir le code source correspondant à ce qu'il distribue, modifications comprises ;
- conserver les avis de licence et indiquer qu'il a modifié le programme.

On ne peut donc pas reprendre un logiciel GPL, l'améliorer et garder ses améliorations pour soi en ne distribuant que l'app compilée.

## Comment je l'applique dans Lucraft

La plupart des apps de Lucraft viennent de projets sous MIT ou Apache 2.0. Une app d'architecture, ConstructLucraft, vient d'un projet sous GPL 3 ou ultérieure. Concrètement :

- **chaque app est livrée avec ses licences et ses attributions**, telles que le projet d'origine les fournit ;
- **le launcher a une page « Provenance et licences »**, dans les réglages ou en bas de la fiche de chaque app. Elle nomme, app par app, le projet d'origine, ses auteurs, sa licence et l'adresse de son code source. C'est le seul endroit qui les nomme : les fiches et les textes de présentation parlent de ce que fait l'app, pas de son ascendance ;
- **la même page dit ce que Lucraft ajoute** à chaque app : l'installation et les mises à jour par le launcher, le pilotage par Claude, les chartes clients, les liens de l'origine retirés, l'icône gravée ;
- **pour ConstructLucraft, le code source modifié est publié avec chaque version**, dans les fichiers de la publication, sous forme d'archive, comme la GPL le demande.

Les adresses y sont écrites en texte simple : le launcher n'ouvre aucune page en ligne, et ce choix de sécurité vaut aussi pour cette page.

## Pourquoi renommer

On me demande parfois pourquoi les apps changent de nom si la licence permet de garder l'original. Trois raisons :

1. **Les marques.** Le nom d'un projet n'est pas couvert par sa licence libre. Le garder sur une version modifiée laisserait croire que ses auteurs la publient ou la soutiennent.
2. **Les utilisateurs.** Une version modifiée a ses propres défauts. Les signaler aux auteurs d'origine ne les aiderait pas, et ce serait injuste envers eux.
3. **La cohérence.** Une suite se lit mieux avec des noms construits sur le même modèle.

Renommer n'efface pas l'origine. Elle reste écrite noir sur blanc dans chaque app et sur la page de provenance, parce que la licence l'exige et parce que c'est la moindre des choses envers ceux qui ont fait le gros du travail.
