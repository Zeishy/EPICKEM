import { Link } from "react-router";
import { Button } from "../components/Button.tsx";
import { Page } from "../components/Page.tsx";

export function NotFoundPage() {
  return (
    <Page title="Page introuvable">
      <p className="mb-6 text-fg-muted">Cette page n'existe pas ou a été déplacée.</p>
      <Button asChild>
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </Page>
  );
}
