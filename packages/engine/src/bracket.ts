import { err, ok, type Result } from "@epickem/shared";

export interface BracketSize {
  /** Nombre de places du tableau : la plus petite puissance de 2 suffisante. */
  readonly size: number;
  /** Places vides, qui donnent un exempt au premier tour. */
  readonly byes: number;
}

export type BracketSizeError = "NOT_ENOUGH_PARTICIPANTS";

/** Taille d'un tableau à élimination directe pour un nombre de participants donné. */
export function bracketSize(participants: number): Result<BracketSize, BracketSizeError> {
  if (!Number.isInteger(participants) || participants < 2) {
    return err("NOT_ENOUGH_PARTICIPANTS");
  }
  let size = 2;
  while (size < participants) size *= 2;
  return ok({ size, byes: size - participants });
}
