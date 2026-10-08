/**
 * GESTION DES ADVERSAIRES (Sections 23 & 24)
 * Permet de générer des rivaux pour le Mode Rapide et la liste des Défis de l'arène.
 */

import { generateCharacter } from "../generation/characterGenerator.js";
import { RACES } from "../data/races.js";
import { WEAPONS } from "../data/weapons.js";
import { POWERS } from "../data/powers.js";

export function generateChallengersList(playerHighestPower = 65) {
  // Génère une sélection de 4 adversaires de puissances variées
  const targets = [
    { nameModifier: "Initié", powerTarget: Math.max(45, playerHighestPower - 8) },
    { nameModifier: "Rival", powerTarget: playerHighestPower },
    { nameModifier: "Champion", powerTarget: playerHighestPower + 6 },
    { nameModifier: "Boss Suprême", powerTarget: playerHighestPower + 12 },
  ];

  return targets.map((t, idx) => {
    let bestMatch = null;
    let closestDiff = 999;

    // Essaie 5 tirages pour trouver un perso approchant le power cible
    for (let i = 0; i < 6; i++) {
      const candidate = generateCharacter();
      const diff = Math.abs(candidate.power - t.powerTarget);
      if (diff < closestDiff) {
        closestDiff = diff;
        bestMatch = candidate;
      }
    }

    bestMatch.arenaRank = t.nameModifier;
    return bestMatch;
  });
}

/**
 * Génère un adversaire pour le combat rapide (Mode A)
 */
export function generateQuickOpponent(playerChar) {
  const targetPower = playerChar ? playerChar.power : 65;
  let bestCandidate = null;
  let minDiff = 999;

  for (let i = 0; i < 5; i++) {
    const candidate = generateCharacter();
    const diff = Math.abs(candidate.power - targetPower);
    if (diff < minDiff) {
      minDiff = diff;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}
