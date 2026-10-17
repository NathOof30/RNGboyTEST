# 🛡️ WHEELBORN — Stratégies Techniques Détaillées

> Ce document répond à toutes les questions ouvertes et formalise les choix techniques pour le portage Laravel.

---

## 1. Système de Combat Dual — Match Rapide + Arène Virtuelle

Tu décris en fait **deux modes de combat distincts**, ce qui est une excellente idée pour la rétention. Voici comment les formaliser :

### 1.1. Mode 1 : Match Rapide (Tickets) ⚔️

> Combat instantané 1v1 — Le joueur voit le résultat immédiatement.

| Aspect | Détail |
|:---|:---|
| **Concept** | Le joueur sélectionne **1 carte** de sa collection et affronte une carte aléatoire d'un autre joueur |
| **Coût** | 1 Ticket de combat (5 max, recharge 1/5min) |
| **Matchmaking** | Basé sur le **Power Score** de la carte choisie (±15% de marge) |
| **Résultat** | Instantané (calcul serveur via `BattleEngineService`) |
| **Récompenses** | Pièces d'Or + XP (pas d'Élo ici, c'est casual) |
| **Source des adversaires** | Cartes de vrais joueurs **OU** bots si pas assez de joueurs |

#### Algorithme de matchmaking simplifié

```php
// Trouver une carte adverse dont le Power Score est proche
$targetPower = $playerCard->power_score;
$margin = max(8, (int) ($targetPower * 0.15)); // ±15%, minimum ±8

$opponentCard = Character::where('user_id', '!=', $player->id)
    ->whereNull('recycled_at')
    ->whereBetween('power_score', [$targetPower - $margin, $targetPower + $margin])
    ->inRandomOrder()
    ->first();

// Fallback sur un bot si aucun joueur trouvé
if (!$opponentCard) {
    $opponentCard = BotCharacter::matchByPower($targetPower);
}
```

### 1.2. Mode 2 : Arène Virtuelle (AFK Timer) 🏟️

> Le joueur envoie une équipe de 3 cartes qui combattent automatiquement pendant 1 heure.

