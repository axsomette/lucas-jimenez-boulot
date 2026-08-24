---
title: "JavaScript Vanilla en 2026 : ce que MonBudget m'a appris sur le code sans framework"
date: 2025-12-18
excerpt: "J'ai construit MonBudget en JavaScript vanilla, sans aucune dépendance front. Les patterns modernes qui tiennent, les limites que j'ai rencontrées, et les cas où ce choix se défend."
tags: ["JavaScript", "Vanilla JS", "Architecture", "Performance", "No Framework"]
draft: false
---

Quand j'ai commencé MonBudget, j'aurais pu prendre React, que j'utilise en production chez Kaneva pour les composants interactifs. J'ai préféré partir sur zéro dépendance front-end, en JavaScript natif. Six mois plus tard, le bilan est nuancé.

## Pourquoi ce choix au départ

Trois raisons ont guidé la décision.

**La nature du projet.** MonBudget est une application offline-first : le code doit tourner sans réseau, donc sans CDN React ni chargement de modules à la volée. Tout doit être bundlé localement ou disponible nativement.

**Apprendre les fondamentaux.** Je voulais manipuler les APIs natives du navigateur sans l'abstraction d'un framework. IndexedDB, Service Workers, Pointer Events, Intersection Observer : les appeler à la main oblige à comprendre ce qu'elles font.

**La taille du bundle.** Une PWA qui s'installe sur un téléphone doit rester légère. React et ReactDOM pèsent environ 130 Ko gzippés, un prix élevé pour une app dont la valeur tient dans les données plutôt que dans l'interface.

## Ce que JavaScript moderne rend possible

Le JavaScript natif de 2026 a peu à voir avec celui de 2012. Quatre patterns portent l'essentiel du gain.

### Modules natifs (ES Modules)

Les ES Modules règlent l'organisation du code :

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

Les modules natifs tournent dans le navigateur sans bundler. En production je passe par Rollup pour les optimisations, mais rien ne m'y oblige.

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

C'est du React « à la main » : état minimal, rendu déclaratif et nettoyage. Je perds le Virtual DOM et la réconciliation, et je garde la main sur tout le reste.

### L'API `FormData` + `Object.fromEntries`

Ce couple m'épargne beaucoup de code :

```javascript
const form = document.querySelector('#transaction-form');
const data = Object.fromEntries(new FormData(form));
// { amount: "42.50", label: "Courses", category: "food" }
```

Deux lignes remplacent un `document.querySelector` par champ, et rendent un objet prêt à partir vers IndexedDB ou une API.

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

Vingt lignes suffisent pour un store réactif de base, là où j'aurais sorti Zustand ou Redux sur un projet plus large. Pour MonBudget, ça couvre le besoin.

## Les limites du vanilla

À plusieurs moments, j'ai regretté de ne pas avoir React.

**La gestion des formulaires complexes.** Validation, état des champs, messages d'erreur conditionnels : avec React et react-hook-form, c'est 20 lignes. En vanilla, j'ai passé 2h à écrire quelque chose de correct et accessible. Le résultat est bon, mais le coût était élevé.

**Le routage.** MonBudget est une SPA avec 3 vues (Dashboard, Transactions, Paramètres). Le routage vanilla via l'API History fonctionne, mais il fallait tout gérer : transitions, gestion du bouton retour, état entre les vues. React Router fait ça natif.

**La maintenabilité sur la durée.** Mes patterns maison de « composants » fonctionnent, mais ils n'existent que chez moi. Un développeur qui rejoint le projet doit apprendre ma convention locale au lieu d'ouvrir une documentation.

**Les animations complexes.** Sur des transitions de vues ou des animations d'entrée travaillées, GSAP et Motion One battent le duo CSS + vanilla JS. J'ai fini par ajouter Motion One, 3 Ko gzippés, au prix du purisme affiché au départ.

## Quand choisir vanilla JS en 2026

Le vanilla se défend rarement sur une application entière, souvent sur une bibliothèque ou un composant isolé.

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
- Application appelée à grossir

## Ce que j'emporte

Construire MonBudget en vanilla m'a obligé à regarder ce que React masque :

- La mécanique de la réconciliation du DOM
- Le coût réel d'une mise à jour du DOM
- La façon dont IndexedDB gère les transactions et la concurrence
- La raison d'être du Virtual DOM, et ce qu'on perd sans lui

J'en suis ressorti meilleur développeur React, parce que je sais maintenant à quel moment l'abstraction cesse de suffire.

MonBudget restera en vanilla, et je referais le même choix sur un projet de cette nature. Pour le reste, React reste mon outil de travail quotidien.
