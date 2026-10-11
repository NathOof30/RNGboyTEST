/**
 * INTERFACE DE GÉNÉRATION DES ROUES — V2
 * 
 * - Régulation micro-session : 3 charges max, recharge rapide de 4 minutes
 * - Jauge de Chance (Pity 10/10) : Déclenche le Super Spin garanti au 10ème tirage
 * - Fin du "Jeter" : Recyclage valorisant en pièces d'or
 * - Prise en compte des améliorations d'Atelier (Aimant, Forge)
 */

import { RACES } from "../data/races.js";
import { WEAPONS } from "../data/weapons.js";
import { POWERS } from "../data/powers.js";
import { generateCharacter } from "../generation/characterGenerator.js";
import { renderCharacterCard } from "./characterCardUI.js";
import { sound } from "../utils/sound.js";
import { collectionManager } from "../collection/collectionManager.js";
import { progressionManager } from "../progression/progressionManager.js";
import { registerPlayerCardToCommunity } from "../combat/opponentsPool.js";
import { showToast } from "./notifications.js";

export class WheelUI {
  constructor(container, onCollectionUpdated) {
    this.container = container;
    this.onCollectionUpdated = onCollectionUpdated;
    this.isSpinning = false;
    this.pendingCharacter = null;
    this.spinIntervals = [];
    this.tickerInterval = null;

    this.render();
    this.startTicker();
  }

