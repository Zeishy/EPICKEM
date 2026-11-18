/**
 * Pseudonymisation des réponses start.gg avant de les enregistrer comme fixtures.
 *
 * Les fixtures sont commitées dans un dépôt public : elles ne doivent contenir ni pseudo
 * ni identifiant permettant de retrouver un joueur (règle d'or du projet, et conditions
 * d'utilisation de start.gg). La structure, les scores, les personnages et les cartes
 * sont conservés : ce sont eux que les mocks doivent reproduire.
 */

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** Champs supprimés partout : données personnelles ou inutiles aux mocks. */
const REMOVED_KEYS = new Set([
  "user",
  "player",
  "players",
  "participant",
  "participants",
  "gamerTag",
  "prefix",
  "email",
  "contactInfo",
  "connectedAccounts",
  "checkedInParticipants",
  "images",
  "vodUrl",
  "displayScore",
]);

/** Champs qui contiennent l'identifiant d'un participant (entrant) start.gg. */
const ENTRANT_ID_KEYS = new Set(["winnerId"]);

function isObject(value: Json): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Crée un pseudonymiseur. Une même instance doit traiter tous les fichiers d'un
 * événement : un participant garde ainsi le même alias d'un fichier à l'autre.
 */
export function createPseudonymizer(label = "Participant") {
  const aliases = new Map<string, number>();

  function alias(rawId: Json): number | null {
    if (typeof rawId !== "number" && typeof rawId !== "string") return null;
    const key = String(rawId);
    let id = aliases.get(key);
    if (id === undefined) {
      id = aliases.size + 1;
      aliases.set(key, id);
    }
    return id;
  }

  function entrant(value: { [key: string]: Json }): { [key: string]: Json } {
    const id = alias(value.id ?? null);
    const result: { [key: string]: Json } = {};
    for (const [key, child] of Object.entries(value)) {
      if (REMOVED_KEYS.has(key)) continue;
      if (key === "id") result.id = id;
      else if (key === "name")
        result.name = id === null ? null : `${label} ${String(id).padStart(3, "0")}`;
      else result[key] = walk(child);
    }
    return result;
  }

  function walk(value: Json): Json {
    if (Array.isArray(value)) return value.map(walk);
    if (!isObject(value)) return value;

    const result: { [key: string]: Json } = {};
    for (const [key, child] of Object.entries(value)) {
      if (REMOVED_KEYS.has(key)) continue;
      if (key === "entrant" && isObject(child)) result[key] = entrant(child);
      else if (key === "entrants" && Array.isArray(child))
        result[key] = child.map((item) => (isObject(item) ? entrant(item) : walk(item)));
      else if (ENTRANT_ID_KEYS.has(key)) result[key] = child === null ? null : alias(child);
      else result[key] = walk(child);
    }
    return result;
  }

  return {
    pseudonymize: walk,
    /** Nombre de participants distincts rencontrés. */
    get size() {
      return aliases.size;
    },
  };
}
