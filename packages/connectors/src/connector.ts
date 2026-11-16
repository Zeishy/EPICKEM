/**
 * Ce qu'un connecteur sait faire. L'application n'appelle que les fonctions
 * déclarées : une plateforme qui n'expose pas les résultats en direct déclare
 * simplement `liveResults: false`.
 */
export interface ConnectorCapabilities {
  readonly importTournament: boolean;
  readonly importParticipants: boolean;
  readonly importResults: boolean;
  readonly liveResults: boolean;
}

export interface Connector {
  /** Identifiant stable, par exemple "startgg". */
  readonly id: string;
  /** Nom affiché à l'utilisateur. */
  readonly name: string;
  readonly capabilities: ConnectorCapabilities;
}

export type Capability = keyof ConnectorCapabilities;

export function supports(connector: Connector, capability: Capability): boolean {
  return connector.capabilities[capability];
}
