# 🚀 WHEELBORN — Tuto de Démarrage du Projet Laravel (depuis zéro)

> Ce guide t'emmène du dossier vide au premier spin fonctionnel.  
> Chaque étape est vérifiable indépendamment — si une étape casse, tu sais exactement où chercher.

---

## 0. Organisation du Workspace

### Structure recommandée

```
C:\Users\natha\Documents\PROJET\
└── PROJET_WHEELBORN\              ← Dossier parent du projet global
    ├── RNGboy\                    ← Ton prototype JS actuel (copie ou déplacement)
    │   ├── src/
    │   ├── index.html
    │   ├── package.json
    │   └── ...
    └── wheelborn\                 ← Nouveau projet Laravel (on va le créer ici)
        ├── app/
        ├── database/
        ├── resources/
        └── ...
```

### Comment faire

```powershell
# 1. Créer le dossier parent
mkdir "C:\Users\natha\Documents\PROJET\PROJET_WHEELBORN"

# 2. COPIER (pas déplacer) le prototype pour garder l'original intact
Copy-Item -Path "C:\Users\natha\Documents\PROJET\RNGboy" `
          -Destination "C:\Users\natha\Documents\PROJET\PROJET_WHEELBORN\RNGboy" `
          -Recurse -Exclude "node_modules"

# 3. Le projet Laravel sera créé dans l'étape 2
```

> [!IMPORTANT]
> **Ouvre ensuite ton éditeur / Antigravity dans `PROJET_WHEELBORN`** comme workspace. Tu auras accès au prototype (référence) ET au projet Laravel côté à côté.

---

## 1. Prérequis à Installer

Vérifie que tout est installé avant de commencer :

```powershell
# Vérifier PHP (besoin de 8.2+)
php -v
# Doit afficher : PHP 8.2.x ou 8.3.x

# Vérifier Composer
composer -V
# Doit afficher : Composer version 2.x.x

# Vérifier Node.js (besoin de 18+ pour Vite)
node -v
# Doit afficher : v18.x.x ou v20.x.x ou plus

# Vérifier npm
npm -v
```

### Si PHP n'est pas installé

