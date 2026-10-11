/**
 * VUES COMPLÉMENTAIRES (Sections 26, 27, 28, 32, 33, 34)
 * - Personnage du Jour (Daily)
 * - Classement (Leaderboard)
 * - Statistiques du Joueur & Succès (Achievements)
 */

import { progressionManager } from "../progression/progressionManager.js";
import { collectionManager } from "../collection/collectionManager.js";
import { SYNERGIES } from "../data/synergies.js";
import { POWERS } from "../data/powers.js";

export function renderDailyView(container, onTriggerDaily) {
  const isAvail = progressionManager.isDailyAvailable();
  const remaining = progressionManager.getDailyRemainingTime();

  container.innerHTML = `
    <div class="daily-wrapper">
      <div class="daily-card">
        <div class="daily-icon-glow">🎁</div>
        <h2>Personnage du Jour</h2>
        <p class="daily-desc">
          Une opportunité unique chaque jour : chances accrues d'obtenir des raretés Épiques et Légendaires,
          accompagnée d'un bonus instantané de <strong>+200 Points</strong> !
        </p>

        <div class="daily-status-box">
          ${isAvail ? `
            <div class="daily-ready-badge">✨ PRÊT À FORGER</div>
            <p class="daily-info-text">La Roue du Destin Quotidienne est disponible !</p>
            <button class="btn btn-primary btn-large btn-glow" id="btn-claim-daily">
              🌟 Lancer la Roue Quotidienne
            </button>
          ` : `
            <div class="daily-cooldown-badge">⏳ COOLDOWN ACTIF</div>
            <p class="daily-info-text">Vous avez déjà invoqué votre héros du jour.</p>
            <div class="countdown-display">Prochaine génération dans : <strong>${remaining || 'Bientôt'}</strong></div>
            <div class="daily-test-hint" style="margin-top: 16px;">
              <button class="btn btn-outline btn-sm" id="btn-quick-reset-daily">
                🔄 Réinitialiser le timer (Test local)
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  container.querySelector("#btn-claim-daily")?.addEventListener("click", () => {
    if (onTriggerDaily) onTriggerDaily();
  });

  container.querySelector("#btn-quick-reset-daily")?.addEventListener("click", () => {
    progressionManager.resetDaily();
    renderDailyView(container, onTriggerDaily);
  });
}

export function renderLeaderboardView(container) {
  const leaderboard = progressionManager.getLeaderboard();

  container.innerHTML = `
    <div class="leaderboard-wrapper">
      <div class="leaderboard-header">
        <h2>🏆 Classement des Joueurs</h2>
        <p class="section-subtitle">Grimpez au sommet de l'arène en remportant des victoires et en amassant des points</p>
      </div>

      <div class="leaderboard-table-card">
        <div class="table-header-row">
          <div class="col-rank">Rang</div>
          <div class="col-name">Joueur</div>
          <div class="col-title">Titre</div>
          <div class="col-points">Points</div>
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
              <div class="col-title">${entry.title}</div>
              <div class="col-points font-bold">${entry.points.toLocaleString()} pts</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

export function renderStatsView(container) {
  // Synchronise et évalue immédiatement tous les critères de succès
  progressionManager.checkAchievements();

  const stats = progressionManager.state.stats;
  const lvlInfo = progressionManager.getCurrentLevelInfo();
  const achievements = progressionManager.getAchievementsList();
  const unlockedMap = progressionManager.state.unlockedAchievements;
  const collCount = collectionManager.getAll().length;

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
        <p class="section-subtitle">Votre progression globale et hauts faits accomplis</p>
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

      <!-- GRILLE DES STATISTIQUES (Section 34) -->
      <div class="stats-metrics-grid">
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
          <div class="metric-val text-leg">${stats.legendariesCount}</div>
          <div class="metric-lbl">🌟 Légendaires obtenus</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-rare">${stats.highestPower || '-'}</div>
          <div class="metric-lbl">💥 Meilleur Power atteint</div>
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

      <!-- SUCCÈS (Section 33) -->
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
