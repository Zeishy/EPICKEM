# Fixtures start.gg

Réponses de l'[API start.gg](https://developer.start.gg) enregistrées pendant le spike #14, pour les mocks du connecteur (#56). Ce sont des données publiques de start.gg ; chaque dossier donne le lien vers sa source dans `source.json`.

**Elles sont pseudonymisées.** Chaque participant est remplacé par `Participant 001`, `Participant 002`… avec un nouvel identifiant. Les champs personnels sont retirés. La structure, les scores, les personnages et les cartes sont conservés.

| Dossier                     | Contenu                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| `genesis-9-ultimate-top-64` | Top 64 en double élimination d'un tournoi à 4 étapes, personnages et cartes    |
| `ger-164-strive-suisse`     | Événement complet : ronde suisse puis double élimination, personnages partiels |
| `rookie-round-robin-73`     | Poule unique (round robin), personnages sans cartes                            |

Chaque dossier contient les mêmes fichiers :

| Fichier           | Contenu                                                      |
| ----------------- | ------------------------------------------------------------ |
| `evenement.json`  | L'événement, son tournoi et ses phases                       |
| `groupes.json`    | Les groupes (poules ou arbres), rondes et qualifications     |
| `sets.json`       | Les matchs, leurs manches, personnages et cartes             |
| `seeds.json`      | Le seeding                                                   |
| `classement.json` | Le classement final des participants présents                |
| `jeu.json`        | Tous les personnages et toutes les cartes du jeu             |
| `source.json`     | Lien vers la page start.gg, date de capture et groupe retenu |

Pour les régénérer, voir la [note technique](../../../../docs/technique/startgg.md#script-dexploration). Ne jamais commiter les réponses brutes de `.startgg-cache/`.
