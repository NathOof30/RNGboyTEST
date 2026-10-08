/**
 * DÉFINITION DES RACES (Section 7)
 * Chaque race influence les statistiques et possède un passif thématique.
 */

export const RACES = [
  {
    id: "human",
    name: "Humain",
    icon: "👤",
    description: "Polyvalent et équilibré dans toutes les situations.",
    statMods: { hp: 5, strength: 5, speed: 5, defense: 5 },
    passive: {
      name: "Adaptabilité",
      description: "+5 à toutes les statistiques.",
    },
    weight: 20, // Pondération dans la roue
  },
  {
    id: "elf",
    name: "Elfe",
    icon: "🧝",
    description: "Agile et vif, mais constitution plus fragile.",
    statMods: { hp: -2, strength: 2, speed: 18, defense: -10 },
    passive: {
      name: "Grâce sylvestre",
      description: "Grande vitesse de réaction (+18 vitesse, -10 défense).",
    },
    weight: 15,
  },
  {
    id: "demon",
    name: "Démon",
    icon: "😈",
    description: "Puissance d'attaque dévastatrice au détriment de la protection.",
    statMods: { hp: 4, strength: 20, speed: 6, defense: -12 },
    passive: {
      name: "Fureur infernale",
      description: "Frappes lourdes (+20 force, -12 défense).",
    },
    weight: 12,
  },
  {
    id: "robot",
    name: "Robot",
    icon: "🤖",
    description: "Blindage lourd résistant aux chocs, mais vitesse limitée.",
    statMods: { hp: 12, strength: 6, speed: -14, defense: 22 },
    passive: {
      name: "Châssis en titane",
      description: "Protection massive (+22 défense, -14 vitesse).",
    },
    weight: 12,
  },
  {
    id: "mutant",
    name: "Mutant",
    icon: "☣️",
    description: "Génétique instable provoquant des variations imprévisibles.",
    statMods: { hp: 0, strength: 0, speed: 0, defense: 0 },
    isChaotic: true, // Applique une variance aléatoire étendue (-12 à +20)
    passive: {
      name: "Génome chaotique",
      description: "Modificateurs imprévisibles sur chaque caractéristique.",
    },
    weight: 10,
  },
  {
    id: "golem",
    name: "Golem",
    icon: "🗿",
    description: "Colosse de pierre quasiment inébranlable.",
    statMods: { hp: 25, strength: 12, speed: -22, defense: 25 },
    passive: {
      name: "Écorce rocheuse",
      description: "Santé et défense colossales, inertie très lente.",
    },
    weight: 10,
  },
  {
    id: "vampire",
    name: "Vampire",
    icon: "🧛",
    description: "Créature de la nuit dotée d'une soif de sang régénératrice.",
    statMods: { hp: -4, strength: 14, speed: 10, defense: -6 },
    passive: {
      name: "Soif de sang",
      description: "Attaque rapide et draine 12% des dégâts infligés en PV.",
      lifestealPercent: 12,
    },
    weight: 11,
  },
  {
    id: "alien",
    name: "Alien",
    icon: "👽",
    description: "Physiologie mystique venue d'un autre monde.",
    statMods: { hp: 6, strength: 8, speed: 8, defense: 6 },
    passive: {
      name: "Biologie stellaire",
      description: "Capacités dimensionnelles et synergies uniques.",
      dodgeBonusPercent: 8,
    },
    weight: 10,
  },
];
