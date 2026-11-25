import { QueryClient } from "@tanstack/react-query";

/** Client TanStack Query de l'application. Une fonction, pour un client neuf par test. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Les mises à jour en direct (#40) invalideront le cache : pas besoin de recharger souvent.
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
