import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from "react-router";
import { APP_NAME } from "../config.ts";

/** Identifiant du contenu principal, cible du lien d'évitement. */
export const MAIN_CONTENT_ID = "contenu";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  "rounded-control px-2 py-1 underline-offset-4 hover:underline " +
  (isActive ? "font-semibold underline" : "");

/**
 * Structure commune à toutes les pages : lien d'évitement, en-tête et navigation, contenu
 * principal, pied de page. Après chaque navigation, le focus passe au contenu principal :
 * un lecteur d'écran annonce la nouvelle page au lieu de rester sur le lien cliqué.
 */
export function RootLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Comparaison au chemin précédent : pas de focus au premier affichage, ni en double en StrictMode.
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only rounded-control bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Aller au contenu principal
      </a>

      <header className="border-b border-border bg-surface-muted">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="rounded-control text-xl font-bold">
            {APP_NAME}
          </Link>
          <nav aria-label="Navigation principale">
            <ul className="flex gap-4">
              <li>
                <NavLink to="/" end className={navLinkClass}>
                  Accueil
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main
        id={MAIN_CONTENT_ID}
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus:outline-none"
      >
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface-muted">
        <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-fg-muted">
          {APP_NAME} · points, badges et titres uniquement, aucun jeu d'argent.
        </p>
      </footer>

      <ScrollRestoration />
    </div>
  );
}
