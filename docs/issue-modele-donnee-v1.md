# Titre

Concevoir le modele de donnees v1

# Labels suggérés

- type: feature
- area: api
- priority: P0 (a confirmer selon planning)

# Besoin

En tant qu'equipe produit/tech, nous voulons definir un modele de donnees v1 robuste pour EPICKEM afin de stocker les tournois, matchs, pronostics et classements de maniere coherente, versionnee et exploitable par l'API.

Ce modele doit permettre:

- le recalcul fiable des etats de tournoi et des points de pronostic a partir des resultats;
- l'import de donnees publiques (ex: start.gg) avec tracabilite de la source;
- une base stable pour les evolutions web/mobile/simulateur.

# Critères d'acceptation

- [ ] La base cible est PostgreSQL (confirmee par `DATABASE_URL` dans `.env.example`).
- [ ] Prisma est utilise comme ORM pour definir le schema v1.
- [ ] Le schema contient les entites suivantes (avec relations): jeu, statistique, tournoi, etape, match, manche, equipe, joueur, inscription, pronostic, question, reponse, classement, source.
- [ ] Cette liste est un minimum : comptes, participants et resultats complementaires sont ajoutes selon les besoins du sujet.
- [ ] Une migration initiale est generee et executable en local.
- [ ] Un diagramme entite-relation est ajoute dans la documentation technique.
- [ ] Un dictionnaire des champs est ajoute dans la documentation technique.
- [ ] Les contraintes minimales sont en place: PK, FK, unicites metier critiques, dates de creation/mise a jour.
- [ ] Les enums metier v1 sont definis (ex: type de tournoi, statut de match, statut de pronostic) ou explicites comme hors-scope.
- [ ] Le schema permet de lier chaque donnee importee a une source externe (provider + externalId + url).
- [ ] La validation locale est documentee (commandes de migration + verification).

# Accessibilité

Pas d'interface utilisateur dans cette issue. Non applicable.

# Notes techniques

Contexte du repo:

- Base de donnees: PostgreSQL (`.env.example` -> `DATABASE_URL=postgresql://...`).
- API: workspace `apps/api`, avec schema, migration et scripts Prisma.

Emplacements proposes:

- Schema Prisma: `apps/api/prisma/schema.prisma`
- Migrations Prisma: `apps/api/prisma/migrations/*`
- Documentation technique du modele: `docs/technical/data-model-v1.md`

Commandes de validation:

- `pnpm --filter @epickem/api exec prisma validate`
- `pnpm --filter @epickem/api prisma:generate`
- `pnpm --filter @epickem/api prisma:deploy` sur une base de test vide.

Proposition de decoupage:

1. Initialiser Prisma dans `apps/api` et brancher `DATABASE_URL`.
2. Definir les modeles + relations + enums v1.
3. Generer la migration initiale.
4. Ecrire la doc technique (ERD + dictionnaire de champs).
5. Verifier migration sur base vide locale.

Definition of done specifique:

- migration appliquee sans erreur sur une base locale vide;
- diagramme ER lisible et coherent avec `schema.prisma`;
- dictionnaire des champs couvre 100% des champs du schema v1;
- les conventions de nommage sont homogenes (snake_case DB via mapping Prisma si besoin, ou camelCase explicitee).

# Risques / points a trancher

- Statistiques definies par jeu et relevees par manche ; agregats recalculables.
- Classements d'etape et de pronostiqueurs sous forme de caches recalculables.
- Question associee exactement a un tournoi, une etape ou un match.
- Les classements de saison et groupe sont reportes aux issues dediees.
- Unicite de `sourceId` par type d'entite ; les imports multi-sources restent a preciser.
