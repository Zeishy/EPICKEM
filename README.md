# EPICKEM

Plateforme de tournois e-sport et de pronostics (Pick'em). Le nom du produit est provisoire, la nouvelle identité arrive avec #11.

## Prérequis

- Node.js 24 ou plus récent (voir `.nvmrc`)
- pnpm 11 : `npm install -g pnpm@11`

## Démarrage

```bash
pnpm install
pnpm build
pnpm test
```

## Organisation du dépôt

| Dossier | Contenu |
|---|---|
| `apps/api` | API REST et temps réel (NestJS) |
| `apps/web` | Application web (React + Vite) |
| `apps/mobile` | Application mobile Android (Expo) |
| `apps/simulator` | Génération de données fictives |
| `packages/engine` | Moteur de tournois : fonctions pures |
| `packages/shared` | Types et schémas partagés |
| `packages/connectors` | Connecteurs externes (start.gg…) |
| `docs` | Documentation et ADR |

## Scripts

Lancés à la racine, orchestrés par Turborepo :

| Commande | Effet |
|---|---|
| `pnpm dev` | Lance les apps en mode développement |
| `pnpm build` | Compile tous les paquets dans l'ordre des dépendances |
| `pnpm test` | Lance les tests |
| `pnpm typecheck` | Vérifie les types |
| `pnpm lint` | Lance le lint (configuré par #2) |
