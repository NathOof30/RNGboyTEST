/**
 * GÉNÉRATEUR DE PERSONNAGES (Sections 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 38)
 * 
 * Contient les fonctions pures indépendantes de l'interface :
 * - generateCharacter()
 * - calculateStats()
 * - calculateRarity()
 * - calculateSynergies()
 * - calculatePower()
 * - calculateValue()
 */

import { GAME_CONFIG } from "../data/config.js";
import { RACES } from "../data/races.js";
import { WEAPONS } from "../data/weapons.js";
import { POWERS } from "../data/powers.js";
import { SYNERGIES } from "../data/synergies.js";
import { generateCharacterName } from "../data/names.js";
import { randomInt, weightedChoice, randomChoice, createPRNG } from "../utils/random.js";

/**
 * Calcule les synergies actives d'un personnage
 */
export function calculateSynergies(charSummary) {
  const active = [];
  for (const syn of SYNERGIES) {
    try {
      if (syn.condition(charSummary)) {
        active.push({
          id: syn.id,
          name: syn.name,
          icon: syn.icon,
          description: syn.description,
          isUnstable: syn.isUnstable,
          effects: syn.effects,
        });
      }
    } catch (e) {
      console.error("Erreur évaluation synergie", syn.id, e);
    }
  }
  return active;
}

/**
 * Calcule les statistiques d'un personnage en combinant :
 * - base aléatoire équilibrée
 * - modificateurs de race (avec variance chaotique si mutant)
 * - modificateurs d'arme
 * - bonus des synergies
 */
export function calculateStats(baseStats, race, weapon, synergies, rng = Math.random) {
  let hp = baseStats.hp + (race.statMods.hp || 0) + (weapon.statMods.hp || 0);
  let strength = baseStats.strength + (race.statMods.strength || 0) + (weapon.statMods.strength || 0);
  let speed = baseStats.speed + (race.statMods.speed || 0) + (weapon.statMods.speed || 0);
  let defense = baseStats.defense + (race.statMods.defense || 0) + (weapon.statMods.defense || 0);

  // Trait chaotique du mutant
  if (race.isChaotic) {
    hp += randomInt(-10, 20, rng);
    strength += randomInt(-10, 20, rng);
    speed += randomInt(-12, 18, rng);
    defense += randomInt(-10, 18, rng);
  }

  // Bonus passifs provenant des synergies
  for (const syn of synergies) {
    if (syn.effects.strengthBonus) strength += syn.effects.strengthBonus;
    if (syn.effects.defenseBonus) defense += syn.effects.defenseBonus;
    if (syn.effects.speedBonus) speed += syn.effects.speedBonus;
    if (syn.effects.regenBonus) hp += Math.round(syn.effects.regenBonus * 0.5);
  }

  // Bornes de sécurité
  hp = Math.max(30, Math.min(130, Math.round(hp)));
  strength = Math.max(15, Math.min(100, Math.round(strength)));
  speed = Math.max(10, Math.min(100, Math.round(speed)));
  defense = Math.max(10, Math.min(100, Math.round(defense)));

  return { hp, strength, speed, defense };
}

/**
 * Calcule le Score Global / POWER (Section 11)
 * Moyenne pondérée des statistiques + bonus des synergies actives
 */
export function calculatePower(stats, synergies = [], isUnstable = false) {
  const w = GAME_CONFIG.POWER_WEIGHTS;
  const rawScore = 
    (stats.hp * w.HP) +
    (stats.strength * w.STRENGTH) +
    (stats.defense * w.DEFENSE) +
    (stats.speed * w.SPEED) +
    (synergies.length * w.SYNERGY_BONUS) +
    (isUnstable ? w.UNSTABLE_BONUS : 0);

  return Math.max(20, Math.min(100, Math.round(rawScore)));
}

/**
 * Détermine la rareté
 * Si isLuckySpin est actif, utilise la table garantie (0% commun, 60% rare, 30% épique, 10% légendaire)
 */
export function calculateRarity(power, synergiesCount, isLuckySpin = false, forcedRarity = null, rng = Math.random) {
  if (forcedRarity) return forcedRarity;

  const weights = isLuckySpin ? GAME_CONFIG.LUCKY_RARITY_WEIGHTS : GAME_CONFIG.RARITY_WEIGHTS;

  const pool = [
    { item: "common", weight: weights.common },
    { item: "rare", weight: weights.rare },
    { item: "epic", weight: weights.epic },
    { item: "legendary", weight: weights.legendary },
  ];

  let rolledRarity = weightedChoice(pool, rng);

  // Bonus d'évaluation restreint : uniquement pour éviter qu'une combinaison exceptionnelle reste en Commun
  if (power >= 86 && synergiesCount >= 2 && rolledRarity === "common") {
    rolledRarity = "rare";
  }
  if (power >= 95 && synergiesCount >= 2 && rolledRarity === "rare") {
    rolledRarity = "epic";
  }

  return rolledRarity;
}

/**
 * Calcule la valeur marchande / prestige du personnage (Section 29)
 */
export function calculateValue(character) {
  const rarityMult = GAME_CONFIG.RARITIES[character.rarity]?.multiplier || 1.0;
  const baseValue = character.power * 8;
  const synergyValue = (character.synergies?.length || 0) * 45;
  const victoryValue = (character.wins || 0) * 15;
  const unstableValue = character.isUnstable ? 60 : 0;

  return Math.round((baseValue + synergyValue + victoryValue + unstableValue) * rarityMult);
}

