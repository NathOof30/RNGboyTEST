/**
 * COMPOSANT D'AFFICHAGE DES CARTES DE PERSONNAGES (Sections 15, 17, 18)
 * Utilisé dans la génération (révélation), la grille de collection et l'arène de combat.
 */

import { GAME_CONFIG } from "../data/config.js";

export function getRarityBadgeHtml(rarity) {
  const meta = GAME_CONFIG.RARITIES[rarity] || GAME_CONFIG.RARITIES.common;
  const starsStr = "★".repeat(meta.stars) + "☆".repeat(5 - meta.stars);
  return `<span class="rarity-badge ${meta.badgeClass}" title="${meta.label}">
    <span class="stars">${starsStr}</span> ${meta.label}
  </span>`;
}

export function renderCharacterCard(char, options = {}) {
  const {
    isDetail = false,
    selectable = false,
    selected = false,
    showActions = true,
  } = options;

  const rarityMeta = GAME_CONFIG.RARITIES[char.rarity] || GAME_CONFIG.RARITIES.common;
  const winRate = char.battlesCount > 0 
    ? Math.round((char.wins / char.battlesCount) * 100) 
    : 0;

  // Synergies badges
  const synergiesHtml = (char.synergies && char.synergies.length > 0)
    ? char.synergies.map(s => `
        <div class="synergy-badge ${s.isUnstable ? 'synergy-unstable' : ''}" title="${s.description}">
          <span class="synergy-icon">${s.icon}</span>
          <span class="synergy-name">${s.name}</span>
          ${s.isUnstable ? '<span class="unstable-tag">INSTABLE</span>' : ''}
        </div>
      `).join("")
    : `<div class="no-synergies">Aucune synergie active</div>`;

  return `
    <div class="character-card rarity-border-${char.rarity} ${selected ? 'is-selected' : ''}" data-char-id="${char.id}">
      <div class="card-header">
        <div class="name-block">
          <h3 class="char-name">${char.name}</h3>
          ${char.isLuckySpin ? '<span class="daily-pill" title="Issu du Super Spin (Jauge de Chance)">🌟 SUPER SPIN</span>' : ''}
          ${char.creatorName ? `
            <span class="creator-badge ${char.isPlayerCreated ? 'badge-player-author' : 'badge-bot-author'}">
              ${char.isPlayerCreated ? '👤 ' + char.creatorName : '🤖 ' + char.creatorName}
            </span>
          ` : ''}
        </div>
        ${getRarityBadgeHtml(char.rarity)}
      </div>

      <div class="traits-row">
        <div class="trait-chip" title="Race">
          <span class="trait-icon">${char.raceIcon}</span>
          <span class="trait-text">${char.race}</span>
        </div>
        <div class="trait-chip" title="Arme">
          <span class="trait-icon">${char.weaponIcon}</span>
          <span class="trait-text">${char.weapon}</span>
        </div>
        <div class="trait-chip" title="Pouvoir">
          <span class="trait-icon">${char.powerIcon}</span>
          <span class="trait-text">${char.power}</span>
        </div>
      </div>

      <div class="power-banner">
        <span class="power-label">POWER</span>
        <span class="power-value">${char.power}</span>
        <span class="char-value-tag" title="Valeur de recyclage">🪙 +${char.recycleValue || Math.round(char.power * 1.2)}</span>
      </div>

      <div class="stats-bars">
        <div class="stat-row">
          <span class="stat-name">❤️ PV</span>
          <div class="bar-container">
            <div class="bar-fill bar-hp" style="width: ${Math.min(100, (char.hp / 120) * 100)}%"></div>
          </div>
          <span class="stat-num">${char.hp}</span>
        </div>
        <div class="stat-row">
          <span class="stat-name">⚔️ Force</span>
          <div class="bar-container">
            <div class="bar-fill bar-str" style="width: ${Math.min(100, char.strength)}%"></div>
          </div>
          <span class="stat-num">${char.strength}</span>
        </div>
        <div class="stat-row">
          <span class="stat-name">⚡ Vitesse</span>
          <div class="bar-container">
            <div class="bar-fill bar-spd" style="width: ${Math.min(100, char.speed)}%"></div>
          </div>
          <span class="stat-num">${char.speed}</span>
        </div>
        <div class="stat-row">
          <span class="stat-name">🛡️ Défense</span>
          <div class="bar-container">
            <div class="bar-fill bar-def" style="width: ${Math.min(100, char.defense)}%"></div>
          </div>
          <span class="stat-num">${char.defense}</span>
        </div>
      </div>

      <div class="synergies-section">
        <div class="section-title-sm">Synergies (${(char.synergies || []).length})</div>
        <div class="synergies-list">${synergiesHtml}</div>
      </div>

      ${isDetail ? `
        <div class="combat-record-box">
          <div class="record-title">Historique de combat</div>
          <div class="record-grid">
            <div class="record-item">
              <span class="record-val">${char.battlesCount || 0}</span>
              <span class="record-lbl">Combats</span>
            </div>
            <div class="record-item win-color">
              <span class="record-val">${char.wins || 0}</span>
              <span class="record-lbl">Victoires</span>
            </div>
            <div class="record-item loss-color">
              <span class="record-val">${char.losses || 0}</span>
              <span class="record-lbl">Défaites</span>
            </div>
            <div class="record-item">
              <span class="record-val">${winRate}%</span>
              <span class="record-lbl">Taux Vict.</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
