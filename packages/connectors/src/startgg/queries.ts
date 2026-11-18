/**
 * Requêtes types de l'API GraphQL start.gg, issues du spike #14.
 * Elles ne demandent que les champs utiles à EPICKEM : les conditions d'utilisation
 * interdisent de demander plus de données que nécessaire. Voir docs/technique/startgg.md.
 */

export const STARTGG_ENDPOINT = "https://api.start.gg/gql/alpha";

/** Limites documentées par start.gg (https://developer.start.gg/docs/rate-limits). */
export const STARTGG_LIMITS = {
  /** Requêtes autorisées par fenêtre, en moyenne. */
  requestsPerWindow: 80,
  windowMs: 60_000,
  /** Objets renvoyés par requête, objets imbriqués compris. */
  maxObjectsPerRequest: 1000,
  /** `perPage` maximal des requêtes paginées par `query` (seeds, classements, tournois). */
  maxPerPage: 512,
} as const;

/** Délai minimal entre deux requêtes pour rester sous la limite moyenne. */
export const STARTGG_MIN_INTERVAL_MS = Math.ceil(
  STARTGG_LIMITS.windowMs / STARTGG_LIMITS.requestsPerWindow,
);

/** Recherche de tournois par nom (#54). */
export const SEARCH_TOURNAMENTS = /* GraphQL */ `
  query SearchTournaments($name: String!, $page: Int!, $perPage: Int!) {
    tournaments(query: { page: $page, perPage: $perPage, filter: { name: $name } }) {
      pageInfo {
        total
        totalPages
      }
      nodes {
        id
        name
        slug
        startAt
        endAt
        isOnline
        numAttendees
      }
    }
  }
`;

/** Un tournoi et ses événements (un événement = une compétition sur un jeu). */
export const TOURNAMENT = /* GraphQL */ `
  query Tournament($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      slug
      startAt
      endAt
      timezone
      isOnline
      numAttendees
      events {
        id
        name
        slug
        state
        type
        numEntrants
        isOnline
        startAt
        videogame {
          id
          name
          displayName
        }
      }
    }
  }
`;

/** Un événement et ses phases (étapes). Les groupes sont lus à part : ils peuvent être nombreux. */
export const EVENT = /* GraphQL */ `
  query Event($slug: String!) {
    event(slug: $slug) {
      id
      name
      slug
      state
      type
      numEntrants
      startAt
      updatedAt
      teamRosterSize {
        minPlayers
        maxPlayers
      }
      videogame {
        id
        name
        displayName
      }
      tournament {
        id
        name
        slug
      }
      phases {
        id
        name
        phaseOrder
        bracketType
        state
        numSeeds
        groupCount
        isExhibition
      }
    }
  }
`;

/** Les groupes d'une phase (poules ou arbres), avec leurs rondes et leurs qualifications. */
export const PHASE_GROUPS = /* GraphQL */ `
  query PhaseGroups($phaseId: ID!, $page: Int!, $perPage: Int!) {
    phase(id: $phaseId) {
      id
      phaseGroups(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          id
          displayIdentifier
          bracketType
          state
          numRounds
          startAt
          rounds {
            id
            number
            bestOf
          }
          progressionsOut {
            id
            originPlacement
            originPhaseGroup {
              id
            }
          }
        }
      }
    }
  }
`;

/**
 * Les matchs d'un événement, avec leurs manches, personnages et cartes.
 * `updatedAfter` permet de ne relire que ce qui a changé (synchronisation, #55).
 */
export const EVENT_SETS = /* GraphQL */ `
  query EventSets($eventId: ID!, $page: Int!, $perPage: Int!, $updatedAfter: Timestamp) {
    event(id: $eventId) {
      id
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
          totalGames
          setGamesType
          hasPlaceholder
          startedAt
          completedAt
          updatedAt
          winnerId
          wPlacement
          lPlacement
          phaseGroup {
            id
          }
          slots(includeByes: true) {
            slotIndex
            prereqType
            prereqId
            prereqPlacement
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
            id
            orderNum
            state
            winnerId
            entrant1Score
            entrant2Score
            stage {
              id
              name
            }
            selections {
              selectionType
              orderNum
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
`;

/** Le seeding d'une phase. */
export const PHASE_SEEDS = /* GraphQL */ `
  query PhaseSeeds($phaseId: ID!, $page: Int!, $perPage: Int!) {
    phase(id: $phaseId) {
      id
      seeds(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          id
          seedNum
          groupSeedNum
          placement
          isBye
          phaseGroup {
            id
          }
          entrant {
            id
            name
          }
        }
      }
    }
  }
`;

/** Le classement final d'un événement. */
export const EVENT_STANDINGS = /* GraphQL */ `
  query EventStandings($eventId: ID!, $page: Int!, $perPage: Int!) {
    event(id: $eventId) {
      id
      standings(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          placement
          isFinal
          entrant {
            id
            name
          }
        }
      }
    }
  }
`;

/** Les personnages et les cartes d'un jeu : des données de référence, sans personne. */
export const VIDEOGAME = /* GraphQL */ `
  query Videogame($id: ID!) {
    videogame(id: $id) {
      id
      name
      displayName
      slug
      characters {
        id
        name
      }
      stages {
        id
        name
      }
    }
  }
`;
