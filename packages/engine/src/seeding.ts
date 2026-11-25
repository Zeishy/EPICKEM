import { err, ok, type Result } from "@epickem/shared";
import { shuffle } from "./random.ts";

/** Identifiant d'un participant (joueur ou équipe), tel que l'API le fournit. */
export type ParticipantId = string;

/**
 * Méthode de seeding d'une étape.
 *
 * - `MANUAL` : l'administrateur donne l'ordre complet, du seed 1 au dernier.
 * - `RANDOM` : tirage reproductible ; la même graine et les mêmes participants donnent
 *   toujours le même ordre, quel que soit l'ordre dans lequel les participants sont fournis.
 * - `RANKING` : tri par une valeur (classement, Elo, points d'une étape précédente).
 *   `ASC` place la plus petite valeur en seed 1 (une place au classement), `DESC` la plus
 *   grande (un Elo). Les participants sans valeur passent après les autres. Les égalités,
 *   et les participants sans valeur entre eux, gardent l'ordre reçu, sauf si `tieSeed`
 *   est fourni : ils sont alors tirés au sort de façon reproductible.
 */
export type SeedingMethod =
  | { readonly type: "MANUAL"; readonly order: readonly ParticipantId[] }
  | { readonly type: "RANDOM"; readonly seed: string | number }
  | {
      readonly type: "RANKING";
      readonly values: Readonly<Record<ParticipantId, number>>;
      readonly direction: "ASC" | "DESC";
      readonly tieSeed?: string | number;
    };

export interface SeededParticipant {
  readonly participantId: ParticipantId;
  /** Seed, de 1 (le mieux placé) à N. */
  readonly seed: number;
}

export type SeedingError =
  "DUPLICATE_PARTICIPANT" | "UNKNOWN_PARTICIPANT" | "MISSING_PARTICIPANT" | "INVALID_VALUE";

/** Attribue un seed de 1 à N à chaque participant selon la méthode choisie. */
export function seedParticipants(
  participants: readonly ParticipantId[],
  method: SeedingMethod,
): Result<SeededParticipant[], SeedingError> {
  if (new Set(participants).size !== participants.length) {
    return err("DUPLICATE_PARTICIPANT");
  }

  const ordered = orderParticipants(participants, method);
  if (!ordered.ok) return ordered;

  return ok(ordered.value.map((participantId, index) => ({ participantId, seed: index + 1 })));
}

function orderParticipants(
  participants: readonly ParticipantId[],
  method: SeedingMethod,
): Result<ParticipantId[], SeedingError> {
  switch (method.type) {
    case "MANUAL":
      return manualOrder(participants, method.order);
    case "RANDOM":
      // Tri préalable : le tirage ne dépend pas de l'ordre de réception des participants.
      return ok(shuffle([...participants].sort(compareIds), method.seed));
    case "RANKING":
      return rankingOrder(participants, method.values, method.direction, method.tieSeed);
  }
}

function manualOrder(
  participants: readonly ParticipantId[],
  order: readonly ParticipantId[],
): Result<ParticipantId[], SeedingError> {
  if (new Set(order).size !== order.length) return err("DUPLICATE_PARTICIPANT");
  const known = new Set(participants);
  if (order.some((id) => !known.has(id))) return err("UNKNOWN_PARTICIPANT");
  if (order.length !== participants.length) return err("MISSING_PARTICIPANT");
  return ok([...order]);
}

function rankingOrder(
  participants: readonly ParticipantId[],
  values: Readonly<Record<ParticipantId, number>>,
  direction: "ASC" | "DESC",
  tieSeed: string | number | undefined,
): Result<ParticipantId[], SeedingError> {
  const known = new Set(participants);
  for (const [id, value] of Object.entries(values)) {
    if (!known.has(id)) return err("UNKNOWN_PARTICIPANT");
    if (!Number.isFinite(value)) return err("INVALID_VALUE");
  }

  const base =
    tieSeed === undefined
      ? [...participants]
      : shuffle([...participants].sort(compareIds), tieSeed);
  const sign = direction === "ASC" ? 1 : -1;

  // Array.prototype.sort est stable : les égalités gardent l'ordre de `base`.
  return ok(
    base.sort((a, b) => {
      const va = values[a];
      const vb = values[b];
      if (va === undefined || vb === undefined) {
        return (va === undefined ? 1 : 0) - (vb === undefined ? 1 : 0);
      }
      return sign * (va - vb);
    }),
  );
}

/** Comparaison par points de code, identique sur toutes les plateformes (pas de locale). */
function compareIds(a: ParticipantId, b: ParticipantId): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
