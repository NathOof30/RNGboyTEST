# 🎡 WHEELBORN (RNGboy)

> Générateur de personnages aléatoires avec combat PvP, économie circulaire et système d'Élo.  
> **Prototype :** Vite/JS — **Cible :** Laravel 11 + Livewire 3 + Tailwind CSS 4

---

## 📁 Structure du Projet

```
RNGboy/
├── README.md              ← Ce fichier (index de la documentation)
├── index.html             # Point d'entrée du prototype
├── package.json           # Config Vite
├── vite.config.js         # Config bundler
├── prompt.txt             # Spécifications initiales du prototype
├── src/                   # Code source du prototype JS
│   ├── data/              #   Données de gameplay (races, armes, pouvoirs, synergies)
│   ├── utils/             #   PRNG Mulberry32, synthétiseur audio
│   ├── generation/        #   Générateur de personnages
│   ├── combat/            #   Moteur de combat tour par tour
│   ├── collection/        #   Gestion de la collection (localStorage)
│   ├── progression/       #   Énergie, Élo, recyclage, atelier
│   ├── ui/                #   Interface utilisateur (rouleaux, cartes, arène)
│   ├── main.js            #   Point d'entrée et orchestration
│   └── style.css          #   Design system (thème dark néon)
├── dist/                  # Build de production
└── docs/                  # 📚 Toute la documentation (voir ci-dessous)
```

---

## 📚 Index de la Documentation

Toute la documentation du projet est centralisée dans le dossier [`docs/`](docs/).

### 🎮 Game Design & Gameplay

| Document | Description | Quand le lire ? |
|:---|:---|:---|
| [DOCUMENTATION_DU_JEU.md](docs/DOCUMENTATION_DU_JEU.md) | **Document de référence principal** — GDD complet (626 lignes). Contient toutes les règles du jeu : races, armes, pouvoirs, synergies, formules mathématiques, rareté, pity system, combat, Élo, ligues, atelier, charte graphique Tailwind, schéma BDD SQL et système d'assets visuels Paper Doll. | En premier. C'est la bible du projet. |
| [NOUVELLE_BOUCLE_GAMEPLAY.md](docs/NOUVELLE_BOUCLE_GAMEPLAY.md) | **Refonte de la boucle de gameplay V2** — Diagnostic des problèmes de la V1, philosophie "Coffee Break" (sessions 5-10 min), jauge de chance 10/10, recyclage en pièces, formule d'Élo FIDE, arbre d'améliorations de l'Atelier. | Pour comprendre pourquoi et comment la boucle a été repensée. |

### 🏗️ Architecture & Code

| Document | Description | Quand le lire ? |
|:---|:---|:---|
| [ARCHITECTURE_AND_GUIDE.md](docs/ARCHITECTURE_AND_GUIDE.md) | **Guide technique du prototype JS** — Arborescence des fichiers, mécaniques clés (génération, stats, Power, rareté, Élo), tableau de personnalisation rapide, et guide de portage vers Laravel. | Pour modifier le prototype ou comprendre le code existant. |
| [PLAN_PORTAGE_LARAVEL.md](docs/PLAN_PORTAGE_LARAVEL.md) | **Plan de migration JS → Laravel** (1192 lignes). Stack technique, architecture Laravel, schéma BDD complet avec migrations SQL, modèles Eloquent, Enums PHP 8.2, services métier (Generator, Battle, Energy, Elo), composants Livewire, authentification Breeze, sécurité anti-triche, correspondance fichier par fichier, ordre de développement. | Avant de coder la moindre ligne du projet Laravel. |

### 📋 Analyse & Stratégie

| Document | Description | Quand le lire ? |
|:---|:---|:---|
| [ANALYSE_FAISABILITE.md](docs/ANALYSE_FAISABILITE.md) | **Analyse de faisabilité** — Évaluation de chaque module (complexité, temps estimé), fonctionnalités MVP vs post-MVP, comparatif de 5 hébergements gratuits (Railway, Render, Fly.io...), éléments manquants dans la doc, plan d'action immédiat. | Pour prioriser et planifier le travail. |
| [STRATEGIES_TECHNIQUES.md](docs/STRATEGIES_TECHNIQUES.md) | **Stratégies techniques détaillées** — Double mode de combat (Match Rapide + Arène Virtuelle AFK), gestion des bots, guide du cache Laravel, tests unitaires PHPUnit, gestion des erreurs UX / perte de connexion, système d'assets visuels par superposition CSS. | Pour les détails d'implémentation des modules complexes. |

### 🚀 Démarrage

| Document | Description | Quand le lire ? |
|:---|:---|:---|
| [TUTO_DEMARRAGE_LARAVEL.md](docs/TUTO_DEMARRAGE_LARAVEL.md) | **Tutoriel pas-à-pas** — Organisation du workspace, prérequis (PHP, Composer, Node), installation Laravel + Breeze + Tailwind, toutes les migrations prêtes à copier-coller, modèles, enums, data files, layout dark, premier composant Livewire, checklist de progression, mémo des commandes. | Au moment de créer le projet Laravel. |

---

## 🗺️ Ordre de Lecture Recommandé

```
1. DOCUMENTATION_DU_JEU.md        → Comprendre le jeu
2. NOUVELLE_BOUCLE_GAMEPLAY.md    → Comprendre la refonte V2
3. ANALYSE_FAISABILITE.md         → Évaluer le scope et prioriser
4. PLAN_PORTAGE_LARAVEL.md        → Plan technique complet
5. STRATEGIES_TECHNIQUES.md       → Détails des modules complexes
6. TUTO_DEMARRAGE_LARAVEL.md      → Lancer le développement
```

---

## 🛠️ Lancer le Prototype

```bash
npm install
npm run dev
# Ouvrir http://localhost:5173
```
