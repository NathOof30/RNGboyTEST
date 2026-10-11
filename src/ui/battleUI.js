/**
 * INTERFACE DU SYSTÈME DE COMBAT (Sections 19, 20, 21, 22, 23, 24, 25, 44, 46)
 * 
 * - Modes : Combat Rapide, Défis d'Arène, Duel Miroir (Collection vs Collection)
 * - Support de la Seed reproductible
 * - Animation tour par tour avec barres de PV dynamiques et journal d'événements
 * - Bouton [COMBAT INSTANTANÉ] pour tests ultra-rapides
 * - Distribution des récompenses de points et d'XP
 */

import { collectionManager } from "../collection/collectionManager.js";
import { progressionManager } from "../progression/progressionManager.js";
import { generateQuickOpponent, generateChallengersList } from "../combat/opponentsPool.js";
import { simulateBattle } from "../combat/battleEngine.js";
import { renderCharacterCard } from "./characterCardUI.js";
import { sound } from "../utils/sound.js";
import { showToast } from "./notifications.js";

export class BattleUI {
  constructor(container, onBattleFinished) {
    this.container = container;
    this.onBattleFinished = onBattleFinished;

    this.selectedPlayerCharId = null;
    this.selectedOpponent = null;
    this.currentMode = "quick"; // 'quick', 'challenge', 'mirror'
    this.challengers = [];

    this.isPlaying = false;
    this.isInstant = false;
    this.currentTurnIndex = 0;
    this.battleResult = null;
    this.activeTimeouts = [];
    this.tickerInterval = null;

    this.render();
    this.startTicker();
  }

  startTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      this.updateTicketsDisplay();
    }, 1000);
  }

  updateTicketsDisplay() {
    const arenaInfo = progressionManager.getArenaTicketInfo();
    const ticketsVal = this.container.querySelector("#arena-tickets-val");
    const ticketsTimer = this.container.querySelector("#arena-tickets-timer");
    const btnStart = this.container.querySelector("#btn-start-battle");
    const btnInstant = this.container.querySelector("#btn-start-instant");

    if (ticketsVal) {
      ticketsVal.textContent = `${arenaInfo.available} / ${arenaInfo.max}`;
      ticketsVal.className = `arena-number ${arenaInfo.available > 0 ? 'text-win' : 'text-loss'}`;
    }

    if (ticketsTimer) {
      if (arenaInfo.available >= arenaInfo.max) {
        ticketsTimer.innerHTML = `<span class="text-win">✓ Stock plein (${arenaInfo.max}/${arenaInfo.max})</span>`;
      } else {
        ticketsTimer.innerHTML = `⏳ Recharge dans : <strong>${arenaInfo.countdownFormatted}</strong>`;
      }
    }

    if (btnStart) {
      if (!arenaInfo.canBattle) {
        btnStart.textContent = `⏳ Pas de Ticket (${arenaInfo.countdownFormatted})`;
        btnStart.disabled = true;
      } else {
        btnStart.textContent = `⚔️ Lancer le combat (1 Ticket)`;
        btnStart.disabled = false;
      }
    }
    if (btnInstant) {
      btnInstant.disabled = !arenaInfo.canBattle;
    }
  }

  setPlayerCharacter(characterId) {
    this.selectedPlayerCharId = characterId;
    this.render();
  }

  render() {
    const playerChars = collectionManager.getAll();
    const hasFighters = playerChars.length > 0;

    // Si aucun combattant n'est sélectionné, prendre le premier par défaut
    if (!this.selectedPlayerCharId && hasFighters) {
      this.selectedPlayerCharId = playerChars[0].id;
    }

    const selectedPlayerChar = collectionManager.getById(this.selectedPlayerCharId);

    // Initialiser les adversaires de défi si non fait
    const playerElo = progressionManager.getElo();
    const playerLeague = progressionManager.getLeague(playerElo);

    if (this.challengers.length === 0) {
      this.challengers = generateChallengersList(selectedPlayerChar ? selectedPlayerChar.power : 65, playerElo);
    }

    this.container.innerHTML = `
      <div class="battle-wrapper">
        <div class="battle-header">
          <h2>⚔️ Arène de Combat</h2>
          <p class="section-subtitle">Affrontez des rivaux réels ou simulés selon votre classement Élo et grimpez les ligues</p>
        </div>

        <!-- BANDEAU DES TICKETS D'ARÈNE ET ÉLO -->
        <div class="arena-status-bar">
          <div class="arena-status-card">
            <span class="arena-icon">🎟️</span>
            <div class="arena-info-text">
              <div class="arena-count-row">
                <span class="arena-label">Tickets d'Arène :</span>
                <span class="arena-number" id="arena-tickets-val">5 / 5</span>
              </div>
              <div class="arena-timer-row" id="arena-tickets-timer">Stock plein</div>
            </div>
          </div>

          <div class="arena-status-card arena-elo-card">
            <span class="arena-icon" id="arena-league-icon">${playerLeague.icon}</span>
            <div class="arena-info-text">
              <div class="arena-count-row">
                <span class="arena-label">Classement ÉLO :</span>
                <span class="arena-number gold-text" id="arena-elo-val">${playerElo}</span>
              </div>
              <div class="arena-timer-row" id="arena-league-name" style="color: ${playerLeague.color}">
                Ligue ${playerLeague.name}
              </div>
            </div>
          </div>
        </div>

        ${!hasFighters ? `
          <div class="empty-state">
            <div class="empty-icon">🛡️</div>
            <h3>Aucun guerrier dans votre collection</h3>
            <p>Rendez-vous dans l'onglet <strong>Générer</strong> pour forger au moins un personnage avant d'entrer dans l'arène !</p>
          </div>
        ` : `
          <!-- SÉLECTION DE MODE ET CONFIGURATION -->
          <div class="battle-setup-card" id="battle-setup">
            <div class="mode-tabs">
              <button class="mode-tab ${this.currentMode === 'quick' ? 'active' : ''}" data-mode="quick">
                ⚡ Mode Rapide
              </button>
              <button class="mode-tab ${this.currentMode === 'challenge' ? 'active' : ''}" data-mode="challenge">
                🏆 Défis d'Arène
              </button>
              <button class="mode-tab ${this.currentMode === 'mirror' ? 'active' : ''}" data-mode="mirror">
                🪞 Duel Collection
              </button>
            </div>

            <div class="setup-grid">
              <!-- Choix combattant joueur -->
              <div class="setup-column">
                <label class="setup-lbl">👤 Votre combattant :</label>
                <select id="select-player-char" class="select-control">
                  ${playerChars.map(c => `
                    <option value="${c.id}" ${c.id === this.selectedPlayerCharId ? 'selected' : ''}>
                      ${c.name} (${c.race} - Power ${c.power})
                    </option>
                  `).join("")}
                </select>
                <div class="mini-char-preview" id="player-preview">
                  ${selectedPlayerChar ? renderCharacterCard(selectedPlayerChar) : ''}
                </div>
              </div>

              <!-- VS divider & options -->
              <div class="setup-middle">
                <div class="vs-badge">VS</div>

                <div class="seed-control-box">
                  <label class="seed-lbl">Seed reproductible :</label>
                  <div class="seed-input-row">
                    <input type="number" id="input-seed" class="input-control" placeholder="Aléatoire" value="">
                    <button class="btn btn-sm btn-outline" id="btn-rand-seed" title="Nouvelle seed aléatoire">🎲</button>
                  </div>
                </div>

                <div class="action-buttons-stack">
                  <button class="btn btn-primary btn-large" id="btn-start-battle">
                    ⚔️ Lancer le combat (1 Ticket)
                  </button>
                  <button class="btn btn-secondary btn-fast" id="btn-start-instant" title="Résultat sans attendre l'animation">
                    ⚡ Combat instantané
                  </button>
                </div>
              </div>

              <!-- Choix / adversaire selon mode -->
              <div class="setup-column">
                <label class="setup-lbl" id="opponent-lbl">👾 Adversaire :</label>
                
                ${this.currentMode === 'mirror' ? `
                  <select id="select-mirror-char" class="select-control">
                    ${playerChars.map(c => `
                      <option value="${c.id}">
                        ${c.name} (${c.race} - Power ${c.power})
                      </option>
                    `).join("")}
                  </select>
                  <div class="mini-char-preview" id="opp-preview"></div>
                ` : this.currentMode === 'challenge' ? `
                  <div class="challengers-list" id="challengers-list">
                    ${this.challengers.map((ch, idx) => `
                      <div class="challenger-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
                        <div class="challenger-top">
                          <span class="chal-rank">${ch.arenaRank}</span>
                          <span class="chal-power">Élo ${ch.elo || 1000}</span>
                        </div>
                        <div class="chal-name">${ch.name} (${ch.race} • Power ${ch.power})</div>
                      </div>
                    `).join("")}
                  </div>
                  <div class="mini-char-preview" id="opp-preview">
                    ${this.challengers[0] ? renderCharacterCard(this.challengers[0]) : ''}
                  </div>
                ` : `
                  <div class="auto-opponent-banner">
                    Adversaire sélectionné automatiquement selon votre classement Élo.
                    <button class="btn btn-outline btn-sm" id="btn-reroll-opp" style="margin-top: 8px;">
                      🔄 Changer d'adversaire
                    </button>
                  </div>
                  <div class="mini-char-preview" id="opp-preview"></div>
                `}
              </div>
            </div>
          </div>

          <!-- ARÈNE DE COMBAT ACTIVE -->
          <div class="arena-active-card hidden" id="arena-card">
            <div class="arena-top-bar">
              <span class="turn-counter" id="turn-display">Préparation...</span>
              <div class="speed-controls">
                <button class="btn btn-sm btn-outline active" id="btn-speed-normal">Normal</button>
                <button class="btn btn-sm btn-outline" id="btn-speed-fast">Rapide (x3)</button>
                <button class="btn btn-sm btn-warning" id="btn-skip-battle">Passer à la fin</button>
              </div>
            </div>

            <!-- COMBATTANTS FACE À FACE -->
            <div class="arena-duel-board">
              <div class="duelist duelist-player" id="duelist-1">
                <div class="duelist-name" id="d1-name">Joueur</div>
                <div class="hp-gauge-wrapper">
                  <div class="hp-gauge-fill" id="d1-hp-fill" style="width: 100%;"></div>
                  <span class="hp-gauge-text" id="d1-hp-text">100 / 100</span>
                </div>
                <div class="shield-indicator hidden" id="d1-shield">🛡️ Bouclier : <span id="d1-shield-val">0</span></div>
                <div class="duelist-meta" id="d1-meta"></div>
              </div>

              <div class="arena-vs-icon">⚔️</div>

              <div class="duelist duelist-opponent" id="duelist-2">
                <div class="duelist-name" id="d2-name">Adversaire</div>
                <div class="hp-gauge-wrapper">
                  <div class="hp-gauge-fill" id="d2-hp-fill" style="width: 100%;"></div>
                  <span class="hp-gauge-text" id="d2-hp-text">100 / 100</span>
                </div>
                <div class="shield-indicator hidden" id="d2-shield">🛡️ Bouclier : <span id="d2-shield-val">0</span></div>
                <div class="duelist-meta" id="d2-meta"></div>
              </div>
            </div>

            <!-- JOURNAL DES ACTIONS DU COMBAT (Section 20) -->
            <div class="battle-log-container">
              <div class="log-title">📜 Journal du combat</div>
              <div class="log-entries" id="log-entries"></div>
            </div>
          </div>

          <!-- MODAL RÉSULTAT DU COMBAT -->
          <div class="modal-overlay hidden" id="battle-result-modal">
            <div class="modal-content modal-battle-result">
              <div class="result-header" id="result-header">VICTOIRE !</div>
              <div class="result-message" id="result-message"></div>
              <div class="result-rewards" id="result-rewards"></div>
              <div class="modal-actions">
                <button class="btn btn-primary btn-large" id="btn-result-close">
                  Recommencer / Continuer
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    this.bindEvents();
    this.updateOpponentPreview();
  }

  bindEvents() {
    // Onglets de mode
    this.container.querySelectorAll(".mode-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        this.currentMode = tab.getAttribute("data-mode");
        this.render();
      });
    });

    // Changement de personnage joueur
    const selectPlayer = this.container.querySelector("#select-player-char");
    selectPlayer?.addEventListener("change", (e) => {
      this.selectedPlayerCharId = e.target.value;
      const char = collectionManager.getById(this.selectedPlayerCharId);
      const preview = this.container.querySelector("#player-preview");
      if (preview && char) preview.innerHTML = renderCharacterCard(char);
      this.updateOpponentPreview();
    });

    // Seed aléatoire
    const btnRandSeed = this.container.querySelector("#btn-rand-seed");
    const inputSeed = this.container.querySelector("#input-seed");
    btnRandSeed?.addEventListener("click", () => {
      if (inputSeed) inputSeed.value = Math.floor(Math.random() * 900000 + 100000);
    });

    // Reroll opp
    const btnReroll = this.container.querySelector("#btn-reroll-opp");
    btnReroll?.addEventListener("click", () => {
      this.selectedOpponent = null;
      this.updateOpponentPreview();
    });

    // Challengers click
    this.container.querySelectorAll(".challenger-item").forEach(item => {
      item.addEventListener("click", () => {
        this.container.querySelectorAll(".challenger-item").forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");
        const idx = Number(item.getAttribute("data-idx"));
        this.selectedOpponent = this.challengers[idx];
        const preview = this.container.querySelector("#opp-preview");
        if (preview && this.selectedOpponent) {
          preview.innerHTML = renderCharacterCard(this.selectedOpponent);
        }
      });
    });

    // Mirror selection
    const selectMirror = this.container.querySelector("#select-mirror-char");
    selectMirror?.addEventListener("change", (e) => {
      this.selectedOpponent = collectionManager.getById(e.target.value);
      const preview = this.container.querySelector("#opp-preview");
      if (preview && this.selectedOpponent) {
        preview.innerHTML = renderCharacterCard(this.selectedOpponent);
      }
    });

    // Lancement du combat
    const btnStart = this.container.querySelector("#btn-start-battle");
    const btnInstant = this.container.querySelector("#btn-start-instant");

    btnStart?.addEventListener("click", () => this.initiateBattle(false));
    btnInstant?.addEventListener("click", () => this.initiateBattle(true));

    // Contrôles de vitesse
    const btnSpeedNorm = this.container.querySelector("#btn-speed-normal");
    const btnSpeedFast = this.container.querySelector("#btn-speed-fast");
    const btnSkip = this.container.querySelector("#btn-skip-battle");

    btnSpeedNorm?.addEventListener("click", () => {
      this.speedDelay = 650;
      btnSpeedNorm.classList.add("active");
      btnSpeedFast?.classList.remove("active");
    });

    btnSpeedFast?.addEventListener("click", () => {
      this.speedDelay = 200;
      btnSpeedFast.classList.add("active");
      btnSpeedNorm?.classList.remove("active");
    });

    btnSkip?.addEventListener("click", () => {
      this.skipToEnd();
    });

    // Fermeture du résultat
    const btnResClose = this.container.querySelector("#btn-result-close");
    const resModal = this.container.querySelector("#battle-result-modal");
    btnResClose?.addEventListener("click", () => {
      resModal?.classList.add("hidden");
      const setup = this.container.querySelector("#battle-setup");
      const arena = this.container.querySelector("#arena-card");
      setup?.classList.remove("hidden");
      arena?.classList.add("hidden");
      if (this.onBattleFinished) this.onBattleFinished();
    });
  }

  updateOpponentPreview() {
    const oppPreview = this.container.querySelector("#opp-preview");
    if (!oppPreview) return;

    const playerChar = collectionManager.getById(this.selectedPlayerCharId);
    const playerElo = progressionManager.getElo();

    if (this.currentMode === "quick") {
      if (!this.selectedOpponent) {
        this.selectedOpponent = generateQuickOpponent(playerChar, playerElo);
      }
      oppPreview.innerHTML = renderCharacterCard(this.selectedOpponent);
    } else if (this.currentMode === "challenge") {
      if (!this.selectedOpponent && this.challengers.length > 0) {
        this.selectedOpponent = this.challengers[0];
      }
      if (this.selectedOpponent) oppPreview.innerHTML = renderCharacterCard(this.selectedOpponent);
    } else if (this.currentMode === "mirror") {
      const selectMirror = this.container.querySelector("#select-mirror-char");
      if (selectMirror) {
        this.selectedOpponent = collectionManager.getById(selectMirror.value) || playerChar;
        oppPreview.innerHTML = renderCharacterCard(this.selectedOpponent);
      }
    }
  }

  initiateBattle(isInstant = false) {
    const playerChar = collectionManager.getById(this.selectedPlayerCharId);
    if (!playerChar) {
      showToast("Veuillez sélectionner un personnage de votre collection.", "warning");
      return;
    }

    const arenaInfo = progressionManager.getArenaTicketInfo();
    if (!arenaInfo.canBattle) {
      showToast(
        `⏳ <strong>Aucun ticket d'Arène disponible !</strong><br>Prochaine recharge dans ${arenaInfo.countdownFormatted}.`,
        "warning"
      );
      return;
    }

    const playerElo = progressionManager.getElo();
    if (!this.selectedOpponent) {
      this.selectedOpponent = generateQuickOpponent(playerChar, playerElo);
    }

    // Consommer 1 ticket d'arène
    progressionManager.consumeArenaTicket();
    this.updateTicketsDisplay();
    if (this.onBattleFinished) this.onBattleFinished();

    const inputSeed = this.container.querySelector("#input-seed");
    const seed = inputSeed && inputSeed.value ? Number(inputSeed.value) : Math.floor(Math.random() * 900000 + 100000);

    // Exécution du moteur de simulation
    this.battleResult = simulateBattle(playerChar, this.selectedOpponent, { seed });
    this.speedDelay = 650;

    // Basculer l'affichage vers l'arène
    const setup = this.container.querySelector("#battle-setup");
    const arena = this.container.querySelector("#arena-card");
    setup?.classList.add("hidden");
    arena?.classList.remove("hidden");

    this.setupArenaUI(playerChar, this.selectedOpponent);

    if (isInstant) {
      this.skipToEnd();
    } else {
      this.playTurnAnimations();
    }
  }

  setupArenaUI(char1, char2) {
    const d1Name = this.container.querySelector("#d1-name");
    const d2Name = this.container.querySelector("#d2-name");
    const d1HpText = this.container.querySelector("#d1-hp-text");
    const d2HpText = this.container.querySelector("#d2-hp-text");
    const d1Fill = this.container.querySelector("#d1-hp-fill");
    const d2Fill = this.container.querySelector("#d2-hp-fill");
    const d1Meta = this.container.querySelector("#d1-meta");
    const d2Meta = this.container.querySelector("#d2-meta");
    const logBox = this.container.querySelector("#log-entries");

    if (d1Name) d1Name.innerHTML = `${char1.name} <span class="badge-power">Power ${char1.power}</span>`;
    if (d2Name) d2Name.innerHTML = `${char2.name} <span class="badge-power">Power ${char2.power}</span>`;

    if (d1HpText) d1HpText.textContent = `${char1.hp} / ${char1.hp}`;
    if (d2HpText) d2HpText.textContent = `${char2.hp} / ${char2.hp}`;
    if (d1Fill) d1Fill.style.width = "100%";
    if (d2Fill) d2Fill.style.width = "100%";

    if (d1Meta) d1Meta.innerHTML = `${char1.raceIcon} ${char1.race} | ${char1.weaponIcon} ${char1.weapon} | ${char1.powerIcon} ${char1.power}`;
    if (d2Meta) d2Meta.innerHTML = `${char2.raceIcon} ${char2.race} | ${char2.weaponIcon} ${char2.weapon} | ${char2.powerIcon} ${char2.power}`;

    if (logBox) logBox.innerHTML = "";
  }

  playTurnAnimations() {
    this.clearTimeouts();
    const logs = this.battleResult.logs;
    const logBox = this.container.querySelector("#log-entries");
    const turnDisplay = this.container.querySelector("#turn-display");
    const d1Fill = this.container.querySelector("#d1-hp-fill");
    const d2Fill = this.container.querySelector("#d2-hp-fill");
    const d1HpText = this.container.querySelector("#d1-hp-text");
    const d2HpText = this.container.querySelector("#d2-hp-text");

    let stepIndex = 0;

    const executeStep = () => {
      if (stepIndex >= logs.length) {
        this.displayFinalResult();
        return;
      }

      const log = logs[stepIndex];

      // Mise à jour de l'affichage du tour
      if (turnDisplay && log.turn > 0) {
        turnDisplay.textContent = `Tour ${log.turn}`;
      }

      // Mise à jour des barres de vie
      if (d1Fill && d1HpText) {
        const p1Ratio = Math.max(0, log.f1Hp / this.battleResult.f1MaxHp);
        d1Fill.style.width = `${Math.min(100, Math.round(p1Ratio * 100))}%`;
        d1HpText.textContent = `${log.f1Hp} / ${this.battleResult.f1MaxHp}`;
      }

      if (d2Fill && d2HpText) {
        const p2Ratio = Math.max(0, log.f2Hp / this.battleResult.f2MaxHp);
        d2Fill.style.width = `${Math.min(100, Math.round(p2Ratio * 100))}%`;
        d2HpText.textContent = `${log.f2Hp} / ${this.battleResult.f2MaxHp}`;
      }

      // Ajout de la ligne dans le journal
      if (logBox) {
        const entryEl = document.createElement("div");
        entryEl.className = `log-entry log-${log.type}`;
        entryEl.textContent = log.text;
        logBox.appendChild(entryEl);
        logBox.scrollTop = logBox.scrollHeight;
      }

      // Sons d'ambiance
      if (log.type === "attack") sound.playHit();
      if (log.type === "power" || log.type === "synergy") sound.playTick();

      stepIndex++;
      const t = setTimeout(executeStep, this.speedDelay);
      this.activeTimeouts.push(t);
    };

    executeStep();
  }

  skipToEnd() {
    this.clearTimeouts();
    const logs = this.battleResult.logs;
    const logBox = this.container.querySelector("#log-entries");
    const d1Fill = this.container.querySelector("#d1-hp-fill");
    const d2Fill = this.container.querySelector("#d2-hp-fill");
    const d1HpText = this.container.querySelector("#d1-hp-text");
    const d2HpText = this.container.querySelector("#d2-hp-text");

    if (d1Fill && d1HpText) {
      const p1Ratio = Math.max(0, this.battleResult.f1FinalHp / this.battleResult.f1MaxHp);
      d1Fill.style.width = `${Math.round(p1Ratio * 100)}%`;
      d1HpText.textContent = `${this.battleResult.f1FinalHp} / ${this.battleResult.f1MaxHp}`;
    }
    if (d2Fill && d2HpText) {
      const p2Ratio = Math.max(0, this.battleResult.f2FinalHp / this.battleResult.f2MaxHp);
      d2Fill.style.width = `${Math.round(p2Ratio * 100)}%`;
      d2HpText.textContent = `${this.battleResult.f2FinalHp} / ${this.battleResult.f2MaxHp}`;
    }

    if (logBox) {
      logBox.innerHTML = logs.map(l => `
        <div class="log-entry log-${l.type}">${l.text}</div>
      `).join("");
      logBox.scrollTop = logBox.scrollHeight;
    }

    this.displayFinalResult();
  }

  displayFinalResult() {
    const isWin = this.battleResult.isPlayerWinner;
    const playerChar = collectionManager.getById(this.selectedPlayerCharId);

    // Enregistrer les stats sur le personnage
    if (playerChar) {
      collectionManager.recordCombatResult(playerChar.id, isWin);
    }
    // Si mode miroir, enregistrer aussi sur l'adversaire de la collection
    if (this.currentMode === "mirror" && this.selectedOpponent) {
      collectionManager.recordCombatResult(this.selectedOpponent.id, !isWin);
    }

    // Traitement de la progression (points, XP, succès)
    const progResult = progressionManager.processBattleResult(
      isWin,
      playerChar,
      this.selectedOpponent
    );

    if (isWin) {
      sound.playVictory();
    } else {
      sound.playDefeat();
    }

    // Modal de résultat
    const resModal = this.container.querySelector("#battle-result-modal");
    const resHeader = this.container.querySelector("#result-header");
    const resMsg = this.container.querySelector("#result-message");
    const resRewards = this.container.querySelector("#result-rewards");

    if (resHeader) {
      resHeader.textContent = isWin ? "🏆 VICTOIRE !" : "💀 DÉFAITE...";
      resHeader.className = `result-header ${isWin ? 'text-win' : 'text-loss'}`;
    }

    if (resMsg) {
      resMsg.innerHTML = isWin
        ? `<strong>${playerChar.name}</strong> a terrassé <strong>${this.selectedOpponent.name}</strong> en ${this.battleResult.totalTurns} tours !`
        : `<strong>${this.selectedOpponent.name}</strong> a pris le dessus sur <strong>${playerChar.name}</strong>. Améliorez votre collection pour retenter votre chance !`;
    }

    if (resRewards) {
      const elo = progResult.eloResult;
      resRewards.innerHTML = `
        <div class="reward-chip chip-gold">🪙 +${progResult.coinsGained} Pièces</div>
        <div class="reward-chip ${elo.delta >= 0 ? 'chip-elo-win' : 'chip-elo-loss'}">
          ⚔️ ${elo.delta >= 0 ? '+' : ''}${elo.delta} Élo (Total: ${elo.newElo})
        </div>
        <div class="reward-chip" style="border-color: ${elo.league.color}">
          ${elo.league.icon} Ligue ${elo.league.name}
        </div>
        <div class="reward-chip">+${progResult.xpGained} XP</div>
        ${progResult.leveledUp ? '<div class="reward-chip chip-levelup">🎉 NIVEAU SUPÉRIEUR !</div>' : ''}
      `;
    }

    // Succès débloqués
    if (progResult.newAchievements?.length > 0) {
      progResult.newAchievements.forEach(ach => {
        showToast(`🏆 <strong>Succès débloqué :</strong> ${ach.title} ! (+75 🪙)`, "achievement");
      });
    }

    // Mettre à jour l'en-tête du composant
    const eloVal = this.container.querySelector("#arena-elo-val");
    const leagueName = this.container.querySelector("#arena-league-name");
    const leagueIcon = this.container.querySelector("#arena-league-icon");
    if (eloVal) eloVal.textContent = progResult.eloResult.newElo;
    if (leagueName) {
      leagueName.textContent = `Ligue ${progResult.eloResult.league.name}`;
      leagueName.style.color = progResult.eloResult.league.color;
    }
    if (leagueIcon) leagueIcon.textContent = progResult.eloResult.league.icon;

    resModal?.classList.remove("hidden");
  }

  clearTimeouts() {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
  }
}
