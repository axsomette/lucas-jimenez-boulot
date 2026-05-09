---
title: "PWA Offline-First : Comment MonBudget fonctionne sans serveur"
date: 2026-05-19
excerpt: "Construire une Progressive Web App 100% offline avec JavaScript vanilla. Architecture, stockage local, et sync intelligente."
tags: ["PWA", "JavaScript", "Offline-First", "IndexedDB", "Service Worker"]
draft: false
---

MonBudget est une application de gestion de budget personnel qui fonctionne entièrement sans serveur. Zéro backend, zéro base de données distante, zéro connexion requise après l'installation. Voici comment c'est construit et pourquoi cette approche offline-first change la façon de penser le développement web.

## Qu'est-ce qu'une PWA, concrètement

Une Progressive Web App est une application web qui adopte les comportements d'une app native : elle s'installe sur l'écran d'accueil, fonctionne hors ligne, et peut recevoir des notifications push.

La différence avec une app classique : pas de store, pas de binaire à télécharger, pas de compte développeur à 99€/an. L'utilisateur visite le site, voit un bouton "Installer", et c'est fait.

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

L'absence de framework n'est pas un manque : c'est un choix délibéré pour garder le bundle à zéro et forcer une compréhension profonde des APIs web natives.

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

La stratégie ici est **Cache First** : si la ressource est en cache, on la sert directement. Si elle ne l'est pas, on fetch le réseau. Pour une app 100% statique comme MonBudget, c'est optimal.

## Stockage local : localStorage vs IndexedDB

### localStorage

Simple, synchrone, limité à 5-10 Mo, et uniquement pour des chaînes de caractères. Parfait pour des préférences utilisateur ou un token de session. Pas adapté pour des données structurées volumineuses.

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
async function schedulSync(data) {
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

**Ce qui marche vraiment bien :**
- Performances : l'app charge instantanément (tout est en cache)
- Confidentialité : données uniquement sur le device de l'utilisateur
- Coût : zéro serveur, zéro infrastructure
- Résilience : fonctionne dans le métro, en avion, n'importe où

**Les vraies limitations :**
- **Pas de backup automatique** : si l'utilisateur efface les données du navigateur, tout disparaît. Un export JSON/CSV manuel est indispensable.
- **Pas de multi-appareils natif** : les données ne se synchronisent pas entre le téléphone et le PC sans une couche serveur.
- **Support navigateur** : IndexedDB et les Service Workers sont bien supportés, mais le comportement d'installation PWA varie entre Chrome, Safari et Firefox.
- **Safari (iOS)** : les limitations d'Apple sur les PWA sont réelles. Push notifications et certaines APIs restent restreintes.

## Conclusion

L'offline-first change la façon de concevoir une app. Au lieu de partir du serveur et d'ajouter un mode offline comme afterthought, on part du local et on ajoute la connectivité quand elle apporte de la valeur.

Pour MonBudget, c'est le bon choix : une app de budget n'a pas besoin d'Internet. L'utilisateur veut saisir une dépense rapidement, voir ses graphiques, et partir. Pas de login, pas de latence, pas de problème.

Le code source est disponible sur mon GitHub si vous voulez creuser l'implémentation.
