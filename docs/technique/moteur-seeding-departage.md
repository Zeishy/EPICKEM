# Moteur : seeding et départage

Note technique de #27. Elle décrit les deux briques du moteur utilisées par tous les formats : l'attribution des seeds avant une étape, et le classement d'une étape avec ses critères de départage. Les formats (#22 à #26) et les qualifications entre étapes (#28) s'appuient dessus.

- Code : [`packages/engine/src/seeding.ts`](../../packages/engine/src/seeding.ts), [`tiebreak.ts`](../../packages/engine/src/tiebreak.ts) et [`random.ts`](../../packages/engine/src/random.ts).
- Tests : les fichiers `*.test.ts` du même dossier.

## En bref

- **Fonctions pures, sans exception.** Le moteur ne lit pas la base de données : l'API lui passe la configuration, les participants et les résultats, et reçoit un `Result` (voir l'[ADR-003](../adr/003-resultats-source-de-verite.md)). Une entrée invalide donne une erreur nommée, jamais une exception.
- **Le hasard est reproductible.** Un tirage dépend d'une graine. On stocke la graine, pas l'ordre obtenu : le même calcul redonne toujours le même résultat, y compris après une correction de résultat.
- **Le départage est configurable par étape.** L'administrateur choisit les critères et leur ordre. La configuration est rangée dans `Etape.config`, et les valeurs calculées dans `ClassementEtape.details` (voir le [modèle de données](../technical/data-model-v1.md)).

## Seeding

`seedParticipants(participants, méthode)` attribue à chaque participant un seed de 1 (le mieux placé) à N.

| Méthode   | Paramètres                        | Comportement                                                                                                   |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `MANUAL`  | `order`                           | L'ordre fourni par l'administrateur, du seed 1 au dernier. Il doit contenir chaque participant une seule fois. |
| `RANDOM`  | `seed`                            | Tirage reproductible. L'ordre dans lequel les participants sont fournis ne change pas le résultat.             |
| `RANKING` | `values`, `direction`, `tieSeed?` | Tri par une valeur : `ASC` pour une place au classement (1 en premier), `DESC` pour un Elo ou des points.      |

Pour `RANKING` :

- un participant sans valeur passe après tous les autres ;
- deux participants à valeur égale gardent l'ordre reçu ;
- avec `tieSeed`, les égalités sont tirées au sort de façon reproductible, sans jamais faire passer une valeur moins bonne devant une meilleure.

| Erreur                  | Cause                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `DUPLICATE_PARTICIPANT` | Un participant apparaît deux fois                            |
| `UNKNOWN_PARTICIPANT`   | L'ordre ou les valeurs citent un participant hors de l'étape |
| `MISSING_PARTICIPANT`   | L'ordre manuel oublie un participant                         |
| `INVALID_VALUE`         | Une valeur de classement n'est pas un nombre fini            |

Le placement des seeds dans un tableau (1 contre 16, 8 contre 9…) ou dans des poules (serpentin) relève de chaque format : #22 et #24.

## Aléatoire reproductible

`createRandom(graine)` renvoie un générateur de nombres dans [0, 1) ; `shuffle(liste, graine)` mélange une liste sans la modifier.

- **Algorithmes** : hachage xmur3 de la graine, générateur mulberry32, mélange de Fisher-Yates. Ils sont rapides, sans dépendance, et donnent le même résultat sur toutes les plateformes. Ils ne conviennent pas à un usage cryptographique, ce qui n'est pas le besoin ici.
- **Graine** : un texte ou un nombre. Un nombre est traité comme son texte (`42` et `"42"` donnent le même tirage).
- **L'algorithme ne doit pas changer.** Des tirages déjà stockés en base seraient redistribués. Les tests figent quelques tirages : s'ils cassent, c'est un changement incompatible, à signaler comme tel.

