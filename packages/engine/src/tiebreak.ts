import { err, ok, type Result } from "@epickem/shared";
import type { ParticipantId } from "./seeding.ts";

/**
 * Critère de départage, appliqué dans l'ordre configuré pour l'étape.
 *
 * - `HEAD_TO_HEAD` : confrontation directe. Points gagnés, selon le barème, dans les seuls
 *   matchs entre participants encore à égalité (mini-classement).
 * - `GAME_DIFFERENCE` : différence de manches sur tous les matchs de l'étape.
 * - `BUCHHOLZ` : somme des points des adversaires rencontrés (un adversaire rencontré deux
 *   fois compte deux fois). Les exempts ne sont pas des matchs et ne comptent pas.
 * - `SEED` : le meilleur seed passe devant ; un participant sans seed passe après.
 */
export type TiebreakCriterion = "HEAD_TO_HEAD" | "GAME_DIFFERENCE" | "BUCHHOLZ" | "SEED";

/** Match terminé entre deux participants, avec les manches gagnées par chacun. */
export interface MatchRecord {
  readonly participants: readonly [ParticipantId, ParticipantId];
  readonly games: readonly [number, number];
}

/** Barème d'un match, utilisé pour la confrontation directe. Égalité de manches = nul. */
export interface MatchScoring {
  readonly win: number;
  readonly draw: number;
  readonly loss: number;
}

export interface RankingInput {
  readonly participants: readonly ParticipantId[];
  /** Points de l'étape, calculés par le format. Un participant absent a 0 point. */
  readonly points: Readonly<Record<ParticipantId, number>>;
  readonly matches: readonly MatchRecord[];
  readonly tiebreakers: readonly TiebreakCriterion[];
  readonly scoring: MatchScoring;
  readonly seeds?: Readonly<Record<ParticipantId, number>>;
}

export interface Standing {
  readonly participantId: ParticipantId;
  /** Rang, de 1 à N. Des ex aequo partagent le même rang, le suivant est sauté (1, 2, 2, 4). */
  readonly rank: number;
  readonly points: number;
  /**
   * Valeurs des critères évalués pour ce participant, à stocker dans `ClassementEtape.details`.
   * Pour `HEAD_TO_HEAD`, c'est la valeur du dernier mini-classement où il figurait.
   */
  readonly tiebreaks: Partial<Record<TiebreakCriterion, number>>;
}

export type RankingError =
  | "DUPLICATE_PARTICIPANT"
  | "UNKNOWN_PARTICIPANT"
  | "DUPLICATE_CRITERION"
  | "INVALID_MATCH"
  | "INVALID_NUMBER";

