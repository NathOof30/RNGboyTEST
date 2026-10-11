/**
 * GESTIONNAIRE DE PROGRESSION ET STATISTIQUES (Sections 25, 26, 27, 28, 32, 33, 34)
 * 
 * - Points du joueur et classement dynamique
 * - Système de niveaux et XP
 * - Personnage du Jour (Daily) avec reset de test
 * - Succès (Achievements) déblocables
 * - Statistiques globales du profil
 */

import { GAME_CONFIG } from "../data/config.js";
import { collectionManager } from "../collection/collectionManager.js";

const PROGRESSION_KEY = "wheelborn_progression";

export class ProgressionManager {
  constructor() {
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      points: 250,
      xp: 0,
      level: 1,
      lastDailyTimestamp: 0,
      hasDailyAvailable: true,

      // Invocations horaires (Section Équilibrage : 1 tirage par heure)
      hourlySpins: {
        available: GAME_CONFIG.HOURLY_SPIN.STARTER_CHARGES,
        lastRegenTimestamp: Date.now(),
      },

      // Statistiques globales
      stats: {
        totalGenerations: 0,
        totalBattles: 0,
        wins: 0,
        losses: 0,
        legendariesCount: 0,
        highestPower: 0,
        discoveredSynergies: [],
        discoveredPowers: [],
      },

      // Succès débloqués
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
    } catch (e) {
      console.warn("Erreur chargement progression", e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Erreur sauvegarde progression", e);
    }
  }

  // --- POINTS & XP ---

  addPoints(amount) {
    this.state.points = Math.max(0, this.state.points + amount);
    this.saveState();
    return this.state.points;
  }

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

  // --- TRAITEMENT COMBAT ---

  processBattleResult(isPlayerWinner, playerChar, oppChar) {
    this.state.stats.totalBattles++;

    let pointsGained = 0;
    let xpGained = 0;

    if (isPlayerWinner) {
      this.state.stats.wins++;
      pointsGained = GAME_CONFIG.REWARDS.WIN_POINTS;
      xpGained = GAME_CONFIG.REWARDS.WIN_XP;

      // Bonus si l'adversaire avait un Power supérieur
      if (oppChar.power > playerChar.power) {
        const diff = oppChar.power - playerChar.power;
        const underdogBonus = diff * GAME_CONFIG.REWARDS.UNDERDOG_MULTIPLIER;
        pointsGained += underdogBonus;
      }
    } else {
      this.state.stats.losses++;
      pointsGained = GAME_CONFIG.REWARDS.LOSS_POINTS;
      xpGained = GAME_CONFIG.REWARDS.LOSS_XP;
    }

    this.addPoints(pointsGained);
    const xpResult = this.addXP(xpGained);

    // Vérification des succès
    const newAchievements = this.checkAchievements(playerChar, oppChar, isPlayerWinner);

    return {
      pointsGained,
      xpGained,
      leveledUp: xpResult.leveledUp,
      newAchievements,
    };
  }

  // --- TRAITEMENT GÉNÉRATION ---