/**
 * Calcule la valeur de recyclage en pièces d'or
 */
export function calculateRecycleValue(character) {
  const rarityMult = GAME_CONFIG.RARITIES[character.rarity]?.multiplier || 1.0;
  const synCount = character.synergies ? character.synergies.length : 0;
  const rawVal = (character.power * 1.2) + (synCount * 25);
  return Math.max(35, Math.round(rawVal * rarityMult));
}

/**
 * Fonction maîtresse de génération d'un personnage (V2)
 * @param {Object} options { isLuckySpin, seed, forcedRace, forcedWeapon, forcedPower, forcedRarity, maxStats, workshopUpgrades }
 */
export function generateCharacter(options = {}) {
  const rng = options.seed !== undefined && options.seed !== null
    ? createPRNG(Number(options.seed) || 12345)
    : Math.random;

  const upgrades = options.workshopUpgrades || {};
  const magnetLvl = upgrades.rare_magnet || 0;
  const forgeLvl = upgrades.hero_forge || 0;

  // 1. Choix ou tirage des roues (Race, Arme, Pouvoir)
  const race = options.forcedRace
    ? RACES.find(r => r.id === options.forcedRace) || RACES[0]
    : weightedChoice(RACES.map(r => ({ item: r, weight: r.weight })), rng);

  const weapon = options.forcedWeapon
    ? WEAPONS.find(w => w.id === options.forcedWeapon) || WEAPONS[0]
    : weightedChoice(WEAPONS.map(w => ({ item: w, weight: w.weight })), rng);

  // Pour le Pouvoir : si LuckySpin ou Aimant à Pouvoirs, modifier la pondération
  let powerPool;
  if (options.forcedPower) {
    powerPool = [{ item: POWERS.find(p => p.id === options.forcedPower) || POWERS[0], weight: 100 }];
  } else if (options.isLuckySpin) {
    // Super Spin : Pouvoirs Rares et Mythiques uniquement !
    powerPool = POWERS.filter(p => p.tier === "rare" || p.tier === "mythic").map(p => ({
      item: p,
      weight: p.tier === "mythic" ? 15 : 20,
    }));
  } else {
    powerPool = POWERS.map(p => {
      let w = p.weight;
      // Bonus de l'Aimant de l'Atelier
      if (magnetLvl > 0 && (p.tier === "rare" || p.tier === "mythic")) {
        w += magnetLvl * 3;
      }
      return { item: p, weight: w };
    });
  }

  const power = weightedChoice(powerPool, rng);

  // 2. Évaluation des synergies préliminaires
  const charSummary = {
    raceId: race.id,
    weaponId: weapon.id,
    powerId: power.id,
  };
  const synergies = calculateSynergies(charSummary);
  const isUnstable = synergies.some(s => s.isUnstable);

  // 3. Tirage des statistiques de base
  const baseCfg = GAME_CONFIG.BASE_STATS;
  let baseStats;
  if (options.maxStats) {
    baseStats = { hp: 85, strength: 80, speed: 80, defense: 80 };
  } else {
    baseStats = {
      hp: randomInt(baseCfg.HP_MIN, baseCfg.HP_MAX, rng),
      strength: randomInt(baseCfg.STRENGTH_MIN, baseCfg.STRENGTH_MAX, rng),
      speed: randomInt(baseCfg.SPEED_MIN, baseCfg.SPEED_MAX, rng),
      defense: randomInt(baseCfg.DEFENSE_MIN, baseCfg.DEFENSE_MAX, rng),
    };
  }

  // Bonus passif de la Forge des Héros de l'Atelier
  if (forgeLvl > 0) {
    baseStats.hp += forgeLvl * 3;
    baseStats.strength += forgeLvl * 2;
  }

  // 4. Calcul des stats finales
  const finalStats = calculateStats(baseStats, race, weapon, synergies, rng);

  // 5. Calcul du Power / Score global
  const powerScore = calculatePower(finalStats, synergies, isUnstable);

  // 6. Rareté
  const rarity = calculateRarity(
    powerScore,
    synergies.length,
    options.isLuckySpin,
    options.forcedRarity,
    rng
  );

  // Si maxStats demandé en dev mode, forcer légendaire
  const finalRarity = options.maxStats ? "legendary" : rarity;

  // 7. Génération du nom
  const name = generateCharacterName(race.id, rng);

  // 8. Identifiant unique
  const id = "char_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);

  // Assemblage de l'objet personnage complet
  const character = {
    id,
    name,
    owner_id: "player_1",
    created_at: new Date().toISOString(),
    isLuckySpin: !!options.isLuckySpin,
    isUnstable,

    // Éléments tirés des roues
    race: race.name,
    raceId: race.id,
    raceIcon: race.icon,

    weapon: weapon.name,
    weaponId: weapon.id,
    weaponIcon: weapon.icon,

    power: power.name,
    powerId: power.id,
    powerIcon: power.icon,
    powerTier: power.tier,

    // Statistiques
    hp: finalStats.hp,
    maxHp: finalStats.hp,
    strength: finalStats.strength,
    speed: finalStats.speed,
    defense: finalStats.defense,

    // Score et Rareté
    power: powerScore,
    rarity: finalRarity,

    // Synergies détectées
    synergies,

    // Historique de combats
    battlesCount: 0,
    wins: 0,
    losses: 0,

    // Valeur calculée et recyclage
    value: 0,
    recycleValue: 0,
  };

  character.value = calculateValue(character);
  character.recycleValue = calculateRecycleValue(character);

  return character;
}
