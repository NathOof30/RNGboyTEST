/**
 * MOTEUR DE COMBAT AUTOMATIQUE TOUR PAR TOUR (Sections 19, 20, 21, 22, 46)
 * 
 * - Reproductible avec une seed optionnelle
 * - Logique tactique solide (PAS de résultat purement RNG)
 * - Gestion complète des statistiques, armes, pouvoirs et synergies
 * - Journal détaillé des actions tour par tour
 */

import { createPRNG, randomInt } from "../utils/random.js";

/**
 * Prépare une instance combattante en combat avec ses jauges dynamiques
 */
function createCombatant(char, index) {
  // Bouclier initial (ex: synergie Bâton + Régénération)
  let initialShield = 0;
  for (const s of char.synergies || []) {
    if (s.effects?.shieldHp) initialShield += s.effects.shieldHp;
  }

  return {
    index,
    id: char.id,
    name: char.name,
    raceId: char.raceId,
    race: char.race,
    raceIcon: char.raceIcon,
    weaponId: char.weaponId,
    weapon: char.weapon,
    weaponIcon: char.weaponIcon,
    powerId: char.powerId,
    power: char.power,
    powerIcon: char.powerIcon,
    powerScore: char.power,
    rarity: char.rarity,
    synergies: char.synergies || [],
    isUnstable: char.isUnstable,

    // Stats dynamiques pendant le combat
    maxHp: char.maxHp || char.hp,
    currentHp: char.maxHp || char.hp,
    strength: char.strength,
    baseSpeed: char.speed,
    currentSpeed: char.speed,
    defense: char.defense,
    shield: initialShield,

    // Statuts et effets actifs
    isStunned: false,
    isFrozen: false,
    burnTurnsRemaining: 0,
    burnDamage: 0,
    poisonTurnsRemaining: 0,
    poisonCurrentTick: 0,
    firstAttackDone: false,
    firstTurnDodgeUsed: false,
  };
}

/**
 * Simule un combat complet entre deux personnages
 * @param {Object} char1 Personnage joueur
 * @param {Object} char2 Personnage adversaire
 * @param {Object} options { seed: number | string }
 * @returns {Object} Résultat avec gagnant, perdant et historique complet des tours
 */
export function simulateBattle(char1, char2, options = {}) {
  const seed = options.seed !== undefined && options.seed !== null
    ? Number(options.seed)
    : Math.floor(Math.random() * 1000000);

  const rng = createPRNG(seed);

  const f1 = createCombatant(char1, 1);
  const f2 = createCombatant(char2, 2);

  const logs = [];
  let turnNumber = 0;
  const maxTurns = 30; // Sécurité anti-boucle infinie

  // Helper pour ajouter une ligne de log
  const addLog = (text, type = "info", details = {}) => {
    logs.push({
      turn: turnNumber,
      text,
      type, // 'info', 'attack', 'power', 'synergy', 'dodge', 'heal', 'defeat'
      f1Hp: Math.max(0, f1.currentHp),
      f2Hp: Math.max(0, f2.currentHp),
      f1Shield: f1.shield,
      f2Shield: f2.shield,
      ...details,
    });
  };

  addLog(
    `⚔️ Début du duel : ${f1.name} (${f1.powerScore} Power) affronte ${f2.name} (${f2.powerScore} Power) !`,
    "info"
  );

  // Annonce des boucliers initiaux
  if (f1.shield > 0) addLog(`🪄 ${f1.name} démarre avec un bouclier arcanique de ${f1.shield} PV !`, "synergy");
  if (f2.shield > 0) addLog(`🪄 ${f2.name} démarre avec un bouclier arcanique de ${f2.shield} PV !`, "synergy");

  // Boucle des tours de combat
  while (f1.currentHp > 0 && f2.currentHp > 0 && turnNumber < maxTurns) {
    turnNumber++;
    addLog(`--- TOUR ${turnNumber} ---`, "info");

    // Phase 1 : Effets de début de tour (DoT, HoT, etc.)
    applyTurnStartEffects(f1, addLog, rng);
    if (f1.currentHp <= 0) break;

    applyTurnStartEffects(f2, addLog, rng);
    if (f2.currentHp <= 0) break;

    // Phase 2 : Ordre d'initiative basé sur la vitesse
    let first = f1;
    let second = f2;

    // Comparaison de vitesse dynamique
    if (f2.currentSpeed > f1.currentSpeed) {
      first = f2;
      second = f1;
    } else if (f2.currentSpeed === f1.currentSpeed) {
      // Égalité : tirage au sort
      if (rng() > 0.5) {
        first = f2;
        second = f1;
      }
    }

    // Phase 3 : Action du premier combattant
    executeFighterTurn(first, second, addLog, rng, turnNumber);
    if (second.currentHp <= 0) break;

    // Phase 4 : Action du second combattant
    executeFighterTurn(second, first, addLog, rng, turnNumber);
    if (first.currentHp <= 0) break;
  }

  // Fin du combat
  let winner = null;
  let loser = null;

  if (f1.currentHp > 0 && f2.currentHp <= 0) {
    winner = char1;
    loser = char2;
    addLog(`🏆 ${f1.name} triomphe avec ${f1.currentHp} PV restants !`, "victory");
  } else if (f2.currentHp > 0 && f1.currentHp <= 0) {
    winner = char2;
    loser = char1;
    addLog(`💀 ${f2.name} l'emporte. ${f1.name} est à terre.`, "defeat");
  } else {
    // Cas limite : égalité ou fin des 30 tours (vainqueur aux PV relatifs)
    const ratio1 = f1.currentHp / f1.maxHp;
    const ratio2 = f2.currentHp / f2.maxHp;
    if (ratio1 >= ratio2) {
      winner = char1;
      loser = char2;
      addLog(`⏱️ Fin du combat : Victoire aux points pour ${f1.name} !`, "victory");
    } else {
      winner = char2;
      loser = char1;
      addLog(`⏱️ Fin du combat : Victoire aux points pour ${f2.name} !`, "defeat");
    }
  }

  return {
    seed,
    winner,
    loser,
    isPlayerWinner: winner.id === char1.id,
    totalTurns: turnNumber,
    logs,
    f1FinalHp: Math.max(0, f1.currentHp),
    f2FinalHp: Math.max(0, f2.currentHp),
    f1MaxHp: f1.maxHp,
    f2MaxHp: f2.maxHp,
  };
}

