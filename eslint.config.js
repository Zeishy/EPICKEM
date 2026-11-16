// Configuration ESLint commune à tout le monorepo. Chaque paquet la lit avec `eslint .`.
import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "**/dist/",
    "**/build/",
    "**/coverage/",
    "**/.turbo/",
    "**/.expo/",
    "**/.docusaurus/",
  ]),

  js.configs.recommended,

  // Règles TypeScript qui s'appuient sur les types : promesses oubliées, valeurs `any`, etc.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Les fichiers JavaScript (configurations) ne font pas partie d'un projet TypeScript.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Accessibilité des composants React (web et mobile) : niveau strict, objectif WCAG 2.2 AA.
  {
    files: ["**/*.{jsx,tsx}"],
    extends: [jsxA11y.configs.strict],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    rules: {
      eqeqeq: ["error", "smart"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // En dernier : désactive les règles de style gérées par Prettier.
  prettier,
);
