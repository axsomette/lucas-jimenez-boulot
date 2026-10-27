# Lucas Jimenez Boulot — guide du logo

## 1. Le logo

**L'idée** : le L et le J se font face pour former un socle, avec un angle droit côté back et une courbe côté front. Le curseur au milieu, c'est le travail en cours.

**Les versions**

| Version | Fichier (fond sombre) | Fichier (fond clair) |
|---|---|---|
| Symbole | `ljb-symbol.svg` | `ljb-symbol-light.svg` |
| Symbole, petites tailles (< 32 px) | `ljb-symbol-small.svg` | `ljb-symbol-small-light.svg` |
| Horizontal (version principale) | `ljb-horizontal.svg` | `ljb-horizontal-light.svg` |
| Empilé | `ljb-stacked.svg` | `ljb-stacked-light.svg` |
| Nom seul | `ljb-wordmark.svg` | `ljb-wordmark-light.svg` |
| Une couleur | `*-white.svg` | `*-black.svg` |

Les PNG prêts à l'emploi sont dans `png/`. Les icônes web (favicon, icône d'app, manifeste, carte de partage) sont dans `public/`. Le nom est vectorisé en Archivo : ne jamais le retaper au clavier.

## 2. Construction

- Grille de 256 unités. La marque occupe 176 × 168, centrée optiquement : 42 unités en haut, 46 en bas.
- Un seul trait de 28 unités pour le L, le J et le curseur.
- Un seul arrondi, côté J : rayons 56 et 28, centrés sur le même point.
- Curseur 28 × 60, flottant à mi-hauteur.
- La version petite taille passe sur une grille de 16 avec un trait de 2 px, pour que le curseur reste détaché à 16 px.

## 3. Zone de protection

Autour du logo, laisser vide une marge au moins égale à **la hauteur du curseur** (60 unités, soit environ un tiers de la hauteur du symbole). La marge grandit avec le logo.

## 4. Tailles minimales

| Version | Écran | Impression |
|---|---|---|
| Symbole | 32 px, puis version petite taille jusqu'à 16 px | 8 mm |
| Horizontal | 140 px de large | 35 mm de large |
| Empilé | 96 px de large | 25 mm de large |

## 5. Couleurs

| Nom | HEX | RVB | CMJN (approximation) | Rôle |
|---|---|---|---|---|
| Encre | #0B1020 | 11 16 32 | 66 50 0 87 | Fond |
| Os | #ECE8DF | 236 232 223 | 0 2 6 7 | Texte, L et J sur fond sombre |
| Brume | #A9B0C3 | 169 176 195 | 13 10 0 24 | Texte secondaire |
| Signal | #F5B83D | 245 184 61 | 0 25 75 4 | Curseur, action principale |
| Signal sur clair | #B47506 | 180 117 6 | 0 35 97 29 | Curseur sur fond clair |

Les valeurs CMJN sont une conversion mathématique : à valider sur épreuve avant toute impression. Aucune référence Pantone n'a été choisie ; si un imprimeur en demande une, la faire choisir sur nuancier à partir de la version écran.

**Couples autorisés** : Os + Signal sur Encre · Encre + Signal sur clair sur Os · Encre seule sur Signal · blanc sur photo sombre et calme · noir sur fond blanc.

Contrastes mesurés : Os sur Encre 15,5:1 · Brume sur Encre 8,7:1 · Signal sur Encre 10,6:1 · Signal sur clair sur Os 3,1:1 (suffisant pour un élément graphique, pas pour du texte).

## 6. Typographie

- Titres et logotype : **Archivo**, graisses 750 à 850, chasse 108 à 118 %.
- Texte courant : **Instrument Sans**, 400 à 650.
- Dates, étiquettes, données : **JetBrains Mono**, 400 à 600.

Les trois familles sont sous licence SIL Open Font License : usage libre, y compris pour un logo.

## 7. Animation

- **Chargement** (accueil, une fois par session, 1,6 s) : le L se dessine depuis sa base, le J suit, le curseur clignote deux fois, la marque se retire et un rideau se lève sur la page.
- **Survol du logo** : le curseur clignote trois fois.
- **Attente** (envoi du formulaire) : le curseur clignote à la fin du libellé du bouton.
- Si la personne a demandé à réduire les animations, rien ne bouge : pas de chargement, logo statique.

## 8. À ne pas faire

Ne pas étirer ni écraser · ne pas recolorer hors de la palette · ne pas séparer le curseur du socle ni le déplacer · ne pas faire pivoter · ne pas ajouter d'ombre, de contour, de dégradé ou d'effet · ne pas réorganiser ni redimensionner les éléments d'un assemblage · ne pas poser le logo sur un fond chargé sans tuile · ne pas utiliser la version maître sous 32 px.

## 9. Fichiers et contact

- Masters : `MonPortfolio/brand/`, générés depuis une seule géométrie.
- Questions : Lucas Jimenez Boulot.
- Pas de dépôt de marque vérifié : faire une recherche d'antériorité (INPI, EUIPO, recherche d'image inversée) avant tout usage commercial du logo.
