# 🎡 WHEELBORN — Guide Technique & Architecture du Prototype

Ce document détaille le fonctionnement complet du prototype jouable **WHEELBORN**, ses formules mathématiques, ses structures de données et les instructions pour étendre le jeu ou le porter vers **Laravel + Livewire**.

---

## 1. Vue d'ensemble de l'Architecture

Le code est rigoureusement découplé conformément aux spécifications du projet. La logique métier (génération, combat, calculs de score) ne dépend d'aucun framework et peut être transposée 1:1 en classes PHP ou Livewire.

```text
/
├── index.html                   # Structure sémantique de l'application
├── package.json                 # Configuration Vite / Scripts
├── prompt.txt                   # Spécifications initiales du prototype
└── src/
    ├── data/                    # Données et équilibrage pur
    │   ├── config.js            # Probabilités, seuils de rareté, XP, récompenses
    │   ├── races.js             # Définition des races et passifs
    │   ├── weapons.js           # Définition des armes et bonus tactiques
    │   ├── powers.js            # Définition des pouvoirs élémentaires et DoT
    │   ├── synergies.js         # Définition des 16 synergies & combinaisons instables
    │   └── names.js             # Générateur procédural de noms
    ├── utils/
    │   ├── random.js            # PRNG déterministe (Mulberry32), tirages pondérés
    │   └── sound.js             # Synthétiseur audio Web Audio API (zéro asset externe)
    ├── generation/
    │   ├── characterGenerator.js# Générateur de personnages, stats, rareté, power
    │   └── massSimulator.js     # Outil de simulation de masse (1 000 tirages)
    ├── combat/
    │   ├── battleEngine.js      # Moteur de combat tour par tour reproductible (Seed)
    │   └── opponentsPool.js     # Pool d'adversaires pour match rapide et défis
    ├── collection/
    │   └── collectionManager.js # Stockage, tri, filtres et persistance localStorage
    ├── progression/
    │   └── progressionManager.js# Points, niveaux, XP, daily, succès et classement
    ├── ui/
    │   ├── wheelUI.js           # Animation des rouleaux et écran de révélation
    │   ├── characterCardUI.js   # Rendu des cartes de personnages (badges, jauges)
    │   ├── collectionUI.js      # Grille de collection et modal détaillé
    │   ├── battleUI.js          # Arène de combat, jauges de PV dynamiques et logs
    │   ├── devUI.js             # Panneau de test Dev Mode et simulateur 1000
    │   ├── extrasUI.js          # Vues Daily, Classement et Profil/Succès
    │   └── notifications.js     # Système de notifications Toast
    ├── style.css                # Design system moderne et responsive
    └── main.js                  # Point d'entrée et orchestration générale
```

---

## 2. Explications des Mécaniques Clés

### 2.1. Comment fonctionne la génération ?
1. **Sélection des 3 composantes** : Lors du lancement, un tirage pondéré (`weightedChoice`) détermine la **Race**, l'**Arme** et le **Pouvoir** selon leurs poids respectifs définis dans `races.js`, `weapons.js` et `powers.js`.
2. **Détection des synergies** : `calculateSynergies()` analyse le trio `{ raceId, weaponId, powerId }` et active les synergies et combinaisons instables éligibles.
3. **Tirage des statistiques de base** : Les valeurs initiales sont tirées dans une fourchette équilibrée (ex: 55-75 PV, 45-70 Force, etc.).
4. **Application des modificateurs** : Les bonus de race (avec variance aléatoire supplémentaire pour le **Mutant**), d'arme et de synergies s'additionnent.
5. **Calcul du POWER et de la Rareté** : Un score global pondéré est calculé, puis la rareté est attribuée.
6. **Attribution d'un nom** : `generateCharacterName()` combine des préfixes/suffixes phonétiques (ou désignation robotique type `X-17`).

### 2.2. Comment fonctionne le calcul des statistiques ?
Dans `src/generation/characterGenerator.js` :
$$\text{Stat Finale} = \text{Base} + \text{Mod Race} + \text{Mod Arme} + \text{Bonus Synergies} + \text{Variance Mutant}$$
Les statistiques sont bornées pour éviter les déséquilibres extrêmes (PV : 30 à 130, Force/Vitesse/Défense : 10 à 100).

### 2.3. Comment fonctionne le calcul du POWER (Score Global) ?
Dans `src/data/config.js` et `calculatePower()` :
$$\text{Power} = (\text{HP} \times 0.24) + (\text{Force} \times 0.32) + (\text{Défense} \times 0.24) + (\text{Vitesse} \times 0.20) + (\text{Synergies} \times 3) + (\text{Bonus Instable})$$
Le score oscille typiquement entre 40 et 95.

### 2.4. Comment fonctionne la rareté ?
Dans `src/data/config.js` :
* **Génération Standard** : Commun (60%), Rare (28%), Épique (10%), Légendaire (2%).
* **Génération Quotidienne (Daily)** : Commun (25%), Rare (45%), Épique (22%), Légendaire (8%).
* **Évaluation de qualité** : Un personnage doté d'un Power $\ge 84$ et de 2 synergies ou plus a une chance supplémentaire d'être promu Rare, Épique ou Légendaire.

