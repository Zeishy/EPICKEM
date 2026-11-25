import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Comme index.html : la langue du document est vérifiée par axe-core.
document.documentElement.lang = "fr";

// jsdom n'implémente pas le défilement, appelé par <ScrollRestoration> à chaque navigation.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  document.title = "";
});
