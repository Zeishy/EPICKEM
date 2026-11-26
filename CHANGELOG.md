# Changelog

Toutes les évolutions notables du projet sont listées ici. Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et les versions suivent le [versionnage sémantique](https://semver.org/lang/fr/).

À partir de #8, ce fichier est généré par release-please à partir des messages de commit.

## [Non publié]

### Ajouté

- Monorepo pnpm + Turborepo : `apps/` (api, web, mobile, simulator), `packages/` (engine, shared, connectors) et `docs/`.
- Fichiers du dépôt : README, guide de contribution, code de conduite, licence, modèles d'issue et de pull request.
- Qualité automatique : ESLint (dont l'accessibilité JSX), Prettier, hooks git (lint-staged, commitlint) et vérifications en CI.
- Pipeline CI : titre de PR, formatage, lint, types, tests et build, avec cache pnpm et Turborepo.
- Environnement de développement en une commande (`pnpm bootstrap`) : PostgreSQL et Redis dans Docker Compose, création du `.env`, installation, migrations et seed.
- Branche d'intégration `dev` : les pull requests ciblent `dev` (deux relectures), `main` ne reçoit que des livraisons depuis `dev`, contrôlées par le check « Source de la PR ».
- Journal des décisions d'architecture (`docs/adr/`) : modèle, ADR-001 stack technique, ADR-002 hébergement et déploiement, ADR-003 résultats comme source de vérité.
- Spike start.gg : note technique (accès, limites, données, conditions d'utilisation), requêtes types, script de capture et fixtures pseudonymisées de trois tournois (double élimination, ronde suisse, poule).
