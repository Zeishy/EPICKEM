import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createQueryClient } from "../app/queryClient.ts";
import { routes as appRoutes } from "../app/routes.tsx";

/** Affiche l'application à un chemin donné, avec un routeur en mémoire. */
export function renderApp(path = "/", routes: RouteObject[] = appRoutes) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, ...view };
}
