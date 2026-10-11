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

## 2. Explications des Mécaniques Clés (Version 2.0)

### 2.1. Comment fonctionne la génération & la jauge de chance ?
1. **Invocations rapides (Micro-sessions 5-10 min)** : Le joueur dispose d'un stock de **3 charges maximum**. Une charge se régénère automatiquement toutes les **4 minutes** (240 secondes).
2. **Jauge de Chance (Pity System 10/10)** : Chaque tirage standard fait monter la jauge d'une unité. Au 10ème tirage, un **Super Spin garanti** est déclenché (0% commun, 60% rare, 30% épique, 10% légendaire + pouvoir rare ou mythique garanti). Cette jauge remplace avantageusement le Daily spin.
3. **Sélection des 3 composantes** : Lors du lancement, un tirage pondéré (`weightedChoice`) détermine la **Race**, l'**Arme** et le **Pouvoir** selon leurs poids respectifs définis dans `races.js`, `weapons.js` et `powers.js`.
4. **Tiers de pouvoirs** : Les pouvoirs sont catégorisés en *Communs* (~60%), *Rares* (~28%) et *Mythiques* (~12%).
5. **Détection des synergies** : `calculateSynergies()` analyse le trio `{ raceId, weaponId, powerId }` et active les synergies et combinaisons instables éligibles.
6. **Passifs d'Atelier** : Si le joueur a acheté des niveaux dans la *Forge des Héros* ou l'*Aimant à Rareté*, les planchers de statistiques et les taux de rareté sont rehaussés.
7. **Recyclage systématique en Pièces** : Tout personnage non conservé est immédiatement converti en **Pièces d'Or 🪙** pour être réinvesti dans l'Atelier.

### 2.2. Comment fonctionne le calcul des statistiques ?
Dans `src/generation/characterGenerator.js` :
$$\text{Stat Finale} = \text{Base} + \text{Mod Race} + \text{Mod Arme} + \text{Bonus Synergies} + \text{Bonus Atelier} + \text{Variance Mutant}$$
Les statistiques sont bornées pour éviter les déséquilibres extrêmes (PV : 30 à 130, Force/Vitesse/Défense : 10 à 100).

### 2.3. Comment fonctionne le calcul du POWER (Score Global) ?
Dans `src/data/config.js` et `calculatePower()` :
$$\text{Power} = (\text{HP} \times 0.24) + (\text{Force} \times 0.32) + (\text{Défense} \times 0.24) + (\text{Vitesse} \times 0.20) + (\text{Synergies} \times 3) + (\text{Bonus Instable})$$
Le score oscille typiquement entre 40 et 98.

### 2.4. Comment fonctionne la rareté & le Super Spin ?
Dans `src/data/config.js` :
* **Tirage Standard** : Commun (72%), Rare (21%), Épique (6%), **Légendaire (1.0%)**.
* **Super Spin (10ème tirage de Chance)** : **Commun (0%)**, **Rare (60%)**, **Épique (30%)**, **Légendaire (10.0%)**.
* La rareté Légendaire est un événement d'exception reconnaissable à ses bordures dorées rayonnantes.

### 2.5. Comment fonctionnent les combats d'Arène, Tickets & Formule ÉLO ?
Dans `src/combat/opponentsPool.js` et `src/progression/progressionManager.js` :
1. **Tickets d'Arène (Régulation anti-farm)** : Réserve de **5 tickets max**, régénération d'**1 ticket toutes les 5 minutes**.
2. **Formule officielle ÉLO FIDE** : Calcul d'espérance de score $E = \frac{1}{1 + 10^{(R_{\text{adv}} - R_{\text{joueur}})/400}}$ avec facteur $K = 32$.
3. **5 Ligues Compétitives** : Bronze (0-999), Argent (1000-1199, rang de départ), Or (1200-1399), Platine (1400-1599), Maître (1600+).
4. **Récompenses de duel** : Les victoires rapportent des Pièces d'Or (bonifiées contre les rivaux plus forts et par l'Atelier) et des points d'Élo.

