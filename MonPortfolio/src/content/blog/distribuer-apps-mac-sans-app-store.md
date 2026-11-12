---
title: "Distribuer des apps Mac sans l'App Store : un launcher, des empreintes SHA-256 et un cache de compilation"
date: 2026-11-10
excerpt: "Comment je publie une suite d'apps Mac pour puces Apple et Intel depuis mon propre Mac, sans App Store ni certificat de développeur : une ligne d'installation, un catalogue cumulatif et des mises à jour vérifiées."
tags: ["macOS", "Rust", "Distribution", "Sécurité", "GitHub Releases", "Lucraft"]
draft: false
---

Au début, installer [Lucraft](/lucas-jimenez-boulot/blog/lucraft-suite-apps-creatives-claude/) chez quelqu'un voulait dire cloner le dépôt et tout compiler. Sur un Mac, une suite d'apps en Rust, c'est long et c'est lourd, et ça demande d'installer toute la chaîne de compilation. Personne d'autre que moi ne devait avoir à le faire.

Depuis fin octobre, plus personne ne compile. Voici le système qui le permet.

## Une ligne dans le Terminal

L'installation tient en une commande :

```bash
curl -fsSL https://raw.githubusercontent.com/axsomette/lucraft-releases/main/install.sh | bash
```

Le script vérifie que le Mac a macOS 11 ou plus récent, détecte s'il a une puce Apple ou Intel, lit le catalogue de la dernière publication, télécharge le launcher qui correspond et l'installe dans Applications.

Deux détails m'ont coûté du temps :

- **tout le script est dans une fonction**, appelée à la dernière ligne. Avec `curl | bash`, bash lit le script au fil de l'eau : une commande qui lit l'entrée standard pourrait avaler la suite du script. Une fonction oblige bash à tout lire avant de rien lancer ;
- **un fichier téléchargé par `curl` ne porte pas l'attribut de quarantaine** qu'ajoute un navigateur. Le launcher s'ouvre donc sans l'avertissement « développeur non identifié ».

## Vérifier chaque téléchargement

Ce second point a une contrepartie : sans l'avertissement, macOS ne contrôle plus grand-chose. Les apps sont signées ad hoc, sans certificat de développeur Apple. L'intégrité doit donc venir d'ailleurs.

Elle vient du catalogue. Pour chaque fichier publié, il donne son adresse et son **empreinte SHA-256**. L'installeur calcule l'empreinte du fichier reçu et la compare. Si elles diffèrent, il s'arrête sans rien installer. Le launcher fait la même vérification pour chaque app et pour ses propres mises à jour.

Le catalogue est servi en HTTPS depuis GitHub. Pour remplacer une app, il faudrait donc modifier à la fois le fichier et le catalogue sur la publication, ce qui demande l'accès au dépôt.

## Un launcher qui ne parle qu'à sa source

Le launcher fait toutes ses requêtes au même endroit : soit la publication qu'on lui a indiquée, soit l'adresse locale de la machine. Toute autre adresse est refusée, sans passer par un proxy. Une page piégée ou une adresse glissée dans une réponse ne peut pas l'envoyer télécharger ailleurs.

## Un catalogue cumulatif

Chaque publication est une « release » GitHub. Elle contient les images disque des apps, pour puces Apple et pour Intel, leurs outils en ligne de commande et un fichier `release_info.json`, le catalogue.

Ce catalogue est **cumulatif**. Une publication n'envoie que les fichiers nouveaux. Une app dont la version n'a pas changé garde l'entrée de la publication précédente, liens compris. On peut donc republier une seule app sans renvoyer les vingt autres, et le launcher voit toujours la suite entière.

Les versions suivent les commits : chaque commit qui touche une app donne une version de la forme `0.10.1-dev.20261110134518` : le numéro de correctif suivant, puis la date et l'heure du commit. Le launcher compare ces versions et propose la mise à jour.

## Publier depuis mon Mac

Tout part d'un script, `lucraft-release.sh`, lancé sur mon Mac :

1. il regarde ce qui a changé depuis la dernière publication ;
2. il compile seulement ces apps, pour puces Apple et pour Intel ;
3. il les essaie : pour chaque app, un essai démarre son serveur MCP sans fenêtre, sur le même moteur que l'app, et lui fait exécuter une vraie commande. Compiler ne prouve pas qu'une app démarre ;
4. il écrit le catalogue et publie la release sur GitHub ;
5. il met à jour la page du dépôt et le script d'installation.

Une option `--dry-run` fait tout sauf la mise en ligne. C'est elle que je lance d'abord.

## Le cache de compilation

Compiler une vingtaine d'apps en Rust, deux fois (une par architecture), prend beaucoup de temps et beaucoup de disque. Pour ne pas remplir le Mac, le script vide le dossier de compilation de chaque app après son build. Sans précaution, la publication suivante recompilerait donc toutes les dépendances.

Depuis le 10 novembre, le script passe par **sccache**, un cache de compilation partagé entre les apps et entre les publications. Il garde les dépendances déjà compilées, dans la limite de 60 Go. La publication suivante ne recompile que ce qui a changé.

## Ce que je ferais autrement

Un certificat de développeur Apple, avec la signature et la notarisation qui vont avec, rendrait les apps installables par un simple double-clic depuis un navigateur. Pour un projet perso, j'ai préféré l'installation en une ligne et les empreintes : la sécurité repose sur le catalogue, pas sur la signature.
