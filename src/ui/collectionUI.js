/**
 * INTERFACE DE LA COLLECTION (Sections 17 & 18)
 * 
 * Affichage des personnages en grille, tri multi-critères,
 * filtres par race, pouvoir, rareté et recherche par nom.
 * Modal détaillé pour chaque personnage avec options de combat ou libération.
 */

import { collectionManager } from "../collection/collectionManager.js";
import { renderCharacterCard } from "./characterCardUI.js";
import { RACES } from "../data/races.js";
import { POWERS } from "../data/powers.js";
import { showToast } from "./notifications.js";

export class CollectionUI {
  constructor(container, onNavigateToCombat, onCollectionChanged) {
    this.container = container;
    this.onNavigateToCombat = onNavigateToCombat;
    this.onCollectionChanged = onCollectionChanged;
    this.selectedCharId = null;

    this.filters = {
      sortBy: "power_desc",
      filterRace: "all",
      filterPower: "all",
      filterRarity: "all",
      searchQuery: "",
    };

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="collection-wrapper">
        <div class="collection-header">
          <div class="header-left">
            <h2>📜 Ma Collection (<span id="coll-count">0</span>)</h2>
            <p class="section-subtitle">Gérez vos guerriers, analysez leurs statistiques et préparez vos duels</p>
          </div>
        </div>

        <!-- BARRE D'OUTILS ET FILTRES (Section 17) -->
        <div class="filters-bar">
          <div class="filter-group search-group">
            <input type="text" id="filter-search" class="input-control" placeholder="🔍 Rechercher un nom..." value="${this.filters.searchQuery}">
          </div>

          <div class="filter-group">
            <label class="filter-lbl">Trier par :</label>
            <select id="filter-sort" class="select-control">
              <option value="power_desc">💥 Power (Décroissant)</option>
              <option value="power_asc">💥 Power (Croissant)</option>
              <option value="rarity_desc">⭐ Rareté</option>
              <option value="speed_desc">⚡ Vitesse</option>
              <option value="winrate_desc">🏆 Taux de victoire</option>
              <option value="date_desc">🕒 Plus récents</option>
              <option value="name_asc">🔤 Nom (A-Z)</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-lbl">Race :</label>
            <select id="filter-race" class="select-control">
              <option value="all">Toutes les races</option>
              ${RACES.map(r => `<option value="${r.id}">${r.icon} ${r.name}</option>`).join("")}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-lbl">Pouvoir :</label>
            <select id="filter-power" class="select-control">
              <option value="all">Tous les pouvoirs</option>
              ${POWERS.map(p => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join("")}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-lbl">Rareté :</label>
            <select id="filter-rarity" class="select-control">
              <option value="all">Toutes</option>
              <option value="legendary">Légendaire</option>
              <option value="epic">Épique</option>
              <option value="rare">Rare</option>
              <option value="common">Commun</option>
            </select>
          </div>
        </div>

        <!-- GRILLE DES CARTES -->
        <div class="collection-grid" id="collection-grid"></div>

        <!-- ÉTAT VIDE -->
        <div class="empty-state hidden" id="empty-state">
          <div class="empty-icon">🎴</div>
          <h3>Aucun personnage trouvé</h3>
          <p>Lancez les roues dans l'onglet Générer pour commencer votre collection !</p>
        </div>

        <!-- MODAL DÉTAILS DU PERSONNAGE (Section 18) -->
        <div class="modal-overlay hidden" id="char-modal">
          <div class="modal-content modal-char-detail">
            <button class="modal-close" id="modal-close">×</button>
            <div id="modal-char-body"></div>
            <div class="modal-actions">
              <button class="btn btn-primary btn-large" id="btn-modal-combat">
                ⚔️ Combattre avec ce personnage
              </button>
              <button class="btn btn-outline-danger" id="btn-modal-delete">
                🗑️ Libérer ce personnage
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.refreshGrid();
  }

  bindEvents() {
    const inputSearch = this.container.querySelector("#filter-search");
    const selectSort = this.container.querySelector("#filter-sort");
    const selectRace = this.container.querySelector("#filter-race");
    const selectPower = this.container.querySelector("#filter-power");
    const selectRarity = this.container.querySelector("#filter-rarity");

    inputSearch?.addEventListener("input", (e) => {
      this.filters.searchQuery = e.target.value;
      this.refreshGrid();
    });

    selectSort?.addEventListener("change", (e) => {
      this.filters.sortBy = e.target.value;
      this.refreshGrid();
    });

    selectRace?.addEventListener("change", (e) => {
      this.filters.filterRace = e.target.value;
      this.refreshGrid();
    });

    selectPower?.addEventListener("change", (e) => {
      this.filters.filterPower = e.target.value;
      this.refreshGrid();
    });

    selectRarity?.addEventListener("change", (e) => {
      this.filters.filterRarity = e.target.value;
      this.refreshGrid();
    });

    // Fermeture du modal
    const modalClose = this.container.querySelector("#modal-close");
    const modal = this.container.querySelector("#char-modal");
    modalClose?.addEventListener("click", () => modal?.classList.add("hidden"));
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });

    // Actions du modal
    const btnCombat = this.container.querySelector("#btn-modal-combat");
    btnCombat?.addEventListener("click", () => {
      if (this.selectedCharId && this.onNavigateToCombat) {
        modal?.classList.add("hidden");
        this.onNavigateToCombat(this.selectedCharId);
      }
    });

    const btnDelete = this.container.querySelector("#btn-modal-delete");
    btnDelete?.addEventListener("click", () => {
      if (this.selectedCharId) {
        const char = collectionManager.getById(this.selectedCharId);
        if (confirm(`Êtes-vous sûr de vouloir libérer ${char?.name || 'ce personnage'} ?`)) {
          collectionManager.removeCharacter(this.selectedCharId);
          showToast(`🗑️ ${char?.name} a été libéré de votre collection.`, "info");
          modal?.classList.add("hidden");
          this.refreshGrid();
          if (this.onCollectionChanged) this.onCollectionChanged();
        }
      }
    });
  }

  refreshGrid() {
    const chars = collectionManager.filterAndSort(this.filters);
    const grid = this.container.querySelector("#collection-grid");
    const emptyState = this.container.querySelector("#empty-state");
    const countEl = this.container.querySelector("#coll-count");

    const totalCount = collectionManager.getAll().length;
    if (countEl) countEl.textContent = `${chars.length}${chars.length !== totalCount ? `/${totalCount}` : ''}`;

    if (!grid || !emptyState) return;

    if (chars.length === 0) {
      grid.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    grid.innerHTML = chars.map(char => `
      <div class="collection-item" data-id="${char.id}">
        ${renderCharacterCard(char)}
      </div>
    `).join("");

    // Clic pour ouvrir la fiche détaillée (Section 18)
    grid.querySelectorAll(".collection-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        this.openDetailModal(id);
      });
    });
  }

  openDetailModal(characterId) {
    const char = collectionManager.getById(characterId);
    if (!char) return;

    this.selectedCharId = characterId;
    const modal = this.container.querySelector("#char-modal");
    const modalBody = this.container.querySelector("#modal-char-body");

    if (modal && modalBody) {
      modalBody.innerHTML = renderCharacterCard(char, { isDetail: true });
      modal.classList.remove("hidden");
    }
  }
}
