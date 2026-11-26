#!/usr/bin/env node
// Environnement de développement en une commande, sous Windows, macOS et Linux.
// Pas de dépendance : ce script tourne avant même `pnpm install`.
//
//   pnpm bootstrap            vérifie les prérequis, installe, lance les services, migre, seed, puis `pnpm dev`
//   pnpm bootstrap --no-dev   idem, sans lancer `pnpm dev` à la fin (CI)
//   pnpm services:up          lance PostgreSQL et Redis et attend qu'ils soient prêts
//   pnpm services:down        arrête les services (les données sont conservées)
//   pnpm services:reset       supprime les données, relance les services, migre et seed
//   pnpm services:status      état des services
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_NODE_MAJOR = 24;

const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = color("1");
const green = color("32");
const red = color("31");
const dim = color("2");

const step = (message) => console.log(`\n${bold("▶")} ${bold(message)}`);
const ok = (message) => console.log(`  ${green("✔")} ${message}`);

class SetupError extends Error {
  constructor(message, hints = []) {
    super(message);
    this.hints = hints;
  }
}

// Une seule chaîne de commande, exécutée par le shell : nécessaire sous Windows pour pnpm.cmd.
// Les commandes sont écrites dans ce fichier, jamais construites à partir d'une saisie.
function run(command, { capture = false } = {}) {
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    stdio: capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: process.env,
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

function runOrFail(command, message, hints = []) {
  console.log(dim(`  $ ${command}`));
  if (!run(command).ok) throw new SetupError(message, hints);
}

function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < MIN_NODE_MAJOR) {
    throw new SetupError(`Node.js ${process.versions.node} est trop ancien.`, [
      `Installez Node.js ${MIN_NODE_MAJOR} ou plus (voir .nvmrc) : https://nodejs.org`,
    ]);
  }
  ok(`Node.js ${process.versions.node}`);
}

function checkPnpm() {
  const pnpm = run("pnpm --version", { capture: true });
  if (!pnpm.ok) {
    throw new SetupError("pnpm est introuvable.", ["Installez-le : npm install -g pnpm@11"]);
  }
  ok(`pnpm ${pnpm.output}`);
}

function checkDocker() {
  const docker = run("docker --version", { capture: true });
  if (!docker.ok) {
    throw new SetupError("Docker est introuvable.", [
      "Windows et macOS : installez Docker Desktop, https://www.docker.com/products/docker-desktop/",
      "Linux : installez Docker Engine et le plugin Compose, https://docs.docker.com/engine/install/",
    ]);
  }
  const compose = run("docker compose version --short", { capture: true });
  if (!compose.ok) {
    throw new SetupError("Docker Compose v2 est introuvable (commande `docker compose`).", [
      "Mettez Docker Desktop à jour, ou installez le plugin docker-compose-plugin sous Linux.",
    ]);
  }
  if (!run("docker info", { capture: true }).ok) {
    throw new SetupError("Docker est installé mais ne répond pas.", [
      "Windows et macOS : lancez Docker Desktop et attendez qu'il soit prêt.",
      "Linux : sudo systemctl start docker (et ajoutez-vous au groupe docker).",
    ]);
  }
  ok(`Docker Compose ${compose.output}`);
}

function ensureEnvFile() {
  const env = join(root, ".env");
  if (existsSync(env)) {
    ok(".env déjà présent, conservé tel quel");
  } else {
    copyFileSync(join(root, ".env.example"), env);
    ok(".env créé à partir de .env.example");
  }
  // Les migrations et le seed lancés ensuite héritent de ces variables.
  process.loadEnvFile(env);
}

function servicesUp() {
  runOrFail(
    "docker compose up --detach --wait",
    "Les services PostgreSQL et Redis n'ont pas démarré.",
    [
      "Un port est peut-être déjà utilisé : changez POSTGRES_PORT ou REDIS_PORT dans .env, ainsi que DATABASE_URL ou REDIS_URL.",
      "Détails : docker compose logs",
    ],
  );
  ok("PostgreSQL et Redis sont prêts");
}

// Les paquets déclarent ces scripts quand ils en ont besoin (#10 pour les migrations, #48 pour le seed).
function migrateAndSeed() {
  runOrFail("pnpm --recursive --if-present run db:migrate", "Les migrations ont échoué.");
  runOrFail("pnpm --recursive --if-present run db:seed", "Le seed a échoué.");
  ok("Base de données migrée et données de démo chargées");
}

const commands = {
  bootstrap(args) {
    step("Vérification des prérequis");
    checkNode();
    checkPnpm();
    checkDocker();

    step("Configuration");
    ensureEnvFile();

    step("Installation des dépendances");
    runOrFail("pnpm install", "pnpm install a échoué.");

    step("Services PostgreSQL et Redis");
    servicesUp();

    step("Compilation des paquets partagés");
    runOrFail("pnpm build", "La compilation a échoué.", [
      "Windows, erreur « spawn UNKNOWN » : voir la section Smart App Control du README.",
    ]);

    step("Base de données");
    migrateAndSeed();

    console.log(`\n${green(bold("Environnement prêt."))}`);
    if (args.includes("--no-dev")) {
      console.log("Lancez la plateforme avec : pnpm dev");
      return;
    }
    step("Lancement de la plateforme (Ctrl+C pour arrêter)");
    run("pnpm exec turbo run dev");
  },

  up() {
    checkDocker();
    servicesUp();
  },

  down() {
    checkDocker();
    runOrFail("docker compose stop", "Impossible d'arrêter les services.");
    ok("Services arrêtés, données conservées");
  },

  reset() {
    checkDocker();
    ensureEnvFile();
    runOrFail("docker compose down --volumes", "Impossible de supprimer les services.");
    ok("Données supprimées");
    servicesUp();
    migrateAndSeed();
  },

  status() {
    checkDocker();
    run("docker compose ps");
  },
};

const [name = "bootstrap", ...args] = process.argv.slice(2);
const command = commands[name];

if (!command) {
  console.error(`Commande inconnue : ${name}. Disponibles : ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}

try {
  command(args);
} catch (error) {
  if (!(error instanceof SetupError)) throw error;
  console.error(`\n${red("✖")} ${bold(error.message)}`);
  for (const hint of error.hints) console.error(`  → ${hint}`);
  process.exit(1);
}