Les formats qui ont besoin de hasard (par exemple le premier tour d'une ronde suisse, #25) réutilisent ces fonctions.

## Classement et départage

`rankParticipants(entrée)` classe les participants d'une étape.

| Champ          | Rôle                                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| `participants` | Les participants de l'étape                                                           |
| `points`       | Les points calculés par le format, selon son barème. Un participant absent a 0 point. |
| `matches`      | Les matchs terminés : deux participants et le nombre de manches gagnées par chacun    |
| `tiebreakers`  | Les critères de départage, dans l'ordre choisi                                        |
| `scoring`      | Le barème d'un match (`win`, `draw`, `loss`), utilisé par la confrontation directe    |
| `seeds`        | Facultatif : les seeds, utilisés par le critère `SEED`                                |

### Critères

| Critère           | Valeur comparée (la plus grande passe devant)                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `HEAD_TO_HEAD`    | Points gagnés, selon `scoring`, dans les seuls matchs entre participants encore à égalité        |
| `GAME_DIFFERENCE` | Manches gagnées moins manches perdues, sur tous les matchs de l'étape                            |
| `BUCHHOLZ`        | Somme des points des adversaires rencontrés ; un adversaire rencontré deux fois compte deux fois |
| `SEED`            | Le meilleur seed passe devant ; un participant sans seed passe après                             |

Un match dont les deux participants ont gagné autant de manches compte comme un nul.

### Algorithme

1. Les participants sont regroupés par points, du plus grand au plus petit.
2. Dans chaque groupe à égalité, les critères sont essayés dans l'ordre configuré. Un critère qui ne sépare personne est passé.
3. **Dès qu'un critère sépare le groupe, chaque sous-groupe repart du premier critère.** Ce n'est utile que pour la confrontation directe : elle est recalculée entre les seuls participants encore à égalité. Les critères globaux, qui n'avaient pas séparé le groupe, ne séparent pas non plus ses sous-groupes.
4. Les participants qu'aucun critère ne sépare restent ex aequo, dans l'ordre où ils ont été fournis.

Exemple : a, b et c ont les mêmes points et forment un cycle (a bat b, b bat c, c bat a). Critères : `HEAD_TO_HEAD` puis `GAME_DIFFERENCE`.

- Confrontation directe à trois : 3 points chacun, personne n'est séparé.
- Différence de manches : b a la meilleure et passe premier ; a et c sont toujours à égalité.
- On repart du premier critère pour a et c seuls : c a battu a, donc c est deuxième et a troisième.

### Rangs

Les ex aequo partagent le même rang et le rang suivant est sauté : 1, 2, 2, 4.

Chaque ligne du classement contient `tiebreaks`, les valeurs des critères évalués pour ce participant, à afficher et à stocker dans `ClassementEtape.details`. Pour la confrontation directe, c'est la valeur du dernier mini-classement où le participant figurait. Un participant seul à son nombre de points n'a besoin d'aucun critère : son `tiebreaks` est vide.

| Erreur                  | Cause                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| `DUPLICATE_PARTICIPANT` | Un participant apparaît deux fois                                             |
| `DUPLICATE_CRITERION`   | Un critère apparaît deux fois                                                 |
| `UNKNOWN_PARTICIPANT`   | Les points, les seeds ou un match citent un participant hors de l'étape       |
| `INVALID_MATCH`         | Un participant contre lui-même, ou des manches négatives ou non entières      |
| `INVALID_NUMBER`        | Des points, un seed ou une valeur du barème qui ne sont pas des nombres finis |

## Limites connues

- **Exempts et Buchholz.** Un exempt n'est pas un match : il n'entre pas dans le Buchholz. La ronde suisse (#25) décidera s'il faut un adversaire virtuel.
- **Matchs à deux uniquement.** Le FFA (#26) aura ses propres critères (meilleure place, nombre de victoires de manche) et étendra `MatchRecord`.
- **Différence de manches globale.** Elle porte sur toute l'étape. Une variante limitée aux matchs entre ex aequo pourra s'ajouter comme nouveau critère si un format la demande.
- **Pas encore de tests de propriétés.** fast-check arrivera avec #25, qui le demande.
