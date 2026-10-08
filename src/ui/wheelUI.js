/**
 * INTERFACE DE GÉNÉRATION DES ROUES (Sections 6, 15, 16, 42, 44)
 * 
 * Anime les rouleaux des roues (Race, Arme, Pouvoir),
 * gère le bouton d'accélération (skip animation),
 * et présente la décision Garder / Rejeter.
 */

import { RACES } from "../data/races.js";
import { WEAPONS } from "../data/weapons.js";
import { POWERS } from "../data/powers.js";
import { generateCharacter } from "../generation/characterGenerator.js";
import { renderCharacterCard } from "./characterCardUI.js";
import { sound } from "../utils/sound.js";
import { collectionManager } from "../collection/collectionManager.js";
import { progressionManager } from "../progression/progressionManager.js";
import { showToast } from "./notifications.js";

export class WheelUI {
  constructor(container, onCollectionUpdated) {
    this.container = container;
    this.onCollectionUpdated = onCollectionUpdated;
    this.isSpinning = false;
    this.pendingCharacter = null;
    this.spinIntervals = [];

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="generator-wrapper">
        <div class="generator-header">
          <h2>🎡 Générateur de Personnages</h2>
          <p class="section-subtitle">Lancez les roues pour forger un guerrier unique</p>
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
            🎰 Lancer les roues
          </button>
          <button class="btn btn-secondary btn-fast" id="btn-spin-fast" title="Passe directement le résultat">
            ⚡ Génération instantanée
          </button>
          <button class="btn btn-outline" id="btn-spin-10" title="Génère 10 personnages d'un coup">
            🎲 Générer 10
          </button>
        </div>

        <!-- ZONE DE RÉVÉLATION DU PERSONNAGE -->
        <div class="reveal-zone hidden" id="reveal-zone">
          <div class="reveal-banner">✨ NOUVEAU PERSONNAGE OBTENU !</div>
          <div class="reveal-card-container" id="reveal-card-container"></div>
          
          <div class="decision-box">
            <p class="decision-prompt">Voulez-vous garder ce personnage dans votre collection ?</p>
            <div class="decision-buttons">
              <button class="btn btn-success btn-large" id="btn-keep">
                📥 Garder dans la collection
              </button>
              <button class="btn btn-danger" id="btn-discard">
                🗑️ Rejeter
              </button>
            </div>
          </div>
        </div>

        <!-- ZONE DU LOT MULTIPLE (BATCH 10) -->
        <div class="batch-zone hidden" id="batch-zone">
          <div class="batch-header">
            <h3>🎉 10 Personnages Générés</h3>
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
  }

  bindEvents() {
    const btnSpin = this.container.querySelector("#btn-spin");
    const btnFast = this.container.querySelector("#btn-spin-fast");
    const btn10 = this.container.querySelector("#btn-spin-10");
    const btnKeep = this.container.querySelector("#btn-keep");
    const btnDiscard = this.container.querySelector("#btn-discard");

    btnSpin?.addEventListener("click", () => this.startGeneration(false));
    btnFast?.addEventListener("click", () => this.startGeneration(true));
    btn10?.addEventListener("click", () => this.generateBatch(10));

    btnKeep?.addEventListener("click", () => this.handleKeep());
    btnDiscard?.addEventListener("click", () => this.handleDiscard());
  }

