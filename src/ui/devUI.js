/**
 * OUTILS DE TEST ET MODE DÉVELOPPEUR (Sections 35, 36)
 * 
 * Panneau d'injection de données et simulateur de masse (1000 tirages)
 * pour tester l'équilibrage et les probabilités en quelques millisecondes.
 */

import { generateCharacter } from "../generation/characterGenerator.js";
import { simulateMassGenerations } from "../generation/massSimulator.js";
import { collectionManager } from "../collection/collectionManager.js";
import { progressionManager } from "../progression/progressionManager.js";
import { showToast } from "./notifications.js";

export class DevUI {
  constructor(container, onDataChanged) {
    this.container = container;
    this.onDataChanged = onDataChanged;
    this.isOpen = false;

    this.render();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const panel = this.container.querySelector("#dev-panel");
    if (this.isOpen) {
      panel?.classList.remove("hidden");
    } else {
      panel?.classList.add("hidden");
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="dev-modal-overlay hidden" id="dev-panel">
        <div class="dev-modal-content">
          <div class="dev-header">
            <h3>🛠️ Outils Développeur & Équilibrage (Dev Mode)</h3>
            <button class="btn btn-sm btn-outline" id="btn-dev-close">✕ Fermer</button>
          </div>

          <div class="dev-sections-grid">
            <!-- INJECTION RAPIDE DE PERSONNAGES -->
            <div class="dev-box">
              <h4>📦 Générations rapides</h4>
              <div class="dev-btn-group">
                <button class="btn btn-outline btn-sm" id="dev-gen-1">+1 Personnage</button>
                <button class="btn btn-outline btn-sm" id="dev-gen-10">+10 Personnages</button>
                <button class="btn btn-outline btn-sm" id="dev-gen-100">+100 Personnages</button>
              </div>
              <div class="dev-btn-group" style="margin-top: 8px;">
                <button class="btn btn-primary btn-sm" id="dev-gen-god">👑 Créer Légendaire Parfait</button>
                <button class="btn btn-warning btn-sm" id="dev-gen-unstable">💥 Créer Combinaison Instable</button>
              </div>
            </div>

            <!-- GESTION PROGRESSION & DAILY -->
            <div class="dev-box">
              <h4>⭐ Progression & Invocations</h4>
              <div class="dev-btn-group">
                <button class="btn btn-outline btn-sm" id="dev-add-points">+1 000 Points</button>
                <button class="btn btn-outline btn-sm" id="dev-add-xp">+500 XP</button>
                <button class="btn btn-secondary btn-sm" id="dev-reset-daily">🕒 Reset Daily</button>
              </div>
              <div class="dev-btn-group" style="margin-top: 8px;">
                <button class="btn btn-outline btn-sm" id="dev-add-spin">🎟️ +2 Invocations</button>
                <button class="btn btn-secondary btn-sm" id="dev-reset-hourly">⚡ Reset Cooldown Horaire</button>
              </div>
              <div class="dev-btn-group" style="margin-top: 8px;">
                <button class="btn btn-danger btn-sm" id="dev-clear-coll">🗑️ Vider collection</button>
                <button class="btn btn-outline-danger btn-sm" id="dev-reset-all">⚠️ Reset total</button>
              </div>
            </div>
          </div>

          <!-- SIMULATION DE MASSE (Section 36) -->
          <div class="dev-box simulation-box">
            <div class="sim-header">
              <h4>📊 Simulation de 1 000 Générations (Équilibrage)</h4>
              <button class="btn btn-primary btn-sm" id="btn-run-sim-1000">
                🚀 Lancer la simulation (1 000 tirages)
              </button>
            </div>
            <div class="sim-results" id="sim-results">
              <p class="sim-placeholder">Cliquez sur le bouton ci-dessus pour simuler 1 000 tirages instantanés et obtenir l'analyse complète des probabilités.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnClose = this.container.querySelector("#btn-dev-close");
    const panel = this.container.querySelector("#dev-panel");
    btnClose?.addEventListener("click", () => this.toggle());
    panel?.addEventListener("click", (e) => {
      if (e.target === panel) this.toggle();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.toggle();
    });

    // Générations
    this.container.querySelector("#dev-gen-1")?.addEventListener("click", () => {
      const c = generateCharacter();
      collectionManager.addCharacter(c);
      progressionManager.processGeneration(c);
      showToast(`1 personnage ajouté (${c.name})`, "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-gen-10")?.addEventListener("click", () => {
      for (let i = 0; i < 10; i++) {
        const c = generateCharacter();
        collectionManager.addCharacter(c);
        progressionManager.processGeneration(c);
      }
      showToast("10 personnages ajoutés à la collection", "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-gen-100")?.addEventListener("click", () => {
      for (let i = 0; i < 100; i++) {
        const c = generateCharacter();
        collectionManager.addCharacter(c);
        progressionManager.processGeneration(c);
      }
      showToast("100 personnages ajoutés à la collection", "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-gen-god")?.addEventListener("click", () => {
      const c = generateCharacter({ maxStats: true, forcedRarity: "legendary" });
      collectionManager.addCharacter(c);
      progressionManager.processGeneration(c);
      showToast(`👑 Guerrier Suprême créé : ${c.name} (Power ${c.power})`, "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-gen-unstable")?.addEventListener("click", () => {
      const c = generateCharacter({ forcedRace: "demon", forcedPower: "ice" });
      collectionManager.addCharacter(c);
      progressionManager.processGeneration(c);
      showToast(`💥 Combinaison instable créée : ${c.name} (${c.synergies[0]?.name})`, "warning");
      this.notifyChange();
    });

    // Progression
    this.container.querySelector("#dev-add-points")?.addEventListener("click", () => {
      progressionManager.addPoints(1000);
      showToast("+1 000 Points ajoutés !", "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-add-xp")?.addEventListener("click", () => {
      const res = progressionManager.addXP(500);
      showToast(`+500 XP ajoutés ! ${res.leveledUp ? 'Niveau supérieur !' : ''}`, "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-reset-daily")?.addEventListener("click", () => {
      progressionManager.resetDaily();
      showToast("Cooldown du Personnage Quotidien réinitialisé !", "info");
      this.notifyChange();
    });

    this.container.querySelector("#dev-add-spin")?.addEventListener("click", () => {
      progressionManager.addHourlySpins(2);
      showToast("+2 Invocations ajoutées !", "success");
      this.notifyChange();
    });

    this.container.querySelector("#dev-reset-hourly")?.addEventListener("click", () => {
      progressionManager.resetHourlyCooldown();
      showToast("Cooldown horaire réinitialisé (Stock plein) !", "info");
      this.notifyChange();
    });

    this.container.querySelector("#dev-clear-coll")?.addEventListener("click", () => {
      if (confirm("Vider entièrement votre collection ?")) {
        collectionManager.clear();
        showToast("Collection vidée.", "info");
        this.notifyChange();
      }
    });

    this.container.querySelector("#dev-reset-all")?.addEventListener("click", () => {
      if (confirm("Réinitialiser TOUTE la partie (points, XP, succès, collection) ?")) {
        collectionManager.clear();
        progressionManager.resetAll();
        showToast("Partie entièrement remise à zéro.", "info");
        this.notifyChange();
      }
    });

    // Simulation de 1000
    this.container.querySelector("#btn-run-sim-1000")?.addEventListener("click", () => {
      this.runSimulation();
    });
  }

  runSimulation() {
    const report = simulateMassGenerations(1000, false);
    const box = this.container.querySelector("#sim-results");
    if (!box) return;

    box.innerHTML = `
      <div class="sim-summary-card">
        <div class="sim-stat-headline">
          ⚡ 1 000 tirages simulés en <strong>${report.durationMs} ms</strong>
        </div>

        <div class="sim-grid">
          <div class="sim-col">
            <h5>Distribution des raretés</h5>
            <div class="rarity-bar-group">
              <div class="sim-bar-item">
                <span class="lbl">Commun :</span>
                <span class="val font-bold">${report.rarityPercentages.common}%</span> (${report.rarityCounts.common})
              </div>
              <div class="sim-bar-item">
                <span class="lbl">Rare :</span>
                <span class="val font-bold text-rare">${report.rarityPercentages.rare}%</span> (${report.rarityCounts.rare})
              </div>
              <div class="sim-bar-item">
                <span class="lbl">Épique :</span>
                <span class="val font-bold text-epic">${report.rarityPercentages.epic}%</span> (${report.rarityCounts.epic})
              </div>
              <div class="sim-bar-item">
                <span class="lbl">Légendaire :</span>
                <span class="val font-bold text-leg">${report.rarityPercentages.legendary}%</span> (${report.rarityCounts.legendary})
              </div>
            </div>
          </div>

          <div class="sim-col">
            <h5>Fréquences des tirages</h5>
            <ul class="sim-list">
              <li><strong>Race la + fréquente :</strong> ${report.mostFrequentRace}</li>
              <li><strong>Arme la + fréquente :</strong> ${report.mostFrequentWeapon}</li>
              <li><strong>Pouvoir le + fréquent :</strong> ${report.mostFrequentPower}</li>
              <li><strong>Synergie la + fréquente :</strong> ${report.mostFrequentSynergy}</li>
              <li><strong>Combinaison la + rare :</strong> ${report.rarestCombo}</li>
              <li><strong>Combinaisons instables :</strong> ${report.unstablePercent}%</li>
            </ul>
          </div>

          <div class="sim-col">
            <h5>Moyennes des caractéristiques</h5>
            <ul class="sim-list">
              <li><strong>Power moyen :</strong> ${report.averages.power} (Min: ${report.minPower} / Max: ${report.maxPower})</li>
              <li><strong>Santé (PV) :</strong> ${report.averages.hp}</li>
              <li><strong>Force :</strong> ${report.averages.strength}</li>
              <li><strong>Vitesse :</strong> ${report.averages.speed}</li>
              <li><strong>Défense :</strong> ${report.averages.defense}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  notifyChange() {
    if (this.onDataChanged) this.onDataChanged();
  }
}
