# Décisions d'architecture (ADR)

Un ADR (_Architecture Decision Record_) consigne une décision technique importante : son contexte, les options envisagées, le choix retenu et ses conséquences. Il permet à un nouveau contributeur, ou au jury, de comprendre pourquoi le projet est construit ainsi.

## Liste

| ADR                                          | Décision                                                            | Statut  |
| -------------------------------------------- | ------------------------------------------------------------------- | ------- |
| [ADR-001](001-stack-technique.md)            | TypeScript en monorepo : NestJS, PostgreSQL, React, Expo (Android)  | Accepté |
| [ADR-002](002-hebergement-et-deploiement.md) | Une VM gratuite avec Docker Compose, déployée par GitHub Actions    | Accepté |
| [ADR-003](003-resultats-source-de-verite.md) | Les résultats sont la source de vérité, tout le reste est recalculé | Accepté |

## Écrire un ADR

1. Copier [`modele.md`](modele.md) en `NNN-titre-court.md`, avec le numéro suivant.
2. Le rédiger et l'ajouter à la liste ci-dessus, avec le statut **Accepté**.
3. Ouvrir une pull request : la relecture sert de discussion, et l'approbation vaut acceptation. Si la décision est rejetée, la PR est fermée sans fusion.

Le statut **Proposé** sert à une décision qu'on veut écrire avant de la trancher : elle est fusionnée telle quelle et passera à **Accepté** ou **Abandonné** dans une PR ultérieure.

Quand écrire un ADR : choix d'une technologie, d'un format de données, d'un découpage entre modules, d'un compromis de performance ou de sécurité. En cas de doute, en écrire un : c'est court.

Un ADR accepté n'est jamais réécrit. Si la décision change, on écrit un nouvel ADR et on passe l'ancien en **Remplacé par ADR-NNN**.
