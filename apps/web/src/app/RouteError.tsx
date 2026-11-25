import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Button } from "../components/Button.tsx";
import { Page } from "../components/Page.tsx";

/** Affichée dans le layout quand une page lève une erreur : la navigation reste disponible. */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Une erreur inattendue s'est produite.";

  return (
    <Page title="Erreur">
      <p role="alert" className="mb-6 text-danger">
        {detail}
      </p>
      <Button asChild>
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </Page>
  );
}
