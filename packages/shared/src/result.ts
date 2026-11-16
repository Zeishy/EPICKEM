/**
 * Résultat d'une opération qui peut échouer, sans exception.
 * Le moteur et les connecteurs renvoient ce type plutôt que de lever des erreurs.
 */
export type Result<T, E = string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
