# @epickem/web

Application web : React, Vite, React Router, TanStack Query, Radix et Tailwind (voir l'ADR-001).

## Commandes

| Commande                               | Rôle                                       |
| -------------------------------------- | ------------------------------------------ |
| `pnpm --filter @epickem/web dev`       | Serveur de développement sur le port 5173  |
| `pnpm --filter @epickem/web build`     | Build de production dans `dist/`           |
| `pnpm --filter @epickem/web test`      | Tests Vitest (jsdom, Testing Library, axe) |
| `pnpm --filter @epickem/web typecheck` | Vérification des types                     |

## Organisation

| Dossier           | Contenu                                                |
| ----------------- | ------------------------------------------------------ |
| `src/app/`        | Routes, layout commun, erreurs, client TanStack Query  |
| `src/pages/`      | Une page par route                                     |
| `src/components/` | Composants partagés : `Page`, `Button`, `usePageTitle` |
| `src/styles/`     | Tailwind et les design tokens (`tokens.css`)           |
| `src/test/`       | Configuration et utilitaires de test (`renderApp`)     |

## Règles pour une nouvelle page

- **Une route dans `src/app/routes.tsx`**, enfant de la route qui porte `errorElement` : une erreur s'affiche dans le layout.
- **Le contenu dans `<Page title="…">`** : il pose le seul `<h1>` de la page et le titre de l'onglet (« Titre · EPICKEM »). Les sections commencent à `<h2>`.
- **Uniquement les tokens de `tokens.css`** (`bg-surface`, `text-fg`, `bg-primary`…) : la palette par défaut de Tailwind est désactivée. Les tokens actuels sont provisoires et seront remplacés par la charte de #11.
- **Les composants interactifs viennent de Radix** quand il en existe un (dialogue, menu, onglets…) : le clavier et l'ARIA sont déjà gérés.
- **Pas d'animation indispensable** : `prefers-reduced-motion` les réduit à presque rien.

## Accessibilité déjà en place

- Landmarks (`header`, `nav`, `main`, `footer`) et lien d'évitement « Aller au contenu principal ».
- Focus toujours visible au clavier (`:focus-visible`).
- À chaque navigation, le titre de l'onglet change et le focus passe au contenu principal.
- Les tests vérifient la structure et lancent axe-core sur chaque page. Le contraste, que jsdom ne peut pas calculer, a été vérifié à la main pour les tokens provisoires.
