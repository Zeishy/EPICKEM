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

1. **Prendre une issue** : la plus prioritaire de la colonne _Todo_ du [tableau](https://github.com/users/Zeishy/projects/2) qui n'a pas encore de responsable (`priority: P0` avant `P1`, puis `P2`). S'y assigner et la passer en _In progress_.
2. **Créer une branche** depuis `dev` à jour.
3. **Développer** avec des commits au format Conventional Commits.
4. **Ouvrir une pull request vers `dev`** : l'issue passe en _In review_.
5. **Faire relire** par les deux autres membres de l'équipe, corriger, puis fusionner en squash. L'issue passe en _Done_.

`main` ne reçoit que des livraisons : une pull request de `dev` vers `main`, ouverte quand `dev` est stable (fin de milestone, démo, release).

Il n'y a pas de rôles fixes : chacun prend la tâche suivante, quel que soit le domaine.

## Branches

```text
feat/25-ronde-suisse ──┐
fix/112-score-negatif ─┼──► dev ──► main
docs/13-site ──────────┘   (intégration)  (livraisons)
```

| Branche | Rôle                                                     | Reçoit                             | Relecture                    | Fusion           |
| ------- | -------------------------------------------------------- | ---------------------------------- | ---------------------------- | ---------------- |
| `dev`   | Branche par défaut, où le travail de chacun est intégré  | Les PR des branches de travail     | Les **deux** autres membres  | Squash           |
| `main`  | Version livrée : déployée, taguée, montrée en soutenance | **Uniquement** une PR depuis `dev` | Un membre autre que l'auteur | Commit de fusion |

Les deux branches sont protégées : pas de push direct, pas de force push, pas de suppression, check CI « Vérifications » obligatoire et discussions de relecture résolues. Une nouvelle modification annule les approbations déjà données.

- **Vers `main`, seulement depuis `dev`.** Le check « Source de la PR » échoue pour toute autre branche, et la fusion est bloquée. Si une PR cible `main` par erreur, changer sa branche cible pour `dev` (bouton _Edit_ à côté du titre).
- **`dev` vers `main` en commit de fusion, pas en squash.** Un squash réécrirait l'historique de `main` et ferait diverger les deux branches : chaque livraison suivante afficherait des conflits.
- **Les issues se ferment à la fusion dans `dev`**, la branche par défaut, grâce au `Closes #<numéro>` de la PR.

Les branches de travail fusionnées sont supprimées automatiquement ; `dev` et `main` ne peuvent pas l'être.

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
- **Cible** : `dev`, qui est la branche par défaut.
- **Relecture** : toute l'équipe est sollicitée automatiquement ([CODEOWNERS](.github/CODEOWNERS)). Une PR vers `dev` doit être approuvée par les deux autres membres : chacun voit donc passer tout le code, ce qui prépare la soutenance.
- **Fusion** : en squash, par l'auteur, une fois la PR approuvée et la CI verte.

### Livrer `dev` dans `main`

1. Ouvrir une PR de `dev` vers `main`, avec un titre comme `chore: livraison de la milestone M1`.
2. Vérifier que la CI est verte, dont « Source de la PR ».
3. La faire approuver par un membre autre que l'auteur.
4. Fusionner avec **Create a merge commit** (seule méthode autorisée sur `main`).

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
