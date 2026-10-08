/**
 * DÉFINITION DES ARMES (Section 8)
 * Chaque arme confère des bonus de statistiques et des effets en combat.
 */

export const WEAPONS = [
  {
    id: "sword",
    name: "Épée",
    icon: "⚔️",
    type: "melee",
    description: "Épée forgée équilibrant tranchant et parade.",
    statMods: { hp: 0, strength: 12, speed: 4, defense: 6 },
    passive: {
      name: "Tranchant droit",
      description: "+12 Force et +6 Défense.",
    },
    weight: 15,
  },
  {
    id: "bow",
    name: "Arc",
    icon: "🏹",
    type: "ranged",
    description: "Tir rapide à longue distance.",
    statMods: { hp: 0, strength: 6, speed: 16, defense: -2 },
    passive: {
      name: "Tir d'alerte",
      description: "+16 Vitesse. Permet souvent d'attaquer en premier.",
    },
    weight: 15,
  },
  {
    id: "hammer",
    name: "Marteau",
    icon: "🔨",
    type: "heavy",
    description: "Masse gigantesque infligeant de violents traumatismes.",
    statMods: { hp: 5, strength: 24, speed: -12, defense: 8 },
    passive: {
      name: "Impact lourd",
      description: "Dégâts très élevés, 25% de chance d'étourdir la cible.",
      stunChance: 0.25,
    },
    weight: 12,
  },
  {
    id: "spear",
    name: "Lance",
    icon: "🔱",
    type: "reach",
    description: "Allonge imposante permettant de frapper avant l'ennemi.",
    statMods: { hp: 2, strength: 10, speed: 10, defense: 4 },
    passive: {
      name: "Estoc fulgurant",
      description: "+25% dégâts lors du tout premier coup porté.",
      firstStrikeBonus: 0.25,
    },
    weight: 14,
  },
  {
    id: "dagger",
    name: "Dague",
    icon: "🗡️",
    type: "assassin",
    description: "Lame furtive redoutable contre les cibles plus lentes.",
    statMods: { hp: -2, strength: 8, speed: 20, defense: -4 },
    passive: {
      name: "Opportunisme",
      description: "+30% dégâts si la vitesse dépasse celle de l'adversaire.",
      speedAdvantageBonus: 0.30,
    },
    weight: 12,
  },
  {
    id: "staff",
    name: "Bâton",
    icon: "🪄",
    type: "magic",
    description: "Bâton d'arcaniste canalisant l'énergie vitale et magique.",
    statMods: { hp: 8, strength: 6, speed: 6, defense: 6 },
    passive: {
      name: "Résonance arcanique",
      description: "Renforce les soins et les effets de contrôle des pouvoirs.",
      magicEmpower: 1.25,
    },
    weight: 12,
  },
  {
    id: "gun",
    name: "Pistolet",
    icon: "🔫",
    type: "ranged",
    description: "Arme balistique rapide avec tirs perforants.",
    statMods: { hp: 0, strength: 14, speed: 12, defense: -4 },
    passive: {
      name: "Tir de précision",
      description: "25% de chance de coup critique (dégâts x1.75).",
      critChance: 0.25,
      critMultiplier: 1.75,
    },
    weight: 11,
  },
  {
    id: "grimoire",
    name: "Grimoire",
    icon: "📖",
    type: "spellbook",
    description: "Tome ancien renfermant des formules élémentaires dévastatrices.",
    statMods: { hp: 0, strength: 16, speed: 2, defense: 2 },
    passive: {
      name: "Magie primordiale",
      description: "+35% sur l'effet des pouvoirs élémentaires (Feu, Glace, Poison, Foudre).",
      elementalBoost: 0.35,
    },
    weight: 11,
  },
];
