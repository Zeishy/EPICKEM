# ADR-002 : Une VM gratuite avec Docker Compose, déployée par GitHub Actions

- **Statut** : Accepté
- **Date** : 2026-11-18
- **Issue** : #9

## Contexte

Le sujet exige un **déploiement continu** : chaque fusion sur `main` met à jour la plateforme en ligne, avec ses données de démonstration, sur une offre d'hébergement gratuite. L'application mobile doit être produite automatiquement par la CI sous forme d'APK.

Ce qu'il faut héberger (voir [ADR-001](001-stack-technique.md)) :

- l'API NestJS, avec des **connexions WebSocket persistantes** ;
- les tâches de fond (synchronisation start.gg, verrouillage des pronostics) ;
- PostgreSQL et Redis ;
- l'application web statique ;
- la documentation.

Contraintes :

- la soutenance comporte un tournoi simulé **en direct** : la plateforme ne doit pas être en veille ni perdre ses connexions ;
- les tests de charge (#76) doivent mesurer quelque chose de proche de la production ;
- aucun secret dans le dépôt : tout passe par les secrets GitHub ;
- budget nul.

## Options envisagées

### Option A : une VM gratuite avec Docker Compose

Une machine virtuelle de l'offre _Always Free_ d'Oracle Cloud, ou payée avec les crédits étudiants du GitHub Student Developer Pack (Azure, DigitalOcean). Elle fait tourner la même stack qu'en local, derrière Caddy.

- **Pour** :
  - même `compose` qu'en développement (#6), donc peu de surprises ;
  - aucune mise en veille, WebSockets sans limite de durée ;
  - PostgreSQL et Redis inclus, sans quota de requêtes ;
  - web et API sur le **même domaine** : pas de CORS, cookies de session simples ;
  - HTTPS automatique avec Caddy.
- **Contre** :
  - le serveur est à administrer : mises à jour, sauvegardes, pare-feu ;
  - l'inscription chez Oracle demande une carte bancaire (vérification, sans débit), et la disponibilité des VM gratuites varie selon les régions.

### Option B : des services gérés gratuits (Render, Neon, Upstash)

L'API sur Render, PostgreSQL sur Neon, Redis sur Upstash, le web sur un hébergeur statique.

- **Pour** : aucun serveur à administrer, déploiement en quelques clics.
- **Contre** :
  - l'offre gratuite de Render met le service en veille après une période d'inactivité : premier chargement lent et connexions WebSocket coupées ;
  - les quotas gratuits de Redis sont vite consommés par BullMQ, qui interroge Redis en permanence ;
  - quatre fournisseurs à configurer et quatre jeux de secrets ;
  - web et API sur des domaines différents : CORS et cookies tiers à gérer.

### Option C : tout sur GitHub Pages

- **Contre** : uniquement des fichiers statiques. Écarté pour l'API ; retenu pour la documentation.

## Décision

On retient l'**option A** :

| Élément           | Hébergement                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| API, tâches       | Conteneurs Docker sur la VM                                                               |
| PostgreSQL, Redis | Conteneurs Docker sur la VM, volumes sauvegardés                                          |
| Web               | Fichiers statiques servis par Caddy, sur le même domaine que l'API (`/api`, `/socket.io`) |
| HTTPS             | Caddy, certificat Let's Encrypt automatique                                               |
| Documentation     | GitHub Pages (#13)                                                                        |
| APK Android       | Artefact du pipeline GitHub Actions (#73)                                                 |

Déploiement à chaque fusion sur `main` (#50) :

1. GitHub Actions construit les images de l'API et du web et les publie sur GitHub Container Registry ;
2. il se connecte à la VM en SSH, récupère les nouvelles images et relance `docker compose up -d` ;
3. les migrations s'appliquent au démarrage, puis le simulateur recharge les données de démo si besoin ;
4. le pipeline vérifie `/health` et échoue si la plateforme ne répond pas.

Les secrets (clé SSH, jeton start.gg, `AUTH_SECRET`, mots de passe des bases) sont stockés dans les secrets GitHub et écrits dans un `.env` sur la VM, jamais dans le dépôt.

L'option A l'emporte parce que c'est la seule qui tienne un **direct sans coupure** pendant la soutenance, avec la même configuration qu'en développement.

## Conséquences

- **Positives** :
  - un seul fichier `compose` décrit le développement et la production ;
  - les tests de charge tournent sur une infrastructure identique à celle de la démo ;
  - une seule adresse à donner au jury, pour le web et l'API.
- **Négatives** :
  - administration à notre charge. On la limite : mises à jour de sécurité automatiques du système, ports 80 et 443 seuls ouverts, sauvegarde quotidienne de PostgreSQL ;
  - un seul serveur, donc pas de redondance. C'est acceptable pour une démonstration ; le plan B de la soutenance (#95) prévoit une vidéo et des données pré-générées.
- **Suivi** :
  - le choix entre Oracle Cloud et les crédits étudiants se fait à la création de la VM, dans #50 ;
  - si aucune VM gratuite n'est disponible, l'option B est le repli, au prix d'un nouvel ADR.