  /**
   * Lance la génération avec ou sans animation
   */
  startGeneration(instant = false, options = {}) {
    if (this.isSpinning) return;

    // Masquer les résultats précédents
    const revealZone = this.container.querySelector("#reveal-zone");
    const batchZone = this.container.querySelector("#batch-zone");
    revealZone?.classList.add("hidden");
    batchZone?.classList.add("hidden");

    // Créer le personnage cible à l'avance
    const character = generateCharacter(options);
    this.pendingCharacter = character;

    if (instant) {
      // Découverte instantanée
      this.displayReelOutcome(character);
      this.revealCharacter(character);
      return;
    }

    this.isSpinning = true;
    this.setControlsDisabled(true);

    const reelRace = this.container.querySelector("#reel-race");
    const reelWeapon = this.container.querySelector("#reel-weapon");
    const reelPower = this.container.querySelector("#reel-power");

    // Lancer le défilement visuel des 3 rouleaux
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

    // Arrêts séquentiels avec suspense
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
      this.setControlsDisabled(false);
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
    if (!revealZone || !cardContainer) return;

    cardContainer.innerHTML = renderCharacterCard(character, { isDetail: true });
    revealZone.classList.remove("hidden");

    // Scroll doux vers le personnage révélé
    revealZone.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Effet sonore selon la rareté
    sound.playReveal(character.rarity);

    // Notifications spéciales
    if (character.rarity === "legendary") {
      showToast("🌟 <strong>LÉGENDAIRE !</strong> Vous avez forgé un guerrier d'exception !", "success");
    }
    if (character.isUnstable) {
      showToast("💥 <strong>COMBINAISON INSTABLE !</strong> Des effets spéciaux sont activés !", "warning");
    }
  }

  handleKeep() {
    if (!this.pendingCharacter) return;

    collectionManager.addCharacter(this.pendingCharacter);
    const result = progressionManager.processGeneration(this.pendingCharacter);

    showToast(`✅ <strong>${this.pendingCharacter.name}</strong> ajouté à votre collection ! (+XP)`, "success");

    if (result.newAchievements?.length > 0) {
      result.newAchievements.forEach(ach => {
        showToast(`🏆 <strong>Succès débloqué :</strong> ${ach.title} ! (+50 pts)`, "achievement");
      });
    }

    this.pendingCharacter = null;
    const revealZone = this.container.querySelector("#reveal-zone");
    revealZone?.classList.add("hidden");

    if (this.onCollectionUpdated) this.onCollectionUpdated();
  }

  handleDiscard() {
    if (!this.pendingCharacter) return;
    showToast(`🗑️ ${this.pendingCharacter.name} a été rejeté.`, "info");
    this.pendingCharacter = null;
    const revealZone = this.container.querySelector("#reveal-zone");
    revealZone?.classList.add("hidden");
  }

  /**
   * Génération par lot (10 personnages pour le test dev, Section 16)
   */
  generateBatch(count = 10) {
    const chars = [];
    for (let i = 0; i < count; i++) {
      chars.push(generateCharacter());
    }

    const revealZone = this.container.querySelector("#reveal-zone");
    const batchZone = this.container.querySelector("#batch-zone");
    const batchGrid = this.container.querySelector("#batch-grid");

    revealZone?.classList.add("hidden");
    if (!batchZone || !batchGrid) return;

    batchGrid.innerHTML = chars.map(c => `
      <div class="batch-item">
        ${renderCharacterCard(c)}
        <button class="btn btn-primary btn-sm btn-batch-add" data-char-json='${encodeURIComponent(JSON.stringify(c))}'>
          Conserver
        </button>
      </div>
    `).join("");

    batchZone.classList.remove("hidden");
    batchZone.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Events pour chaque bouton
    batchGrid.querySelectorAll(".btn-batch-add").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const json = decodeURIComponent(btn.getAttribute("data-char-json"));
        const char = JSON.parse(json);
        collectionManager.addCharacter(char);
        progressionManager.processGeneration(char);
        btn.textContent = "✓ Conservé";
        btn.classList.replace("btn-primary", "btn-secondary");
        btn.disabled = true;
        showToast(`Ajouté : ${char.name}`, "success");
        if (this.onCollectionUpdated) this.onCollectionUpdated();
      });
    });

    const btnKeepAll = this.container.querySelector("#btn-batch-keep-all");
    btnKeepAll?.addEventListener("click", () => {
      chars.forEach(c => {
        collectionManager.addCharacter(c);
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
