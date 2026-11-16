// Vérifie les messages de commit (hook commit-msg) et les titres de pull request (CI).
// Format : <type>(<scope>): <description>, voir CONTRIBUTING.md.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        // Zones du projet
        "engine",
        "api",
        "web",
        "mobile",
        "realtime",
        "import",
        "simulator",
        "shared",
        "connectors",
        "infra",
        "docs",
        "adr",
        // Mises à jour de dépendances (Dependabot)
        "deps",
        "deps-dev",
        // Pull requests de version de release-please : « chore(main): release x.y.z »
        "main",
      ],
    ],
  },
};