/**
 * Effets de début de tour (Brûlure, Poison, Régénération, Corrosion Robot)
 */
function applyTurnStartEffects(fighter, addLog, rng) {
  // 1. Régénération de PV (Pouvoir & Synergies)
  if (fighter.powerId === "regeneration" && fighter.currentHp < fighter.maxHp) {
    let regenAmount = 12;
    const synRegen = fighter.synergies.find(s => s.effects?.regenBonus);
    if (synRegen) regenAmount += synRegen.effects.regenBonus;

    const actualHeal = Math.min(regenAmount, fighter.maxHp - fighter.currentHp);
    fighter.currentHp += actualHeal;
    addLog(`💖 ${fighter.name} régénère ${actualHeal} PV (${fighter.currentHp}/${fighter.maxHp})`, "heal");
  }

  // 2. DoT de Brûlure
  if (fighter.burnTurnsRemaining > 0) {
    const burnDmg = fighter.burnDamage || 8;
    fighter.currentHp -= burnDmg;
    fighter.burnTurnsRemaining--;
    addLog(`🔥 ${fighter.name} brûle et subit ${burnDmg} dégâts de feu !`, "power");
  }

  // 3. DoT de Poison
  if (fighter.poisonTurnsRemaining > 0) {
    fighter.poisonCurrentTick += 5;
    const poisonDmg = fighter.poisonCurrentTick;
    fighter.currentHp -= poisonDmg;
    fighter.poisonTurnsRemaining--;
    addLog(`🧪 Le poison ronge ${fighter.name} (-${poisonDmg} dégâts) !`, "power");
  }

  // 4. Synergie Instable Robot + Poison (Infection Artificielle : corrosion propre)
  const unstableRobot = fighter.synergies.find(s => s.id === "robot_poison");
  if (unstableRobot) {
    fighter.currentHp -= 4;
    addLog(`☣️ Fuite de circuit sur ${fighter.name} : corrosion interne de 4 PV.`, "synergy");
  }

  // 5. Synergie Instable Mutant + Gravité (Stats chaotiques)
  const chaoticShift = fighter.synergies.find(s => s.id === "mutant_gravity");
  if (chaoticShift) {
    const shift = randomInt(-10, 20, rng);
    fighter.strength = Math.max(20, fighter.strength + shift);
    addLog(`🌌 Mutation gravitationnelle de ${fighter.name} : Force modifiée de ${shift > 0 ? "+" + shift : shift} !`, "synergy");
  }
}

/**
 * Exécute l'action d'un combattant attaquant vers un défenseur
 */
