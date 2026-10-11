/**
 * CONFIGURATION CENTRALE DU JEU — NOUVELLE BOUCLE DE GAMEPLAY (V2)
 * Micro-sessions 5-10 min, Énergie rapide, Jauge Pity 10/10,
 * Vrai Élo mathématique, Recyclage en pièces et Atelier d'améliorations.
 */

export const GAME_CONFIG = {
  // Nom du projet
  GAME_TITLE: "WHEELBORN",
  VERSION: "0.2.0-loop-v2",

  // Probabilités de rareté lors de la génération standard (en %)
  RARITY_WEIGHTS: {
    common: 72,     // Commun 72%
    rare: 21,       // Rare 21%
    epic: 6,        // Épique 6%
    legendary: 1,   // Légendaire 1%
  },

  // Probabilités du "Super Spin" (Jauge de chance 10/10 - Lucky Spin)
  LUCKY_RARITY_WEIGHTS: {
    common: 0,      // 0% de Commun garanti !
    rare: 60,       // Rare 60%
    epic: 30,       // Épique 30%
    legendary: 10,  // Légendaire 10%
  },

  // Système de charges de tirage (3 charges, recharge rapide toutes les 4 minutes)
  SPIN_ENERGY: {
    MAX_CHARGES: 3,             // Maximum 3 charges
    REGEN_INTERVAL_MS: 240000,  // 4 minutes = 240 000 ms
    STARTER_CHARGES: 3,         // Prêt à jouer au lancement
  },

  // Système de tickets d'Arène (Anti-AFK, 5 tickets, recharge toutes les 5 minutes)
  ARENA_ENERGY: {
    MAX_TICKETS: 5,             // Maximum 5 combats par session
    REGEN_INTERVAL_MS: 300000,  // 5 minutes = 300 000 ms
    STARTER_TICKETS: 5,
  },

  // Seuil du Pity System (Jauge de chance)
  PITY_THRESHOLD: 10,

  // Seuils de statistiques de base
  BASE_STATS: {
    HP_MIN: 55,
    HP_MAX: 75,
    STRENGTH_MIN: 45,
    STRENGTH_MAX: 70,
    SPEED_MIN: 40,
    SPEED_MAX: 68,
    DEFENSE_MIN: 42,
    DEFENSE_MAX: 68,
  },

  // Pondérations pour le calcul du SCORE GLOBAL (POWER)
  POWER_WEIGHTS: {
    STRENGTH: 0.32,
    HP: 0.24,
    DEFENSE: 0.24,
    SPEED: 0.20,
    SYNERGY_BONUS: 3,
    UNSTABLE_BONUS: 2,
  },

  // Raretés et détails
  RARITIES: {
    common: {
      id: "common",
      label: "Commun",
      color: "#94a3b8",
      stars: 1,
      multiplier: 1.0,
      badgeClass: "badge-common",
    },
    rare: {
      id: "rare",
      label: "Rare",
      color: "#38bdf8",
      stars: 2,
      multiplier: 1.15,
      badgeClass: "badge-rare",
    },
    epic: {
      id: "epic",
      label: "Épique",
      color: "#c084fc",
      stars: 3,
      multiplier: 1.30,
      badgeClass: "badge-epic",
    },
    legendary: {
      id: "legendary",
      label: "Légendaire",
      color: "#fbbf24",
      stars: 5,
      multiplier: 1.50,
      badgeClass: "badge-legendary",
    },
  },

  // Formule ÉLO (FIDE standard) et Ligues
  ELO_CONFIG: {
    STARTING_ELO: 1000,
    K_FACTOR: 32,
    LEAGUES: [
      { id: "bronze", name: "Bronze", minElo: 0, maxElo: 999, icon: "🥉", color: "#cd7f32" },
      { id: "silver", name: "Argent", minElo: 1000, maxElo: 1399, icon: "🥈", color: "#94a3b8" },
      { id: "gold", name: "Or", minElo: 1400, maxElo: 1799, icon: "🥇", color: "#fbbf24" },
      { id: "platinum", name: "Platine", minElo: 1800, maxElo: 2199, icon: "💎", color: "#38bdf8" },
      { id: "master", name: "Maître", minElo: 2200, maxElo: 99999, icon: "👑", color: "#c084fc" },
    ],
  },

  // Récompenses en Pièces et XP
  REWARDS: {
    WIN_COINS_BASE: 65,
    LOSS_COINS_BASE: 20,
    WIN_XP: 60,
    LOSS_XP: 20,
    GENERATE_XP: 10,
    LUCKY_SPIN_XP: 100,
    SYNERGY_DISCOVER_XP: 80,
    LEGENDARY_DISCOVER_XP: 150,
  },

  // Atelier d'Améliorations (Upgrades achetables en Pièces)
  WORKSHOP_UPGRADES: {
    rare_magnet: {
      id: "rare_magnet",
      name: "Aimant à Pouvoirs",
      icon: "🧲",
      maxLevel: 5,
      costs: [200, 450, 750, 1100, 1600],
      bonusPerLevel: 3, // +3% de chance de pouvoirs rares/mythiques
      desc: "+3% par niveau de chance d'obtenir des pouvoirs Rares & Mythiques",
    },
    hero_forge: {
      id: "hero_forge",
      name: "Forge des Héros",
      icon: "⚡",
      maxLevel: 5,
      costs: [150, 350, 650, 950, 1400],
      bonusHpPerLevel: 3,
      bonusStrPerLevel: 2,
      desc: "+2 Force et +3 PV passifs sur tous les futurs tirages",
    },
    arena_bonus: {
      id: "arena_bonus",
      name: "Prime d'Arène",
      icon: "🛡️",
      maxLevel: 3,
      costs: [300, 600, 1000],
      multipliers: [1.25, 1.50, 2.00],
      desc: "Augmente l'or gagné par victoire d'arène (+25%, +50%, +100%)",
    },
    emergency_spin: {
      id: "emergency_spin",
      name: "Jeton d'Urgence",
      icon: "🎟️",
      isInstant: true,
      baseCost: 120,
      costMultiplier: 1.6,
      desc: "Acheter 1 charge de tirage immédiatement (coût journalier croissant)",
    },
  },

  // Paliers d'XP
  LEVELS: [
    { level: 1, xpRequired: 0, title: "Apprenti des Roues" },
    { level: 2, xpRequired: 500, title: "Initié du Hasard" },
    { level: 3, xpRequired: 1200, title: "Duelliste Aléatoire" },
    { level: 4, xpRequired: 2500, title: "Stratège des Synergies" },
    { level: 5, xpRequired: 4500, title: "Maître de la Roue" },
    { level: 6, xpRequired: 7500, title: "Grand Champion" },
    { level: 7, xpRequired: 12000, title: "Légende du Destin" },
  ],

  // Limite de stockage en collection
  MAX_COLLECTION_SIZE: 150,

  // Délais d'animation (ms)
  ANIMATION_SPEEDS: {
    WHEEL_SPIN_DURATION: 1600,
    BATTLE_TURN_DELAY_NORMAL: 650,
    BATTLE_TURN_DELAY_FAST: 220,
  },
};

