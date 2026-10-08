/**
 * POINT D'ENTRÉE PRINCIPAL DE L'APPLICATION WHEELBORN
 * Orchestration des vues, synchronisation des données et gestion des événements globaux.
 */

import { collectionManager } from "./collection/collectionManager.js";
import { progressionManager } from "./progression/progressionManager.js";
import { sound } from "./utils/sound.js";
import { WheelUI } from "./ui/wheelUI.js";
import { CollectionUI } from "./ui/collectionUI.js";
import { BattleUI } from "./ui/battleUI.js";
import { DevUI } from "./ui/devUI.js";
import { renderDailyView, renderLeaderboardView, renderStatsView } from "./ui/extrasUI.js";

class App {
  constructor() {
    this.currentView = "view-generator";
    this.init();
  }

  init() {
    // 1. Initialisation des composants UI
    const genContainer = document.getElementById("view-generator");
    const collContainer = document.getElementById("view-collection");
    const combatContainer = document.getElementById("view-combat");
    const devContainer = document.getElementById("dev-ui-container");

    this.wheelUI = new WheelUI(genContainer, () => this.handleDataUpdated());
    this.collectionUI = new CollectionUI(
      collContainer,
      (charId) => this.navigateToCombatWithChar(charId),
      () => this.handleDataUpdated()
    );
    this.battleUI = new BattleUI(combatContainer, () => this.handleDataUpdated());
    this.devUI = new DevUI(devContainer, () => this.handleDataUpdated());

    // 2. Événements globaux et navigation
    this.bindNavigation();
    this.bindHeaderActions();

    // 3. Mise à jour initiale de l'en-tête
    this.updateHeaderStats();

    // 4. Si la collection est vide au tout premier lancement, on peut proposer de démarrer
    console.log("🎮 WHEELBORN Prototype initialisé avec succès !");
  }

  bindNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetView = btn.getAttribute("data-target");
        this.switchView(targetView);
      });
    });

    // Logo mène à l'écran de génération
    document.getElementById("nav-logo")?.addEventListener("click", () => {
      this.switchView("view-generator");
    });
  }

  bindHeaderActions() {
    // Bouton Son
    const btnSound = document.getElementById("btn-toggle-sound");
    btnSound?.addEventListener("click", () => {
      const isMuted = sound.toggleMute();
      btnSound.textContent = isMuted ? "🔇 Muet" : "🔊 Son";
    });

    // Bouton Dev Mode
    const btnDev = document.getElementById("btn-open-dev");
    btnDev?.addEventListener("click", () => {
      this.devUI.toggle();
    });
  }

  switchView(viewId) {
    this.currentView = viewId;

    // Mise à jour des boutons de navigation
    document.querySelectorAll(".nav-btn").forEach(btn => {
      if (btn.getAttribute("data-target") === viewId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Masquer toutes les sections et afficher la cible
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    const activeSec = document.getElementById(viewId);
    if (activeSec) {
      activeSec.classList.add("active");
    }

    // Rafraîchissement spécifique à la vue
    if (viewId === "view-collection") {
      this.collectionUI.refreshGrid();
    } else if (viewId === "view-combat") {
      this.battleUI.render();
    } else if (viewId === "view-daily") {
      this.renderDailySection();
    } else if (viewId === "view-leaderboard") {
      const el = document.getElementById("view-leaderboard");
      if (el) renderLeaderboardView(el);
    } else if (viewId === "view-stats") {
      const el = document.getElementById("view-stats");
      if (el) renderStatsView(el);
    }

    this.updateHeaderStats();
  }

  navigateToCombatWithChar(charId) {
    this.battleUI.setPlayerCharacter(charId);
    this.switchView("view-combat");
  }

  renderDailySection() {
    const el = document.getElementById("view-daily");
    if (!el) return;

    renderDailyView(el, () => {
      // Déclenche une génération quotidienne spéciale
      progressionManager.claimDaily();
      this.switchView("view-generator");
      this.wheelUI.startGeneration(false, { isDaily: true });
    });
  }

  handleDataUpdated() {
    this.updateHeaderStats();
    if (this.currentView === "view-collection") {
      this.collectionUI.refreshGrid();
    }
    if (this.currentView === "view-daily") {
      this.renderDailySection();
    }
  }

  updateHeaderStats() {
    const countEl = document.getElementById("header-char-count");
    const pointsEl = document.getElementById("header-points");
    const levelEl = document.getElementById("header-level");
    const collBadge = document.getElementById("nav-coll-badge");
    const dailyBadge = document.getElementById("nav-daily-badge");

    const collCount = collectionManager.getAll().length;
    const points = progressionManager.state.points;
    const lvlInfo = progressionManager.getCurrentLevelInfo();
    const dailyAvail = progressionManager.isDailyAvailable();

    if (countEl) countEl.textContent = collCount;
    if (pointsEl) pointsEl.textContent = points.toLocaleString();
    if (levelEl) levelEl.textContent = lvlInfo.level;
    if (collBadge) collBadge.textContent = collCount;

    if (dailyBadge) {
      dailyBadge.textContent = dailyAvail ? "Prêt" : "⏳";
      dailyBadge.style.background = dailyAvail ? "#10b981" : "rgba(0,0,0,0.3)";
    }
  }
}

// Lancement au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