function executeFighterTurn(attacker, defender, addLog, rng, turnNumber) {
  // Vérification de contrôle (Étourdissement / Gel)
  if (attacker.isStunned) {
    addLog(`💫 ${attacker.name} est étourdi et ne peut pas agir ce tour !`, "info");
    attacker.isStunned = false;
    return;
  }
  if (attacker.isFrozen) {
    addLog(`❄️ ${attacker.name} est complètement gelé et passe son tour !`, "info");
    attacker.isFrozen = false;
    return;
  }

  // 1. Calcul d'esquive du défenseur
  let dodgeChance = 0;
  if (defender.powerId === "teleportation") dodgeChance += 0.28;
  if (defender.raceId === "alien") dodgeChance += 0.08;
  const alienSyn = defender.synergies.find(s => s.id === "alien_teleport");
  if (alienSyn) dodgeChance += 0.30;

  // Synergie Instable Golem + Téléportation
  const golemTeleport = defender.synergies.find(s => s.id === "golem_teleport");
  if (golemTeleport) dodgeChance += 0.20;

  // Invisibilité au premier tour
  if (defender.powerId === "invisibility" && !defender.firstTurnDodgeUsed) {
    dodgeChance = 1.0;
    defender.firstTurnDodgeUsed = true;
    addLog(`👁️‍🗨️ ${defender.name} s'évapore dans l'invisibilité et esquive le coup !`, "dodge");
    return;
  }

  // Vérifier si la lance perce l'esquive
  const spearPierces = attacker.synergies.some(s => s.effects?.pierceDodge);
  if (!spearPierces && dodgeChance > 0 && rng() < dodgeChance) {
    addLog(`🌀 ${defender.name} esquive habilement l'attaque de ${attacker.name} !`, "dodge");

    // Contre-attaque Alien Distorsion Spatiale
    if (alienSyn) {
      const counterDmg = Math.max(8, Math.round(defender.strength * 0.45));
      applyDamageToTarget(defender, attacker, counterDmg, addLog, "🌀 Contre-attaque spatiale d'Alien");
    }
    // Golem écrasement lourd après téléportation
    if (golemTeleport) {
      const crushDmg = 30;
      applyDamageToTarget(defender, attacker, crushDmg, addLog, "☄️ Golem retombe lourdement sur l'adversaire");
    }
    return;
  }

  // 2. Calcul des dégâts de base (Formule Section 21 & 22 : Force vs Défense)
  // Base : 75% Force attaquante - 38% Défense défensive + légère variation aléatoire de (-3 à +3)
  const baseDmg = (attacker.strength * 0.75) - (defender.defense * 0.38);
  const variance = (rng() * 6) - 3;
  let finalDamage = Math.max(6, baseDmg + variance);

  // 3. Multiplicateurs d'armes et passifs
  // Allonge de la Lance au 1er coup
  if (attacker.weaponId === "spear" && !attacker.firstAttackDone) {
    finalDamage *= 1.25;
    addLog(`🔱 Allonge de la Lance : premier coup renforcé pour ${attacker.name} !`, "attack");
  }

  // Bonus opportunisme de la Dague contre cible plus lente
  if (attacker.weaponId === "dagger" && attacker.currentSpeed > defender.currentSpeed) {
    finalDamage *= 1.30;
  }

  // Coup critique (Pistolet, Foudre, Archer naturel)
  let critChance = 0.08; // Base 8%
  let critMult = 1.5;

  if (attacker.weaponId === "gun") {
    critChance += 0.25;
    critMult = 1.75;
  }
  if (attacker.powerId === "lightning") {
    critChance += 0.35;
    critMult = 1.8;
  }
  const elfBow = attacker.synergies.find(s => s.id === "elf_bow");
  if (elfBow) critChance += 0.20;

  const gunLight = attacker.synergies.find(s => s.id === "gun_lightning");
  if (gunLight) {
    critChance += 0.25;
    critMult = 2.0;
  }

  // Assassin fantôme (Dague + Invisibilité)
  const assassinSyn = attacker.synergies.find(s => s.id === "dagger_invis");
  if (assassinSyn && !attacker.firstAttackDone) {
    critChance = 1.0;
    critMult = 2.2;
  }

  let isCrit = false;
  if (rng() < critChance) {
    isCrit = true;
    finalDamage *= critMult;
  }

  // Synergie Démon + Feu (+18% dégâts globaux)
  const demonFire = attacker.synergies.find(s => s.id === "demon_fire");
  if (demonFire) finalDamage *= 1.18;

  // Synergie Grimoire (bonus magique)
  const grimoireBoost = attacker.synergies.find(s => s.id === "grimoire_elemental");
  if (grimoireBoost) finalDamage *= 1.20;

  // Combinaison Instable Démon + Glace (Choc thermique imprévisible 0.5x à 2.2x)
  const unstableThermal = attacker.synergies.find(s => s.id === "demon_ice");
  if (unstableThermal) {
    const mult = 0.5 + (rng() * 1.7);
    finalDamage *= mult;
  }

  // Réduction de dégâts défensifs (ex: Maître d'armes, Gravité)
  const humanSword = defender.synergies.find(s => s.id === "human_sword");
  if (humanSword) finalDamage *= 0.90;

  if (defender.powerId === "gravity") finalDamage *= 0.85;

  finalDamage = Math.max(5, Math.round(finalDamage));

  // 4. Application des dégâts
  const critPrefix = isCrit ? "💥 COUP CRITIQUE ! " : "";
  addLog(
    `${critPrefix}${attacker.name} attaque avec ${attacker.weaponIcon} ${attacker.weapon} (${finalDamage} dégâts)`,
    isCrit ? "power" : "attack",
    { damage: finalDamage }
  );

  applyDamageToTarget(attacker, defender, finalDamage, addLog);

  // Vol de vie Vampire
  if (attacker.raceId === "vampire" && defender.currentHp > 0) {
    const lifestealRate = attacker.synergies.some(s => s.id === "vampire_regen") ? 0.25 : 0.12;
    const lifestealHp = Math.max(1, Math.round(finalDamage * lifestealRate));
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + lifestealHp);
    addLog(`🩸 Soif de sang : ${attacker.name} draine ${lifestealHp} PV !`, "heal");
  }

  // 5. Déclenchement des effets secondaires de pouvoirs & armes sur le défenseur
  // Étourdissement du marteau
  if (attacker.weaponId === "hammer" && rng() < 0.25) {
    defender.isStunned = true;
    addLog(`🔨 L'impact de ${attacker.name} étourdit ${defender.name} !`, "power");
  }

  // Synergie Golem + Marteau (40% étourdissement)
  const golemHammer = attacker.synergies.find(s => s.id === "golem_hammer");
  if (golemHammer && rng() < 0.40) {
    defender.isStunned = true;
    addLog(`🗿🔨 Écrasement tellurique ! ${defender.name} chancelle et perd son tour !`, "synergy");
  }

  // Brûlure du Feu
  if (attacker.powerId === "fire" && defender.burnTurnsRemaining === 0) {
    let burnDmg = 8;
    if (demonFire) burnDmg = Math.round(burnDmg * 1.5);
    defender.burnDamage = burnDmg;
    defender.burnTurnsRemaining = 3;
    addLog(`🔥 ${defender.name} prend feu ! (${burnDmg} dégâts/tour)`, "power");
  }

  // Ralentissement de la Glace
  if (attacker.powerId === "ice") {
    defender.currentSpeed = Math.max(10, Math.round(defender.currentSpeed * 0.70));
    if (rng() < 0.15) defender.isFrozen = true;
    addLog(`❄️ Le gel ralentit ${defender.name} (Vitesse: ${defender.currentSpeed})`, "power");
  }

  // Ralentissement de la Gravité
  if (attacker.powerId === "gravity") {
    defender.currentSpeed = Math.max(10, Math.round(defender.currentSpeed * 0.60));
    addLog(`🌌 Pression gravitationnelle : la vitesse de ${defender.name} chute à ${defender.currentSpeed} !`, "power");
  }

  // Poison progressif
  if (attacker.powerId === "poison" && defender.poisonTurnsRemaining === 0) {
    defender.poisonTurnsRemaining = 3;
    defender.poisonCurrentTick = 0;
    addLog(`🧪 Toxine injectée dans ${defender.name} !`, "power");
  }

  // Synergie Robot + Foudre (Le robot absorbe la foudre et se recharge)
  if (defender.raceId === "robot" && attacker.powerId === "lightning") {
    defender.currentHp = Math.min(defender.maxHp, defender.currentHp + 8);
    addLog(`⚡🤖 Supraconducteur : ${defender.name} absorbe la foudre et régénère 8 PV !`, "synergy");
  }

  // Combinaison Instable Démon + Glace : applique aussi le gel
  if (unstableThermal && rng() < 0.5) {
    defender.currentSpeed = Math.max(10, Math.round(defender.currentSpeed * 0.75));
    addLog(`💥 Combustion Glacée : le choc thermique glace également les rouages de ${defender.name} !`, "synergy");
  }

  attacker.firstAttackDone = true;
}

/**
 * Applique des dégâts directs à un défenseur en prenant en compte le bouclier
 */
function applyDamageToTarget(attacker, target, damage, addLog, reasonText = null) {
  let remainingDmg = damage;

  if (target.shield > 0) {
    if (target.shield >= remainingDmg) {
      target.shield -= remainingDmg;
      addLog(`🛡️ Le bouclier de ${target.name} absorbe ${remainingDmg} dégâts (Bouclier: ${target.shield})`, "info");
      remainingDmg = 0;
    } else {
      remainingDmg -= target.shield;
      addLog(`🛡️ Le bouclier de ${target.name} vole en éclats sous l'assaut !`, "info");
      target.shield = 0;
    }
  }

  if (remainingDmg > 0) {
    target.currentHp -= remainingDmg;
    if (reasonText) {
      addLog(`${reasonText} inflige ${remainingDmg} dégâts à ${target.name} !`, "power");
    }
  }

  if (target.currentHp < 0) target.currentHp = 0;
}
