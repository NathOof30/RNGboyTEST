/**
 * DÉFINITION DES SYNERGIES ET COMBINAISONS INSTABLES (Sections 13 & 14)
 * Chaque synergie est déclenchée lorsque des combinaisons spécifiques de Race, Arme ou Pouvoir sont réunies.
 * Comprend au minimum 12 synergies harmonieuses et 4 combinaisons instables surprenantes.
 */

export const SYNERGIES = [
  // 1. Démon + Feu
  {
    id: "demon_fire",
    name: "Affinité Démoniaque",
    icon: "🔥😈",
    description: "+18% Dégâts globaux et la Brûlure inflige 50% de dégâts supplémentaires.",
    isUnstable: false,
    condition: (char) => char.raceId === "demon" && char.powerId === "fire",
    effects: {
      damageMultiplier: 1.18,
      burnDamageBoost: 1.5,
    },
  },

  // 2. Elfe + Arc
  {
    id: "elf_bow",
    name: "Archer Naturel",
    icon: "🏹🧝",
    description: "+16 Vitesse et +20% de chances de coup critique.",
    isUnstable: false,
    condition: (char) => char.raceId === "elf" && char.weaponId === "bow",
    effects: {
      speedBonus: 16,
      critChanceBonus: 0.20,
    },
  },

  // 3. Robot + Foudre
  {
    id: "robot_lightning",
    name: "Supraconducteur",
    icon: "⚡🤖",
    description: "+15 Défense et immunité aux débuffs de foudre. Chaque coup électrique recharge 6 PV.",
    isUnstable: false,
    condition: (char) => char.raceId === "robot" && char.powerId === "lightning",
    effects: {
      defenseBonus: 15,
      lightningHeal: 6,
    },
  },

  // 4. Vampire + Régénération
  {
    id: "vampire_regen",
    name: "Sangsue Immortelle",
    icon: "💖🧛",
    description: "Régénération passive doublée (+12 PV/tour) et vol de vie accru à 25%.",
    isUnstable: false,
    condition: (char) => char.raceId === "vampire" && char.powerId === "regeneration",
    effects: {
      regenBonus: 12,
      lifestealBonus: 0.13,
    },
  },

  // 5. Golem + Marteau
  {
    id: "golem_hammer",
    name: "Impact Tellurique",
    icon: "🔨🗿",
    description: "+25 Force d'écrasement et 40% de chance d'étourdir l'adversaire.",
    isUnstable: false,
    condition: (char) => char.raceId === "golem" && char.weaponId === "hammer",
    effects: {
      strengthBonus: 25,
      stunChanceBonus: 0.15,
    },
  },

  // 6. Grimoire + Magie élémentaire (Feu, Glace, Foudre, Poison)
  {
    id: "grimoire_elemental",
    name: "Incantation Arcanique",
    icon: "📖✨",
    description: "+25% sur tous les effets magiques et dégâts élémentaires.",
    isUnstable: false,
    condition: (char) =>
      char.weaponId === "grimoire" &&
      ["fire", "ice", "lightning", "poison"].includes(char.powerId),
    effects: {
      spellDamageMultiplier: 1.25,
      dotDurationBonus: 1,
    },
  },

  // 7. Humain + Épée
  {
    id: "human_sword",
    name: "Maître d'Armes",
    icon: "⚔️👤",
    description: "+12 Force, +12 Défense et parade réduisant de 20% les dégâts reçus.",
    isUnstable: false,
    condition: (char) => char.raceId === "human" && char.weaponId === "sword",
    effects: {
      strengthBonus: 12,
      defenseBonus: 12,
      damageReduction: 0.10,
    },
  },

  // 8. Alien + Téléportation
  {
    id: "alien_teleport",
    name: "Distorsion Spatiale",
    icon: "🌀👽",
    description: "+30% esquive globale. Réplique immédiatement avec une contre-attaque en cas d'esquive.",
    isUnstable: false,
    condition: (char) => char.raceId === "alien" && char.powerId === "teleportation",
    effects: {
      dodgeBonus: 0.30,
      counterOnDodge: true,
    },
  },

  // 9. Dague + Invisibilité
  {
    id: "dagger_invis",
    name: "Assassin Fantôme",
    icon: "🗡️👁️‍🗨️",
    description: "Premier coup critique garanti à x2.2 de dégâts. Vitesse accrue de +12.",
    isUnstable: false,
    condition: (char) => char.raceId === "dagger" || (char.weaponId === "dagger" && char.powerId === "invisibility"),
    effects: {
      speedBonus: 12,
      firstCritMultiplier: 2.2,
    },
  },

  // 10. Bâton + Régénération
  {
    id: "staff_regen",
    name: "Harmonie Sylvestre",
    icon: "🪄💖",
    description: "Confère un bouclier de 25 PV en début de combat et +8 PV soignés par tour.",
    isUnstable: false,
    condition: (char) => char.weaponId === "staff" && char.powerId === "regeneration",
    effects: {
      shieldHp: 25,
      regenBonus: 8,
    },
  },

  // 11. Pistolet + Foudre
  {
    id: "gun_lightning",
    name: "Tir Électro-Magnétique",
    icon: "🔫⚡",
    description: "40% de chance de critique électrique infligeant des secousses paralysantes.",
    isUnstable: false,
    condition: (char) => char.weaponId === "gun" && char.powerId === "lightning",
    effects: {
      critChanceBonus: 0.25,
      critMultiplier: 2.0,
    },
  },

  // 12. Lance + Gravité
  {
    id: "spear_gravity",
    name: "Pointe Gravitationnelle",
    icon: "🔱🌌",
    description: "La lance cloue la cible au sol. L'adversaire ne peut jamais esquiver et subit +15% dégâts.",
    isUnstable: false,
    condition: (char) => char.weaponId === "spear" && char.powerId === "gravity",
    effects: {
      pierceDodge: true,
      damageMultiplier: 1.15,
    },
  },

  // ==========================================
  // COMBINAISONS INSTABLES (Section 14)
  // Effets surprenants et uniques !
  // ==========================================

  // 13. Démon + Glace (Instable)
  {
    id: "demon_ice",
    name: "Combustion Glacée",
    icon: "❄️😈💥",
    description: "INSTABLE : Choc thermique imprévisible ! Dégâts oscillant entre 50% et 220%, inflige Brûlure ET Gel en même temps.",
    isUnstable: true,
    condition: (char) => char.raceId === "demon" && char.powerId === "ice",
    effects: {
      unstableVolatility: true,
      appliesBothBurnAndFreeze: true,
    },
  },

  // 14. Robot + Poison (Instable)
  {
    id: "robot_poison",
    name: "Infection Artificielle",
    icon: "🧪🤖☣️",
    description: "INSTABLE : Liquide de refroidissement toxique. Le poison adverse réduit la défense ennemie de 30%, mais le robot s'auto-endommage de 4 PV par tour.",
    isUnstable: true,
    condition: (char) => char.raceId === "robot" && char.powerId === "poison",
    effects: {
      acidPoison: true,
      selfCorrosionDamage: 4,
    },
  },

  // 15. Golem + Téléportation (Instable)
  {
    id: "golem_teleport",
    name: "Masse Déplacée",
    icon: "🌀🗿☄️",
    description: "INSTABLE : Un colosse de 10 tonnes qui se téléporte ! 20% esquive, puis s'écrase sur l'ennemi en provoquant 30 dégâts bonus massifs.",
    isUnstable: true,
    condition: (char) => char.raceId === "golem" && char.powerId === "teleportation",
    effects: {
      heavyCrushDodgeBonus: 0.20,
      crushBonusDamage: 30,
    },
  },

  // 16. Mutant + Gravité (Instable)
  {
    id: "mutant_gravity",
    name: "Singularité Vivante",
    icon: "🌌☣️🌀",
    description: "INSTABLE : Anomalie biologique gravitationnelle. Les statistiques changent aléatoirement à chaque tour (-10 à +25 force ou vitesse).",
    isUnstable: true,
    condition: (char) => char.raceId === "mutant" && char.powerId === "gravity",
    effects: {
      chaosShifting: true,
    },
  },
];
