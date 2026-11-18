# ADR-003 : Les résultats sont la source de vérité, tout le reste est recalculé

- **Statut** : Accepté
- **Date** : 2026-11-18
- **Issue** : #9

## Contexte

Un résultat de match peut arriver par quatre chemins : saisie de l'administrateur, déclaration des participants avec double confirmation, import d'un fichier, synchronisation start.gg. Le sujet demande que **chacun déclenche la même mécanique** : l'arbre avance, les qualifiés sont désignés, les pronostics et les Pick'em sont résolus, les classements sont mis à jour en temps réel.

Un résultat peut aussi être **corrigé** : après un litige, après une synchronisation start.gg qui change un score, ou après une erreur de saisie. Le sujet exige alors un **recalcul en cascade** : l'arbre, les qualifiés et les points de tous les spectateurs sont recalculés, et l'historique garde la trace du changement.

Si l'état des tournois et les points étaient modifiés pas à pas, à chaque résultat, une correction obligerait à « défaire » chaque effet à la main. C'est la principale source de bugs de ce genre de plateforme, et la plus difficile à tester.

## Options envisagées

### Option A : mises à jour incrémentales

Chaque résultat modifie directement l'arbre, les qualifiés et les points.

- **Pour** : intuitif, rapide à écrire pour le cas simple.
- **Contre** : une correction demande une logique d'annulation pour chaque effet ; l'état peut diverger sans moyen simple de le vérifier ; l'historique est à construire à part.

### Option B : les résultats comme seule source de vérité, l'état dérivé recalculé

On ne stocke comme donnée de référence que la configuration du tournoi, les participants, les résultats des manches et les pronostics. Tout le reste est calculé par des fonctions pures.

- **Pour** : une correction n'est qu'un nouveau résultat suivi d'un nouveau calcul ; le calcul est déterministe et se teste sans base de données ; l'historique découle des versions de résultats.
- **Contre** : on recalcule plus que le strict nécessaire ; il faut stocker l'état calculé pour que les lectures restent rapides.

### Option C : event sourcing complet

Tout changement est un événement, et l'état entier est reconstruit à partir du journal.

- **Pour** : historique total.
- **Contre** : infrastructure lourde (journal, projections, rejeu) pour une équipe de trois en dix semaines.

## Décision

On retient l'**option B**.

**Données de référence**, seules modifiables :

- la configuration du tournoi et de ses étapes (format, barème, départage, seeding) ;
- les participants et leurs inscriptions ;
- les **résultats des manches**, en ajout seul : une correction crée une nouvelle version avec son auteur, sa date et sa raison (litige, synchronisation, erreur de saisie) ;
- les pronostics et les réponses aux Pick'em, figés à leur verrouillage (#44).

**Données dérivées**, jamais modifiées à la main :

- l'état de chaque étape : arbre, poules, classement, qualifiés ;
- les points de chaque pronostic et de chaque réponse de Pick'em ;
- les classements des pronostiqueurs, des groupes et des saisons.

**Calcul** :

- `packages/engine` expose des fonctions pures : `état de l'étape = f(configuration, participants, résultats)` et `points = g(pronostics, résultats, barème)` ;
- les quatre sources de résultats aboutissent au même point d'entrée, qui enregistre le résultat et émet l'événement `MatchResultRecorded` ;
- l'API recalcule alors l'étape concernée et les étapes suivantes, puis les points touchés, **dans une seule transaction** ;
- l'état dérivé est enregistré en base comme un cache, pour des lectures rapides, et les changements sont diffusés en direct (#40) ;
- chaque variation de points est écrite dans un historique (pronostic, ancienne et nouvelle valeur, résultat à l'origine du changement) ;
- les corrections sont aussi tracées dans le journal d'audit (#66).

**Cas particuliers** :

- **Élimination directe** : si une correction change le vainqueur d'un match dont la suite a déjà été jouée, les matchs en aval deviennent invalides. Ils sont signalés à l'administrateur et réinitialisés seulement après sa confirmation (#64).
- **Ronde suisse** : les appariements des rondes déjà jouées sont **figés**. Une correction recalcule les scores et le Buchholz, mais ne réapparie pas le passé ; seules les rondes à venir en tiennent compte.
- **Tournois importés** : la source externe fait foi. Une synchronisation qui change un score est traitée comme une correction (#55).
- **Pronostics** : un recalcul ne modifie jamais ce qu'un spectateur a pronostiqué, seulement les points qu'il en retire.

## Conséquences

- **Positives** :
  - le recalcul en cascade (#64) n'est pas un mécanisme à part : c'est le calcul normal relancé ;
  - le moteur se teste avec des entrées et des sorties, sans base ni serveur ; la liste de tests exigée par le sujet s'écrit directement contre lui ;
  - le calcul est idempotent : relancer deux fois donne le même résultat, ce qui sécurise les synchronisations répétées ;
  - l'historique et l'audit découlent des versions de résultats.
- **Négatives** :
  - plus de calcul qu'une mise à jour ciblée. À notre échelle (quelques centaines de matchs par tournoi), le coût est négligeable ; le recalcul des classements de milliers de spectateurs est mesuré par les tests de charge (#76) ;
  - le cache de l'état dérivé doit toujours être réécrit dans la même transaction que le résultat, sinon il devient faux. Cette règle est centralisée dans un seul service de l'API.
- **Suivi** : le modèle de données (#10) distingue les tables de référence des tables dérivées ; le barème (#45) et le recalcul en cascade (#64) appliquent cette décision ; la documentation technique (#85) la reprend.
