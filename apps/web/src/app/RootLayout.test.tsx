import { act, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { renderApp } from "../test/renderApp.tsx";
import { RootLayout } from "./RootLayout.tsx";
import { RouteError } from "./RouteError.tsx";

/** Violations axe-core du document. Le contraste n'est pas calculable sans moteur de rendu. */
async function axeViolations() {
  const results = await axe.run(document, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map((v) => `${v.id} : ${v.help}`);
}

describe("structure des pages", () => {
  it("expose les landmarks : en-tête, navigation, contenu, pied de page", async () => {
    renderApp("/");
    await screen.findByRole("heading", { level: 1, name: "Accueil" });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("commence par un lien d'évitement vers le contenu principal", async () => {
    renderApp("/");
    await screen.findByRole("heading", { level: 1 });

    await userEvent.tab();
    const skipLink = screen.getByRole("link", { name: "Aller au contenu principal" });
    expect(skipLink).toHaveFocus();

    const main = screen.getByRole("main");
    expect(skipLink).toHaveAttribute("href", `#${main.id}`);
    // tabIndex -1 : le contenu peut recevoir le focus sans entrer dans l'ordre de tabulation.
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it.each([
    ["/", "Accueil"],
    ["/page-qui-n-existe-pas", "Page introuvable"],
  ])("%s : un seul h1, identique au titre de l'onglet", async (path, title) => {
    renderApp(path);
    await screen.findByRole("heading", { level: 1, name: title });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await waitFor(() => expect(document.title).toBe(`${title} · EPICKEM`));
  });

  it("signale la page courante dans la navigation", async () => {
    renderApp("/");
    const link = await screen.findByRole("link", { name: "Accueil" });
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it.each(["/", "/page-qui-n-existe-pas"])("%s : aucune violation axe-core", async (path) => {
    renderApp(path);
    await screen.findByRole("heading", { level: 1 });
    expect(await axeViolations()).toEqual([]);
  });
});

describe("navigation", () => {
  it("met à jour le titre et place le focus sur le contenu principal", async () => {
    const { router } = renderApp("/");
    await screen.findByRole("heading", { level: 1, name: "Accueil" });
    // Pas de déplacement du focus au premier affichage.
    expect(screen.getByRole("main")).not.toHaveFocus();

    await act(() => router.navigate("/inconnue"));
    await screen.findByRole("heading", { level: 1, name: "Page introuvable" });
    expect(document.title).toBe("Page introuvable · EPICKEM");
    expect(screen.getByRole("main")).toHaveFocus();

    await userEvent.click(screen.getByRole("link", { name: "Retour à l'accueil" }));
    await screen.findByRole("heading", { level: 1, name: "Accueil" });
    expect(document.title).toBe("Accueil · EPICKEM");
    expect(screen.getByRole("main")).toHaveFocus();
  });
});

describe("erreurs", () => {
  it("affiche l'erreur dans le layout, sans perdre la navigation", async () => {
    const Broken = () => {
      throw new Error("boom");
    };
    const routes = [
      {
        element: <RootLayout />,
        children: [
          { errorElement: <RouteError />, children: [{ index: true, Component: Broken }] },
        ],
      },
    ];

    // React journalise l'erreur attrapée : on la masque pour garder la sortie lisible.
    const consoleError = console.error;
    console.error = () => {};
    try {
      renderApp("/", routes);
      await screen.findByRole("heading", { level: 1, name: "Erreur" });
    } finally {
      console.error = consoleError;
    }

    expect(screen.getByRole("alert")).toHaveTextContent("Une erreur inattendue s'est produite.");
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(document.title).toBe("Erreur · EPICKEM");
  });
});
