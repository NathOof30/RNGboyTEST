/**
 * DÉFINITION DES POUVOIRS (Section 9)
 * Chaque pouvoir introduit des effets actifs ou passifs durant le combat :
 * DoT (dégâts sur la durée), débuffs, soins, esquives ou critiques.
 */

export const POWERS = [
  {
    id: "fire",
    name: "Feu",
    icon: "🔥",
    description: "Brûle la cible, infligeant des dégâts continus sur plusieurs tours.",
    type: "elemental",
    effect: {
      type: "burn",
      damagePerTurn: 8,
      duration: 3,
      label: "Brûlure",
    },
    weight: 15,
  },
  {
    id: "ice",
    name: "Glace",
    icon: "❄️",
    description: "Gèle les articulations adverses, réduisant drastiquement leur vitesse.",
    type: "elemental",
    effect: {
      type: "slow",
      speedReductionPercent: 35,
      freezeChance: 0.15, // 15% chance de geler sur place
      label: "Ralentissement glacial",
    },
    weight: 14,
  },
  {
    id: "poison",
    name: "Poison",
    icon: "🧪",
    description: "Toxine mortelle qui s'intensifie à chaque tour de combat.",
    type: "elemental",
    effect: {
      type: "poison",
      baseDamage: 5,
      ramping: 5, // 5 puis 10 puis 15 dégâts
      duration: 3,
      label: "Envenimement",
    },
    weight: 14,
  },
  {
    id: "lightning",
    name: "Foudre",
    icon: "⚡",
    description: "Énergie électrique pure conférant une haute chance de coup critique.",
    type: "elemental",
    effect: {
      type: "crit_boost",
      critChance: 0.35,
      critMultiplier: 1.8,
      label: "Choc foudroyant",
    },
    weight: 13,
  },
  {
    id: "gravity",
    name: "Gravité",
    icon: "🌌",
    description: "Manipule la masse : écrase la vitesse ennemie et affaiblit ses coups.",
    type: "cosmic",
    effect: {
      type: "gravity",
      speedReductionPercent: 45,
      damageReductionPercent: 15,
      label: "Pression gravitationnelle",
    },
    weight: 11,
  },
  {
    id: "teleportation",
    name: "Téléportation",
    icon: "🌀",
    description: "Disparaît dans une faille spatiale pour éviter les attaques reçues.",
    type: "spatial",
    effect: {
      type: "dodge",
      dodgeChance: 0.28, // 28% de chance d'éviter un coup
      label: "Saut dimensionnel",
    },
    weight: 11,
  },
  {
    id: "regeneration",
    name: "Régénération",
    icon: "💖",
    description: "Restaure des points de vie de manière continue tout au long du duel.",
    type: "vital",
    effect: {
      type: "heal",
      healPerTurn: 12,
      label: "Régénération cellulaire",
    },
    weight: 12,
  },
  {
    id: "invisibility",
    name: "Invisibilité",
    icon: "👁️‍🗨️",
    description: "Se dissimule aux yeux de l'adversaire, garantissant l'esquive du 1er coup et un retour puissant.",
    type: "stealth",
    effect: {
      type: "stealth",
      firstTurnDodge: true,
      dodgeChance: 0.20,
      ambushCritMultiplier: 1.6,
      label: "Camouflage optique",
    },
    weight: 10,
  },
];
