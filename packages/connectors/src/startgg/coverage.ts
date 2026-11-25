/**
 * Mesure de ce qu'un événement start.gg renseigne vraiment : les manches, les
 * personnages et les cartes dépendent de la saisie des organisateurs et des joueurs.
 * Sert à choisir les tournois de démo (#14) et à décider quoi afficher (#54).
 */

/** Sous-ensemble d'un set renvoyé par la requête EVENT_SETS. */
export interface StartggSet {
  readonly completedAt?: number | null;
  readonly slots?: readonly ({ readonly entrant?: unknown } | null)[] | null;
  readonly games?: readonly StartggGame[] | null;
}

export interface StartggGame {
  readonly stage?: { readonly name?: string | null } | null;
  readonly selections?:
    readonly ({ readonly character?: { readonly name?: string | null } | null } | null)[] | null;
}

export interface Coverage {
  readonly sets: number;
  readonly completedSets: number;
  /** Sets dont au moins un emplacement est vide : exempt (bye) ou adversaire pas encore connu. */
  readonly setsWithBye: number;
  /** Sets avec plus de deux participants (FFA). */
  readonly ffaSets: number;
  /** Sets terminés dont le détail des manches est saisi. */
  readonly completedSetsWithGames: number;
  readonly games: number;
  readonly gamesWithCharacters: number;
  readonly gamesWithStage: number;
  readonly distinctCharacters: number;
  readonly distinctStages: number;
}

export function measureCoverage(sets: readonly StartggSet[]): Coverage {
  const characters = new Set<string>();
  const stages = new Set<string>();
  let completedSets = 0;
  let setsWithBye = 0;
  let ffaSets = 0;
  let completedSetsWithGames = 0;
  let games = 0;
  let gamesWithCharacters = 0;
  let gamesWithStage = 0;

  for (const set of sets) {
    const slots = set.slots ?? [];
    const setGames = set.games ?? [];
    const completed = set.completedAt != null;

    if (completed) completedSets += 1;
    if (completed && setGames.length > 0) completedSetsWithGames += 1;
    if (slots.some((slot) => slot?.entrant == null)) setsWithBye += 1;
    if (slots.length > 2) ffaSets += 1;

    for (const game of setGames) {
      games += 1;
      const stage = game.stage?.name;
      if (stage) {
        gamesWithStage += 1;
        stages.add(stage);
      }
      const picked = (game.selections ?? [])
        .map((selection) => selection?.character?.name)
        .filter((name): name is string => Boolean(name));
      if (picked.length > 0) gamesWithCharacters += 1;
      for (const name of picked) characters.add(name);
    }
  }

  return {
    sets: sets.length,
    completedSets,
    setsWithBye,
    ffaSets,
    completedSetsWithGames,
    games,
    gamesWithCharacters,
    gamesWithStage,
    distinctCharacters: characters.size,
    distinctStages: stages.size,
  };
}

/** Part en pourcentage, arrondie à l'unité ; 0 si le total est nul. */
export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
