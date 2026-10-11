/**
 * DÉFINITION DES POUVOIRS (Paliers Communs, Rares et Mythiques)
 * 
 * Hiérarchisation des probabilités d'obtention :
 * - Communs (~60%) : Feu, Poison
 * - Rares (~28%) : Glace, Foudre, Régénération
 * - Mythiques (~12%) : Gravité, Téléportation, Invisibilité
 */

export const POWERS = [
  {
    id: "fire",
    name: "Feu",
    icon: "🔥",
    tier: "common",
    tierLabel: "Commun",
    description: "Brûle la cible, infligeant des dégâts continus sur plusieurs tours.",
    type: "elemental",
    effect: {
      type: "burn",
      damagePerTurn: 8,
      duration: 3,
      label: "Brûlure",
    },
    weight: 30, // Commun
  },
  {
    id: "poison",
    name: "Poison",
    icon: "🧪",
    tier: "common",
    tierLabel: "Commun",
    description: "Toxine mortelle qui s'intensifie à chaque tour de combat.",
    type: "elemental",
    effect: {
      type: "poison",
      baseDamage: 5,
      ramping: 5,
      duration: 3,
      label: "Envenimement",
    },
    weight: 30, // Commun
  },
  {
    id: "ice",
    name: "Glace",
    icon: "❄️",
    tier: "rare",
    tierLabel: "Rare",
    description: "Gèle les articulations adverses, réduisant drastiquement leur vitesse.",
    type: "elemental",
    effect: {
      type: "slow",
      speedReductionPercent: 35,
      freezeChance: 0.15,
      label: "Ralentissement glacial",
    },
    weight: 10, // Rare
  },
  {
    id: "lightning",
    name: "Foudre",
    icon: "⚡",
    tier: "rare",
    tierLabel: "Rare",
    description: "Énergie électrique pure conférant une haute chance de coup critique.",
    type: "elemental",
    effect: {
      type: "crit_boost",
      critChance: 0.35,
      critMultiplier: 1.8,
      label: "Choc foudroyant",
    },
    weight: 10, // Rare
  },
  {
    id: "regeneration",
    name: "Régénération",
    icon: "💖",
    tier: "rare",
    tierLabel: "Rare",
    description: "Restaure des points de vie de manière continue tout au long du duel.",
    type: "vital",
    effect: {
      type: "heal",
      healPerTurn: 12,
      label: "Régénération cellulaire",
    },
    weight: 8, // Rare
  },
  {
    id: "gravity",
    name: "Gravité",
    icon: "🌌",
    tier: "mythic",
    tierLabel: "Mythique",
    description: "Manipule la masse : écrase la vitesse ennemie et affaiblit ses coups.",
    type: "cosmic",
    effect: {
      type: "gravity",
      speedReductionPercent: 45,
      damageReductionPercent: 15,
      label: "Pression gravitationnelle",
    },
    weight: 4, // Mythique
  },
  {
    id: "teleportation",
    name: "Téléportation",
    icon: "🌀",
    tier: "mythic",
    tierLabel: "Mythique",
    description: "Disparaît dans une faille spatiale pour éviter les attaques reçues.",
    type: "spatial",
    effect: {
      type: "dodge",
      dodgeChance: 0.28,
      label: "Saut dimensionnel",
    },
    weight: 4, // Mythique
  },
  {
    id: "invisibility",
    name: "Invisibilité",
    icon: "👁️‍🗨️",
    tier: "mythic",
    tierLabel: "Mythique",
    description: "Se dissimule aux yeux de l'adversaire, garantissant l'esquive du 1er coup et un retour puissant.",
    type: "stealth",
    effect: {
      type: "stealth",
      firstTurnDodge: true,
      dodgeChance: 0.20,
      ambushCritMultiplier: 1.6,
      label: "Camouflage optique",
    },
    weight: 4, // Mythique
  },
];

