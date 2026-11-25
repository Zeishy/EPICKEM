/**
 * Aléatoire reproductible : une même graine donne toujours la même suite de nombres.
 *
 * Le résultat d'un tirage est stocké en base sous la forme de sa graine. L'algorithme
 * ne doit donc jamais changer : un changement redistribuerait les tirages déjà faits.
 * Les tests figent quelques tirages pour le garantir.
 */

/** Générateur de nombres dans [0, 1). */
export type Random = () => number;

/** Hachage xmur3 : transforme une graine texte en entier 32 bits. */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Générateur mulberry32 initialisé par une graine. */
export function createRandom(seed: string | number): Random {
  let state = hashSeed(String(seed));
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange de Fisher-Yates reproductible. Ne modifie pas le tableau reçu. */
export function shuffle<T>(items: readonly T[], seed: string | number): T[] {
  const random = createRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i] as T;
    result[i] = result[j] as T;
    result[j] = a;
  }
  return result;
}
