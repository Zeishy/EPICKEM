// Lancé par le hook pre-commit : corrige et formate uniquement les fichiers commités.
export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": [
    "eslint --fix --no-warn-ignored --max-warnings=0",
    "prettier --write",
  ],
  "*.{json,md,yml,yaml,css,html}": "prettier --write",
};
