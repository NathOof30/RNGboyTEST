/**
 * SIMULATEUR DE MASSE (Section 36)
 * Permet de lancer 1000 (ou N) générations instantanées et d'analyser
 * la distribution statistique : raretés, races, pouvoirs, synergies, moyennes de stats.
 */

import { generateCharacter } from "./characterGenerator.js";

export function simulateMassGenerations(count = 1000, isDaily = false) {
  const startTime = performance.now();

  const rarityCounts = { common: 0, rare: 0, epic: 0, legendary: 0 };
  const raceCounts = {};
  const weaponCounts = {};
  const powerCounts = {};
  const comboCounts = {};
  const synergyCounts = {};

  let sumHp = 0;
  let sumStrength = 0;
  let sumSpeed = 0;
  let sumDefense = 0;
  let sumPower = 0;

  let minPower = 100;
  let maxPower = 0;
  let unstableCount = 0;

  for (let i = 0; i < count; i++) {
    const char = generateCharacter({ isDaily });

    // Rareté
    rarityCounts[char.rarity] = (rarityCounts[char.rarity] || 0) + 1;

    // Éléments
    raceCounts[char.race] = (raceCounts[char.race] || 0) + 1;
    weaponCounts[char.weapon] = (weaponCounts[char.weapon] || 0) + 1;
    powerCounts[char.power] = (powerCounts[char.power] || 0) + 1;

    // Combinaison (Race + Arme + Pouvoir)
    const comboKey = `${char.race} + ${char.weapon} + ${char.power}`;
    comboCounts[comboKey] = (comboCounts[comboKey] || 0) + 1;

    // Synergies
    for (const syn of char.synergies || []) {
      synergyCounts[syn.name] = (synergyCounts[syn.name] || 0) + 1;
    }

    if (char.isUnstable) unstableCount++;

    // Stats
    sumHp += char.hp;
    sumStrength += char.strength;
    sumSpeed += char.speed;
    sumDefense += char.defense;
    sumPower += char.power;

    if (char.power < minPower) minPower = char.power;
    if (char.power > maxPower) maxPower = char.power;
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Trouver les plus et moins fréquents
  const getTop = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];
  const getBottom = (obj) => Object.entries(obj).sort((a, b) => a[1] - b[1])[0] || ["N/A", 0];

  const topRace = getTop(raceCounts);
  const topWeapon = getTop(weaponCounts);
  const topPower = getTop(powerCounts);
  const topSynergy = getTop(synergyCounts);
  const rarestCombo = getBottom(comboCounts);

  return {
    count,
    isDaily,
    durationMs,
    rarityPercentages: {
      common: ((rarityCounts.common / count) * 100).toFixed(1),
      rare: ((rarityCounts.rare / count) * 100).toFixed(1),
      epic: ((rarityCounts.epic / count) * 100).toFixed(1),
      legendary: ((rarityCounts.legendary / count) * 100).toFixed(1),
    },
    rarityCounts,
    mostFrequentRace: `${topRace[0]} (${topRace[1]} tirages, ${((topRace[1] / count) * 100).toFixed(1)}%)`,
    mostFrequentWeapon: `${topWeapon[0]} (${topWeapon[1]} tirages, ${((topWeapon[1] / count) * 100).toFixed(1)}%)`,
    mostFrequentPower: `${topPower[0]} (${topPower[1]} tirages, ${((topPower[1] / count) * 100).toFixed(1)}%)`,
    mostFrequentSynergy: topSynergy[0] !== "N/A" ? `${topSynergy[0]} (${topSynergy[1]} apparitions)` : "Aucune",
    rarestCombo: `${rarestCombo[0]} (${rarestCombo[1]} occurrence${rarestCombo[1] > 1 ? "s" : ""})`,
    unstablePercent: ((unstableCount / count) * 100).toFixed(1),
    averages: {
      hp: Math.round(sumHp / count),
      strength: Math.round(sumStrength / count),
      speed: Math.round(sumSpeed / count),
      defense: Math.round(sumDefense / count),
      power: Math.round(sumPower / count),
    },
    minPower,
    maxPower,
  };
}
