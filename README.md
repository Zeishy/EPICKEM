# EPICKEM

[![CI](https://github.com/Zeishy/EPICKEM/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Zeishy/EPICKEM/actions/workflows/ci.yml)

> Nom provisoire : le nom, le logo et la charte du produit arrivent avec #11.

Une plateforme de tournois e-sport où chaque résultat fait avancer l'arbre et met à jour en temps réel les pronostics, les Pick'em et les classements, sur le web et sur une application Android.

- **Tournois** : élimination simple et double, poules, ronde suisse, FFA, avec exempts, seeding, départage et qualifications entre étapes.
- **Pronostics et Pick'em** : des points, des badges et des titres, jamais d'argent.
- **Import** : tournois start.gg (données publiques, avec lien vers la source) et import par fichier.
- **Temps réel** : web, mobile et dashboard se mettent à jour pendant les matchs.
- **Accessibilité** : objectif WCAG 2.2 AA, y compris pour la saisie d'un arbre au clavier.

Toutes les données de démonstration sont générées : le projet ne contient aucune donnée personnelle réelle.

## Prérequis

| Outil   | Version                    | Installation                                       |
| ------- | -------------------------- | -------------------------------------------------- |
| Node.js | 24 ou plus (voir `.nvmrc`) | [nodejs.org](https://nodejs.org)                   |
| pnpm    | 11                         | `npm install -g pnpm@11`                           |
| Docker  | récent                     | Nécessaire pour PostgreSQL et Redis à partir de #6 |

## Installation

```bash
git clone git@github.com:Zeishy/EPICKEM.git
cd EPICKEM
pnpm install
pnpm build
cp .env.example .env
```

- `pnpm install` installe aussi les hooks git, qui vérifient le format et le message de chaque commit.
- `pnpm build` compile les paquets partagés : le lint et l'éditeur en ont besoin pour connaître leurs types.
- Le fichier `.env.example` décrit chaque variable. Le fichier `.env` n'est jamais commité.

Sous VS Code, installez les extensions recommandées à l'ouverture du dossier : le code est alors formaté et corrigé à chaque enregistrement.

## Lancement

```bash
pnpm dev
```

Pour l'instant, seule une API provisoire démarre, sur <http://localhost:3000/health>. Les applications arrivent avec leurs issues :

| Application        | Issue |
| ------------------ | ----- |
| API (NestJS)       | #15   |
| Web (React + Vite) | #16   |
| Mobile (Expo)      | #51   |
| Simulateur         | #48   |

## Tests et vérifications

| Commande         | Effet                                                 |
| ---------------- | ----------------------------------------------------- |
| `pnpm test`      | Lance tous les tests                                  |
| `pnpm typecheck` | Vérifie les types                                     |
| `pnpm lint`      | Lance ESLint, dont les règles d'accessibilité         |
| `pnpm format`    | Formate tout le dépôt avec Prettier                   |
| `pnpm build`     | Compile tous les paquets dans l'ordre des dépendances |

Ces commandes sont orchestrées par Turborepo et mettent les résultats en cache. Pour cibler un seul paquet : `pnpm --filter @epickem/engine test`.

### Windows : turbo bloqué par Smart App Control

Si `pnpm build` échoue avec `spawn UNKNOWN`, Smart App Control bloque `turbo.exe`. Deux solutions :

- travailler dans WSL2 (recommandé) ;
- lancer les tâches sans Turborepo : `pnpm -r run build`, `pnpm -r run test`.

## Organisation du dépôt

| Dossier               | Contenu                                                    |
| --------------------- | ---------------------------------------------------------- |
| `apps/api`            | API REST et temps réel                                     |
| `apps/web`            | Application web                                            |
| `apps/mobile`         | Application Android                                        |
| `apps/simulator`      | Génération de données fictives, démo et tests de charge    |
| `packages/engine`     | Moteur de tournois : fonctions pures, sans base de données |
| `packages/shared`     | Types et schémas partagés                                  |
| `packages/connectors` | Connecteurs externes (start.gg…)                           |
| `docs`                | Documentation et décisions d'architecture                  |

Principe central : les résultats des matchs sont la seule source de vérité. L'état des tournois et les points des pronostiqueurs sont recalculés à partir d'eux par le moteur.

## Documentation

- [`docs/`](docs/) : documentation utilisateur et technique. Le site publié arrive avec #13.
- `docs/adr/` : décisions d'architecture, à partir de #9.
- [`CHANGELOG.md`](CHANGELOG.md) : historique des versions.

## Contribuer

Le workflow (branches, commits, pull requests, définition de « terminé ») est décrit dans [CONTRIBUTING.md](CONTRIBUTING.md). Le suivi se fait sur le [tableau du projet](https://github.com/users/Zeishy/projects/2).

## Licence

[MIT](LICENSE)