| Méthode | Commande / Lien |
|:---|:---|
| **Option A : Laragon** (recommandé Windows) | [laragon.org](https://laragon.org/download/) — Installe PHP + MySQL + Apache en un clic |
| **Option B : XAMPP** | [apachefriends.org](https://www.apachefriends.org/) — Plus classique mais plus lourd |
| **Option C : PHP seul** | `winget install PHP.PHP.8.2` (Windows Package Manager) |

### Si Composer n'est pas installé

```powershell
# Via le site officiel (recommandé)
# Télécharger : https://getcomposer.org/download/

# OU via PowerShell
winget install Composer.Composer
```

> [!WARNING]
> **Laragon** est de loin la meilleure option pour Windows : il installe PHP 8.2+, MySQL 8, Composer, et fournit un serveur web intégré. Si tu ne l'as pas déjà, commence par là.

---

## 2. Créer le Projet Laravel

```powershell
cd "C:\Users\natha\Documents\PROJET\PROJET_WHEELBORN"

# Créer le projet Laravel 11 (dernière version stable)
composer create-project laravel/laravel wheelborn

cd wheelborn
```

### ✅ Vérification

```powershell
php artisan --version
# Doit afficher : Laravel Framework 11.x.x

php artisan serve
# Ouvre http://127.0.0.1:8000 dans ton navigateur
# Tu dois voir la page d'accueil Laravel
# Ctrl+C pour arrêter le serveur
```

---

## 3. Installer Breeze (Authentification) + Tailwind

```powershell
# Installer Laravel Breeze
composer require laravel/breeze --dev

# Scaffolding avec Blade + Tailwind (pas React, pas Vue)
php artisan breeze:install blade

# Installer les dépendances front-end
npm install
```

### ✅ Vérification

```powershell
# Compiler les assets Tailwind
npm run build

# Relancer le serveur
php artisan serve

# Aller sur http://127.0.0.1:8000
# Tu dois voir les liens "Log in" et "Register" en haut à droite
```

---

## 4. Configurer la Base de Données

### Option A : SQLite (Recommandé pour commencer — zéro config)

Laravel 11 utilise **SQLite par défaut**. Vérifie ton fichier `.env` :

```env
# .env — déjà configuré par défaut en Laravel 11
DB_CONNECTION=sqlite
# Pas besoin de DB_HOST, DB_PORT, DB_DATABASE, etc.
```

Le fichier `database/database.sqlite` est créé automatiquement.

### Option B : MySQL (si tu as Laragon/XAMPP)

```env
# .env — modifier si tu veux MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wheelborn
DB_USERNAME=root
DB_PASSWORD=
```

> [!TIP]
> **Commence avec SQLite.** C'est instantané, pas de serveur à démarrer, et tu pourras migrer vers MySQL plus tard sans changer une ligne de code applicatif. Laravel gère la transition automatiquement.

### Lancer les migrations de base (Breeze)

```powershell
php artisan migrate
```

### ✅ Vérification

```powershell
# Relancer le serveur
php artisan serve

# Aller sur http://127.0.0.1:8000/register
# Créer un compte test
# Tu dois être redirigé vers le dashboard après inscription
```

---

## 5. Créer les Migrations du Jeu

### 5.1. Modifier la migration `users` existante

La migration `users` créée par Breeze est dans `database/migrations/0001_01_01_000000_create_users_table.php`. On va la modifier pour ajouter les champs du jeu :

```powershell
# Créer une migration pour ajouter les champs gameplay à users
php artisan make:migration add_gameplay_fields_to_users_table --table=users
```

Dans le fichier créé (`database/migrations/xxxx_add_gameplay_fields_to_users_table.php`) :

```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // Économie
        $table->unsignedInteger('coins')->default(250);
        $table->unsignedInteger('elo')->default(1000);
        $table->unsignedTinyInteger('pity_counter')->default(0);
        $table->unsignedInteger('xp')->default(0);
        $table->unsignedTinyInteger('level')->default(1);

        // Énergies
        $table->unsignedTinyInteger('spin_charges')->default(3);
        $table->timestamp('last_spin_regen_at')->nullable();
        $table->unsignedTinyInteger('arena_tickets')->default(5);
        $table->timestamp('last_arena_regen_at')->nullable();

        // Index pour le leaderboard
        $table->index('elo');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn([
            'coins', 'elo', 'pity_counter', 'xp', 'level',
            'spin_charges', 'last_spin_regen_at',
            'arena_tickets', 'last_arena_regen_at',
        ]);
    });
}
```

### 5.2. Créer les nouvelles tables

```powershell
php artisan make:migration create_characters_table
php artisan make:migration create_battles_table
php artisan make:migration create_arena_sessions_table
php artisan make:migration create_achievements_table
php artisan make:migration create_workshop_upgrades_table
php artisan make:migration create_player_stats_table
```

#### `create_characters_table.php`

```php
public function up(): void
{
    Schema::create('characters', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        // Identité
        $table->string('name');
        $table->string('race_id', 50);
        $table->string('weapon_id', 50);
        $table->string('power_id', 50);
        $table->enum('power_tier', ['common', 'rare', 'mythic']);

        // Stats
        $table->unsignedSmallInteger('hp');
        $table->unsignedSmallInteger('max_hp');
        $table->unsignedSmallInteger('strength');
        $table->unsignedSmallInteger('speed');
        $table->unsignedSmallInteger('defense');
        $table->unsignedSmallInteger('power_score');

        // Rareté & flags
        $table->enum('rarity', ['common', 'rare', 'epic', 'legendary']);
        $table->boolean('is_lucky_spin')->default(false);
        $table->boolean('is_unstable')->default(false);
        $table->json('synergies_data')->nullable();
        $table->unsignedSmallInteger('recycle_value');

        // Combat
        $table->unsignedSmallInteger('battles_count')->default(0);
        $table->unsignedSmallInteger('wins')->default(0);
        $table->unsignedSmallInteger('losses')->default(0);

        // Statut
        $table->boolean('is_active_fighter')->default(false);
        $table->boolean('pending_reveal')->default(true);
        $table->timestamp('recycled_at')->nullable();

        $table->timestamps();

        // Index
        $table->index(['user_id', 'recycled_at', 'is_active_fighter']);
        $table->index(['user_id', 'rarity']);
        $table->index('power_score');
    });
}
```

#### `create_battles_table.php`

```php
public function up(): void
{
    Schema::create('battles', function (Blueprint $table) {
        $table->id();
        $table->foreignId('player_id')->constrained('users')->cascadeOnDelete();

        $table->uuid('challenger_id');
        $table->uuid('opponent_id')->nullable();
        $table->string('opponent_name')->nullable();
        $table->unsignedInteger('opponent_elo')->nullable();
        $table->uuid('winner_id');

        $table->bigInteger('seed');
        $table->unsignedTinyInteger('turns_count');

        $table->unsignedInteger('player_old_elo');
        $table->unsignedInteger('player_new_elo');
        $table->smallInteger('elo_delta');

        $table->unsignedSmallInteger('coins_awarded')->default(0);
        $table->unsignedSmallInteger('xp_awarded')->default(0);

        $table->json('combat_log')->nullable();
        $table->timestamp('created_at')->useCurrent();

        $table->index(['player_id', 'created_at']);
    });
}
```

#### `create_arena_sessions_table.php`

```php
public function up(): void
{
    Schema::create('arena_sessions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        $table->uuid('card_1_id');
        $table->uuid('card_2_id');
        $table->uuid('card_3_id');

        $table->timestamp('started_at');
        $table->timestamp('ends_at');
        $table->timestamp('claimed_at')->nullable();

        $table->json('results');

        $table->unsignedTinyInteger('total_wins')->default(0);
        $table->unsignedTinyInteger('total_losses')->default(0);
        $table->smallInteger('elo_delta')->default(0);
        $table->unsignedSmallInteger('coins_earned')->default(0);
        $table->unsignedSmallInteger('xp_earned')->default(0);

        $table->enum('status', ['active', 'completed', 'claimed'])->default('active');

        $table->index(['user_id', 'status']);
    });
}
```

#### `create_workshop_upgrades_table.php`

```php
public function up(): void
{
    Schema::create('workshop_upgrades', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

        $table->unsignedTinyInteger('rare_magnet_level')->default(0);
        $table->unsignedTinyInteger('hero_forge_level')->default(0);
        $table->unsignedTinyInteger('arena_bonus_level')->default(0);

        $table->unsignedTinyInteger('emergency_purchases_today')->default(0);
        $table->date('last_emergency_date')->nullable();

        $table->timestamp('updated_at')->useCurrent();
    });
}
```

#### `create_player_stats_table.php`

```php
public function up(): void
{
    Schema::create('player_stats', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

        $table->unsignedInteger('total_generations')->default(0);
        $table->unsignedInteger('total_battles')->default(0);
        $table->unsignedInteger('total_wins')->default(0);
        $table->unsignedInteger('total_losses')->default(0);
        $table->unsignedInteger('total_recycled')->default(0);
        $table->unsignedInteger('legendaries_found')->default(0);
        $table->unsignedSmallInteger('highest_power')->default(0);
        $table->unsignedInteger('coins_earned_total')->default(0);

        $table->json('discovered_synergies')->nullable();
        $table->json('discovered_powers')->nullable();

        $table->timestamp('updated_at')->useCurrent();
    });
}
```

#### `create_achievements_table.php`

```php
public function up(): void
{
    Schema::create('achievements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('achievement_key', 100);
        $table->timestamp('unlocked_at')->useCurrent();

        $table->unique(['user_id', 'achievement_key']);
    });
}
```

### 5.3. Lancer les migrations

```powershell
php artisan migrate
```

### ✅ Vérification

```powershell
# Vérifier que toutes les tables existent
php artisan migrate:status
# Toutes les lignes doivent afficher "Ran"
```

---

## 6. Créer les Modèles Eloquent

```powershell
php artisan make:model Character
php artisan make:model Battle
php artisan make:model ArenaSession
php artisan make:model Achievement
php artisan make:model WorkshopUpgrade
php artisan make:model PlayerStat
```

> [!NOTE]
> Le code complet de chaque modèle est détaillé dans le [PLAN_PORTAGE_LARAVEL.md](file:///c:/Users/natha/Documents/PROJET/RNGboy/PLAN_PORTAGE_LARAVEL.md#L508-L637) (section 4). Copie le contenu des modèles `User.php` et `Character.php` depuis ce fichier.

---

## 7. Créer les Enums PHP 8.2

```powershell
# Créer le dossier Enums
mkdir app\Enums
```

Créer les fichiers suivants :

| Fichier | Contenu (copier depuis le plan) |
|:---|:---|
| `app/Enums/Rarity.php` | Enum `common`, `rare`, `epic`, `legendary` avec `color()`, `recycleMultiplier()`, `stars()` |
| `app/Enums/PowerTier.php` | Enum `common`, `rare`, `mythic` |
| `app/Enums/League.php` | Enum `bronze` → `master` avec `fromElo()`, `label()`, `icon()`, `minElo()` |

> Le code complet est dans [PLAN_PORTAGE_LARAVEL.md](file:///c:/Users/natha/Documents/PROJET/RNGboy/PLAN_PORTAGE_LARAVEL.md#L640-L755).

---

## 8. Porter les Fichiers de Data

Ce sont les données de gameplay (races, armes, pouvoirs, etc.), converties de JS vers PHP.

```powershell
mkdir app\Data
```

### Exemple : `app/Data/RaceData.php`

```php
<?php

namespace App\Data;

class RaceData
{
    public static function all(): array
    {
        return [
            [
                'id' => 'human',
                'name' => 'Humain',
                'icon' => '👤',
                'weight' => 20,
                'mods' => ['hp' => 5, 'strength' => 5, 'speed' => 5, 'defense' => 5],
                'passive' => 'Adaptabilité',
                'passive_desc' => 'Bonus universel équilibré.',
            ],
            [
                'id' => 'elf',
                'name' => 'Elfe',
                'icon' => '🧝',
                'weight' => 15,
                'mods' => ['hp' => -2, 'strength' => 2, 'speed' => 18, 'defense' => -10],
                'passive' => 'Grâce Sylvestre',
                'passive_desc' => 'Initiative et vélocité extrêmes.',
            ],
            [
                'id' => 'demon',
                'name' => 'Démon',
                'icon' => '😈',
                'weight' => 12,
                'mods' => ['hp' => 4, 'strength' => 20, 'speed' => 6, 'defense' => -12],
                'passive' => 'Fureur Infernale',
                'passive_desc' => 'Frappe massive, défense vulnérable.',
            ],
            [
                'id' => 'robot',
                'name' => 'Robot',
                'icon' => '🤖',
                'weight' => 12,
                'mods' => ['hp' => 12, 'strength' => 6, 'speed' => -14, 'defense' => 22],
                'passive' => 'Châssis Titane',
                'passive_desc' => 'Blindage lourd, pénalité de vitesse.',
            ],
            [
                'id' => 'mutant',
                'name' => 'Mutant',
                'icon' => '☣️',
                'weight' => 10,
                'mods' => ['hp' => 0, 'strength' => 0, 'speed' => 0, 'defense' => 0],
                'passive' => 'Génome Chaotique',
                'passive_desc' => 'Tirages imprévisibles par stat (variance [-12, +20]).',
                'is_mutant' => true,
            ],
            [
                'id' => 'golem',
                'name' => 'Golem',
                'icon' => '🗿',
                'weight' => 10,
                'mods' => ['hp' => 25, 'strength' => 12, 'speed' => -22, 'defense' => 25],
                'passive' => 'Écorce Rocheuse',
                'passive_desc' => 'Sac de PV et armure colossale.',
            ],
            [
                'id' => 'vampire',
                'name' => 'Vampire',
                'icon' => '🧛',
                'weight' => 11,
                'mods' => ['hp' => -4, 'strength' => 14, 'speed' => 10, 'defense' => -6],
                'passive' => 'Soif de Sang',
                'passive_desc' => 'Vole 12% des dégâts infligés en PV.',
            ],
            [
                'id' => 'alien',
                'name' => 'Alien',
                'icon' => '👽',
                'weight' => 10,
                'mods' => ['hp' => 6, 'strength' => 8, 'speed' => 8, 'defense' => 6],
                'passive' => 'Biologie Stellaire',
                'passive_desc' => '+8% d\'esquive innée et synergies cosmiques.',
            ],
        ];
    }

    public static function find(string $id): ?array
    {
        return collect(self::all())->firstWhere('id', $id);
    }
}
```

> [!NOTE]
> Fais la même chose pour `WeaponData.php`, `PowerData.php`, `SynergyData.php` et `GameConfig.php` en te basant sur les fichiers `src/data/*.js` du prototype. C'est un travail mécanique : convertir la syntaxe JS en tableaux PHP.

---

## 9. Créer le Layout Principal (Thème Dark)

Le layout Breeze par défaut est clair. On va le transformer en thème dark néon inspiré du prototype.

### Modifier `resources/views/layouts/app.blade.php`

Tu peux personnaliser le layout Breeze existant. L'important est d'avoir :
- Un fond sombre (`bg-slate-950`)
- Une navbar avec les onglets du jeu (Spin, Collection, Combat, Atelier, Classement)
- Le système de navigation par onglets

### Modifier `resources/css/app.css`

Ajouter tes tokens custom après les imports Tailwind :

```css
@import 'tailwindcss';

/* Theme custom WHEELBORN */
@theme {
    --color-game-bg: #0a0e1a;
    --color-game-surface: rgba(15, 23, 42, 0.9);
    --color-game-border: #1e293b;
    
    --color-rarity-common: #94a3b8;
    --color-rarity-rare: #38bdf8;
    --color-rarity-epic: #c084fc;
    --color-rarity-legendary: #fbbf24;
    
    --color-stat-hp: #f43f5e;
    --color-stat-strength: #f59e0b;
    --color-stat-speed: #06b6d4;
    --color-stat-defense: #10b981;
}
```

---

## 10. Premier Composant Livewire : CharacterWheel

```powershell
# Créer le composant Livewire
php artisan make:livewire CharacterWheel
```

Cela crée deux fichiers :
- `app/Livewire/CharacterWheel.php` (logique PHP)
- `resources/views/livewire/character-wheel.blade.php` (template Blade)

> [!NOTE]
> Le code du composant est détaillé dans [PLAN_PORTAGE_LARAVEL.md](file:///c:/Users/natha/Documents/PROJET/RNGboy/PLAN_PORTAGE_LARAVEL.md#L942-L1050) et dans les [stratégies techniques](file:///c:/Users/natha/.gemini/antigravity-ide/brain/e00ce2ac-68c6-4ddb-96c6-b2fc5be485a7/strategies_techniques_wheelborn.md).

---

## 11. Lancer le Projet en Développement

```powershell
# Terminal 1 : Serveur PHP Laravel
php artisan serve

# Terminal 2 : Compilateur Vite (Tailwind + HMR)
npm run dev
```

> [!IMPORTANT]
> Tu dois avoir **les deux terminaux actifs en même temps** pendant le développement.
> - `php artisan serve` → Backend PHP sur `http://127.0.0.1:8000`
> - `npm run dev` → Compilateur CSS/JS avec Hot Module Replacement

---

## 12. Checklist de Progression

Coche chaque étape au fur et à mesure :

### Phase 1 — Fondations
- [ ] Dossier `PROJET_WHEELBORN` créé avec prototype copié
- [ ] Laravel 11 installé (`composer create-project`)
- [ ] Breeze + Tailwind installés
- [ ] BDD configurée (SQLite par défaut)
- [ ] Migrations de base lancées (`php artisan migrate`)
- [ ] Inscription/connexion fonctionnelles
- [ ] Migrations gameplay ajoutées (characters, battles, arena_sessions, etc.)
- [ ] Toutes les migrations passent
- [ ] Modèles Eloquent créés (Character, Battle, ArenaSession, etc.)
- [ ] Enums PHP créés (Rarity, PowerTier, League)
- [ ] Fichiers Data PHP créés (RaceData, WeaponData, PowerData, SynergyData, GameConfig)
- [ ] Layout dark néon appliqué

### Phase 2 — Cœur du Jeu
- [ ] `CharacterGeneratorService` implémenté
- [ ] `EnergyManagerService` implémenté
- [ ] `RecycleService` implémenté
- [ ] `CharacterWheel` Livewire fonctionnel (spin → révélation → garder/recycler)
- [ ] `CollectionGrid` Livewire fonctionnel (filtres, tri, recyclage)

### Phase 3 — Combat
- [ ] `BattleEngineService` implémenté
- [ ] `EloService` implémenté
- [ ] Match Rapide fonctionnel (1v1 en tickets)
- [ ] Arène Virtuelle fonctionnelle (3 cartes, timer 1h, résultats)
- [ ] `Workshop` Livewire fonctionnel (achats d'upgrades)
- [ ] `Leaderboard` Livewire fonctionnel

### Phase 4 — Polish
- [ ] Assets visuels placeholder (superposition CSS)
- [ ] Animations Alpine.js (rouleaux, timers, barres de PV)
- [ ] Responsive mobile
- [ ] Tests unitaires des services critiques
- [ ] Déploiement sur Railway/Fly.io

---

## 📌 Commandes Mémo (à garder sous la main)

```powershell
# --- COMMANDES LARAVEL FRÉQUENTES ---

# Serveur de dev
php artisan serve

# Compiler le front (Tailwind + JS)
npm run dev          # Mode dev avec HMR
npm run build        # Build de production

# Migrations
php artisan migrate                    # Appliquer les migrations
php artisan migrate:rollback           # Annuler la dernière migration
php artisan migrate:fresh --seed       # Tout recréer + seeds

# Créer des fichiers
php artisan make:model NomDuModele     # Modèle Eloquent
php artisan make:migration nom         # Migration
php artisan make:livewire NomComposant # Composant Livewire
php artisan make:seeder NomSeeder      # Seeder

# Tests
php artisan test                       # Tous les tests
php artisan test --filter=NomDuTest    # Un test spécifique

# Debug
php artisan tinker                     # Console PHP interactive
php artisan route:list                 # Voir toutes les routes

# Cache (en prod ou si problème)
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```
