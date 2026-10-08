/**
 * GESTIONNAIRE D'ADVERSAIRES ET MATCHMAKING (Sections 23 & 24 + Équilibrage)
 * 
 * Architecture cible (Laravel/API future) :
 * 1. Recherche d'abord parmi les personnages créés et sauvegardés par de VRAIS joueurs.
 * 2. Si le pool de cartes joueurs est vide ou insuffisant dans la tranche de niveau,
 *    pioche automatiquement dans une liste de combattants FICTIFS (bots / IA d'arène).
 */

import { generateCharacter } from "../generation/characterGenerator.js";

const COMMUNITY_STORAGE_KEY = "wheelborn_community_pool";

// Joueurs fictifs pré-définis pour amorcer le démarrage
const STARTER_COMMUNITY_CARDS = [
  { creatorName: "Shadow_K", raceId: "elf", weaponId: "bow", powerId: "lightning", forcedRarity: "rare" },
  { creatorName: "ValkyrieFR", raceId: "human", weaponId: "sword", powerId: "fire", forcedRarity: "rare" },
  { creatorName: "Lord_Malok", raceId: "demon", weaponId: "hammer", powerId: "fire", forcedRarity: "epic" },
  { creatorName: "CyberUnit_9", raceId: "robot", weaponId: "gun", powerId: "lightning", forcedRarity: "rare" },
  { creatorName: "Aria_Frost", raceId: "vampire", weaponId: "dagger", powerId: "ice", forcedRarity: "epic" },
  { creatorName: "Kael_Blade", raceId: "human", weaponId: "spear", powerId: "gravity", forcedRarity: "common" },
  { creatorName: "GolemX", raceId: "golem", weaponId: "hammer", powerId: "teleportation", forcedRarity: "rare" },
];

/**
 * Charge la liste des cartes créées par les joueurs
 */
export function getCommunityPlayerCards() {
  try {
    const data = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Erreur chargement pool communautaire", e);
  }

  // Initialisation du pool communautaire d'amorçage
  const seedCards = STARTER_COMMUNITY_CARDS.map(seed => {
    const char = generateCharacter({
      forcedRace: seed.raceId,
      forcedWeapon: seed.weaponId,
      forcedPower: seed.powerId,
      forcedRarity: seed.forcedRarity,
    });
    char.creatorName = seed.creatorName;
    char.isPlayerCreated = true;
    return char;
  });

  saveCommunityPlayerCards(seedCards);
  return seedCards;
}

/**
 * Sauvegarde la liste des cartes créées par les joueurs
 */
export function saveCommunityPlayerCards(cards) {
  try {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error("Erreur sauvegarde pool communautaire", e);
  }
}

/**
 * Enregistre une carte créée par le joueur dans le pool communautaire partagé
 */
export function registerPlayerCardToCommunity(character, playerName = "Toi") {
  const cards = getCommunityPlayerCards();
  const exists = cards.some(c => c.id === character.id);
  if (!exists) {
    const communityEntry = {
      ...character,
      creatorName: playerName,
      isPlayerCreated: true,
      registeredAt: new Date().toISOString(),
    };
    cards.unshift(communityEntry);
    // Limite à 50 cartes communautaires récentes pour la démo
    if (cards.length > 50) cards.pop();
    saveCommunityPlayerCards(cards);
  }
}

/**
 * Génère un adversaire fictif (Bot d'arène de secours)
 */
export function generateFictitiousChallenger(targetPower = 65, roleTitle = "Challenger Fictif") {
  let bestCandidate = null;
  let minDiff = 999;

  for (let i = 0; i < 6; i++) {
    const candidate = generateCharacter();
    const diff = Math.abs(candidate.power - targetPower);
    if (diff < minDiff) {
      minDiff = diff;
      bestCandidate = candidate;
    }
  }

  bestCandidate.isPlayerCreated = false;
  bestCandidate.isFictitious = true;
  bestCandidate.creatorName = `Bot Arène (${roleTitle})`;
  return bestCandidate;
}

/**
 * Sélectionne un adversaire pour le combat rapide :
 * 1. Cherche en priorité un personnage créé par un joueur (différence de power modérée).
 * 2. Si aucune carte joueur correspondante n'est trouvée, pioche un joueur fictif.
 */
export function generateQuickOpponent(playerChar) {
  const targetPower = playerChar ? playerChar.power : 65;
  const communityCards = getCommunityPlayerCards();

  // Filtrer les cartes créées par d'autres joueurs (exclure le personnage actif du joueur)
  const candidatePlayerCards = communityCards.filter(c => !playerChar || c.id !== playerChar.id);

  // Chercher des cartes de joueurs dans une fourchette de power équilibrée (+/- 14)
  const closePlayerCards = candidatePlayerCards.filter(c => Math.abs(c.power - targetPower) <= 14);

  if (closePlayerCards.length > 0) {
    // 🎯 TROUVÉ DANS LE POOL DES JOUEURS !
    const randomIndex = Math.floor(Math.random() * closePlayerCards.length);
    const chosen = { ...closePlayerCards[randomIndex] };
    chosen.isPlayerCreated = true;
    chosen.isFictitious = false;
    return chosen;
  }

  // 🤖 FALLBACK : AUCUNE CARTE JOUEUR DISPONIBLE DANS CETTE FOURCHETTE -> COMBATTANT FICTIF
  return generateFictitiousChallenger(targetPower, "Rival Aléatoire");
}

/**
 * Génère la liste des 4 défis d'arène en piochant en priorité dans les cartes joueurs
 */
export function generateChallengersList(playerHighestPower = 65) {
  const communityCards = getCommunityPlayerCards();

  const targets = [
    { rank: "Initié", targetPower: Math.max(45, playerHighestPower - 8) },
    { rank: "Rival", targetPower: playerHighestPower },
    { rank: "Champion", targetPower: playerHighestPower + 6 },
    { rank: "Boss Suprême", targetPower: playerHighestPower + 14 },
  ];

  return targets.map(t => {
    // Chercher d'abord dans les cartes joueurs
    const matchingPlayerCard = communityCards.find(c => Math.abs(c.power - t.targetPower) <= 7);

    if (matchingPlayerCard) {
      const challenger = { ...matchingPlayerCard };
      challenger.arenaRank = t.rank;
      challenger.isPlayerCreated = true;
      challenger.isFictitious = false;
      return challenger;
    }

    // Sinon, générer un combattant fictif
    const fictitious = generateFictitiousChallenger(t.targetPower, t.rank);
    fictitious.arenaRank = t.rank;
    return fictitious;
  });
}
