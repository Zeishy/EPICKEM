# ADR-001 : TypeScript en monorepo, avec NestJS, PostgreSQL, React et Expo

- **Statut** : Accepté
- **Date** : 2026-11-18
- **Issue** : #9

## Contexte

Le sujet laisse la stack libre mais demande de la justifier. Il impose :

- une plateforme web, une API avec du temps réel, un simulateur et une application mobile **native** : pas de PWA, de Capacitor ou de WebView ;
- une seule plateforme mobile, iOS ou Android ;
- des tests lancés en une commande, un build mobile produit par la CI, une référence d'API (OpenAPI ou équivalent) ;
- l'accessibilité WCAG 2.2 AA sur le web et le mobile ;
- un nouveau contributeur opérationnel en moins de 15 minutes.

Contraintes de l'équipe :

- trois personnes, **sans rôles fixes** : chacun doit pouvoir travailler partout et expliquer tout le code en soutenance ;
- environ dix semaines de développement, vacances de Noël comprises ;
- des postes sous Windows, sans Mac.

Le cœur du produit est un **moteur de règles** (formats de tournoi, départage, barèmes, résolution des Pick'em) partagé par l'API, le simulateur et les tests. Les mêmes types (tournoi, match, pronostic) circulent entre le serveur, le web et le mobile.

## Options envisagées

### Langage et organisation du code

**Option A : TypeScript partout, en monorepo pnpm + Turborepo.**

- **Pour** : un seul langage pour les trois membres ; le moteur et les types sont écrits une fois et importés partout ; une commande pour tout tester et tout compiler.
- **Contre** : le monorepo demande un peu d'outillage (workspaces, ordre de compilation), déjà en place.

**Option B : un back-end dans un autre langage (Java/Spring, Python/Django, Go).**

- **Pour** : écosystèmes back-end matures.
- **Contre** : deux langages au minimum, des types à dupliquer entre serveur et clients, un moteur impossible à partager avec le front et le mobile.

### API

**Option A : NestJS.**

- **Pour** : structure imposée (modules, services, contrôleurs) qui garde le code homogène à trois ; guards pour vérifier les permissions côté serveur ; intégrations officielles pour OpenAPI, WebSocket, tâches planifiées et files BullMQ.
- **Contre** : plus verbeux qu'un framework minimal, injection de dépendances à apprendre.

**Option B : Fastify ou Express seul.**

- **Pour** : léger, rapide à démarrer.
- **Contre** : toute l'architecture est à inventer et à documenter, ce que NestJS fournit déjà.

**Option C : tRPC.**

- **Pour** : types de bout en bout sans génération.
- **Contre** : pas de référence OpenAPI native, alors que le sujet en demande une.

### Base de données et accès

**Option A : PostgreSQL avec Prisma.**

- **Pour** : données très relationnelles (tournoi, étape, match, manche, inscription, pronostic) ; transactions pour verrouiller les pronostics de façon sûre ; migrations versionnées et client typé avec Prisma.
- **Contre** : Prisma masque une partie du SQL ; les requêtes de classement les plus lourdes pourront passer en SQL brut.

**Option B : MongoDB.**

- **Pour** : schéma souple.
- **Contre** : les relations et les recalculs en cascade y sont plus difficiles à garder cohérents.

La validation des données utilise **Zod**, dans `packages/shared` : les mêmes schémas servent au formulaire web, à l'API et au mobile.

### Temps réel et tâches de fond

**Option A : Socket.IO avec Redis, et BullMQ pour les tâches.**

- **Pour** : salles par tournoi, match et groupe ; reconnexion automatique ; client disponible pour le web et React Native ; Redis permet de lancer plusieurs instances de l'API pendant les tests de charge ; BullMQ gère la synchronisation start.gg (limites de requêtes, nouvelles tentatives) et le verrouillage planifié des pronostics.
- **Contre** : Redis est un service de plus à faire tourner.

**Option B : Server-Sent Events.**

- **Pour** : plus simple, HTTP standard.
- **Contre** : flux à sens unique, reconnexion et regroupement par salle à reconstruire, support moins direct sur React Native.

### Web

**Option A : React avec Vite, React Router, TanStack Query, Radix et Tailwind.**

- **Pour** : connu de l'équipe ; Radix fournit des composants accessibles (clavier, ARIA) sur lesquels construire ; TanStack Query gère le cache et les mises à jour reçues en direct ; application statique simple à servir.
- **Contre** : pas de rendu serveur. Il n'est pas nécessaire : le référencement n'est pas un objectif.

**Option B : Next.js.**

- **Pour** : rendu serveur, routage intégré.
- **Contre** : un deuxième serveur à déployer à côté de l'API, et une complexité (composants serveur, cache) sans bénéfice ici.

### Mobile

**Option A : React Native avec Expo, sur Android.**

- **Pour** : composants natifs, donc conforme au sujet ; TypeScript, types et client API partagés avec le web ; propriétés d'accessibilité compatibles TalkBack ; APK compilable sur un runner Linux de GitHub Actions ; Android se teste sur émulateur sous Windows.
- **Contre** : une couche d'abstraction au-dessus du natif ; certaines fonctions (notifications push) demandent une configuration Firebase.

**Option B : Kotlin natif.**

- **Pour** : la meilleure intégration Android.
- **Contre** : un deuxième langage, aucun code partagé, une courbe d'apprentissage incompatible avec le délai.

**Option C : Flutter.**

- **Pour** : rendu performant, bon outillage.
- **Contre** : Dart à apprendre, aucun code partagé avec le reste.

**iOS** est écarté : il faut un Mac pour compiler et l'équipe n'en a pas.

### Tests et documentation

- **Vitest** pour le moteur, les paquets partagés et l'API ; **fast-check** pour les tests de propriétés du moteur (par exemple : jamais de rematch en ronde suisse).
- **Playwright avec axe-core** pour les parcours web et l'accessibilité automatique.
- **Jest avec React Native Testing Library** pour le mobile.
- **MSW** pour simuler l'API start.gg : les tests passent sans réseau.
- **Docusaurus** pour le site de documentation (#13), en Markdown dans `docs/`.

## Décision

On retient **TypeScript partout, en monorepo pnpm + Turborepo** :

| Brique     | Choix                                                      |
| ---------- | ---------------------------------------------------------- |
| Moteur     | `packages/engine` : fonctions pures, sans base de données  |
| API        | NestJS, Prisma, PostgreSQL, validation Zod                 |
| Temps réel | Socket.IO avec Redis, tâches de fond avec BullMQ           |
| Web        | React, Vite, React Router, TanStack Query, Radix, Tailwind |
| Mobile     | React Native avec Expo, Android uniquement                 |
| Simulateur | CLI Node qui passe par l'API, données générées             |
| Tests      | Vitest, fast-check, Playwright + axe, Jest + RNTL, MSW     |
| Docs       | Markdown dans `docs/`, publié avec Docusaurus              |

Le critère décisif est le **partage** : un seul langage pour une équipe sans rôles fixes, un moteur écrit une fois et utilisé par l'API, le simulateur et les tests, et des types communs au serveur, au web et au mobile.

## Conséquences

- **Positives** :
  - chacun peut relire et reprendre n'importe quelle partie du code ;
  - une règle de tournoi corrigée dans le moteur est corrigée partout ;
  - `pnpm test` couvre tout le dépôt ;
  - les choix web (Radix) et mobile (Expo) partent d'une base accessible.
- **Négatives** :
  - quatre familles d'outils à maîtriser (NestJS, Prisma, React, Expo). On limite le coût avec des socles posés tôt (#15, #16, #51) et un guide de contribution ;
  - Redis s'ajoute à PostgreSQL. Il est déjà fourni par l'environnement de développement (#6) ;
  - Android uniquement : le jury devra utiliser un téléphone Android ou l'APK sur émulateur (#73, #95).
- **Suivi** : le modèle de données (#10) et le socle de l'API (#15) appliquent ces choix. Un changement de brique passera par un nouvel ADR.
