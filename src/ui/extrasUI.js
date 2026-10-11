/**
 * VUES COMPLÉMENTAIRES — V2
 * - Atelier d'Améliorations (Workshop) : Dépense des pièces en bonus permanents
 * - Classement ÉLO (Leaderboard) : Ligues FIDE
 * - Statistiques du Joueur & Succès
 */

import { progressionManager } from "../progression/progressionManager.js";
import { collectionManager } from "../collection/collectionManager.js";
import { GAME_CONFIG } from "../data/config.js";
import { SYNERGIES } from "../data/synergies.js";
import { POWERS } from "../data/powers.js";
import { showToast } from "./notifications.js";

/**
 * VUE ATELIER D'AMÉLIORATIONS (Remplace l'ancien Daily)
 */
export function renderWorkshopView(container, onWorkshopUpdated) {
  const coins = progressionManager.getCoins();
  const upgrades = progressionManager.getWorkshopUpgrades();
  const defs = GAME_CONFIG.WORKSHOP_UPGRADES;

  // Calcul du coût du jeton d'urgence
  const emergencyCount = upgrades.emergency_count_today || 0;
  const emergencyCost = Math.round(defs.emergency_spin.baseCost * Math.pow(defs.emergency_spin.costMultiplier, emergencyCount));

  container.innerHTML = `
    <div class="workshop-wrapper">
      <div class="workshop-header">
        <div class="workshop-title-row">
          <h2>🏛️ Atelier de Destin & Améliorations</h2>
          <div class="workshop-coins-pill">
            <span>🪙 Solde :</span>
            <strong class="gold-text">${coins.toLocaleString()} Pièces</strong>
          </div>
        </div>
        <p class="section-subtitle">
          Investissez les pièces gagnées par le recyclage et vos victoires en arène pour renforcer vos futurs tirages et combats.
        </p>
      </div>

      <div class="workshop-grid">
        <!-- 1. Aimant à Pouvoirs Rares -->
        <div class="workshop-card">
          <div class="workshop-card-top">
            <span class="upgrade-icon">${defs.rare_magnet.icon}</span>
            <div class="upgrade-meta">
              <h3 class="upgrade-name">${defs.rare_magnet.name}</h3>
              <span class="upgrade-lvl">Niveau ${upgrades.rare_magnet || 0} / ${defs.rare_magnet.maxLevel}</span>
            </div>
          </div>
          <p class="upgrade-desc">${defs.rare_magnet.desc}</p>
          <div class="upgrade-current-bonus">
            Bonus actuel : <strong>+${(upgrades.rare_magnet || 0) * defs.rare_magnet.bonusPerLevel}%</strong> sur les pouvoirs rares/mythiques
          </div>
          <div class="upgrade-action-row">
            ${(upgrades.rare_magnet || 0) >= defs.rare_magnet.maxLevel ? `
              <button class="btn btn-secondary btn-full" disabled>Niveau Maximum</button>
            ` : `
              <button class="btn btn-primary btn-full btn-upgrade" data-upgrade="rare_magnet">
                Améliorer (${defs.rare_magnet.costs[upgrades.rare_magnet || 0]} 🪙)
              </button>
            `}
          </div>
        </div>

        <!-- 2. Forge des Héros -->
        <div class="workshop-card">
          <div class="workshop-card-top">
            <span class="upgrade-icon">${defs.hero_forge.icon}</span>
            <div class="upgrade-meta">
              <h3 class="upgrade-name">${defs.hero_forge.name}</h3>
              <span class="upgrade-lvl">Niveau ${upgrades.hero_forge || 0} / ${defs.hero_forge.maxLevel}</span>
            </div>
          </div>
          <p class="upgrade-desc">${defs.hero_forge.desc}</p>
          <div class="upgrade-current-bonus">
            Bonus actuel : <strong>+${(upgrades.hero_forge || 0) * defs.hero_forge.bonusHpPerLevel} PV</strong> et <strong>+${(upgrades.hero_forge || 0) * defs.hero_forge.bonusStrPerLevel} Force</strong>
          </div>
          <div class="upgrade-action-row">
            ${(upgrades.hero_forge || 0) >= defs.hero_forge.maxLevel ? `
              <button class="btn btn-secondary btn-full" disabled>Niveau Maximum</button>
            ` : `
              <button class="btn btn-primary btn-full btn-upgrade" data-upgrade="hero_forge">
                Améliorer (${defs.hero_forge.costs[upgrades.hero_forge || 0]} 🪙)
              </button>
            `}
          </div>
        </div>

        <!-- 3. Prime d'Arène -->
        <div class="workshop-card">
          <div class="workshop-card-top">
            <span class="upgrade-icon">${defs.arena_bonus.icon}</span>
            <div class="upgrade-meta">
              <h3 class="upgrade-name">${defs.arena_bonus.name}</h3>
              <span class="upgrade-lvl">Niveau ${upgrades.arena_bonus || 0} / ${defs.arena_bonus.maxLevel}</span>
            </div>
          </div>
          <p class="upgrade-desc">${defs.arena_bonus.desc}</p>
          <div class="upgrade-current-bonus">
            Multiplicateur actuel : <strong>${(upgrades.arena_bonus || 0) > 0 ? 'x' + defs.arena_bonus.multipliers[(upgrades.arena_bonus || 0) - 1] : 'x1.00 (Standard)'}</strong>
          </div>
          <div class="upgrade-action-row">
            ${(upgrades.arena_bonus || 0) >= defs.arena_bonus.maxLevel ? `
              <button class="btn btn-secondary btn-full" disabled>Niveau Maximum</button>
            ` : `
              <button class="btn btn-primary btn-full btn-upgrade" data-upgrade="arena_bonus">
                Améliorer (${defs.arena_bonus.costs[upgrades.arena_bonus || 0]} 🪙)
              </button>
            `}
          </div>
        </div>

        <!-- 4. Jeton d'Urgence (Achat direct) -->
        <div class="workshop-card workshop-card-instant">
          <div class="workshop-card-top">
            <span class="upgrade-icon">${defs.emergency_spin.icon}</span>
            <div class="upgrade-meta">
              <h3 class="upgrade-name">${defs.emergency_spin.name}</h3>
              <span class="upgrade-lvl">Acheté(s) aujourd'hui : ${emergencyCount}</span>
            </div>
          </div>
          <p class="upgrade-desc">${defs.emergency_spin.desc}</p>
          <div class="upgrade-current-bonus">
            Octroie immédiatement <strong>+1 Charge de tirage</strong> dans le générateur
          </div>
          <div class="upgrade-action-row">
            <button class="btn btn-warning btn-full btn-upgrade" data-upgrade="emergency_spin">
              Acheter 1 Charge (${emergencyCost} 🪙)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind upgrade clicks
  container.querySelectorAll(".btn-upgrade").forEach(btn => {
    btn.addEventListener("click", () => {
      const upgradeId = btn.getAttribute("data-upgrade");
      const res = progressionManager.buyWorkshopUpgrade(upgradeId);

      if (res.success) {
        showToast(`🎉 ${res.message}`, "success");
        renderWorkshopView(container, onWorkshopUpdated);
        if (onWorkshopUpdated) onWorkshopUpdated();
      } else {
        showToast(`⚠️ ${res.message}`, "warning");
      }
    });
  });
}

/**
 * VUE CLASSEMENT ÉLO
 */
export function renderLeaderboardView(container) {
  const leaderboard = progressionManager.getLeaderboard();

  container.innerHTML = `
    <div class="leaderboard-wrapper">
      <div class="leaderboard-header">
        <h2>🏆 Classement des Joueurs</h2>
        <p class="section-subtitle">Affrontez des rivaux en arène pour faire grimper votre classement Élo et atteindre la Ligue Maître</p>
      </div>

      <div class="leaderboard-table-card">
        <div class="table-header-row">
          <div class="col-rank">Rang</div>
          <div class="col-name">Joueur</div>
          <div class="col-title">Ligue</div>
          <div class="col-points">Score ÉLO</div>
        </div>
        <div class="table-body">
          ${leaderboard.map(entry => `
            <div class="table-row ${entry.isPlayer ? 'player-row' : ''}">
              <div class="col-rank">
                ${entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
              </div>
              <div class="col-name">
                ${entry.name} ${entry.isPlayer ? '<span class="you-badge">VOUS</span>' : ''}
              </div>
              <div class="col-title" style="color: ${entry.league.color}">
                ${entry.league.icon} ${entry.league.name}
              </div>
              <div class="col-points font-bold gold-text">${entry.elo} pts</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

/**
 * VUE STATISTIQUES & SUCCÈS
 */
export function renderStatsView(container) {
  progressionManager.checkAchievements();

  const stats = progressionManager.state.stats;
  const lvlInfo = progressionManager.getCurrentLevelInfo();
  const achievements = progressionManager.getAchievementsList();
  const unlockedMap = progressionManager.state.unlockedAchievements;
  const collCount = collectionManager.getAll().length;
  const playerElo = progressionManager.getElo();
  const playerLeague = progressionManager.getLeague();

  const totalSynergiesCount = SYNERGIES.length;
  const discoveredSynCount = (stats.discoveredSynergies || []).length;
  const totalPowersCount = POWERS.length;
  const discoveredPowCount = (stats.discoveredPowers || []).length;

  const winRate = stats.totalBattles > 0
    ? Math.round((stats.wins / stats.totalBattles) * 100)
    : 0;

  container.innerHTML = `
    <div class="stats-page-wrapper">
      <div class="stats-header">
        <h2>📊 Statistiques & Succès</h2>
        <p class="section-subtitle">Votre progression globale, classement Élo et hauts faits accomplis</p>
      </div>

      <!-- CARTE NIVEAU ET XP -->
      <div class="player-level-card">
        <div class="level-badge-large">
          <span class="lvl-number">Niv. ${lvlInfo.level}</span>
          <span class="lvl-title">${lvlInfo.title}</span>
        </div>
        <div class="xp-progress-block">
          <div class="xp-labels">
            <span>Expérience : ${lvlInfo.currentXP} XP</span>
            <span>Objectif prochain niveau : ${lvlInfo.nextLevelXP} XP</span>
          </div>
          <div class="xp-bar-track">
            <div class="xp-bar-fill" style="width: ${lvlInfo.progressPercent}%;"></div>
          </div>
        </div>
      </div>

      <!-- GRILLE DES STATISTIQUES V2 -->
      <div class="stats-metrics-grid">
        <div class="metric-card">
          <div class="metric-val gold-text">${playerElo}</div>
          <div class="metric-lbl">${playerLeague.icon} Ligue ${playerLeague.name}</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-win">${progressionManager.getCoins().toLocaleString()} 🪙</div>
          <div class="metric-lbl">Solde de pièces actuel</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">${stats.totalBattles}</div>
          <div class="metric-lbl">⚔️ Combats menés</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-win">${stats.wins}</div>
          <div class="metric-lbl">🏆 Victoires (${winRate}%)</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-loss">${stats.losses}</div>
          <div class="metric-lbl">💀 Défaites</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">${collCount}</div>
          <div class="metric-lbl">👥 Personnages actuels</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-rare">${stats.totalRecycled || 0}</div>
          <div class="metric-lbl">♻️ Cartes recyclées</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-leg">${stats.legendariesCount}</div>
          <div class="metric-lbl">🌟 Légendaires obtenus</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">${discoveredSynCount} / ${totalSynergiesCount}</div>
          <div class="metric-lbl">⚡ Synergies découvertes</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">${discoveredPowCount} / ${totalPowersCount}</div>
          <div class="metric-lbl">🔮 Pouvoirs découverts</div>
        </div>
      </div>

      <!-- SUCCÈS -->
      <div class="achievements-section">
        <h3>🏅 Succès (${Object.keys(unlockedMap).length} / ${achievements.length})</h3>
        <div class="achievements-grid">
          ${achievements.map(ach => {
            const isUnlocked = !!unlockedMap[ach.id];
            return `
              <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                  <div class="ach-title">${ach.title}</div>
                  <div class="ach-desc">${ach.description}</div>
                </div>
                <div class="ach-status">
                  ${isUnlocked ? '<span class="ach-badge-done">✓ DÉBLOQUÉ</span>' : '<span class="ach-badge-lock">🔒 Verrouillé</span>'}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