### 2.5. Comment fonctionnent les synergies ?
Définies dans `src/data/synergies.js`. Chaque synergie possède une fonction `condition(char)` et des `effects`.
Exemples :
* **Démon + Feu** (*Affinité Démoniaque*) : +18% Dégâts globaux et DoT de Brûlure amplifié de +50%.
* **Robot + Foudre** (*Supraconducteur*) : +15 Défense, immunité aux débuffs électriques et absorption de la foudre pour se soigner.
* **Vampire + Régénération** (*Sangsue Immortelle*) : Draine 25% des dégâts infligés et soigne +12 PV/tour.
* **Golem + Téléportation** (*Masse Déplacée - Instable*) : 20% d'esquive avec téléportation d'un colosse de 10 tonnes qui retombe en infligeant 30 dégâts bonus !

### 2.6. Comment fonctionne le combat (Non purement RNG) ?
Dans `src/combat/battleEngine.js` :
1. **Initiative** : Comparaison de la Vitesse dynamique des deux combattants à chaque tour. Le plus rapide frappe en premier.
2. **Début de tour** : Résolution des DoTs (Brûlure, Poison croissant) et HoTs (Régénération de PV).
3. **Esquive** : Vérification des passifs d'esquive (Téléportation 28%, Alien 8%, Invisibilité 100% au 1er tour), sauf si l'adversaire dispose d'une allonge traversante (ex: Lance).
4. **Calcul des dégâts** :
   $$\text{Dégâts} = \max(5, (0.75 \times \text{Force}_{\text{attaquant}} - 0.38 \times \text{Défense}_{\text{défenseur}} + \text{Aléatoire}(-3, +3)) \times \text{Multiplicateurs})$$
5. **Coups critiques** : Calculés selon l'arme (Pistolet), le pouvoir (Foudre) ou les synergies.
6. **Effets secondaires** : Étourdissement du Marteau, Ralentissement du Gel ou de la Gravité, Vol de vie du Vampire, Contre-attaque spatiale de l'Alien.
7. **Reproductibilité** : Tout le combat accepte une `seed` optionnelle qui garantit un déroulement strictement identique pour le débogage.

### 2.7. Comment fonctionne la progression ?
Dans `src/progression/progressionManager.js` :
* **Points** : +100 pour une victoire (+ bonus d'outsider si l'adversaire avait un Power supérieur), +25 pour une défaite, +200 bonus Daily.
* **Niveaux et XP** : Gagne de l'XP à chaque génération (+10 XP), combat (+60/+20 XP), découverte d'une nouvelle synergie (+80 XP) ou légendaire (+150 XP).
* **Succès** : 8 objectifs suivis en direct (Première victoire, 10 combattants, Tueur de colosse, etc.).
* **Classement dynamique** : Affiche les 10 meilleurs rivaux où le joueur est classé selon ses points réels.

---

## 3. Guide de Personnalisation Rapide

| Ce que vous souhaitez modifier | Fichier concerné | Lignes / Variables clés |
| :--- | :--- | :--- |
| **Probabilités des raretés** | `src/data/config.js` | `RARITY_WEIGHTS` et `DAILY_RARITY_WEIGHTS` |
| **Pondération du Score (Power)** | `src/data/config.js` | `POWER_WEIGHTS` |
| **Valeurs de base des stats** | `src/data/config.js` | `BASE_STATS` |
| **Points et XP gagnés** | `src/data/config.js` | `REWARDS` |
| **Ajouter une nouvelle Race** | `src/data/races.js` | Ajouter un objet dans le tableau `RACES` |
| **Ajouter une nouvelle Arme** | `src/data/weapons.js` | Ajouter un objet dans le tableau `WEAPONS` |
| **Ajouter un nouveau Pouvoir** | `src/data/powers.js` | Ajouter un objet dans le tableau `POWERS` |
| **Ajouter de nouvelles Synergies** | `src/data/synergies.js` | Ajouter un objet dans le tableau `SYNERGIES` |
| **Modifier les règles de combat** | `src/combat/battleEngine.js` | Fonctions `simulateBattle()` et `executeFighterTurn()` |

---

## 4. Guide de Portage vers Laravel + Livewire

La transition vers **Laravel 11+ et Livewire 3** est directe grâce à l'architecture modulaire :

1. **Modèles Eloquent & Migrations** :
   * `Character` (`id`, `user_id`, `name`, `race`, `weapon`, `power`, `hp`, `strength`, `speed`, `defense`, `power_score`, `rarity`, `synergies` (JSON), `wins`, `losses`).
   * `User` (`points`, `xp`, `level`, `last_daily_at`).
2. **Services PHP purs** :
   * `App\Services\CharacterGenerator` : convertit `characterGenerator.js` en méthodes statiques ou injectables.
   * `App\Services\BattleEngine` : convertit `battleEngine.js`. La seed peut être enregistrée en base pour rejouer les duels !
3. **Composants Livewire 3** :
   * `Livewire\CharacterGenerator` : gère les boutons, le spin (avec transitions Alpine.js) et la décision Garder/Rejeter.
   * `Livewire\CollectionGrid` : gère les filtres `wire:model.live="filterRace"` et le tri réactif.
   * `Livewire\BattleArena` : gère le matchmaking, l'affichage des jauges et le journal tour par tour via Alpine.js ou Livewire poll/events.