### 2.6. Comment fonctionne l'Atelier (Workshop) ?
Dans `src/ui/extrasUI.js` et `src/progression/progressionManager.js` :
* **Aimant à Rareté** (5 niveaux) : améliore les chances d'obtenir des cartes Rares, Épiques et Légendaires.
* **Forge des Héros** (5 niveaux) : élève les statistiques minimales garanties lors de chaque création de héros.
* **Prime d'Arène** (4 niveaux) : multiplie les gains en pièces d'or après chaque victoire en arène.
* **Invocation d'Urgence** : achat direct de charges de spin contre des pièces (max 2 fois par jour).

---

## 3. Guide de Personnalisation Rapide

| Ce que vous souhaitez modifier | Fichier concerné | Lignes / Variables clés |
| :--- | :--- | :--- |
| **Énergie Invocations & Arène** | `src/data/config.js` | `SPIN_ENERGY` (3 max, 4 min) et `ARENA_ENERGY` (5 max, 5 min) |
| **Probabilités Rareté & Super Spin** | `src/data/config.js` | `RARITY_WEIGHTS` et `LUCKY_RARITY_WEIGHTS` |
| **Tiers de Pouvoirs** | `src/data/powers.js` | Propriété `tier: 'common' \| 'rare' \| 'mythic'` et `POWERS_TIERS` |
| **Ligues & Facteur K ÉLO** | `src/data/config.js` | `ELO_CONFIG` (Ligues, `STARTING_ELO: 1000`, `K_FACTOR: 32`) |
| **Paliers de l'Atelier** | `src/data/config.js` | `WORKSHOP_UPGRADES` |
| **Pondération du Score (Power)** | `src/data/config.js` | `POWER_WEIGHTS` |
| **Ajouter une Race / Arme / Pouvoir** | `src/data/races.js`, `weapons.js`, `powers.js` | Ajouter un objet avec id, icône, stats et effets |
| **Modifier les règles de combat** | `src/combat/battleEngine.js` | `simulateBattle()` et `executeFighterTurn()` |

---

## 4. Guide de Portage vers Laravel + Livewire

La transition vers **Laravel 11+ et Livewire 3** est directe grâce à l'architecture modulaire :

1. **Modèles Eloquent & Migrations** :
   * `Character` (`id`, `user_id`, `name`, `race_id`, `weapon_id`, `power_id`, `power_tier`, `hp`, `strength`, `speed`, `defense`, `power_score`, `rarity`, `recycle_value`, `synergies_data` JSON, `wins`, `losses`).
   * `User` (`coins`, `elo`, `pity_counter`, `spin_charges`, `arena_tickets`, `workshop_upgrades` JSON, `xp`, `level`).
2. **Services PHP purs** :
   * `App\Services\CharacterGeneratorService` : convertit `characterGenerator.js` en service injectable.
   * `App\Services\BattleEngineService` : convertit `battleEngine.js` avec calcul de l'Élo FIDE et persistance de la seed.
   * `App\Services\EnergyManagerService` : régénère les charges de spins et tickets d'arène côté serveur.
3. **Composants Livewire 3** :
   * `Livewire\CharacterWheel` : gère les charges, le spin avec rouleaux Alpine.js et la jauge de chance (Pity 10/10).
   * `Livewire\CollectionGrid` : gère les filtres `wire:model.live="filterRace"`, le tri réactif et la modale de recyclage en pièces.
   * `Livewire\BattleArena` : gère les tickets d'arène, le matchmaking Élo et l'animation du journal de combat.
   * `Livewire\Workshop` : gère l'achat réactif des améliorations permanentes avec les pièces d'or.
   * `Livewire\Leaderboard` : affiche le classement par ligues (Bronze à Maître).
