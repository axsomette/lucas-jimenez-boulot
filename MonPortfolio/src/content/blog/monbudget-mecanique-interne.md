---
title: "MonBudget : la mécanique interne d'un gestionnaire de budget local"
date: 2026-08-24
excerpt: "Près de 5 000 lignes de JavaScript qui tournent dans le navigateur : montants en centimes entiers, score de santé financière pondéré sur 100, détection des dépenses récurrentes et simulateur qui n'attaque que les dépenses réductibles."
tags: ["JavaScript", "PWA", "Architecture", "Finance", "localStorage", "Algorithmes"]
draft: false
---

MonBudget suit des dépenses personnelles. Formulé comme ça, le projet tient en une table et deux graphiques. Le fichier `app.js` en fait aujourd'hui 4 923 lignes, et l'essentiel de ce volume répond à des questions que je n'avais pas vues venir en commençant : où mettre la frontière entre une dépense subie et une dépense arbitrable, comment noter une situation financière sans inventer une science, et quoi faire quand l'utilisateur saisit la même dépense tous les mois.

Cet article détaille quatre mécanismes du code plutôt que la liste des fonctionnalités.

## L'argent ne se stocke pas en nombre flottant

C'est la décision qui a le plus de conséquences en aval, et elle se prend à la première ligne du modèle de données.

`0.1 + 0.2` vaut `0.30000000000000004` en JavaScript, comme dans tout langage qui suit la norme IEEE 754. Sur une addition isolée, l'écart reste invisible. Sur un budget qui additionne trois cents lignes, le compare à une limite et affiche un reste à vivre, il finit par produire un total à un centime du compte, puis un dépassement de budget signalé à tort.

MonBudget stocke donc chaque montant en **centimes entiers**. La conversion se fait une seule fois, à la saisie :

```javascript
const targetCents = Math.round(parseFloat(targetStr) * 100);
```

Tout le reste du code raisonne sur des entiers, et l'euro ne réapparaît qu'au moment de l'affichage :

```javascript
const sumCents = (arr, type) =>
  arr.filter(e => e.type === type).reduce((s, e) => s + e.amountCents, 0);

const currRev   = sumCents(currData, 'income');
const currExp   = sumCents(currData, 'expense');
const currReste = currRev - currExp;
```

Le champ s'appelle `amountCents` partout dans le modèle, y compris sur les objectifs d'épargne (`savedCents`, `targetCents`) et les plans (`monthlyCents`). Ce suffixe est le seul garde-fou contre la tentation de diviser par 100 trop tôt. Une variable nommée `amount` aurait fini par contenir des euros dans la moitié du fichier.

## Six clés dans localStorage

L'application ne parle à aucun serveur. Toute la persistance passe par six clés :

| Clé | Contenu |
|---|---|
| `budgetData` | Les lignes de revenus et de dépenses |
| `budgetCategories` | Catégories, sous-catégories, limites globales et mensuelles |
| `budgetGoals` | Objectifs d'épargne et contributions |
| `budgetPlans` | Plans de financement |
| `dismissedRecurring` | Mois pour lesquels l'utilisateur a fermé le panneau de suggestions |
| `prefCalendarView` | Préférence d'affichage |

J'ai retenu `localStorage` plutôt qu'IndexedDB parce que le volume le permet : un budget personnel sur cinq ans tient dans quelques centaines de kilo-octets, loin des 5 Mo que les navigateurs accordent. L'API synchrone évite en prime de propager de l'`async` dans toute la couche de rendu, ce qui aurait coûté plus cher que le gain de capacité.

Ce choix a un prix, et il est réel : vider les données du navigateur efface le budget. L'export CSV n'est pas une commodité dans cette architecture, c'est la seule sauvegarde qui existe.

## Un score de santé financière pondéré sur 100

Noter une situation financière sur 100 points expose à deux dérives : produire un chiffre arbitraire que personne ne peut interpréter, ou refuser de trancher et n'afficher que des données brutes. `computeHealthScore()` répartit les points sur quatre critères et retourne le détail de chacun, pour que l'utilisateur voie d'où vient sa note.

**Le taux d'épargne pèse 35 points.** Au-delà de 20 %, la totalité. Entre 10 et 20 %, 25 points. Entre 0 et 10 %, 12 points. En dessous de zéro, rien.

**Le respect des budgets en vaut 30**, au prorata des catégories tenues :

```javascript
const ratio = respected / catsWithLimit.length;
const pts   = Math.round(ratio * 30);
```

**Le ratio de charges fixes en vaut 20.** Sous 30 % des dépenses, la totalité. Le barème tombe à 14 points sous 50 %, à 7 sous 70 %, et à 2 au-delà. Un budget dont les trois quarts partent en loyer et abonnements laisse peu de marge de manœuvre, et le score doit le dire.

**Les objectifs d'épargne actifs valent les 15 derniers points.**

La subtilité du calcul tient en trois lignes :

