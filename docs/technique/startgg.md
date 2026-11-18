# API start.gg

Note technique du spike #14. Elle sert de référence au connecteur (#54), à la synchronisation (#55) et aux tests sans réseau (#56).

## En bref

- **Une API GraphQL, accessible avec un jeton personnel.** Elle expose tout ce dont EPICKEM a besoin : phases, groupes, matchs, manches, personnages, cartes, seeds et classements.
- **Deux limites structurent le connecteur.** On a droit à 80 requêtes par minute en moyenne, et une requête renvoie au plus 1000 objets : il faut paginer, limiter le débit et reprendre après une erreur.
- **Pas de temps réel côté start.gg.** L'API ne propose ni webhook ni abonnement : la synchronisation interroge régulièrement les matchs modifiés (`updatedAfter`).
- **Le détail des manches est rare sur les gros tournois.** Il n'existe que si l'organisation ou les joueurs le saisissent. Sur Genesis 9 (Ultimate, 1215 joueurs), seulement 2 % des matchs l'ont, presque tous en Top 64 et Top 8. Sur les petits tournois mesurés, la part va de 0 à 83 %. Quand une manche est détaillée, les personnages y sont presque toujours, les cartes beaucoup moins souvent.
- **Les conditions d'utilisation imposent leurs règles.** Il faut afficher la source, demander le minimum de données, ne pas les redistribuer et répercuter leurs corrections. C'est pourquoi les fixtures commitées sont pseudonymisées.

## Accès

