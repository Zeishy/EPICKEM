import type { RouteObject } from "react-router";
import { HomePage } from "../pages/HomePage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { RootLayout } from "./RootLayout.tsx";
import { RouteError } from "./RouteError.tsx";

/**
 * Routes de l'application. Les pages sont enfants d'une route sans chemin qui porte
 * `errorElement` : une erreur s'affiche dans le layout, avec la navigation.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