```javascript
const savingsContribCents = filteredData
  .filter(e => e.type === 'expense' && e.goalId)
  .reduce((s, e) => s + e.amountCents, 0);
const adjustedExpenses = totalDepensesCents - savingsContribCents;
```

Une contribution à un objectif d'épargne est enregistrée comme une dépense, puisqu'elle sort du compte courant. Sans ce retraitement, un utilisateur qui met 300 € de côté verrait son taux d'épargne baisser de 300 €. L'application déduit donc ces lignes des dépenses courantes avant de calculer le taux, et l'épargne compte pour ce qu'elle est.

Chaque critère prévoit un cas neutre quand la donnée manque : pas de revenu enregistré rapporte 10 points sur 35, aucun budget fixé en rapporte 15 sur 30. Un utilisateur qui vient d'installer l'application obtient une note médiocre plutôt qu'un zéro décourageant.

## Détecter les dépenses qui reviennent

Saisir son loyer, son forfait mobile et ses abonnements tous les mois use la patience avant le deuxième mois. `detectRecurringExpenses()` propose de les importer, en s'appuyant sur une clé de regroupement.

```javascript
const key = normalizeDesc(e.desc) + '|||' + (e.largeCat || '');
```

`normalizeDesc()` passe la description en minuscules, retire les espaces de bord et écrase les espaces multiples. « Loyer  Appartement » et « loyer appartement » produisent alors la même clé. Le séparateur `|||` évite les collisions qu'un simple tiret provoquerait sur une description qui en contient un.

L'algorithme travaille ensuite en trois passes. Il collecte les dépenses marquées fixes en dehors du mois cible, les déduplique par clé en gardant la plus récente, puis retranche celles que l'utilisateur a déjà saisies :

```javascript
const byKey = {};
otherFixed.forEach(e => {
  const key = normalizeDesc(e.desc) + '|||' + (e.largeCat || '');
  if (!byKey[key] || e.date > byKey[key].date) byKey[key] = e;
});

const alreadyIn = new Set(
  targetExpenses.map(e => normalizeDesc(e.desc) + '|||' + (e.largeCat || ''))
);
```

Garder la version la plus récente compte plus qu'il n'y paraît : un loyer augmente, un abonnement change de tarif. La suggestion propose le dernier montant connu, pas celui d'il y a deux ans. La comparaison `e.date > byKey[key].date` fonctionne sur des chaînes parce que les dates sont stockées au format `AAAA-MM-JJ`, où l'ordre lexicographique et l'ordre chronologique coïncident.

Le tri final passe par `localeCompare(a.desc, b.desc, 'fr')` plutôt que par une comparaison brute, pour que les accents se rangent où un lecteur francophone les attend.

## Un simulateur qui refuse de mentir

Le simulateur répond à une question précise : que faudrait-il couper pour tenir un budget donné ? La réponse naïve applique une réduction proportionnelle à toutes les dépenses. Elle est fausse, parce qu'un loyer ne se réduit pas de 12 % au motif que l'utilisateur a décidé de dépenser moins.

L'application sépare donc les deux natures de dépenses et n'applique l'effort qu'aux dépenses réductibles :

```javascript
const fixedExpenses    = baselineExpenses.filter(e => e.isFixed);
// Exclure les contributions épargne (goalId) : non réductibles par le simulateur
const variableExpenses = baselineExpenses.filter(e => !e.isFixed && !e.goalId);

const variableTarget = targetCents - fixedTotal;
const diffCents      = variableTotal - variableTarget;
```

Les contributions aux objectifs d'épargne rejoignent les charges fixes du côté intouchable. Proposer à quelqu'un d'atteindre son budget en cessant d'épargner reviendrait à déguiser un renoncement en optimisation.

Reste le cas que la plupart des simulateurs escamotent. Quand les charges fixes dépassent à elles seules le budget cible, `variableTarget` devient négatif et aucune coupe sur le variable ne rattrape l'écart. L'application affiche alors un échec explicite :

```javascript
if (variableTarget <= 0) {
  // « Objectif impossible » : les charges fixes seules dépassent la cible
}
```

Un simulateur qui rendrait dans ce cas une liste de réductions à 100 % produirait un plan mathématiquement cohérent et inapplicable.

## Ce que l'architecture locale coûte

Le zéro-serveur donne quatre choses : aucune donnée financière ne quitte la machine, l'application se charge depuis le cache, l'hébergement ne coûte rien, et le tout fonctionne dans le métro.

Il en retire trois autres. Aucune synchronisation entre le téléphone et l'ordinateur. Aucune sauvegarde automatique, donc un export CSV à la charge de l'utilisateur. Aucune reprise possible si le navigateur purge son stockage.

Pour un gestionnaire de budget personnel, l'échange me paraît tenir. Les données financières sont ce qu'on confie le moins volontiers à un tiers, et la contrepartie se résume à un fichier CSV téléchargé de temps en temps. Sur une application partagée entre plusieurs personnes, le calcul s'inverserait.

Le code est sur mon GitHub.