| Aspect | Détail |
|:---|:---|
| **Concept** | Sélectionner **3 cartes** → Les envoyer dans l'arène → Attendre 1h → Récupérer les résultats |
| **Coût** | Gratuit mais **1 session maximum à la fois** (pas de spam) |
| **Déroulement** | Le serveur **simule immédiatement** tous les combats (10-15 matchs par carte) mais les résultats ne sont dévoilés qu'après le timer |
| **Résultat** | Au bout de 1h : rapport détaillé (W/L par carte, Élo gagné/perdu, Pièces cumulées) |
| **Élo** | ✅ C'est ici que l'Élo bouge (car c'est le mode compétitif sérieux) |
| **Matchmaking** | Par tranche d'Élo du joueur (±200) |
| **Verrouillage** | Les 3 cartes sont **verrouillées** pendant la session (pas recyclables, pas réutilisables) |

#### Comment ça marche côté serveur

```
1. Le joueur soumet 3 cartes → Enregistrement en BDD (arena_sessions)
2. Le serveur SIMULE IMMÉDIATEMENT les ~15 combats (c'est instantané, quelques ms)
3. Les résultats sont stockés en JSON dans arena_sessions.results
4. Un timestamp arena_sessions.ends_at = now() + 1 heure est posé
5. Le joueur voit un écran "Arène en cours... 47min restantes"
6. Quand ends_at est passé → Le joueur clique "Récupérer les résultats"
7. Élo + Pièces + XP sont appliqués. Les cartes sont déverrouillées.
```

> [!TIP]
> L'astuce ici est que les combats sont simulés **immédiatement** côté serveur, mais les résultats sont **révélés** après le timer. Aucun cron job ou queue nécessaire — juste un timestamp et une vérification `ends_at <= now()`.

### 1.3. Table BDD pour l'Arène Virtuelle

```sql
CREATE TABLE arena_sessions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    
    -- Les 3 cartes envoyées
    card_1_id       CHAR(36) NOT NULL,
    card_2_id       CHAR(36) NOT NULL,
    card_3_id       CHAR(36) NOT NULL,
    
    -- Timing
    started_at      TIMESTAMP NOT NULL,
    ends_at         TIMESTAMP NOT NULL,              -- started_at + 1 heure
    claimed_at      TIMESTAMP NULL,                   -- NULL = pas encore récupéré
    
    -- Résultats (pré-simulés, stockés en JSON)
    results         JSON NOT NULL,                    -- Détail de chaque combat simulé
    
    -- Récompenses totales (calculées à la simulation)
    total_wins      TINYINT UNSIGNED DEFAULT 0,
    total_losses    TINYINT UNSIGNED DEFAULT 0,
    elo_delta       SMALLINT DEFAULT 0,               -- Total Élo gagné/perdu
    coins_earned    SMALLINT UNSIGNED DEFAULT 0,
    xp_earned       SMALLINT UNSIGNED DEFAULT 0,
    
    -- Statut
    status          ENUM('active', 'completed', 'claimed') DEFAULT 'active',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_arena_user_status (user_id, status)
);
```

#### Structure du JSON `results`

```json
{
  "matches": [
    {
      "round": 1,
      "player_card_id": "uuid-card-1",
      "player_card_name": "Ignis le Brûlant",
      "opponent_card_name": "Golem de Fer",
      "opponent_elo": 1050,
      "winner": "player",
      "turns": 12,
      "elo_change": +18,
      "coins": 75
    },
    {
      "round": 2,
      "player_card_id": "uuid-card-2",
      "...": "..."
    }
  ],
  "summary": {
    "card_1_record": "3W / 2L",
    "card_2_record": "4W / 1L",
    "card_3_record": "2W / 3L"
  }
}
```

### 1.4. Gestion des Bots (Pool d'Adversaires Virtuels)

Les bots comblent le vide quand il n'y a pas assez de vrais joueurs. Voici la stratégie :

```sql
-- Pas besoin d'une table séparée "bots" — on utilise la table characters
-- avec un user_id spécial (le "compte système" id=1)

-- Le Seeder crée ~50 bots répartis sur toutes les ligues :
```

| Ligue | Nb Bots | Power Score | Élo attribué | Distribution |
|:---|:---:|:---:|:---:|:---|
| Bronze | 15 | 40-55 | 600-999 | Beaucoup de communs, quelques rares |
| Argent | 12 | 55-70 | 1000-1199 | Mix commun/rare, quelques synergies |
| Or | 10 | 65-80 | 1200-1399 | Rares et épiques, synergies fréquentes |
| Platine | 8 | 75-90 | 1400-1599 | Épiques dominants, multi-synergies |
| Maître | 5 | 85-98 | 1600+ | Légendaires, synergies puissantes |

> [!NOTE]
> Les bots sont des `Character` normaux appartenant à un `User` système (id=1, name="Wheelborn AI"). Ils sont créés via un `BotOpponentSeeder` et ne participent pas au classement joueur.

---

## 2. Cache Laravel — Guide Pratique

### 2.1. C'est quoi le cache et pourquoi ?

Le cache, c'est stocker temporairement en mémoire des données qui ne changent **jamais** ou **rarement**, pour éviter de les recalculer ou relire à chaque requête HTTP.

**Exemple concret :** Les 8 races du jeu ne changent jamais. Sans cache, à chaque spin, Laravel relit le fichier `RaceData.php`, reconstruit les tableaux, etc. Avec le cache, les données sont lues **une seule fois** et gardées en mémoire.

### 2.2. Quoi mettre en cache

| Donnée | Fréquence de changement | Mettre en cache ? | Durée |
|:---|:---|:---:|:---|
| Liste des 8 races | **Jamais** (données statiques) | ✅ Oui | Infini (`rememberForever`) |
| Liste des 8 armes | **Jamais** | ✅ Oui | Infini |
| Liste des 8 pouvoirs | **Jamais** | ✅ Oui | Infini |
| Liste des 16 synergies | **Jamais** | ✅ Oui | Infini |
| Config du jeu (probabilités, seuils) | **Jamais** | ✅ Oui | Infini |
| Leaderboard (top 100) | Toutes les minutes | ✅ Oui | 60 secondes |
| Profil du joueur connecté | À chaque action | ❌ Non | — |
| Résultat d'un combat | Unique | ❌ Non | — |
| Collection du joueur | À chaque spin/recyclage | ❌ Non | — |

### 2.3. Comment utiliser le cache (exemples concrets)

```php
// app/Data/RaceData.php — Exemple avec cache

use Illuminate\Support\Facades\Cache;

class RaceData
{
    /**
     * Retourne toutes les races.
     * Mise en cache permanente car les données ne changent JAMAIS.
     */
    public static function all(): array
    {
        return Cache::rememberForever('game_races', function () {
            return [
                [
                    'id' => 'human',
                    'name' => 'Humain',
                    'icon' => '👤',
                    'weight' => 20,
                    'mods' => ['hp' => 5, 'strength' => 5, 'speed' => 5, 'defense' => 5],
                    'passive' => 'Adaptabilité',
                ],
                // ... les 7 autres races
            ];
        });
    }
}
```

```php
// Leaderboard — Cache de 60 secondes (se rafraîchit toutes les minutes)

class Leaderboard extends Component
{
    public function render()
    {
        $topPlayers = Cache::remember('leaderboard_top100', 60, function () {
            return User::orderByDesc('elo')
                       ->take(100)
                       ->get(['name', 'elo', 'level']);
        });

        return view('livewire.leaderboard', compact('topPlayers'));
    }
}
```

### 2.4. Configuration du cache (zéro effort)

Laravel utilise le cache **fichier** par défaut (stocké dans `storage/framework/cache/`). Pour un projet étudiant, **ne change rien** — ça fonctionne parfaitement. 

```env
# .env — configuration par défaut, pas besoin de toucher
CACHE_STORE=file
```

> [!TIP]
> **Règle simple :** Si la donnée est la même pour TOUS les joueurs et ne change pas → `Cache::rememberForever()`. Si elle change rarement → `Cache::remember('clé', 60, ...)` (60 secondes). Si elle est propre au joueur → pas de cache.

---

## 3. Tests Unitaires — Stratégie Minimale mais Efficace

### 3.1. Quoi tester en priorité

On ne va pas tester 100% du code. On teste **les services critiques** où un bug serait catastrophique :

| Service | Priorité | Pourquoi |
|:---|:---:|:---|
| `CharacterGeneratorService` | 🔴 Critique | Un bug ici = des personnages cassés pour tout le monde |
| `BattleEngineService` | 🔴 Critique | Un bug ici = résultats de combat faux, Élo injuste |
| `EloService` | 🔴 Critique | Un bug = classement corrompu |
| `RecycleService` | 🟡 Important | Un bug = pièces mal calculées (économie brisée) |
| `EnergyManagerService` | 🟡 Important | Un bug = charges infinies ou bloquées |
| Composants Livewire | 🟢 Optionnel | Testables manuellement via le navigateur |

### 3.2. Exemples de tests concrets

```php
// tests/Unit/EloServiceTest.php

use App\Services\EloService;

class EloServiceTest extends TestCase
{
    private EloService $elo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->elo = new EloService();
    }

    /** @test */
    public function match_equilibre_donne_plus_16()
    {
        // 1000 vs 1000, victoire → +16
        $delta = $this->elo->calculateDelta(1000, 1000, true);
        $this->assertEquals(16, $delta);
    }

    /** @test */
    public function victoire_contre_plus_fort_donne_plus()
    {
        // 1000 vs 1200, victoire → doit gagner plus que 16
        $delta = $this->elo->calculateDelta(1000, 1200, true);
        $this->assertGreaterThan(16, $delta);
    }

    /** @test */
    public function defaite_contre_plus_faible_penalise_fort()
    {
        // 1200 vs 1000, défaite → doit perdre plus que 16
        $delta = $this->elo->calculateDelta(1200, 1000, false);
        $this->assertLessThan(-16, $delta);
    }
}
```

```php
// tests/Unit/CharacterGeneratorServiceTest.php

/** @test */
public function les_stats_sont_dans_les_bornes()
{
    $service = app(CharacterGeneratorService::class);
    $user = User::factory()->create();

    // Générer 100 personnages et vérifier les bornes
    for ($i = 0; $i < 100; $i++) {
        $char = $service->generate($user);

        $this->assertGreaterThanOrEqual(30, $char->hp);
        $this->assertLessThanOrEqual(130, $char->hp);
        $this->assertGreaterThanOrEqual(15, $char->strength);
        $this->assertLessThanOrEqual(100, $char->strength);
        // ... etc
    }
}

/** @test */
public function super_spin_ne_genere_jamais_de_commun()
{
    $service = app(CharacterGeneratorService::class);
    $user = User::factory()->create(['pity_counter' => 10]);

    for ($i = 0; $i < 50; $i++) {
        $char = $service->generate($user, isLuckySpin: true);
        $this->assertNotEquals('common', $char->rarity->value);
    }
}
```

### 3.3. Comment lancer les tests

```bash
# Lancer tous les tests
php artisan test

# Lancer un test spécifique
php artisan test --filter=EloServiceTest

# Lancer avec couverture (optionnel)
php artisan test --coverage
```

> [!NOTE]
> Tu n'as pas besoin de tout tester au début. Écris les tests **en même temps** que tu codes chaque service. Pas après, pas avant — en même temps.

---

## 4. Gestion des Erreurs UX & Perte de Connexion

### 4.1. Le vrai risque : perte de connexion pendant un spin

Voici le scénario problématique et sa solution :

```
SCÉNARIO DANGEREUX :
1. Le joueur clique "Spinner"
2. Le serveur consomme 1 charge (-1 spin)
3. Le serveur génère le personnage et le sauvegarde en BDD
4. La réponse HTTP est envoyée au navigateur
5. ❌ CONNEXION PERDUE — Le joueur ne voit jamais le résultat
6. Le joueur recharge la page → Sa charge est consommée, mais il ne sait pas quel perso il a reçu
```

### 4.2. Solution : État "en attente de révélation"

```php
// Ajouter un flag sur Character
// pending_reveal = true → Le joueur n'a pas encore vu/décidé pour ce personnage

Schema::table('characters', function (Blueprint $table) {
    $table->boolean('pending_reveal')->default(true);
});
```

```php
// Dans CharacterWheel.php — Au chargement du composant
public function mount(): void
{
    $this->refreshEnergy();
    
    // Vérifier s'il y a un personnage non révélé (reconnexion après perte de co)
    $pending = auth()->user()->characters()
        ->where('pending_reveal', true)
        ->latest()
        ->first();
    
    if ($pending) {
        // Ré-afficher la modale de révélation
        $this->revealedCharacter = $pending->toArray();
    }
}

// Quand le joueur décide (garder ou recycler)
public function keepCharacter(): void
{
    Character::find($this->revealedCharacter['id'])
        ->update(['pending_reveal' => false]);
    $this->revealedCharacter = null;
}
```

> [!IMPORTANT]
> **Principe clé :** Toute action critique (spin, recyclage, combat) doit être **atomique côté serveur**. Le serveur ne dépend jamais de la réponse du client. Si le client disparaît, le serveur a déjà enregistré un état cohérent que le joueur retrouvera à sa reconnexion.

### 4.3. Résumé des protections par action

| Action | Risque | Protection |
|:---|:---|:---|
| **Spin** | Charge consommée, résultat non vu | Flag `pending_reveal` sur le perso. Ré-affichage à la reconnexion. |
| **Recyclage** | Double clic = double recyclage | Transaction SQL + `recycled_at IS NULL` vérification |
| **Combat (Match Rapide)** | Combat lancé, résultat non vu | Le résultat est en BDD (`battles`). Re-affichage du dernier combat non-vu. |
| **Arène Virtuelle** | Timer en cours, joueur déconnecté | Aucun problème — tout est côté serveur. Le joueur revient et réclame quand il veut. |
| **Achat Atelier** | Double achat | Transaction SQL + vérification du solde dans la même transaction |

### 4.4. Le cache côté client ne résout PAS ce problème

> [!WARNING]
> Stocker des données dans le cache navigateur (localStorage) pour "protéger" contre les pertes de connexion est une **mauvaise idée** pour un jeu multijoueur. Le client n'est pas la source de vérité — le serveur l'est. La solution est toujours **côté serveur** (flags en BDD, transactions).

---

## 5. Système d'Assets Visuels (Superposition CSS) — Détails

### 5.1. Structure des fichiers d'assets

```
public/
└── assets/
    ├── backgrounds/          # Fonds par rareté
    │   ├── common.webp       # Fond gris/sombre
    │   ├── rare.webp         # Fond bleu
    │   ├── epic.webp         # Fond violet
    │   └── legendary.webp    # Fond doré avec particules
    ├── races/                # Silhouettes des 8 races
    │   ├── human.webp
    │   ├── elf.webp
    │   ├── demon.webp
    │   ├── robot.webp
    │   ├── mutant.webp
    │   ├── golem.webp
    │   ├── vampire.webp
    │   └── alien.webp
    ├── weapons/              # Armes (positionnées sur le gabarit)
    │   ├── sword.webp
    │   ├── bow.webp
    │   ├── hammer.webp
    │   ├── spear.webp
    │   ├── dagger.webp
    │   ├── staff.webp
    │   ├── gun.webp
    │   └── grimoire.webp
    ├── powers/               # Auras et effets de pouvoir
    │   ├── fire.webp
    │   ├── ice.webp
    │   ├── poison.webp
    │   ├── lightning.webp
    │   ├── gravity.webp
    │   ├── teleportation.webp
    │   ├── regeneration.webp
    │   └── invisibility.webp
    └── frames/               # Bordures de rareté
        ├── frame-common.webp
        ├── frame-rare.webp
        ├── frame-epic.webp
        └── frame-legendary.webp
```

### 5.2. Composant Blade réutilisable

```html
<!-- resources/views/components/character-card.blade.php -->

@props(['character'])

<div class="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl
            {{ $character->rarity->value === 'legendary' ? 'animate-pulse-glow' : '' }}">
    
    <!-- Couche 1 : Fond de rareté -->
    <img src="/assets/backgrounds/{{ $character->rarity->value }}.webp" 
         class="absolute inset-0 w-full h-full object-cover z-0"
         alt="" loading="lazy">
    
    <!-- Couche 2 : Silhouette de race -->
    <img src="/assets/races/{{ $character->race_id }}.webp" 
         class="absolute inset-0 w-full h-full object-contain z-10"
         alt="{{ $character->race_id }}" loading="lazy">
    
    <!-- Couche 3 : Arme -->
    <img src="/assets/weapons/{{ $character->weapon_id }}.webp" 
         class="absolute inset-0 w-full h-full object-contain z-20"
         alt="{{ $character->weapon_id }}" loading="lazy">
    
    <!-- Couche 4 : Aura de pouvoir -->
    <img src="/assets/powers/{{ $character->power_id }}.webp" 
         class="absolute inset-0 w-full h-full object-contain z-30 opacity-70"
         alt="{{ $character->power_id }}" loading="lazy">
    
    <!-- Couche 5 : Cadre de rareté -->
    <img src="/assets/frames/frame-{{ $character->rarity->value }}.webp" 
         class="absolute inset-0 w-full h-full object-cover z-40 pointer-events-none"
         alt="" loading="lazy">
    
    <!-- Overlay info (nom + power score) -->
    <div class="absolute bottom-0 left-0 right-0 z-50 p-2 
                bg-gradient-to-t from-black/80 to-transparent">
        <p class="text-white text-sm font-bold truncate">{{ $character->name }}</p>
        <p class="text-xs" style="color: {{ $character->rarity->color() }}">
            ⚡ {{ $character->power_score }}
        </p>
    </div>
</div>
```

### 5.3. Convention de nommage

| Règle | Exemple |
|:---|:---|
| Tous les fichiers en **minuscules** | `demon.webp`, pas `Demon.webp` |
| Le nom du fichier = l'`id` en BDD | `race_id = 'demon'` → `races/demon.webp` |
| Format **WebP** recommandé | 2-5× plus léger que PNG, transparent supporté |
| Taille du gabarit | **400×600px** (bon compromis qualité/performance web) |
| Fond **transparent** obligatoire | Sauf pour `backgrounds/` et `frames/` |

> [!TIP]
> **Phase de développement :** Crée des images placeholder de 400×600px (rectangles colorés semi-transparents avec le nom écrit dessus) pour tester le système de superposition avant d'avoir les vrais dessins.
