/**
 * GESTIONNAIRE DE PROGRESSION ET ÉCONOMIE — V2
 * 
 * - Monnaie : Pièces d'or (Coins 🪙)
 * - Invocations : 3 charges max, 1 recharge toutes les 4 minutes
 * - Tickets d'Arène : 5 tickets max, 1 recharge toutes les 5 minutes
 * - Jauge de Chance (Pity 10/10) : Remplace le Daily, 10ème spin garanti Super Spin
 * - Système ÉLO officiel (FIDE) et Ligues (Bronze, Argent, Or, Platine, Maître)
 * - Recyclage de cartes en pièces
 * - Atelier d'améliorations permanentes
 */

import { GAME_CONFIG } from "../data/config.js";
import { collectionManager } from "../collection/collectionManager.js";

const PROGRESSION_KEY = "wheelborn_progression_v2";
const LEGACY_KEY = "wheelborn_progression";

export class ProgressionManager {
  constructor() {
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      coins: 250,
      xp: 0,
      level: 1,
      elo: GAME_CONFIG.ELO_CONFIG.STARTING_ELO, // 1000 de base

      // Jauge de chance (Pity au 10ème tirage)
      pityCounter: 0,

      // Invocations rapides (3 charges, recharge toutes les 4 min)
      spinEnergy: {
        available: GAME_CONFIG.SPIN_ENERGY.STARTER_CHARGES,
        lastRegenTimestamp: Date.now(),
      },

      // Tickets d'Arène (5 tickets, recharge toutes les 5 min)
      arenaEnergy: {
        available: GAME_CONFIG.ARENA_ENERGY.STARTER_TICKETS,
        lastRegenTimestamp: Date.now(),
      },

      // Améliorations de l'Atelier
      workshopUpgrades: {
        rare_magnet: 0,     // 0 à 5
        hero_forge: 0,      // 0 à 5
        arena_bonus: 0,     // 0 à 3
        emergency_count_today: 0,
        last_emergency_date: new Date().toDateString(),
      },

      // Statistiques globales
      stats: {
        totalGenerations: 0,
        totalBattles: 0,
        wins: 0,
        losses: 0,
        legendariesCount: 0,
        highestPower: 0,
        totalRecycled: 0,
        coinsEarnedTotal: 250,
        discoveredSynergies: [],
        discoveredPowers: [],
      },

      unlockedAchievements: {},
    };
  }

  loadState() {
    try {
      const data = localStorage.getItem(PROGRESSION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...this.getDefaultState(), ...parsed };
      }

      // Migration de l'ancien format si existant
      const oldData = localStorage.getItem(LEGACY_KEY);
      if (oldData) {
        const oldParsed = JSON.parse(oldData);
        const def = this.getDefaultState();
        return {
          ...def,
          coins: oldParsed.points || def.coins,
          xp: oldParsed.xp || 0,
          level: oldParsed.level || 1,
          stats: { ...def.stats, ...(oldParsed.stats || {}) },
          unlockedAchievements: oldParsed.unlockedAchievements || {},
        };
      }
    } catch (e) {
      console.warn("Erreur chargement progression V2", e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Erreur sauvegarde progression V2", e);
    }
  }

  // --- MONNAIE : PIÈCES (COINS 🪙) ---

  getCoins() {
    return this.state.coins || 0;
  }

  addCoins(amount) {
    this.state.coins = Math.max(0, (this.state.coins || 0) + amount);
    this.state.stats.coinsEarnedTotal = (this.state.stats.coinsEarnedTotal || 0) + amount;
    this.saveState();
    return this.state.coins;
  }

  spendCoins(amount) {
    if ((this.state.coins || 0) < amount) return false;
    this.state.coins -= amount;
    this.saveState();
    return true;
  }

  // --- XP & NIVEAUX ---

  addXP(amount) {
    this.state.xp += amount;
    const oldLevel = this.state.level;
    this.recalculateLevel();
    const leveledUp = this.state.level > oldLevel;
    this.saveState();
    return { currentXP: this.state.xp, currentLevel: this.state.level, leveledUp };
  }

  recalculateLevel() {
    const levels = GAME_CONFIG.LEVELS;
    let currentLvl = 1;
    for (const lvl of levels) {
      if (this.state.xp >= lvl.xpRequired) {
        currentLvl = lvl.level;
      } else {
        break;
      }
    }
    this.state.level = currentLvl;
  }

  getCurrentLevelInfo() {
    const levels = GAME_CONFIG.LEVELS;
    const current = levels.find(l => l.level === this.state.level) || levels[0];
    const next = levels.find(l => l.level === this.state.level + 1) || null;

    let progressPercent = 100;
    let nextXp = current.xpRequired;

    if (next) {
      const xpInCurrentLevel = this.state.xp - current.xpRequired;
      const range = next.xpRequired - current.xpRequired;
      progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / range) * 100)));
      nextXp = next.xpRequired;
    }

    return {
      level: current.level,
      title: current.title,
      currentXP: this.state.xp,
      nextLevelXP: nextXp,
      progressPercent,
    };
  }

  // --- CHARGES DE TIRAGE (3 max, recharge 4 minutes) ---

  checkAndRegenSpinEnergy() {
    const cfg = GAME_CONFIG.SPIN_ENERGY;
    if (!this.state.spinEnergy) {
      this.state.spinEnergy = {
        available: cfg.STARTER_CHARGES,
        lastRegenTimestamp: Date.now(),
      };
    }

    const energy = this.state.spinEnergy;
    if (energy.available < cfg.MAX_CHARGES) {
      const now = Date.now();
      const elapsed = now - (energy.lastRegenTimestamp || now);
      if (elapsed >= cfg.REGEN_INTERVAL_MS) {
        const recharged = Math.floor(elapsed / cfg.REGEN_INTERVAL_MS);
        energy.available = Math.min(cfg.MAX_CHARGES, energy.available + recharged);
        if (energy.available >= cfg.MAX_CHARGES) {
          energy.lastRegenTimestamp = now;
        } else {
          energy.lastRegenTimestamp += recharged * cfg.REGEN_INTERVAL_MS;
        }
        this.saveState();
      }
    }
  }

  getSpinEnergyInfo() {
    this.checkAndRegenSpinEnergy();
    const cfg = GAME_CONFIG.SPIN_ENERGY;
    const energy = this.state.spinEnergy;

    let timeRemainingMs = 0;
    let countdownFormatted = "Plein";

    if (energy.available < cfg.MAX_CHARGES) {
      const now = Date.now();
      const elapsed = now - (energy.lastRegenTimestamp || now);
      timeRemainingMs = Math.max(0, cfg.REGEN_INTERVAL_MS - elapsed);
      const minutes = Math.floor(timeRemainingMs / 60000);
      const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
      countdownFormatted = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }

    return {
      available: energy.available,
      max: cfg.MAX_CHARGES,
      timeRemainingMs,
      countdownFormatted,
      canSpin: energy.available > 0,
    };
  }

  consumeSpinCharge() {
    this.checkAndRegenSpinEnergy();
    const cfg = GAME_CONFIG.SPIN_ENERGY;
    const energy = this.state.spinEnergy;

    if (energy.available <= 0) return false;

    if (energy.available === cfg.MAX_CHARGES) {
      energy.lastRegenTimestamp = Date.now();
    }

    energy.available--;
    this.saveState();
    return true;
  }

  addSpinCharges(count = 1) {
    const cfg = GAME_CONFIG.SPIN_ENERGY;
    if (!this.state.spinEnergy) {
      this.state.spinEnergy = { available: cfg.STARTER_CHARGES, lastRegenTimestamp: Date.now() };
    }
    this.state.spinEnergy.available = Math.min(cfg.MAX_CHARGES + 5, this.state.spinEnergy.available + count);
    this.saveState();
  }

  // --- TICKETS D'ARÈNE (5 max, recharge 5 minutes) ---

  checkAndRegenArenaTickets() {
    const cfg = GAME_CONFIG.ARENA_ENERGY;
    if (!this.state.arenaEnergy) {
      this.state.arenaEnergy = {
        available: cfg.STARTER_TICKETS,
        lastRegenTimestamp: Date.now(),
      };
    }

    const arena = this.state.arenaEnergy;
    if (arena.available < cfg.MAX_TICKETS) {
      const now = Date.now();
      const elapsed = now - (arena.lastRegenTimestamp || now);
      if (elapsed >= cfg.REGEN_INTERVAL_MS) {
        const recharged = Math.floor(elapsed / cfg.REGEN_INTERVAL_MS);
        arena.available = Math.min(cfg.MAX_TICKETS, arena.available + recharged);
        if (arena.available >= cfg.MAX_TICKETS) {
          arena.lastRegenTimestamp = now;
        } else {
          arena.lastRegenTimestamp += recharged * cfg.REGEN_INTERVAL_MS;
        }
        this.saveState();
      }
    }
  }

  getArenaTicketInfo() {
    this.checkAndRegenArenaTickets();
    const cfg = GAME_CONFIG.ARENA_ENERGY;
    const arena = this.state.arenaEnergy;

    let timeRemainingMs = 0;
    let countdownFormatted = "Plein";

    if (arena.available < cfg.MAX_TICKETS) {
      const now = Date.now();
      const elapsed = now - (arena.lastRegenTimestamp || now);
      timeRemainingMs = Math.max(0, cfg.REGEN_INTERVAL_MS - elapsed);
      const minutes = Math.floor(timeRemainingMs / 60000);
      const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
      countdownFormatted = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }

    return {
      available: arena.available,
      max: cfg.MAX_TICKETS,
      timeRemainingMs,
      countdownFormatted,
      canBattle: arena.available > 0,
    };
  }

  consumeArenaTicket() {
    this.checkAndRegenArenaTickets();
    const cfg = GAME_CONFIG.ARENA_ENERGY;
    const arena = this.state.arenaEnergy;

    if (arena.available <= 0) return false;

    if (arena.available === cfg.MAX_TICKETS) {
      arena.lastRegenTimestamp = Date.now();
    }

    arena.available--;
    this.saveState();
    return true;
  }

  addArenaTickets(count = 1) {
    const cfg = GAME_CONFIG.ARENA_ENERGY;
    if (!this.state.arenaEnergy) {
      this.state.arenaEnergy = { available: cfg.STARTER_TICKETS, lastRegenTimestamp: Date.now() };
    }
    this.state.arenaEnergy.available = Math.min(cfg.MAX_TICKETS + 5, this.state.arenaEnergy.available + count);
    this.saveState();
  }

  // --- JAUGE DE CHANCE (PITY SYSTEM AU 10ème TIRAGE) ---

  getPityInfo() {
    const max = GAME_CONFIG.PITY_THRESHOLD;
    const current = this.state.pityCounter || 0;
    const isLuckyReady = current >= (max - 1); // Le 10ème tirage (index 9 vers 10) est le Super Spin
    return {
      current,
      max,
      isLuckyReady: current >= max,
      percent: Math.min(100, Math.round((current / max) * 100)),
    };
  }

  incrementPity() {
    const max = GAME_CONFIG.PITY_THRESHOLD;
    const current = this.state.pityCounter || 0;

    if (current >= max) {
      // Super Spin consommé, on recommence à 1
      this.state.pityCounter = 1;
      this.saveState();
      return { isLuckySpin: true, nextCount: 1 };
    }

    const next = current + 1;
    this.state.pityCounter = next;
    const isLuckySpin = next >= max;
    this.saveState();
    return { isLuckySpin, nextCount: next };
  }

  // --- FORMULE ÉLO OFFICIELLE & LIGUES ---

  getElo() {
    return this.state.elo || GAME_CONFIG.ELO_CONFIG.STARTING_ELO;
  }

  getLeague(eloValue = null) {
    const elo = eloValue !== null ? eloValue : this.getElo();
    const leagues = GAME_CONFIG.ELO_CONFIG.LEAGUES;
    return leagues.find(l => elo >= l.minElo && elo <= l.maxElo) || leagues[0];
  }

  calculateEloDelta(playerElo, opponentElo, isWin) {
    // Formule FIDE : E_A = 1 / (1 + 10^((R_B - R_A)/400))
    const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const score = isWin ? 1 : 0;
    const k = GAME_CONFIG.ELO_CONFIG.K_FACTOR;
    const rawDelta = k * (score - expected);
    return Math.round(rawDelta);
  }

  updateElo(opponentElo, isWin) {
    const oldElo = this.getElo();
    const delta = this.calculateEloDelta(oldElo, opponentElo, isWin);
    const newElo = Math.max(0, oldElo + delta);

    this.state.elo = newElo;
    this.saveState();

    return {
      oldElo,
      newElo,
      delta,
      league: this.getLeague(newElo),
    };
  }

  // --- TRAITEMENT COMBAT AVEC ÉLO ET COINS ---

  processBattleResult(isPlayerWinner, playerChar, oppChar) {
    this.state.stats.totalBattles++;

    const playerElo = this.getElo();
    const oppElo = oppChar.elo || Math.round(oppChar.power * 14 + 100);

    // Calcul Élo réel
    const eloResult = this.updateElo(oppElo, isPlayerWinner);

    // Calcul de l'or de récompense (affecté par l'Atelier Prime d'Arène)
    let coinsGained = 0;
    let xpGained = 0;
    const arenaBonusLvl = this.state.workshopUpgrades?.arena_bonus || 0;
    const arenaMult = arenaBonusLvl > 0 ? (GAME_CONFIG.WORKSHOP_UPGRADES.arena_bonus.multipliers[arenaBonusLvl - 1] || 1.0) : 1.0;

    if (isPlayerWinner) {
      this.state.stats.wins++;
      coinsGained = Math.round(GAME_CONFIG.REWARDS.WIN_COINS_BASE * arenaMult);
      xpGained = GAME_CONFIG.REWARDS.WIN_XP;

      // Bonus si l'adversaire avait un Elo supérieur
      if (oppElo > playerElo) {
        coinsGained += Math.min(60, Math.round((oppElo - playerElo) * 0.2));
      }
    } else {
      this.state.stats.losses++;
      coinsGained = GAME_CONFIG.REWARDS.LOSS_COINS_BASE;
      xpGained = GAME_CONFIG.REWARDS.LOSS_XP;
    }

    this.addCoins(coinsGained);
    const xpResult = this.addXP(xpGained);

    const newAchievements = this.checkAchievements(playerChar, oppChar, isPlayerWinner);

    return {
      coinsGained,
      xpGained,
      eloResult,
      leveledUp: xpResult.leveledUp,
      newAchievements,
    };
  }

  // --- TRAITEMENT GÉNÉRATION ---

  processGeneration(character, isLuckySpin = false) {
    this.state.stats.totalGenerations++;

    if (character.rarity === "legendary") {
      this.state.stats.legendariesCount++;
      this.addXP(GAME_CONFIG.REWARDS.LEGENDARY_DISCOVER_XP);
    } else if (isLuckySpin) {
      this.addXP(GAME_CONFIG.REWARDS.LUCKY_SPIN_XP);
    } else {
      this.addXP(GAME_CONFIG.REWARDS.GENERATE_XP);
    }

    if (character.power > this.state.stats.highestPower) {
      this.state.stats.highestPower = character.power;
    }

    if (character.powerId && !this.state.stats.discoveredPowers.includes(character.powerId)) {
      this.state.stats.discoveredPowers.push(character.powerId);
    }

    let newlyDiscoveredSynergies = 0;
    for (const syn of character.synergies || []) {
      if (!this.state.stats.discoveredSynergies.includes(syn.id)) {
        this.state.stats.discoveredSynergies.push(syn.id);
        this.addXP(GAME_CONFIG.REWARDS.SYNERGY_DISCOVER_XP);
        newlyDiscoveredSynergies++;
      }
    }

    this.saveState();
    const newAchievements = this.checkAchievements(character, null, false);

    return { newlyDiscoveredSynergies, newAchievements };
  }

  // --- RECYCLAGE EN PIÈCES D'OR ---

  recycleCharacter(character) {
    const rarityMeta = GAME_CONFIG.RARITIES[character.rarity] || GAME_CONFIG.RARITIES.common;
    const synCount = character.synergies ? character.synergies.length : 0;
    const rawVal = (character.power * 1.2) + (synCount * 25);
    const coinsAwarded = Math.max(35, Math.round(rawVal * (rarityMeta.multiplier || 1.0)));

    this.addCoins(coinsAwarded);
    this.state.stats.totalRecycled = (this.state.stats.totalRecycled || 0) + 1;
    this.saveState();

    return coinsAwarded;
  }

  // --- ATELIER D'AMÉLIORATIONS (WORKSHOP) ---

  getWorkshopUpgrades() {
    if (!this.state.workshopUpgrades) {
      this.state.workshopUpgrades = this.getDefaultState().workshopUpgrades;
    }

    // Réinitialisation journalière de l'achat d'urgence
    const today = new Date().toDateString();
    if (this.state.workshopUpgrades.last_emergency_date !== today) {
      this.state.workshopUpgrades.last_emergency_date = today;
      this.state.workshopUpgrades.emergency_count_today = 0;
      this.saveState();
    }

    return this.state.workshopUpgrades;
  }

  buyWorkshopUpgrade(upgradeId) {
    const upgrades = this.getWorkshopUpgrades();
    const def = GAME_CONFIG.WORKSHOP_UPGRADES[upgradeId];
    if (!def) return { success: false, message: "Amélioration inconnue" };

    if (def.isInstant) {
      // Jeton d'Urgence (Achat direct d'une charge de tirage)
      const countToday = upgrades.emergency_count_today || 0;
      const cost = Math.round(def.baseCost * Math.pow(def.costMultiplier, countToday));

      if (this.getCoins() < cost) {
        return { success: false, message: `Pièces insuffisantes (${cost} 🪙 requis)` };
      }

      this.spendCoins(cost);
      upgrades.emergency_count_today = countToday + 1;
      this.addSpinCharges(1);
      this.saveState();

      return {
        success: true,
        message: `Charge de tirage obtenue ! (Coût: ${cost} 🪙)`,
        newCoins: this.getCoins(),
      };
    }

    // Amélioration à niveaux
    const currentLvl = upgrades[upgradeId] || 0;
    if (currentLvl >= def.maxLevel) {
      return { success: false, message: "Niveau maximum déjà atteint !" };
    }

    const cost = def.costs[currentLvl];
    if (this.getCoins() < cost) {
      return { success: false, message: `Pièces insuffisantes (${cost} 🪙 requis)` };
    }

    this.spendCoins(cost);
    upgrades[upgradeId] = currentLvl + 1;
    this.saveState();

    return {
      success: true,
      message: `${def.name} amélioré au niveau ${currentLvl + 1} !`,
      newLevel: currentLvl + 1,
      newCoins: this.getCoins(),
    };
  }

  // --- CLASSEMENT ÉLO DYNAMIQUE ---

  getLeaderboard() {
    const playerElo = this.getElo();
    const playerLeague = this.getLeague();

    // Adversaires virtuels échelonnés autour du joueur
    const virtualPlayers = [
      { name: "Aurelius_IX", elo: 2450, title: "Légende du Destin" },
      { name: "Valkyrie_FR", elo: 2150, title: "Grand Champion" },
      { name: "Kage_Shadow", elo: 1850, title: "Maître de la Roue" },
      { name: "CyberUnit_7", elo: 1550, title: "Stratège des Synergies" },
      { name: "Darius_Iron", elo: 1300, title: "Duelliste Aléatoire" },
      { name: "Solas_Wind", elo: 1100, title: "Initié du Hasard" },
      { name: "Zephyr_Zero", elo: 950, title: "Initié du Hasard" },
      { name: "Rook_Stone", elo: 780, title: "Apprenti des Roues" },
      { name: "Nova_Rookie", elo: 500, title: "Apprenti des Roues" },
    ];

    const entries = [
      ...virtualPlayers.map(p => ({
        ...p,
        league: this.getLeague(p.elo),
        isPlayer: false,
      })),
      {
        name: "Toi (Joueur)",
        elo: playerElo,
        isPlayer: true,
        title: this.getCurrentLevelInfo().title,
        league: playerLeague,
      },
    ];

    entries.sort((a, b) => b.elo - a.elo);
    return entries.map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  // --- SUCCÈS ---

  syncDiscoveredElements() {
    if (!this.state.stats) {
      this.state.stats = this.getDefaultState().stats;
    }
    if (!Array.isArray(this.state.stats.discoveredSynergies)) {
      this.state.stats.discoveredSynergies = [];
    }
    if (!Array.isArray(this.state.stats.discoveredPowers)) {
      this.state.stats.discoveredPowers = [];
    }

    const chars = collectionManager.getAll();
    let updated = false;

    for (const c of chars) {
      if (c.powerId && !this.state.stats.discoveredPowers.includes(c.powerId)) {
        this.state.stats.discoveredPowers.push(c.powerId);
        updated = true;
      }
      for (const syn of c.synergies || []) {
        if (syn.id && !this.state.stats.discoveredSynergies.includes(syn.id)) {
          this.state.stats.discoveredSynergies.push(syn.id);
          updated = true;
        }
      }
    }

    if (updated) {
      this.saveState();
    }
  }

  getAchievementsList() {
    return [
      {
        id: "first_win",
        title: "Première Victoire",
        description: "Remporter votre premier duel en arène.",
        icon: "🏆",
        check: () => this.state.stats.wins >= 1,
      },
      {
        id: "first_legendary",
        title: "Bénédiction du Destin",
        description: "Obtenir un personnage de rareté Légendaire.",
        icon: "🌟",
        check: () => this.state.stats.legendariesCount >= 1 || collectionManager.getAll().some(c => c.rarity === "legendary"),
      },
      {
        id: "first_recycle",
        title: "Alchimiste Économe",
        description: "Recycler au moins une carte en pièces d'or.",
        icon: "🪙",
        check: () => (this.state.stats.totalRecycled || 0) >= 1,
      },
      {
        id: "silver_league",
        title: "Ascension : Argent",
        description: "Atteindre la Ligue Argent (1 000 Élo).",
        icon: "🥈",
        check: () => this.getElo() >= 1000,
      },
      {
        id: "gold_league",
        title: "Champion de l'Or",
        description: "Atteindre la Ligue Or (1 400 Élo).",
        icon: "🥇",
        check: () => this.getElo() >= 1400,
      },
      {
        id: "five_powers",
        title: "Maître des Éléments",
        description: "Découvrir 5 pouvoirs distincts.",
        icon: "🔮",
        check: () => (this.state.stats.discoveredPowers || []).length >= 5 || new Set(collectionManager.getAll().map(c => c.powerId)).size >= 5,
      },
      {
        id: "ten_synergies",
        title: "Alchimiste Tactique",
        description: "Découvrir 10 synergies différentes.",
        icon: "⚡",
        check: () => (this.state.stats.discoveredSynergies || []).length >= 10,
      },
      {
        id: "ten_wins",
        title: "Gladiateur Inébranlable",
        description: "Remporter 10 victoires en combat.",
        icon: "⚔️",
        check: () => this.state.stats.wins >= 10,
      },
    ];
  }

  checkAchievements(playerChar = null, oppChar = null, isWin = false) {
    this.syncDiscoveredElements();
    const list = this.getAchievementsList();
    const newlyUnlocked = [];

    for (const ach of list) {
      if (!this.state.unlockedAchievements[ach.id]) {
        try {
          if (ach.check(playerChar, oppChar, isWin)) {
            this.state.unlockedAchievements[ach.id] = new Date().toISOString();
            this.addCoins(75);
            this.addXP(100);
            newlyUnlocked.push(ach);
          }
        } catch (e) {
          console.error("Erreur vérification succès", ach.id, e);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      this.saveState();
    }
    return newlyUnlocked;
  }

  resetAll() {
    this.state = this.getDefaultState();
    this.saveState();
  }
}

export const progressionManager = new ProgressionManager();

