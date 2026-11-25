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

| Outil   | Version                    | Installation                                                                                                                                           |
| ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node.js | 24 ou plus (voir `.nvmrc`) | [nodejs.org](https://nodejs.org)                                                                                                                       |
| pnpm    | 11                         | `npm install -g pnpm@11`                                                                                                                               |
| Docker  | Compose v2                 | Windows et macOS : [Docker Desktop](https://www.docker.com/products/docker-desktop/), Linux : [Docker Engine](https://docs.docker.com/engine/install/) |

Docker fait tourner PostgreSQL et Redis : rien d'autre à installer. Lancez Docker Desktop avant de continuer.

## Installation et lancement

Depuis un clone vierge, une seule commande installe et lance tout :

```bash
git clone git@github.com:Zeishy/EPICKEM.git
cd EPICKEM
pnpm bootstrap
```

`pnpm bootstrap` enchaîne :

1. la vérification des prérequis (Node.js, pnpm, Docker), avec la marche à suivre si l'un manque ;
2. la création de `.env` à partir de `.env.example`, s'il n'existe pas encore ;
3. `pnpm install`, qui installe aussi les hooks git (format et message de chaque commit) ;
4. le démarrage de PostgreSQL et Redis dans Docker, en attendant qu'ils soient prêts ;
5. `pnpm build`, qui compile les paquets partagés dont le lint et l'éditeur ont besoin ;
6. les migrations de la base et le chargement des données de démo ;
7. `pnpm dev`, qui lance la plateforme.

Les fois suivantes, `pnpm dev` suffit : il redémarre les services s'ils sont arrêtés.

Le fichier `.env.example` décrit chaque variable. Le fichier `.env` n'est jamais commité.

Sous VS Code, installez les extensions recommandées à l'ouverture du dossier : le code est alors formaté et corrigé à chaque enregistrement.

### Services PostgreSQL et Redis

| Commande               | Effet                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `pnpm services:up`     | Lance les services et attend qu'ils soient prêts               |
| `pnpm services:down`   | Arrête les services, les données sont conservées               |
| `pnpm services:reset`  | Supprime toutes les données, relance les services, migre, seed |
| `pnpm services:status` | Affiche l'état des services                                    |

| Service    | Adresse                                               | Identifiants          |
| ---------- | ----------------------------------------------------- | --------------------- |
| PostgreSQL | `postgresql://epickem:epickem@localhost:5432/epickem` | `epickem` / `epickem` |
| Redis      | `redis://localhost:6379`                              | aucun                 |

Les services n'écoutent que sur la machine locale. Ces identifiants ne servent qu'en développement.

**Un port est déjà utilisé** (un PostgreSQL installé sur la machine, par exemple) : changez `POSTGRES_PORT` ou `REDIS_PORT` dans `.env`, et reportez le port dans `DATABASE_URL` ou `REDIS_URL`.

## Lancement

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
- [`docs/adr/`](docs/adr/) : décisions d'architecture (stack, hébergement, recalcul des résultats) et modèle pour en écrire une.
- [`CHANGELOG.md`](CHANGELOG.md) : historique des versions.

## Contribuer

Les pull requests ciblent `dev`, la branche par défaut ; `main` ne reçoit que des livraisons depuis `dev`. Le workflow (branches, commits, pull requests, définition de « terminé ») est décrit dans [CONTRIBUTING.md](CONTRIBUTING.md). Le suivi se fait sur le [tableau du projet](https://github.com/users/Zeishy/projects/2).

## Licence

[MIT](LICENSE)
