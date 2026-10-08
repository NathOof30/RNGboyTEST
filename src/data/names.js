/**
 * SYSTÈME DE GÉNÉRATION DE NOMS ALÉATOIRES (Section 15)
 * Combine des préfixes et suffixes de syllabes stylisées,
 * ou utilise des désignations adaptées aux robots/aliens (ex: X-17, Cyber-09).
 */

import { randomChoice, randomInt } from "../utils/random.js";

const PREFIXES = [
  "Var", "Zor", "Lyr", "Kor", "Nym", "Xer", "Val", "Ryn",
  "Thal", "Drak", "Zeph", "Mal", "Ka", "Syr", "Mor", "Ael",
  "Tor", "Brak", "Gry", "Vex", "Sol", "Nyx", "Ign", "Cryo",
  "Fen", "Kael", "Rha", "Vol", "Jax", "Orn", "Dax", "Zen"
];

const SUFFIXES = [
  "k", "an", "a", "r", "on", "o", "is", "en",
  "or", "ath", "ys", "mir", "th", "us", "ix", "el",
  "um", "ar", "ox", "ia", "ax", "or", "in", "ash"
];

const ROBOT_PREFIXES = ["MK", "Unit", "X", "Cyber", "Volt", "Core", "Nexus", "Zero"];

export function generateCharacterName(raceId = "human", rng = Math.random) {
  if (raceId === "robot" && rng() > 0.4) {
    const pre = randomChoice(ROBOT_PREFIXES, rng);
    const num = randomInt(1, 99, rng);
    return `${pre}-${num}`;
  }

  const prefix = randomChoice(PREFIXES, rng);
  const suffix = randomChoice(SUFFIXES, rng);
  let name = prefix + suffix;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
