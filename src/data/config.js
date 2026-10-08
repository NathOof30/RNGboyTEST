/**
 * CONFIGURATION CENTRALE DU JEU
 * Toutes les constantes, probabilités et équilibrages sont regroupés ici
 * pour une modification facile et rapide.
 */

export const GAME_CONFIG = {
  // Nom du projet
  GAME_TITLE: "WHEELBORN",
  VERSION: "0.1.0-prototype",

  // Probabilités de rareté lors de la génération standard (en %)
  // Équilibrage : Les cartes Légendaires sont désormais un véritable Graal (1%)
  RARITY_WEIGHTS: {
    common: 72,     // Commun 72%
    rare: 21,       // Rare 21%
    epic: 6,        // Épique 6%
    legendary: 1,   // Légendaire 1% (Véritablement rare et précieux)
  },

  // Probabilités de rareté pour la génération quotidienne (Bonus Daily)
  DAILY_RARITY_WEIGHTS: {
    common: 48,
    rare: 34,
    epic: 14,
    legendary: 4,
  },

  // Système d'invocation horaire (1 tirage par heure)
  HOURLY_SPIN: {
    MAX_CHARGES: 2,             // Maximum de charges stockables
    REGEN_INTERVAL_MS: 3600000, // 1 heure (3600 secondes = 3 600 000 ms)
    STARTER_CHARGES: 2,         // Charges initiales pour débuter la démo
  },

  // Seuils de statistiques de base (Roll initial avant modificateurs de race/arme)
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
  // Section 11 : Force, Vitesse, Défense, PV
  POWER_WEIGHTS: {
    STRENGTH: 0.32,
    HP: 0.24,
    DEFENSE: 0.24,
    SPEED: 0.20,
    SYNERGY_BONUS: 3,     // Bonus de score par synergie active
    UNSTABLE_BONUS: 2,    // Bonus de score si combinaison instable
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

  // Récompenses de combat (Section 25)
  REWARDS: {
    WIN_POINTS: 100,
    LOSS_POINTS: 25,
    WIN_XP: 60,
    LOSS_XP: 20,
    GENERATE_XP: 10,
    SYNERGY_DISCOVER_XP: 80,
    LEGENDARY_DISCOVER_XP: 150,
    DAILY_BONUS_POINTS: 200,
    // Bonus si l'adversaire avait un Power supérieur : bonus = diff * UNDERDOG_MULTIPLIER
    UNDERDOG_MULTIPLIER: 4,
  },

  // Cooldown Daily (24 heures en millisecondes)
  DAILY_COOLDOWN_MS: 24 * 60 * 60 * 1000,

  // Niveaux et paliers d'XP (Section 32)
  LEVELS: [
    { level: 1, xpRequired: 0, title: "Apprenti des Roues" },
    { level: 2, xpRequired: 500, title: "Initié du Hasard" },
    { level: 3, xpRequired: 1200, title: "Duelliste Aléatoire" },
    { level: 4, xpRequired: 2500, title: "Stratège des Synergies" },
    { level: 5, xpRequired: 4500, title: "Maître de la Roue" },
    { level: 6, xpRequired: 7500, title: "Grand Champion" },
    { level: 7, xpRequired: 12000, title: "Légende du Destin" },
  ],

  // Limite de stockage en collection (sécurité)
  MAX_COLLECTION_SIZE: 150,

  // Délais d'animation (ms)
  ANIMATION_SPEEDS: {
    WHEEL_SPIN_DURATION: 1600,
    BATTLE_TURN_DELAY_NORMAL: 650,
    BATTLE_TURN_DELAY_FAST: 220,
  },
};
