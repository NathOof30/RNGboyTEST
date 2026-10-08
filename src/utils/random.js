/**
 * Utilitaires aléatoires et reproductibilité (Seeds).
 * Permet d'exécuter des combats ou générations déterministes si une seed est fournie,
 * ou en aléatoire pur (Math.random) sinon.
 */

// Générateur pseudo-aléatoire Mulberry32
export function createPRNG(seedNumber) {
  let s = Math.floor(seedNumber) >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Retourne un nombre aléatoire entre min et max (inclus)
 */
export function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Retourne un élément aléatoire d'un tableau
 */
export function randomChoice(array, rng = Math.random) {
  if (!array || array.length === 0) return null;
  const index = Math.floor(rng() * array.length);
  return array[index];
}

/**
 * Tirage pondéré
 * @param {Array<{ item: any, weight: number }>} itemsWithWeights
 * @param {Function} rng
 */
export function weightedChoice(itemsWithWeights, rng = Math.random) {
  const totalWeight = itemsWithWeights.reduce((sum, entry) => sum + (entry.weight || 1), 0);
  let threshold = rng() * totalWeight;

  for (const entry of itemsWithWeights) {
    threshold -= (entry.weight || 1);
    if (threshold <= 0) {
      return entry.item;
    }
  }
  return itemsWithWeights[itemsWithWeights.length - 1].item;
}

/**
 * Mélange un tableau (Fisher-Yates)
 */
export function shuffleArray(array, rng = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
