---
title: "PWA offline-first : MonBudget tourne sans serveur"
date: 2025-08-14
excerpt: "Construire une Progressive Web App 100% offline en JavaScript vanilla : architecture, stockage local et synchronisation."
tags: ["PWA", "JavaScript", "Offline-First", "IndexedDB", "Service Worker"]
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
├── index.html
├── manifest.json
├── sw.js              # Service Worker
├── js/
│   ├── app.js         # Logique principale
│   ├── db.js          # Couche IndexedDB
│   ├── charts.js      # Visualisations Chart.js
│   └── sync.js        # Synchronisation (future)
└── icons/
    ├── icon-192.png
    └── icon-512.png
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

## Stockage local : localStorage vs IndexedDB

### localStorage

Synchrone, limité à 5-10 Mo, et réservé aux chaînes de caractères. Il convient pour une préférence utilisateur ou un token de session, et décroche dès que les données deviennent structurées et volumineuses.

```javascript
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');
```

### IndexedDB

Base de données asynchrone, orientée objets, avec support des transactions et des index. Capacité de stockage bien supérieure (typiquement plusieurs centaines de Mo selon le navigateur).

Pour MonBudget, IndexedDB stocke toutes les transactions financières :

```javascript
// db.js : initialisation de la base
const DB_NAME    = 'monbudget-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Store principal : les transactions
      const store = db.createObjectStore('transactions', {
        keyPath:       'id',
        autoIncrement: true,
      });
      store.createIndex('date',     'date',     { unique: false });
      store.createIndex('category', 'category', { unique: false });
    };

    request.onsuccess  = () => resolve(request.result);
    request.onerror    = () => reject(request.error);
  });
}

export async function addTransaction(transaction) {
  const db      = await openDB();
  const tx      = db.transaction('transactions', 'readwrite');
  const store   = tx.objectStore('transactions');
  return store.add({ ...transaction, date: new Date().toISOString() });
}
```

## Synchronisation en arrière-plan

Actuellement, MonBudget est 100% local : aucune donnée ne quitte le device. Mais si on voulait ajouter une sync multi-appareils, on utiliserait la **Background Sync API**.

Le principe : l'app enregistre des "sync events" quand elle est offline. Quand la connexion revient, le Service Worker exécute ces events en arrière-plan, même si l'app n'est pas ouverte.

```javascript
// Enregistrement d'un sync event
async function scheduleSync(data) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-transaction');
  // Stocker data en IndexedDB pour le SW
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
- **Support navigateur** : IndexedDB et les Service Workers sont bien supportés, mais le comportement d'installation PWA varie entre Chrome, Safari et Firefox.
- **Safari (iOS)** : Apple restreint les notifications push et plusieurs APIs, ce qui ferme la porte à une partie des usages.

## Conclusion

L'offline-first inverse l'ordre de conception. Je pars du stockage local et j'ajoute la connectivité là où elle sert, au lieu de partir du serveur et de greffer un mode dégradé à la fin.

Pour MonBudget, le calcul tient : une app de budget n'a pas besoin d'Internet. L'utilisateur saisit une dépense, regarde ses graphiques et referme l'application, sans login ni temps de chargement à subir.

Vous trouverez le code source sur mon GitHub.