| Élément        | Valeur                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Point d'entrée | `POST https://api.start.gg/gql/alpha`, corps JSON `{ "query", "variables" }`                          |
| Jeton          | Compte start.gg → [Developer Settings](https://start.gg/admin/profile/developer) → _Create new token_ |
| En-tête        | `Authorization: Bearer <jeton>`                                                                       |
| Validité       | Un an, puis il faut en créer un nouveau                                                               |
| Sans jeton     | Toute requête échoue : `Invalid authentication token`, HTTP 400                                       |

Le jeton se range dans `STARTGG_API_TOKEN` (fichier `.env` en local, secret GitHub pour la production). Les conditions d'utilisation demandent un jeton par produit : l'équipe partage celui du projet plutôt que d'en créer un chacun pour la production. Les tests n'ont jamais besoin de jeton : ils utilisent les fixtures.

L'API est en version _alpha_ : start.gg peut la modifier sans préavis. Le connecteur doit donc valider les réponses (schémas Zod) et échouer proprement si un champ disparaît.

## Limites

| Limite                     | Valeur                                        | Réponse en cas de dépassement                                           |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| Débit                      | 80 requêtes par 60 secondes, en moyenne       | `{"success": false, "message": "Rate limit exceeded - api-token"}`      |
| Taille d'une réponse       | 1000 objets par requête, imbriqués compris    | `Query complexity too high. A maximum of 1000 objects may be returned…` |
| Taille de page (`perPage`) | 512 au plus pour les seeds et les classements | —                                                                       |

Sources : [Rate Limits](https://developer.start.gg/docs/rate-limits) et le [schéma de référence](https://developer.start.gg/reference/query.doc.html).

### Mesures

Relevées le 18 novembre 2026 avec le script du spike, sur les sept événements du [tableau des candidats](#tournois-candidats-pour-la-démo), à raison d'une requête toutes les 750 ms :

| Mesure                                       | Valeur                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Durée d'une requête                          | 370 à 880 ms en moyenne selon l'événement                                                        |
| Coût d'un set (`extensions.queryComplexity`) | ~19 objets sans manches, ~52 objets avec 5 manches détaillées                                    |
| Complexité la plus haute observée            | 875 objets sur 1000 (46 sets sans manches par page)                                              |
| Import complet de Genesis 9 Ultimate         | 268 requêtes, environ 4 minutes : 4129 sets, 1543 seeds, 1215 lignes de classement               |
| Limite de débit                              | Jamais atteinte à ce rythme. Aucun en-tête de quota n'est renvoyé : impossible de lire le reste. |

La complexité de chaque réponse est renvoyée dans `extensions.queryComplexity`. C'est la seule façon de connaître le coût d'une requête avant d'atteindre la limite.

### Conséquences pour le connecteur

- **Débit** : au moins 750 ms entre deux requêtes, et une file d'attente commune à tous les imports, puisque le jeton est partagé. Comme l'API n'annonce pas le quota restant, le connecteur doit compter lui-même ses requêtes. Après une erreur de limite, attendre une minute puis réessayer.
- **Taille** : le coût d'un set triple quand ses manches sont détaillées, et une page légère peut être suivie d'une page lourde. Le script part donc de 17 sets par page (17 × 52 < 1000) et divise la page par deux si start.gg la refuse ; le connecteur doit faire de même.
- **Volume** : un gros événement compte plusieurs milliers de sets. L'import complet prend plusieurs minutes et doit tourner en tâche de fond (BullMQ), pas dans une requête HTTP.
- **Interdit** : les conditions d'utilisation interdisent les tests de charge. On ne cherche pas à atteindre la limite, on la respecte.

## Correspondance avec le modèle EPICKEM

| start.gg     | EPICKEM              | Remarques                                                                               |
| ------------ | -------------------- | --------------------------------------------------------------------------------------- |
| `Tournament` | Tournoi              | Nom, dates, fuseau, en ligne ou non. Le lien source se construit à partir du `slug`.    |
| `Event`      | Compétition (un jeu) | Un tournoi start.gg regroupe plusieurs événements : un par jeu ou par format.           |
| `Phase`      | Étape                | `phaseOrder` donne l'ordre, `bracketType` le format.                                    |
| `PhaseGroup` | Poule ou arbre       | Une phase de poules a plusieurs groupes. `progressionsOut` décrit les qualifiés.        |
| `Set`        | Match                | `round` est négatif côté perdants. `slots` donne les participants, y compris en FFA.    |
| `Game`       | Manche               | Scores, vainqueur, carte (`stage`) et personnages (`selections`).                       |
| `Entrant`    | Participant          | Joueur ou équipe : `name` est le pseudo affiché ou le nom d'équipe.                     |
| `Seed`       | Seeding              | `seedNum` dans la phase, `groupSeedNum` dans le groupe.                                 |
| `Standing`   | Classement           | `placement` final dans l'événement.                                                     |
| `Videogame`  | Jeu                  | Liste complète des personnages et des cartes : des données de référence, sans personne. |

Formats (`BracketType`) : `SINGLE_ELIMINATION`, `DOUBLE_ELIMINATION`, `ROUND_ROBIN` (poules), `SWISS`, ainsi que `EXHIBITION`, `CUSTOM_SCHEDULE`, `MATCHMAKING`, `ELIMINATION_ROUNDS`, `RACE` et `CIRCUIT`, qu'EPICKEM ne gère pas et doit signaler comme non importables. Le FFA n'a pas de type propre : il se reconnaît aux sets qui ont plus de deux `slots`.

## Données disponibles

| Donnée                 | Où                                                     | Toujours présente ?                                                       |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Phases et groupes      | `event.phases`, `phase.phaseGroups`                    | Oui, dès que l'arbre est publié                                           |
| Rondes et format (BO)  | `phaseGroup.rounds { number bestOf }`                  | Oui                                                                       |
| Matchs et score du set | `event.sets` → `slots.standing.stats.score`            | Oui une fois le set terminé                                               |
| Exempts                | `sets(filters: { showByes: true })`, slot sans entrant | Oui, si on les demande                                                    |
| Manches                | `set.games`                                            | **Non** : seulement si le détail est saisi, sinon `games` est `null`      |
| Personnages            | `game.selections.character`                            | **Non** : saisis par les joueurs ou l'organisation, souvent partiellement |
| Cartes                 | `game.stage`                                           | **Non** : même chose, et seulement pour les jeux qui en ont               |
| Seeds                  | `phase.seeds`                                          | Oui                                                                       |
| Classement final       | `event.standings`                                      | Oui une fois l'événement terminé                                          |
| Qualifications         | `phaseGroup.progressionsOut`                           | Oui pour les tournois en plusieurs étapes                                 |

Ce que les mesures montrent (détail dans le [tableau des candidats](#tournois-candidats-pour-la-démo)) :

- **Manches** : sur un gros tournoi, elles sont saisies surtout en fin de tournoi. Sur Genesis 9 Ultimate, 57 des 116 sets du Top 64 et 11 des 15 sets du Top 8 sont détaillés, contre 1 set sur plus de 3900 en poules. Certains événements n'en ont aucune, même sur un gros tournoi (Guilty Gear Strive à Genesis 9).
- **Personnages** : présents dans 100 % des manches détaillées sur les tournois Smash et Rivals mesurés, mais seulement dans 27 % sur un tournoi Guilty Gear.
- **Cartes** : 92 % des manches détaillées du Top 64 de Genesis 9 Ultimate, 0 % sur Rivals of Aether et sur un petit tournoi Ultimate.
- **Exempts** : nombreux dans les poules des gros tournois (1700 sets sur 4129 à Genesis 9), car les poules sont dimensionnées en puissances de 2.

L'interface doit donc afficher les manches, personnages et cartes quand ils existent, sans jamais les supposer présents.

Données à ne pas demander : `user`, `contactInfo`, `email`, adresses et `connectedAccounts` des participants. Elles sont personnelles, inutiles à EPICKEM, et souvent réservées aux administrateurs du tournoi.

## Requêtes types

Les requêtes sont dans [`packages/connectors/src/startgg/queries.ts`](../../packages/connectors/src/startgg/queries.ts), prêtes à être reprises par le connecteur :

| Requête              | Usage                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `SEARCH_TOURNAMENTS` | Recherche par nom (#54)                                              |
| `TOURNAMENT`         | Un tournoi et ses événements, à partir d'une adresse start.gg        |
| `EVENT`              | Un événement et ses phases                                           |
| `PHASE_GROUPS`       | Les groupes d'une phase, avec rondes et qualifications               |
| `EVENT_SETS`         | Les matchs, manches, personnages et cartes ; `updatedAfter` pour #55 |
| `PHASE_SEEDS`        | Le seeding d'une phase                                               |
| `EVENT_STANDINGS`    | Le classement final                                                  |
| `VIDEOGAME`          | Les personnages et les cartes d'un jeu                               |

La plus importante, celle des matchs :

```graphql
query EventSets($eventId: ID!, $page: Int!, $perPage: Int!, $updatedAfter: Timestamp) {
  event(id: $eventId) {
    sets(
      page: $page
      perPage: $perPage
      sortType: ROUND
      filters: { hideEmpty: true, showByes: true, updatedAfter: $updatedAfter }
    ) {
      pageInfo {
        total
        totalPages
      }
      nodes {
        id
        identifier
        round
        fullRoundText
        state
        bestOf
        completedAt
        updatedAt
        winnerId
        phaseGroup {
          id
        }
        slots(includeByes: true) {
          slotIndex
          prereqType
          prereqId
          entrant {
            id
            name
          }
          standing {
            placement
            stats {
              score {
                label
                value
              }
            }
          }
        }
        games {
          orderNum
          winnerId
          entrant1Score
          entrant2Score
          stage {
            id
            name
          }
          selections {
            entrant {
              id
            }
            character {
              id
              name
            }
          }
        }
      }
    }
  }
}
```

### Script d'exploration

Le script [`startgg-spike.mjs`](../../packages/connectors/scripts/startgg-spike.mjs) exécute ces requêtes en respectant les limites, puis affiche ce qu'un événement renseigne vraiment. Il lit le jeton dans `.env`.

```bash
pnpm --filter @epickem/connectors spike:startgg recherche "genesis"
pnpm --filter @epickem/connectors spike:startgg tournoi https://www.start.gg/tournament/<tournoi>
pnpm --filter @epickem/connectors spike:startgg evenement tournament/<tournoi>/event/<evenement>
pnpm --filter @epickem/connectors spike:startgg evenement <slug> --fixture <nom> --groupe <id>
pnpm --filter @epickem/connectors spike:startgg evenement <slug> --fixture <nom> --cache
```

La commande `evenement` affiche la structure, la part de matchs avec le détail des manches, la part de manches avec personnages et avec carte, ainsi que les mesures : nombre de requêtes, durée, complexité maximale et en-têtes de limite renvoyés.

Les réponses brutes vont dans `.startgg-cache/`, ignoré par git, car elles contiennent les pseudos réels. Avec `--fixture`, une copie pseudonymisée est écrite dans `packages/connectors/fixtures/startgg/<nom>/`, limitée au groupe `--groupe` s'il est donné. Avec `--cache`, le script relit ces réponses au lieu d'appeler l'API : il ne demande alors pas de jeton.

## Conditions d'utilisation

Résumé des [START.GG APIs Terms of Use](https://www.start.gg/about/apitos) (version du 14 février 2025), limité à ce qui concerne EPICKEM. Ce résumé ne remplace pas le texte.

| Règle                                                                                         | Conséquence pour EPICKEM                                                                                 |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Licence limitée et révocable, API modifiable sans préavis                                     | L'import start.gg reste une option : la saisie manuelle et l'import par fichier marchent sans lui        |
| Demander le minimum de données nécessaire                                                     | Les requêtes ne demandent que les champs utiles, jamais les données de compte des joueurs                |
| Pas de copie de données au-delà de l'usage prévu, pas de redistribution ni de revente         | On ne stocke que les tournois importés par un utilisateur, et les fixtures commitées sont pseudonymisées |
| Attribution obligatoire, sans retirer ni modifier les liens et mentions de start.gg           | Chaque tournoi importé affiche « Données start.gg » avec un lien vers la page source                     |
| Données stockées tenues à jour, corrections et suppressions répercutées                       | La synchronisation (#55) met à jour, et supprime ce qui a disparu de start.gg                            |
| Politique de conservation et de suppression, déclaration de confidentialité publiée           | À couvrir par la page de confidentialité et la suppression de compte                                     |
| Pas de jeu d'argent ni d'activité illégale autour des données                                 | Déjà une règle d'or : uniquement des points, des badges et des titres                                    |
| Pas d'usage publicitaire des données, pas de test de charge, pas de contournement des limites | Aucune publicité ; débit limité côté client ; pas de jetons multiples pour contourner la limite          |

### Pourquoi les fixtures sont pseudonymisées

Le dépôt est public. Y commiter des réponses brutes reviendrait à redistribuer des données start.gg, et à publier les pseudos de vrais joueurs, ce qu'interdit la règle d'or « aucune donnée personnelle réelle ». Le script applique donc [`createPseudonymizer`](../../packages/connectors/src/startgg/pseudonymize.ts) avant d'écrire une fixture :

- chaque participant devient `Participant 001`, `Participant 002`… avec un nouvel identifiant, cohérent dans tous les fichiers de l'événement (`winnerId` et les sélections suivent) ;
- les champs personnels (`user`, `player`, `participants`, `gamerTag`, `prefix`, `email`…) ainsi que `displayScore` et `vodUrl`, qui peuvent contenir des pseudos, sont supprimés ;
- la structure, les scores, les personnages, les cartes et le lien vers la source sont conservés : ce sont eux que les mocks de #56 doivent reproduire.

## Tournois candidats pour la démo

Critères :

- un tournoi public et terminé ;
- au moins un événement en plusieurs étapes, par exemple des poules puis un arbre ;
- les manches, les personnages et les cartes renseignés sur la majorité des matchs ;
- si possible, des formats variés (double élimination, poules, ronde suisse).

### Retenus

Les trois tournois retenus couvrent la double élimination en plusieurs étapes, la ronde suisse et la poule. Ils couvrent aussi des données complètes et des données partielles, deux cas que #56 doit tester. Chacun a une fixture pseudonymisée dans [`packages/connectors/fixtures/startgg/`](../../packages/connectors/fixtures/startgg/).

| Événement                                                                                                                 | Formats                              | Sets détaillés | Personnages | Cartes | Fixture                     |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------- | ----------- | ------ | --------------------------- |
| [Genesis 9 · Ultimate Singles](https://www.start.gg/tournament/genesis-9-1/event/ultimate-singles), Top 64                | Double élimination (4 étapes)        | 57 / 116       | 100 %       | 92 %   | `genesis-9-ultimate-top-64` |
| [GER#164 · GG Strive Singles](https://www.start.gg/tournament/ger-164-the-swisscake-factory/event/gg-strive-singles)      | Ronde suisse puis double élimination | 43 / 52        | 27 %        | sans   | `ger-164-strive-suisse`     |
| [Rookie Round Robin #73 · Ultimate Singles](https://www.start.gg/tournament/rookie-round-robin-73/event/ultimate-singles) | Poule unique (round robin)           | 42 / 55        | 100 %       | 0 %    | `rookie-round-robin-73`     |

Personnages et cartes : part des manches détaillées qui les renseignent. « sans » : le jeu n'a pas de cartes.

- **Genesis 9** sert pour la démo : un grand tournoi connu, en plusieurs étapes, avec personnages et cartes sur les matchs les plus regardés. La fixture se limite au Top 64, car l'événement complet pèse plus de 4000 sets ; ses seeds montrent l'arrivée depuis les poules.
- **GER#164** est un petit événement complet : ronde suisse, puis arbre final.
- **Rookie Round Robin #73** est une poule où chacun rencontre tous les autres.

### Mesurés et écartés

| Événement                              | Participants | Formats                              | Sets détaillés  | Raison                                 |
| -------------------------------------- | ------------ | ------------------------------------ | --------------- | -------------------------------------- |
| Genesis 9 · Rivals of Aether Singles   | 171          | Double élimination (3 étapes)        | 68 / 569 (12 %) | Personnages à 100 %, mais aucune carte |
| Genesis 9 · Guilty Gear Strive         | 185          | Double élimination (3 étapes)        | 0 / 594         | Aucune manche détaillée                |
| Monday Night Melee 520 · Melee Singles | 27           | Ronde suisse puis double élimination | 0 / 101         | Aucune manche détaillée                |
| The Roundtable 12 · Ultimate Singles   | 59           | Double élimination (3 étapes)        | 0 / 173         | Aucune manche détaillée                |

Aucun événement FFA n'a été trouvé parmi les tournois mesurés. Ce format reste à tester sur un autre jeu (battle royale, course).

## Suite

- **#54** : le connecteur reprend les requêtes de `queries.ts`. Il déclare `importTournament`, `importParticipants` et `importResults`. Pour `liveResults`, il s'agit en fait d'une interrogation régulière (_polling_).
- **#55** : interrogation par `updatedAfter`, fréquence adaptée à l'état du tournoi, file d'attente commune et reprise après l'erreur de limite.
- **#56** : mocks MSW construits à partir des fixtures de `packages/connectors/fixtures/startgg/`. Les erreurs de limite et de complexité n'ont pas été rencontrées pendant le spike. Leurs réponses exactes viennent de la documentation et figurent dans la section [Limites](#limites).
- **Démo (#95, #97)** : Genesis 9 a peu de manches détaillées en dehors du Top 64. Pour montrer les personnages et les cartes, la démo doit partir de ces phases finales. Le simulateur peut compléter le reste, avec des données générées.
