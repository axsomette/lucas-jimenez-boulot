---
title: "PWA offline-first : MonBudget tourne sans serveur"
date: 2025-08-14
excerpt: "Construire une Progressive Web App 100% offline en JavaScript vanilla : architecture, stockage local et synchronisation."
tags: ["PWA", "JavaScript", "Offline-First", "localStorage", "Service Worker"]
draft: false
---

MonBudget gère un budget personnel sans serveur : aucun backend, aucune base distante, et plus aucune connexion requise après l'installation. Je détaille ici l'architecture et ce que l'approche offline-first impose comme ordre de conception.

## Ce qu'apporte une PWA

Une Progressive Web App est une application web qui adopte les comportements d'une app native : elle s'installe sur l'écran d'accueil, fonctionne hors ligne, et peut recevoir des notifications push.

Face à une app de store, vous économisez le binaire à télécharger et le compte développeur à 99 €/an. L'utilisateur visite le site, voit un bouton « Installer », et c'est fait.

Les trois piliers d'une PWA :
- **HTTPS** : obligatoire, même en local via `localhost`
- **Service Worker** : le cerveau offline, tourne en arrière-plan
- **Web App Manifest** : décrit l'app (icône, couleurs, orientation)

## Architecture de MonBudget

MonBudget est construit avec JavaScript vanilla et Chart.js. Aucun framework, aucune dépendance côté serveur.

```
monbudget/
├── index.html         # Page de présentation
├── app.html           # L'application
├── app.js             # Toute la logique (4 923 lignes)
├── style.css
├── sw.js              # Service Worker
├── manifest.json
└── icon-192.png, icon-512.png, icon.svg…
```

J'ai écarté les frameworks pour garder le bundle à zéro et me forcer à connaître les APIs web natives.

## Service Workers expliqués

Un Service Worker est un script JavaScript qui s'exécute dans un thread séparé du navigateur. Il intercepte toutes les requêtes réseau de l'app et peut les mettre en cache, les modifier, ou les servir depuis le cache local.

```javascript
// sw.js : installation et mise en cache des assets statiques
const CACHE_NAME = 'monbudget-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/db.js',
  '/js/charts.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached ?? fetch(event.request);
    })
  );
});
```

La stratégie ici est **Cache First** : le Service Worker sert la ressource depuis le cache, et ne va sur le réseau que s'il ne l'y trouve pas. Pour une app 100% statique comme MonBudget, ça suffit.

## Stockage local : le choix de localStorage

MonBudget range tout dans `localStorage`, sur six clés :

| Clé | Contenu |
|---|---|
| `budgetData` | Les lignes de revenus et de dépenses |
| `budgetCategories` | Catégories, sous-catégories et limites |
| `budgetGoals` | Objectifs d'épargne et contributions |
| `budgetPlans` | Plans de financement |
| `dismissedRecurring` | Mois dont l'utilisateur a fermé les suggestions |
| `prefCalendarView` | Préférence d'affichage |

```javascript
localStorage.setItem('budgetData', JSON.stringify(expenses));
const expenses = JSON.parse(localStorage.getItem('budgetData') || '[]');
```

### Pourquoi j'ai écarté IndexedDB

IndexedDB offre des transactions, des index et une capacité bien supérieure. Deux raisons m'ont fait rester sur `localStorage`.

**Le volume ne le justifie pas.** Un budget personnel tenu sur cinq ans occupe quelques centaines de kilo-octets une fois sérialisé en JSON, loin des 5 Mo que les navigateurs accordent à `localStorage`. La capacité d'IndexedDB répondrait à un problème que l'application n'a pas.

**L'API synchrone garde le rendu simple.** IndexedDB travaille en asynchrone, ce qui aurait fait remonter des `async`/`await` dans toute la couche d'affichage : chaque fonction qui lit une dépense pour la peindre serait devenue asynchrone, et avec elle ses appelantes. `localStorage.getItem()` rend sa valeur dans l'instant, et les fonctions de rendu restent des fonctions ordinaires.

Ce choix a une contrepartie, et elle est sérieuse : `localStorage` se vide avec les données de navigation. L'export CSV n'est pas un confort dans cette architecture, c'est la seule sauvegarde qui existe.

## Synchronisation en arrière-plan

Actuellement, MonBudget est 100% local : aucune donnée ne quitte le device. Mais si on voulait ajouter une sync multi-appareils, on utiliserait la **Background Sync API**.

Le principe : l'app enregistre des "sync events" quand elle est offline. Quand la connexion revient, le Service Worker exécute ces events en arrière-plan, même si l'app n'est pas ouverte.

```javascript
// Enregistrement d'un sync event
async function scheduleSync(data) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-transaction');
  // Persister data pour que le SW la retrouve au réveil
}

// Dans sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transaction') {
    event.waitUntil(syncPendingTransactions());
  }
});
```

## Avantages et limitations

**Les gains :**
- Performances : l'app charge instantanément (tout est en cache)
- Confidentialité : les données ne quittent pas le device de l'utilisateur
- Coût : zéro serveur, zéro infrastructure
- Résilience : fonctionne dans le métro, en avion, n'importe où

**Les limites :**
- **Pas de backup automatique** : si l'utilisateur efface les données du navigateur, tout disparaît. Un export JSON/CSV manuel est indispensable.
- **Pas de multi-appareils natif** : les données ne se synchronisent pas entre le téléphone et le PC sans une couche serveur.
- **Support navigateur** : `localStorage` et les Service Workers sont bien supportés, mais le comportement d'installation PWA varie entre Chrome, Safari et Firefox.
- **Safari (iOS)** : Apple restreint les notifications push et plusieurs APIs, ce qui ferme la porte à une partie des usages.

## Conclusion

L'offline-first inverse l'ordre de conception. Je pars du stockage local et j'ajoute la connectivité là où elle sert, au lieu de partir du serveur et de greffer un mode dégradé à la fin.

Pour MonBudget, le calcul tient : une app de budget n'a pas besoin d'Internet. L'utilisateur saisit une dépense, regarde ses graphiques et referme l'application, sans login ni temps de chargement à subir.

Vous trouverez le code source sur mon GitHub.
