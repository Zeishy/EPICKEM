import type { ReactNode } from "react";
import { usePageTitle } from "./usePageTitle.ts";

interface PageProps {
  /** Titre de la page : le seul `<h1>`, et le titre de l'onglet. */
  readonly title: string;
  readonly children?: ReactNode;
}

/**
 * Conteneur de toute page. Il garantit un seul `<h1>` par page, identique au titre de l'onglet.
 * Les sections de la page commencent donc à `<h2>`.
 */
export function Page({ title, children }: PageProps) {
  usePageTitle(title);
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      {children}
    </>
  );
}
