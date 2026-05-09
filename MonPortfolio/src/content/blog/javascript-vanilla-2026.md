---
title: "JavaScript Vanilla en 2026 : ce que MonBudget m'a appris sur le code sans framework"
date: 2026-06-30
excerpt: "J'ai construit MonBudget en JavaScript vanilla, sans React, sans Vue, sans rien. Voici ce que j'ai appris sur les patterns modernes, les vraies limites du sans-framework, et quand c'est le bon choix."
tags: ["JavaScript", "Vanilla JS", "Architecture", "Performance", "No Framework"]
draft: false
---

Quand j'ai commencé MonBudget, j'aurais pu prendre React. Je connais React. C'est ce que j'utilise en production chez Kaneva pour les composants interactifs. Mais pour une PWA de gestion de budget personnel, j'ai fait le choix de zéro dépendance front-end. Vanilla JavaScript, rien d'autre.

Six mois plus tard, voici ce que j'en pense.

## Pourquoi ce choix au départ

Trois raisons ont guidé la décision :

**La nature du projet.** MonBudget est une application offline-first. Le code doit tourner sans réseau. Pas de CDN React, pas de fetch de modules. Tout doit être bundlé localement ou disponible nativement. JavaScript natif = zéro dépendance externe.

**Apprendre les fondamentaux.** Je voulais confronter directement les APIs natives du navigateur sans l'abstraction d'un framework. IndexedDB, Service Workers, l'API Pointer Events, Intersection Observer : les utiliser directement force une compréhension profonde.

**La taille du bundle.** Une PWA qui s'installe sur un téléphone doit être légère. React + ReactDOM = ~130 Ko gzippés. Pour une app dont la valeur est dans les données, pas dans l'UI, c'est un coût élevé.

## Ce que JavaScript moderne rend possible

JavaScript vanilla en 2026, ce n'est plus JavaScript vanilla de 2012. Voici les patterns qui changent tout.

### Modules natifs (ES Modules)

Fini le problème d'organisation du code :

```javascript
// js/db.js
export class Database {
  constructor(name, version) {
    this.name    = name;
    this.version = version;
    this.db      = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.name, this.version);
      req.onsuccess  = () => { this.db = req.result; resolve(this); };
      req.onerror    = () => reject(req.error);
      req.onupgradeneeded = (e) => this.onUpgrade(e);
    });
  }

  // ...
}

// js/app.js
import { Database }    from './db.js';
import { renderChart } from './charts.js';
import { syncQueue }   from './sync.js';
```

Les modules natifs fonctionnent directement dans le navigateur, sans bundler. Pour la prod, je passe par un petit bundler (Rollup) pour les optimisations, mais ce n'est pas obligatoire.

### Classes et encapsulation

```javascript
// Pattern "composant maison" sans framework
class TransactionForm {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit  = onSubmit;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <form class="form" id="transaction-form">
        <input type="number" name="amount"  placeholder="Montant" required />
        <input type="text"   name="label"   placeholder="Libellé" required />
        <select name="category">
          <option value="food">Alimentation</option>
          <option value="transport">Transport</option>
          <option value="other">Autre</option>
        </select>
        <button type="submit">Ajouter</button>
      </form>
    `;
    this.form = this.container.querySelector('#transaction-form');
  }

  bindEvents() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this.form));
      await this.onSubmit(data);
      this.form.reset();
    });
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
```

C'est du React "à la main" : état minimal, rendu déclaratif, cleanup. Mais sans Virtual DOM, sans réconciliation, sans les abstractions qu'on ne contrôle pas.

### L'API `FormData` + `Object.fromEntries`

Ce combo est sous-estimé :

```javascript
const form = document.querySelector('#transaction-form');
const data = Object.fromEntries(new FormData(form));
// { amount: "42.50", label: "Courses", category: "food" }
```

Plus de `document.querySelector` pour chaque champ. En deux lignes, on récupère un objet propre à envoyer à IndexedDB ou une API.

### `Proxy` pour la réactivité

Pas besoin de React state pour un état réactif simple :

```javascript
function createStore(initialState, onChange) {
  return new Proxy(initialState, {
    set(target, key, value) {
      target[key] = value;
      onChange(key, value, target);
      return true;
    }
  });
}

const store = createStore(
  { balance: 0, transactions: [] },
  (key, value) => {
    // Re-render uniquement les composants qui dépendent de cette clé
    if (key === 'balance') renderBalance(value);
    if (key === 'transactions') renderTransactionList(value);
  }
);

store.balance = 150; // Déclenche renderBalance automatiquement
```

C'est 20 lignes pour un store réactif basique. Pas Zustand, pas Redux. Pour MonBudget, c'est amplement suffisant.

## Les vraies limites du vanilla

Je serai honnête : il y a des moments où j'ai regretté de ne pas avoir React.

**La gestion des formulaires complexes.** Validation, état des champs, messages d'erreur conditionnels : avec React et react-hook-form, c'est 20 lignes. En vanilla, j'ai passé 2h à écrire quelque chose de correct et accessible. Le résultat est bon, mais le coût était élevé.

**Le routage.** MonBudget est une SPA avec 3 vues (Dashboard, Transactions, Paramètres). Le routage vanilla via l'API History fonctionne, mais il fallait tout gérer : transitions, gestion du bouton retour, état entre les vues. React Router fait ça natif.

**La maintenabilité sur la durée.** Les patterns maison de "composants" fonctionnent, mais ils ne sont pas standardisés. Un développeur qui rejoint le projet doit apprendre la convention locale, pas une API documentée.

**Les animations complexes.** Pour des transitions de vues ou des animations d'entrée sophistiquées, GSAP ou Motion One valent mieux que du CSS + vanilla JS. J'ai finalement ajouté Motion One (3 Ko gzippé), ce qui casse un peu le purisme mais améliore l'expérience.

## Quand choisir vanilla JS en 2026

La réponse courte : rarement pour une app, souvent pour une lib ou un composant isolé.

**Bon choix :**
- PWA offline-first avec contraintes de bundle
- Widget embarquable dans d'autres pages (pas de dépendances à injecter)
- Prototype rapide pour valider un concept
- Script utilitaire ou animation spécifique
- Apprentissage des APIs natives

**Mauvais choix :**
- Application avec des douzaines de vues et d'états
- Équipe de plusieurs développeurs (la standardisation de React est précieuse)
- Formulaires complexes avec validation
- Application qui va grossir significativement

## Ce que j'emporte

Construire MonBudget en vanilla m'a forcé à comprendre des choses que React cache :

- Comment fonctionne vraiment la réconciliation du DOM
- Ce que coûte réellement une mise à jour du DOM
- Comment IndexedDB gère les transactions et la concurrence
- Pourquoi le Virtual DOM existe (et ce qu'on perd sans lui)

Ces connaissances me rendent meilleur développeur React. Comprendre ce qui est sous l'abstraction, c'est savoir quand l'abstraction ne suffit plus.

MonBudget restera en vanilla. Pour de nouveaux projets de cette nature, je ferais le même choix. Pour le reste, React reste mon outil de travail quotidien : et je l'apprécie mieux depuis que je sais ce qu'il fait à ma place.
