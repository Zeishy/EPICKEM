# Contribuer

Ce guide décrit comment on travaille sur le dépôt. Pour installer le projet, voir le [README](README.md).

## Règles d'or

Elles priment sur tout le reste :

- **Aucun jeu d'argent** : uniquement des points, des badges et des titres.
- **Aucune donnée personnelle réelle** : comptes, pseudos et résultats de démo sont générés.
- **start.gg** : uniquement des données publiques, toujours avec un lien vers la source.
- **Aucun secret dans le dépôt** : les valeurs vont dans `.env` en local et dans les secrets GitHub pour la CI.
- **Accessibilité** : toute interface vise WCAG 2.2 AA.

## Du ticket à la fusion

1. **Choisir une issue** sur le [tableau](https://github.com/users/Zeishy/projects/2), s'y assigner et la passer en _In progress_.
2. **Créer une branche** depuis `main` à jour.
3. **Développer** avec des commits au format Conventional Commits.
4. **Ouvrir une pull request** : l'issue passe en _In review_.
5. **Faire relire** par quelqu'un d'un autre profil, corriger, puis fusionner en squash. L'issue passe en _Done_.

## Branches

`main` est protégée : pas de push direct, une relecture et une CI verte sont obligatoires.

Une branche par issue, nommée `<type>/<numéro>-<description-courte>` :

| Préfixe  | Usage                        | Exemple                   |
| -------- | ---------------------------- | ------------------------- |
| `feat/`  | Nouvelle fonctionnalité      | `feat/25-ronde-suisse`    |
| `fix/`   | Correction de bug            | `fix/112-score-negatif`   |
| `docs/`  | Documentation                | `docs/13-site-docusaurus` |
| `chore/` | Outillage, configuration, CI | `chore/7-pipeline-ci`     |
| `test/`  | Tests uniquement             | `test/74-tests-moteur`    |

## Commits

Format [Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/) : `<type>(<scope>): <description>`.

```text
feat(engine): ronde suisse avec départage Buchholz
fix(api): refuser un score négatif
docs(adr): choix de l'hébergement
```

| Type       | Usage                                           |
| ---------- | ----------------------------------------------- |
| `feat`     | Nouvelle fonctionnalité (version mineure)       |
| `fix`      | Correction de bug (version de correctif)        |
| `docs`     | Documentation                                   |
| `test`     | Ajout ou correction de tests                    |
| `refactor` | Restructuration sans changement de comportement |
| `perf`     | Performance                                     |
| `style`    | Formatage, sans changement de code              |
| `build`    | Dépendances, build                              |
| `ci`       | Intégration continue                            |
| `chore`    | Autre maintenance                               |

Le scope est facultatif et reprend la zone touchée : `engine`, `api`, `web`, `mobile`, `realtime`, `import`, `simulator`, `shared`, `connectors`, `infra`, `docs`, `adr`. Les scopes `deps`, `deps-dev` et `main` sont réservés aux outils (Dependabot, release-please). Pour en ajouter un, modifier [`commitlint.config.js`](commitlint.config.js).

Un changement incompatible se signale par `!` après le scope (`feat(api)!: …`) et une ligne `BREAKING CHANGE:` dans le corps du commit.

Les versions et le [CHANGELOG](CHANGELOG.md) sont générés à partir de ces messages : un message bien formé compte.

## Vérifications automatiques

Les hooks git sont installés par `pnpm install` (Husky) :

| Moment       | Vérification                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| Avant commit | ESLint corrige et Prettier formate les fichiers commités (lint-staged)                                          |
| Message      | commitlint refuse un message qui ne respecte pas le format ci-dessus                                            |
| Pull request | la CI vérifie le titre, le formatage, le lint, les types, les tests et le build ; une CI rouge bloque la fusion |

Si ESLint signale une erreur qu'il ne sait pas corriger, le commit est annulé : corriger puis recommencer. Pour tout vérifier avant de pousser : `pnpm format:check`, `pnpm lint`, `pnpm typecheck` et `pnpm test`.

## Pull requests

- **Titre** au format Conventional Commits : c'est le message du commit après la fusion en squash.
- **Description** : remplir le modèle, avec `Closes #<numéro>` pour fermer l'issue automatiquement.
- **Taille** : une PR par issue. Si une issue dépasse quelques jours de travail, la découper.
- **Relecture** : par quelqu'un d'un autre profil. Chacun doit pouvoir expliquer tout le code en soutenance.
- **Fusion** : en squash, par l'auteur, une fois la PR approuvée et la CI verte.

## Définition de « terminé »

Une issue est terminée quand :

- [ ] ses critères d'acceptation sont remplis ;
- [ ] les tests sont écrits et la CI est verte ;
- [ ] l'interface, s'il y en a une, est utilisable au clavier et au lecteur d'écran ;
- [ ] la documentation (utilisateur et/ou technique) est à jour ;
- [ ] la PR est relue et fusionnée, et l'issue est en _Done_.

## Signaler un bug ou proposer une fonctionnalité

Ouvrir une issue avec le modèle adapté. Pour un problème de sécurité, ne pas ouvrir d'issue publique : contacter directement les mainteneurs.

## Code de conduite

En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md).