  processGeneration(character) {
    this.state.stats.totalGenerations++;

    if (character.rarity === "legendary") {
      this.state.stats.legendariesCount++;
      this.addXP(GAME_CONFIG.REWARDS.LEGENDARY_DISCOVER_XP);
    } else {
      this.addXP(GAME_CONFIG.REWARDS.GENERATE_XP);
    }

    if (character.power > this.state.stats.highestPower) {
      this.state.stats.highestPower = character.power;
    }

    // Enregistrement des découvertes
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

  // --- DAILY (Section 27 & 28) ---

  isDailyAvailable() {
    const now = Date.now();
    const elapsed = now - (this.state.lastDailyTimestamp || 0);
    return elapsed >= GAME_CONFIG.DAILY_COOLDOWN_MS;
  }

  getDailyRemainingTime() {
    if (this.isDailyAvailable()) return null;
    const now = Date.now();
    const remainingMs = GAME_CONFIG.DAILY_COOLDOWN_MS - (now - this.state.lastDailyTimestamp);
    if (remainingMs <= 0) return null;

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  claimDaily() {
    this.state.lastDailyTimestamp = Date.now();
    this.addPoints(GAME_CONFIG.REWARDS.DAILY_BONUS_POINTS);
    this.saveState();
  }

  resetDaily() {
    this.state.lastDailyTimestamp = 0;
    this.saveState();
  }

  // --- INVOCATIONS HORAIRES (Section Équilibrage : 1 tirage par heure) ---

  checkAndRegenHourlySpins() {
    const cfg = GAME_CONFIG.HOURLY_SPIN;
    if (!this.state.hourlySpins) {
      this.state.hourlySpins = {
        available: cfg.STARTER_CHARGES,
        lastRegenTimestamp: Date.now(),
      };
    }

    const spins = this.state.hourlySpins;
    if (spins.available < cfg.MAX_CHARGES) {
      const now = Date.now();
      const elapsed = now - (spins.lastRegenTimestamp || now);
      if (elapsed >= cfg.REGEN_INTERVAL_MS) {
        const recharged = Math.floor(elapsed / cfg.REGEN_INTERVAL_MS);
        spins.available = Math.min(cfg.MAX_CHARGES, spins.available + recharged);
        if (spins.available >= cfg.MAX_CHARGES) {
          spins.lastRegenTimestamp = now;
        } else {
          spins.lastRegenTimestamp += recharged * cfg.REGEN_INTERVAL_MS;
        }
        this.saveState();
      }
    }
  }

  getHourlySpinInfo() {
    this.checkAndRegenHourlySpins();
    const cfg = GAME_CONFIG.HOURLY_SPIN;
    const spins = this.state.hourlySpins;

    let timeRemainingMs = 0;
    let countdownFormatted = "Plein";

    if (spins.available < cfg.MAX_CHARGES) {
      const now = Date.now();
      const elapsed = now - (spins.lastRegenTimestamp || now);
      timeRemainingMs = Math.max(0, cfg.REGEN_INTERVAL_MS - elapsed);
      const minutes = Math.floor(timeRemainingMs / 60000);
      const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
      countdownFormatted = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }

    return {
      available: spins.available,
      max: cfg.MAX_CHARGES,
      timeRemainingMs,
      countdownFormatted,
      canSpin: spins.available > 0,
    };
  }

  consumeHourlySpin() {
    this.checkAndRegenHourlySpins();
    const cfg = GAME_CONFIG.HOURLY_SPIN;
    const spins = this.state.hourlySpins;

    if (spins.available <= 0) return false;

    // Si on était au stock maximum, démarrer le timer de recharge à cet instant
    if (spins.available === cfg.MAX_CHARGES) {
      spins.lastRegenTimestamp = Date.now();
    }

    spins.available--;
    this.saveState();
    return true;
  }

  addHourlySpins(count = 1) {
    const cfg = GAME_CONFIG.HOURLY_SPIN;
    if (!this.state.hourlySpins) {
      this.state.hourlySpins = { available: cfg.STARTER_CHARGES, lastRegenTimestamp: Date.now() };
    }
    this.state.hourlySpins.available = Math.min(cfg.MAX_CHARGES + 5, this.state.hourlySpins.available + count);
    this.saveState();
  }

  resetHourlyCooldown() {
    const cfg = GAME_CONFIG.HOURLY_SPIN;
    this.state.hourlySpins = {
      available: cfg.MAX_CHARGES,
      lastRegenTimestamp: Date.now(),
    };
    this.saveState();
  }

  // --- CLASSEMENT FICTIF (Section 26) ---

  getLeaderboard() {
    const baseOpponents = [
      { name: "Aurelius", points: 4950, title: "Maître Suprême" },
      { name: "Valkyrie-7", points: 4120, title: "Duelliste d'Élite" },
      { name: "Kage", points: 3450, title: "Ombre Vorace" },
      { name: "Nebula", points: 2890, title: "Forge-Destin" },
      { name: "Darius", points: 2200, title: "Invocateur" },
      { name: "Solas", points: 1750, title: "Pisteur" },
      { name: "Zephyr", points: 1300, title: "Gardien" },
      { name: "Rook", points: 850, title: "Combattant" },
      { name: "Nova", points: 420, title: "Novice" },
    ];

    const entries = [
      ...baseOpponents,
      { name: "Toi (Joueur)", points: this.state.points, isPlayer: true, title: this.getCurrentLevelInfo().title }
    ];

    entries.sort((a, b) => b.points - a.points);
    return entries.map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  // Synchronise les éléments découverts à partir de la collection actuelle et des générations
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

  // --- SUCCÈS (Section 33) ---

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
        id: "ten_characters",
        title: "Collectionneur Émergent",
        description: "Avoir collecté au moins 10 personnages.",
        icon: "👥",
        check: () => collectionManager.getAll().length >= 10,
      },
      {
        id: "ten_wins",
        title: "Vétéran de l'Arène",
        description: "Remporter 10 victoires en combat.",
        icon: "⚔️",
        check: () => this.state.stats.wins >= 10,
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
        id: "giant_slayer",
        title: "Tueur de Colosse",
        description: "Battre un adversaire possédant un Power supérieur au vôtre.",
        icon: "🗡️",
        check: (player, opp, isWin) => isWin && opp && player && opp.power > player.power,
      },
      {
        id: "wheel_addict",
        title: "Roue de l'Infini",
        description: "Générer au moins 30 personnages.",
        icon: "🎡",
        check: () => this.state.stats.totalGenerations >= 30,
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
            this.addPoints(50);
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