  render() {
    const pity = progressionManager.getPityInfo();

    this.container.innerHTML = `
      <div class="generator-wrapper">
        <div class="generator-header">
          <h2>🎡 Générateur de Personnages</h2>
          <p class="section-subtitle">Chaque invocation alimente votre légende. Révélez des héros ou recyclez-les pour forger votre destinée.</p>
        </div>

        <!-- DOUBLE BANDEAU : CHARGES & JAUGE DE CHANCE (PITY 10) -->
        <div class="generator-stats-bar">
          <!-- Carte Charges Invocations -->
          <div class="spins-status-card" id="spins-status-card">
            <div class="spins-status-left">
              <span class="spins-icon">🎟️</span>
              <div class="spins-info-text">
                <div class="spins-count-row">
                  <span class="spins-label">Charges disponibles :</span>
                  <span class="spins-number" id="spins-available-count">0 / 3</span>
                </div>
                <div class="spins-regen-row" id="spins-regen-text">
                  ⏳ Chargement...
                </div>
              </div>
            </div>
            <div class="spins-status-right">
              <span class="spins-scarcity-hint" title="1 recharge automatique toutes les 4 minutes">⚡ +1 / 4 min</span>
            </div>
          </div>

          <!-- Carte Jauge de Chance (Lucky Spin 10/10) -->
          <div class="pity-status-card ${pity.isLuckyReady ? 'pity-ready' : ''}" id="pity-status-card">
            <div class="pity-header-row">
              <span class="pity-title">✨ Jauge de Chance</span>
              <span class="pity-counter-badge" id="pity-badge">${pity.current} / 10</span>
            </div>
            <div class="pity-progress-bar-bg">
              <div class="pity-progress-bar-fill" id="pity-progress-fill" style="width: ${pity.percent}%"></div>
            </div>
            <div class="pity-desc-row" id="pity-desc">
              ${pity.isLuckyReady 
                ? '<strong class="gold-text">🌟 SUPER SPIN ACTIVÉ !</strong> (Rare+ garanti, 0% Commun)' 
                : 'Super Spin béni au 10ème tirage (0% Commun, Rareté accrue)'}
            </div>
          </div>
        </div>

        <!-- ROUES / ROULEAUX -->
        <div class="wheels-container" id="wheels-container">
          <div class="wheel-box" id="wheel-race">
            <div class="wheel-category">RACE</div>
            <div class="wheel-viewport">
              <div class="wheel-reel" id="reel-race">
                <span class="wheel-icon">👤</span>
                <span class="wheel-label">Humain</span>
              </div>
            </div>
          </div>

          <div class="wheel-box" id="wheel-weapon">
            <div class="wheel-category">ARME</div>
            <div class="wheel-viewport">
              <div class="wheel-reel" id="reel-weapon">
                <span class="wheel-icon">⚔️</span>
                <span class="wheel-label">Épée</span>
              </div>
            </div>
          </div>

          <div class="wheel-box" id="wheel-power">
            <div class="wheel-category">POUVOIR</div>
            <div class="wheel-viewport">
              <div class="wheel-reel" id="reel-power">
                <span class="wheel-icon">🔥</span>
                <span class="wheel-label">Feu</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BOUTONS DE LANCEMENT -->
        <div class="generator-controls" id="generator-controls">
          <button class="btn btn-primary btn-large btn-spin" id="btn-spin">
            🎰 Lancer les roues (1 Jeton)
          </button>
          <button class="btn btn-secondary btn-fast" id="btn-spin-fast" title="Passe directement l'animation">
            ⚡ Tirage instantané
          </button>
          <button class="btn btn-outline" id="btn-spin-10" title="Générer 10 personnages d'un coup (Test Dev)">
            🎲 Tirage x10 (Test)
          </button>
        </div>

        <!-- ZONE DE RÉVÉLATION DU PERSONNAGE -->
        <div class="reveal-zone hidden" id="reveal-zone">
          <div class="reveal-banner" id="reveal-banner">✨ NOUVEAU PERSONNAGE OBTENU !</div>
          <div class="reveal-card-container" id="reveal-card-container"></div>
          
          <div class="decision-box">
            <p class="decision-prompt">Que souhaitez-vous faire de ce personnage ?</p>
            <div class="decision-buttons">
              <button class="btn btn-success btn-large" id="btn-keep">
                📥 Garder dans la collection
              </button>
              <button class="btn btn-warning btn-large" id="btn-recycle">
                🪙 Recycler en pièces
              </button>
            </div>
          </div>
        </div>

        <!-- ZONE DU LOT MULTIPLE (BATCH 10 - DEV) -->
        <div class="batch-zone hidden" id="batch-zone">
          <div class="batch-header">
            <h3>🎉 10 Personnages Générés (Mode Test)</h3>
            <div class="batch-actions">
              <button class="btn btn-success btn-sm" id="btn-batch-keep-all">Tout conserver</button>
              <button class="btn btn-outline btn-sm" id="btn-batch-close">Fermer</button>
            </div>
          </div>
          <div class="batch-grid" id="batch-grid"></div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateSpinsDisplay();
  }

  bindEvents() {
    const btnSpin = this.container.querySelector("#btn-spin");
    const btnFast = this.container.querySelector("#btn-spin-fast");
    const btn10 = this.container.querySelector("#btn-spin-10");
    const btnKeep = this.container.querySelector("#btn-keep");
    const btnRecycle = this.container.querySelector("#btn-recycle");

    btnSpin?.addEventListener("click", () => this.handleSpinClick(false));
    btnFast?.addEventListener("click", () => this.handleSpinClick(true));
    btn10?.addEventListener("click", () => this.generateBatch(10));

    btnKeep?.addEventListener("click", () => this.handleKeep());
    btnRecycle?.addEventListener("click", () => this.handleRecycle());
  }

  startTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      this.updateSpinsDisplay();
    }, 1000);
  }

  updateSpinsDisplay() {
    const info = progressionManager.getSpinEnergyInfo();
    const countEl = this.container.querySelector("#spins-available-count");
    const regenEl = this.container.querySelector("#spins-regen-text");
    const btnSpin = this.container.querySelector("#btn-spin");
    const btnFast = this.container.querySelector("#btn-spin-fast");

    if (countEl) {
      countEl.textContent = `${info.available} / ${info.max}`;
      countEl.className = `spins-number ${info.available > 0 ? 'text-win' : 'text-loss'}`;
    }

    if (regenEl) {
      if (info.available >= info.max) {
        regenEl.innerHTML = `<span class="text-win">✓ Stock plein (${info.max}/${info.max})</span>`;
      } else {
        regenEl.innerHTML = `⏳ Recharge dans : <strong>${info.countdownFormatted}</strong>`;
      }
    }

    // Mise à jour de la jauge Pity
    const pity = progressionManager.getPityInfo();
    const pityBadge = this.container.querySelector("#pity-badge");
    const pityFill = this.container.querySelector("#pity-progress-fill");
    const pityCard = this.container.querySelector("#pity-status-card");
    const pityDesc = this.container.querySelector("#pity-desc");

    if (pityBadge) pityBadge.textContent = `${pity.current} / 10`;
    if (pityFill) pityFill.style.width = `${pity.percent}%`;
    if (pityCard) {
      if (pity.isLuckyReady) {
        pityCard.classList.add("pity-ready");
      } else {
        pityCard.classList.remove("pity-ready");
      }
    }
    if (pityDesc) {
      pityDesc.innerHTML = pity.isLuckyReady
        ? '<strong class="gold-text">🌟 SUPER SPIN ACTIVÉ !</strong> (Rare+ garanti, 0% Commun)'
        : 'Super Spin béni au 10ème tirage (0% Commun, Rareté accrue)';
    }

    // Gestion des boutons
    if (!this.isSpinning) {
      if (btnSpin) {
        if (info.available <= 0) {
          btnSpin.textContent = `⏳ Recharge (${info.countdownFormatted})`;
          btnSpin.disabled = true;
        } else {
          btnSpin.innerHTML = pity.isLuckyReady
            ? `🌟 <strong>LANCER LE SUPER SPIN</strong> (1 Jeton)`
            : `🎰 Lancer les roues (1 Jeton)`;
          btnSpin.disabled = false;
        }
      }
      if (btnFast) {
        btnFast.disabled = info.available <= 0;
      }
    }
  }

  handleSpinClick(instant = false) {
    const spinInfo = progressionManager.getSpinEnergyInfo();

    if (!spinInfo.canSpin) {
      showToast(
        `⏳ <strong>Aucun tirage disponible !</strong><br>Recharge dans ${spinInfo.countdownFormatted} ou achetez un Jeton d'Urgence dans l'Atelier.`,
        "warning"
      );
      return;
    }

    // Consommer 1 charge d'énergie
    progressionManager.consumeSpinCharge();

    // Avancement de la Jauge de Chance (Pity 10/10)
    const pityOutcome = progressionManager.incrementPity();

    this.updateSpinsDisplay();
    if (this.onCollectionUpdated) this.onCollectionUpdated();

    // Récupérer les upgrades actives de l'Atelier
    const workshopUpgrades = progressionManager.getWorkshopUpgrades();

    // Lancer la génération
    this.startGeneration(instant, {
      isLuckySpin: pityOutcome.isLuckySpin,
      workshopUpgrades,
    });
  }

  startGeneration(instant = false, options = {}) {
    if (this.isSpinning) return;

    const revealZone = this.container.querySelector("#reveal-zone");
    const batchZone = this.container.querySelector("#batch-zone");
    revealZone?.classList.add("hidden");
    batchZone?.classList.add("hidden");

    const character = generateCharacter(options);
    this.pendingCharacter = character;

    if (instant) {
      this.displayReelOutcome(character);
      this.revealCharacter(character);
      return;
    }

    this.isSpinning = true;
    this.setControlsDisabled(true);

    const reelRace = this.container.querySelector("#reel-race");
    const reelWeapon = this.container.querySelector("#reel-weapon");
    const reelPower = this.container.querySelector("#reel-power");

    let intervalRace = setInterval(() => {
      const r = RACES[Math.floor(Math.random() * RACES.length)];
      if (reelRace) reelRace.innerHTML = `<span class="wheel-icon">${r.icon}</span><span class="wheel-label">${r.name}</span>`;
      sound.playTick();
    }, 60);

    let intervalWeapon = setInterval(() => {
      const w = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
      if (reelWeapon) reelWeapon.innerHTML = `<span class="wheel-icon">${w.icon}</span><span class="wheel-label">${w.name}</span>`;
    }, 60);

    let intervalPower = setInterval(() => {
      const p = POWERS[Math.floor(Math.random() * POWERS.length)];
      if (reelPower) reelPower.innerHTML = `<span class="wheel-icon">${p.icon}</span><span class="wheel-label">${p.name}</span>`;
    }, 60);

    setTimeout(() => {
      clearInterval(intervalRace);
      if (reelRace) reelRace.innerHTML = `<span class="wheel-icon">${character.raceIcon}</span><span class="wheel-label">${character.race}</span>`;
      sound.playTick();
    }, 700);

    setTimeout(() => {
      clearInterval(intervalWeapon);
      if (reelWeapon) reelWeapon.innerHTML = `<span class="wheel-icon">${character.weaponIcon}</span><span class="wheel-label">${character.weapon}</span>`;
      sound.playTick();
    }, 1150);

    setTimeout(() => {
      clearInterval(intervalPower);
      if (reelPower) reelPower.innerHTML = `<span class="wheel-icon">${character.powerIcon}</span><span class="wheel-label">${character.power}</span>`;
      this.isSpinning = false;
      this.updateSpinsDisplay();
      this.revealCharacter(character);
    }, 1600);
  }

  displayReelOutcome(char) {
    const reelRace = this.container.querySelector("#reel-race");
    const reelWeapon = this.container.querySelector("#reel-weapon");
    const reelPower = this.container.querySelector("#reel-power");
    if (reelRace) reelRace.innerHTML = `<span class="wheel-icon">${char.raceIcon}</span><span class="wheel-label">${char.race}</span>`;
    if (reelWeapon) reelWeapon.innerHTML = `<span class="wheel-icon">${char.weaponIcon}</span><span class="wheel-label">${char.weapon}</span>`;
    if (reelPower) reelPower.innerHTML = `<span class="wheel-icon">${char.powerIcon}</span><span class="wheel-label">${char.power}</span>`;
  }

  revealCharacter(character) {
    const revealZone = this.container.querySelector("#reveal-zone");
    const cardContainer = this.container.querySelector("#reveal-card-container");
    const revealBanner = this.container.querySelector("#reveal-banner");
    const btnRecycle = this.container.querySelector("#btn-recycle");

    if (!revealZone || !cardContainer) return;

    if (revealBanner) {
      if (character.isLuckySpin) {
        revealBanner.innerHTML = "🌟 <strong>SUPER SPIN DU DESTIN !</strong> Tirage béni d'élite !";
        revealBanner.className = "reveal-banner reveal-banner-lucky";
      } else {
        revealBanner.innerHTML = "✨ NOUVEAU PERSONNAGE OBTENU !";
        revealBanner.className = "reveal-banner";
      }
    }

    if (btnRecycle) {
      const recVal = character.recycleValue || 65;
      btnRecycle.innerHTML = `🪙 Recycler (+${recVal} 🪙)`;
    }

    cardContainer.innerHTML = renderCharacterCard(character, { isDetail: true });
    revealZone.classList.remove("hidden");
    revealZone.scrollIntoView({ behavior: "smooth", block: "nearest" });

    sound.playReveal(character.rarity);

    if (character.rarity === "legendary") {
      showToast("🌟 <strong>LÉGENDAIRE !</strong> Un tirage d'exception extrêmement prestigieux !", "success", 5000);
    }
    if (character.isUnstable) {
      showToast("💥 <strong>COMBINAISON INSTABLE !</strong> Des effets chaotiques sont activés !", "warning");
    }
  }

  handleKeep() {
    if (!this.pendingCharacter) return;

    collectionManager.addCharacter(this.pendingCharacter);
    registerPlayerCardToCommunity(this.pendingCharacter, "Toi");

    const result = progressionManager.processGeneration(this.pendingCharacter, this.pendingCharacter.isLuckySpin);

    showToast(`✅ <strong>${this.pendingCharacter.name}</strong> ajouté à votre collection !`, "success");

    if (result.newAchievements?.length > 0) {
      result.newAchievements.forEach(ach => {
        showToast(`🏆 <strong>Succès débloqué :</strong> ${ach.title} ! (+75 🪙)`, "achievement");
      });
    }

    this.pendingCharacter = null;
    const revealZone = this.container.querySelector("#reveal-zone");
    revealZone?.classList.add("hidden");

    this.updateSpinsDisplay();
    if (this.onCollectionUpdated) this.onCollectionUpdated();
  }

  handleRecycle() {
    if (!this.pendingCharacter) return;

    const coinsEarned = progressionManager.recycleCharacter(this.pendingCharacter);
    showToast(`🪙 <strong>${this.pendingCharacter.name}</strong> recyclé avec succès pour <strong>+${coinsEarned} Pièces</strong> !`, "success");

    this.pendingCharacter = null;
    const revealZone = this.container.querySelector("#reveal-zone");
    revealZone?.classList.add("hidden");

    this.updateSpinsDisplay();
    if (this.onCollectionUpdated) this.onCollectionUpdated();
  }

  generateBatch(count = 10) {
    const chars = [];
    const workshopUpgrades = progressionManager.getWorkshopUpgrades();

    for (let i = 0; i < count; i++) {
      chars.push(generateCharacter({ workshopUpgrades }));
    }

    const revealZone = this.container.querySelector("#reveal-zone");
    const batchZone = this.container.querySelector("#batch-zone");
    const batchGrid = this.container.querySelector("#batch-grid");

    revealZone?.classList.add("hidden");
    if (!batchZone || !batchGrid) return;

    batchGrid.innerHTML = chars.map(c => `
      <div class="batch-item">
        ${renderCharacterCard(c)}
        <div class="batch-btn-row">
          <button class="btn btn-primary btn-sm btn-batch-add" data-char-json='${encodeURIComponent(JSON.stringify(c))}'>
            Conserver
          </button>
          <button class="btn btn-warning btn-sm btn-batch-recycle" data-char-json='${encodeURIComponent(JSON.stringify(c))}'>
            Recycler (+${c.recycleValue} 🪙)
          </button>
        </div>
      </div>
    `).join("");

    batchZone.classList.remove("hidden");
    batchZone.scrollIntoView({ behavior: "smooth", block: "nearest" });

    batchGrid.querySelectorAll(".btn-batch-add").forEach(btn => {
      btn.addEventListener("click", () => {
        const char = JSON.parse(decodeURIComponent(btn.getAttribute("data-char-json")));
        collectionManager.addCharacter(char);
        registerPlayerCardToCommunity(char, "Toi (Test)");
        progressionManager.processGeneration(char);
        btn.parentElement.innerHTML = `<span class="text-win">✓ Conservé</span>`;
        showToast(`Ajouté : ${char.name}`, "success");
        if (this.onCollectionUpdated) this.onCollectionUpdated();
      });
    });

    batchGrid.querySelectorAll(".btn-batch-recycle").forEach(btn => {
      btn.addEventListener("click", () => {
        const char = JSON.parse(decodeURIComponent(btn.getAttribute("data-char-json")));
        const coins = progressionManager.recycleCharacter(char);
        btn.parentElement.innerHTML = `<span class="gold-text">+${coins} 🪙 Recyclé</span>`;
        showToast(`Recyclé : ${char.name} (+${coins} 🪙)`, "info");
        if (this.onCollectionUpdated) this.onCollectionUpdated();
      });
    });

    const btnKeepAll = this.container.querySelector("#btn-batch-keep-all");
    btnKeepAll?.addEventListener("click", () => {
      chars.forEach(c => {
        collectionManager.addCharacter(c);
        registerPlayerCardToCommunity(c, "Toi (Test)");
        progressionManager.processGeneration(c);
      });
      showToast(`🎉 Les ${count} personnages ont été ajoutés à votre collection !`, "success");
      batchZone.classList.add("hidden");
      if (this.onCollectionUpdated) this.onCollectionUpdated();
    });

    const btnClose = this.container.querySelector("#btn-batch-close");
    btnClose?.addEventListener("click", () => {
      batchZone.classList.add("hidden");
    });
  }

  setControlsDisabled(disabled) {
    const btns = this.container.querySelectorAll("#generator-controls button");
    btns.forEach(b => { b.disabled = disabled; });
  }
}

