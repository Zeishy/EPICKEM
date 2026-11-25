import { useEffect } from "react";
import { APP_NAME } from "../config.ts";

/** Titre de l'onglet, sous la forme « Page · EPICKEM ». */
export function formatPageTitle(title: string): string {
  return `${title} · ${APP_NAME}`;
}

/**
 * Met à jour le titre de l'onglet. Chaque page l'appelle, via le composant `Page` : le titre
 * change à chaque navigation, et une page peut le calculer à partir de ses données (le nom
 * d'un tournoi, par exemple).
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = formatPageTitle(title);
  }, [title]);
}