/** Classe les participants par points, puis applique les critères de départage dans l'ordre. */
export function rankParticipants(input: RankingInput): Result<Standing[], RankingError> {
  const invalid = validate(input);
  if (invalid) return err(invalid);

  const { participants, matches, tiebreakers, scoring } = input;
  const points = (id: ParticipantId) => input.points[id] ?? 0;
  const details = new Map<ParticipantId, Partial<Record<TiebreakCriterion, number>>>(
    participants.map((id) => [id, {}]),
  );

  const gameDifference = new Map<ParticipantId, number>(participants.map((id) => [id, 0]));
  const buchholz = new Map<ParticipantId, number>(participants.map((id) => [id, 0]));
  for (const {
    participants: [a, b],
    games: [ga, gb],
  } of matches) {
    gameDifference.set(a, (gameDifference.get(a) ?? 0) + ga - gb);
    gameDifference.set(b, (gameDifference.get(b) ?? 0) + gb - ga);
    buchholz.set(a, (buchholz.get(a) ?? 0) + points(b));
    buchholz.set(b, (buchholz.get(b) ?? 0) + points(a));
  }

  /** Valeur d'un critère pour chaque membre du groupe : la plus grande passe devant. */
  const evaluate = (criterion: TiebreakCriterion, group: readonly ParticipantId[]) => {
    const keys = new Map<ParticipantId, number>();
    switch (criterion) {
      case "HEAD_TO_HEAD": {
        const members = new Set(group);
        for (const id of group) keys.set(id, 0);
        for (const {
          participants: [a, b],
          games: [ga, gb],
        } of matches) {
          if (!members.has(a) || !members.has(b)) continue;
          const [pa, pb] =
            ga > gb
              ? [scoring.win, scoring.loss]
              : ga < gb
                ? [scoring.loss, scoring.win]
                : [scoring.draw, scoring.draw];
          keys.set(a, (keys.get(a) ?? 0) + pa);
          keys.set(b, (keys.get(b) ?? 0) + pb);
        }
        break;
      }
      case "GAME_DIFFERENCE":
        for (const id of group) keys.set(id, gameDifference.get(id) ?? 0);
        break;
      case "BUCHHOLZ":
        for (const id of group) keys.set(id, buchholz.get(id) ?? 0);
        break;
      case "SEED":
        for (const id of group) keys.set(id, -(input.seeds?.[id] ?? Infinity));
        break;
    }

    for (const id of group) {
      const detail = details.get(id);
      if (!detail) continue;
      if (criterion === "SEED") {
        const seed = input.seeds?.[id];
        if (seed !== undefined) detail.SEED = seed;
      } else {
        detail[criterion] = keys.get(id) ?? 0;
      }
    }
    return keys;
  };

  /**
   * Départage un groupe à égalité. Dès qu'un critère le scinde, chaque sous-groupe repart
   * du premier critère : la confrontation directe se recalcule entre les seuls participants
   * encore à égalité. Les critères globaux, qui n'avaient pas scindé le groupe, ne scindent
   * pas non plus ses sous-groupes. Renvoie les groupes d'ex aequo, du meilleur au moins bon.
   */
  const resolve = (group: ParticipantId[]): ParticipantId[][] => {
    if (group.length < 2) return [group];
    for (const criterion of tiebreakers) {
      const keys = evaluate(criterion, group);
      const split = groupByDescending(group, (id) => keys.get(id) ?? 0);
      if (split.length > 1) return split.flatMap(resolve);
    }
    return [group];
  };

  const standings: Standing[] = [];
  for (const tied of groupByDescending(participants, points).flatMap(resolve)) {
    const rank = standings.length + 1;
    for (const participantId of tied) {
      standings.push({
        participantId,
        rank,
        points: points(participantId),
        tiebreaks: details.get(participantId) ?? {},
      });
    }
  }
  return ok(standings);
}

/** Regroupe par valeur égale, groupes triés par valeur décroissante, ordre d'entrée conservé. */
function groupByDescending<T>(items: readonly T[], key: (item: T) => number): T[][] {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const k = key(item);
    const group = groups.get(k);
    if (group) group.push(item);
    else groups.set(k, [item]);
  }
  // Comparaison sans soustraction : -Infinity (participant sans seed) reste ordonnable.
  return [...groups.entries()]
    .sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0))
    .map(([, group]) => group);
}

function validate(input: RankingInput): RankingError | undefined {
  const known = new Set(input.participants);
  if (known.size !== input.participants.length) return "DUPLICATE_PARTICIPANT";
  if (new Set(input.tiebreakers).size !== input.tiebreakers.length) return "DUPLICATE_CRITERION";

  const { win, draw, loss } = input.scoring;
  if (![win, draw, loss].every(Number.isFinite)) return "INVALID_NUMBER";

  for (const values of [input.points, input.seeds ?? {}]) {
    for (const [id, value] of Object.entries(values)) {
      if (!known.has(id)) return "UNKNOWN_PARTICIPANT";
      if (!Number.isFinite(value)) return "INVALID_NUMBER";
    }
  }

  for (const {
    participants: [a, b],
    games,
  } of input.matches) {
    if (!known.has(a) || !known.has(b)) return "UNKNOWN_PARTICIPANT";
    if (a === b) return "INVALID_MATCH";
    if (!games.every((g) => Number.isInteger(g) && g >= 0)) return "INVALID_MATCH";
  }
  return undefined;
}
