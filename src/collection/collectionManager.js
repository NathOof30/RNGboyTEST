/**
 * GESTIONNAIRE DE COLLECTION (Sections 16, 17, 18, 38, 39)
 * 
 * Stockage, tri, filtrage, sauvegarde dans localStorage.
 * Fonctions indépendantes de l'interface pour portabilité aisée.
 */

const STORAGE_KEY = "wheelborn_collection";

export class CollectionManager {
  constructor() {
    this.characters = this.loadCollection();
  }

  loadCollection() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn("Erreur chargement collection depuis localStorage", e);
    }
    return [];
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.characters));
    } catch (e) {
      console.error("Erreur sauvegarde collection", e);
    }
  }

  getAll() {
    return this.characters;
  }

  getById(id) {
    return this.characters.find(c => c.id === id) || null;
  }

  addCharacter(character) {
    // Vérifie que le personnage n'est pas déjà présent
    const exists = this.characters.some(c => c.id === character.id);
    if (!exists) {
      this.characters.unshift(character);
      this.saveToStorage();
    }
    return character;
  }

  removeCharacter(id) {
    this.characters = this.characters.filter(c => c.id !== id);
    this.saveToStorage();
    return true;
  }

  clear() {
    this.characters = [];
    this.saveToStorage();
  }

  /**
   * Met à jour les statistiques de combat d'un personnage (Victoire/Défaite)
   */
  recordCombatResult(characterId, isWin) {
    const char = this.getById(characterId);
    if (!char) return null;

    char.battlesCount = (char.battlesCount || 0) + 1;
    if (isWin) {
      char.wins = (char.wins || 0) + 1;
    } else {
      char.losses = (char.losses || 0) + 1;
    }

    this.saveToStorage();
    return char;
  }

  /**
   * Tri et filtrage avancés (Section 17)
   */
  filterAndSort(options = {}) {
    const {
      sortBy = "date_desc",
      filterRace = "all",
      filterPower = "all",
      filterRarity = "all",
      searchQuery = "",
    } = options;

    let result = [...this.characters];

    // 1. Filtrage par recherche de nom
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    // 2. Filtrage par race
    if (filterRace && filterRace !== "all") {
      result = result.filter(c => c.raceId === filterRace);
    }

    // 3. Filtrage par pouvoir
    if (filterPower && filterPower !== "all") {
      result = result.filter(c => c.powerId === filterPower);
    }

    // 4. Filtrage par rareté
    if (filterRarity && filterRarity !== "all") {
      result = result.filter(c => c.rarity === filterRarity);
    }

    // 5. Tri
    const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };

    switch (sortBy) {
      case "power_desc":
        result.sort((a, b) => b.power - a.power);
        break;
      case "power_asc":
        result.sort((a, b) => a.power - b.power);
        break;
      case "rarity_desc":
        result.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
        break;
      case "speed_desc":
        result.sort((a, b) => b.speed - a.speed);
        break;
      case "winrate_desc":
        result.sort((a, b) => {
          const rateA = a.battlesCount > 0 ? (a.wins / a.battlesCount) : -1;
          const rateB = b.battlesCount > 0 ? (b.wins / b.battlesCount) : -1;
          return rateB - rateA;
        });
        break;
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "date_asc":
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "date_desc":
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return result;
  }
}

export const collectionManager = new CollectionManager();
