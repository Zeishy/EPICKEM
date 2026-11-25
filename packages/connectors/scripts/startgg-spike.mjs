#!/usr/bin/env node
// Spike start.gg (#14) : interroge l'API, mesure ce qu'un événement renseigne vraiment
// et enregistre des fixtures pseudonymisées pour les mocks (#56).
//
//   pnpm --filter @epickem/connectors spike:startgg recherche "<nom>"
//   pnpm --filter @epickem/connectors spike:startgg tournoi <slug-du-tournoi>
//   pnpm --filter @epickem/connectors spike:startgg evenement <slug-de-l-evenement> [--fixture <nom>] [--groupe <id>] [--cache]
//
// --fixture écrit une copie pseudonymisée, limitée au groupe --groupe s'il est donné.
// --cache relit les réponses déjà enregistrées au lieu d'appeler l'API (pas besoin de jeton).
//
// Le jeton est lu dans STARTGG_API_TOKEN (fichier .env à la racine). Les réponses brutes,
// qui contiennent des pseudos réels, restent dans .startgg-cache/ (ignoré par git) ;
// seules les fixtures pseudonymisées vont dans fixtures/startgg/.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  EVENT,
  EVENT_SETS,
  EVENT_STANDINGS,
  PHASE_GROUPS,
  PHASE_SEEDS,
  SEARCH_TOURNAMENTS,
  STARTGG_ENDPOINT,
  STARTGG_LIMITS,
  STARTGG_MIN_INTERVAL_MS,
  TOURNAMENT,
  VIDEOGAME,
  createPseudonymizer,
  measureCoverage,
  percent,
} from "../src/startgg/index.ts";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageDir, "../..");
const cacheDir = join(repoRoot, ".startgg-cache");
const fixturesDir = join(packageDir, "fixtures", "startgg");

// Au-delà, une fixture devient trop lourde pour le dépôt : choisir un groupe avec --groupe.
const MAX_FIXTURE_SETS = 300;
// Un set avec 5 manches détaillées coûte ~52 objets : 17 sets restent sous les 1000.
// Les pages plus lourdes (BO7…) sont redécoupées automatiquement.
const SETS_PER_PAGE = 17;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    fixture: { type: "string" },
    groupe: { type: "string" },
    cache: { type: "boolean" },
  },
});
const [command, target] = positionals;

/** Erreur attendue : message affiché tel quel, sans pile d'appels. */
class SpikeError extends Error {}
/** Réponse refusée car elle dépasse 1000 objets : il faut une page plus petite. */
class ComplexityError extends SpikeError {}

const token = process.env.STARTGG_API_TOKEN;
const metrics = {
  requests: 0,
  retries: 0,
  totalMs: 0,
  complexities: [],
  complexityErrors: [],
  rateLimitHeaders: {},
};
let lastRequestAt = 0;

try {
  if (!token && !values.cache) {
    fail(
      "STARTGG_API_TOKEN est vide. Créer un jeton sur https://start.gg/admin/profile/developer " +
        "(« Create new token »), puis le copier dans le fichier .env à la racine du dépôt.",
    );
  }
  switch (command) {
    case "recherche":
      await search(required(target, "nom du tournoi"));
      break;
    case "tournoi":
      await tournament(normalizeSlug(required(target, "slug du tournoi"), "tournament"));
      break;
    case "evenement":
      await event(normalizeSlug(required(target, "slug de l'événement"), "event"));
      break;
    default:
      fail("Commande attendue : recherche, tournoi ou evenement. Voir l'en-tête du script.");
  }
  printMetrics();
} catch (error) {
  if (!(error instanceof SpikeError)) throw error;
  // Pas de process.exit : sous Windows, il coupe la sortie avant qu'elle soit écrite.
  console.error(`\n${error.message}`);
  process.exitCode = 1;
}

// --- Commandes ---------------------------------------------------------------

async function search(name) {
  const data = await query(SEARCH_TOURNAMENTS, { name, page: 1, perPage: 20 });
  const { nodes, pageInfo } = data.tournaments;
  console.log(`${pageInfo.total} tournoi(s) pour « ${name} » :`);
  for (const t of nodes) {
    console.log(`- ${t.slug}  ${t.name}  (${date(t.startAt)}, ${t.numAttendees ?? "?"} inscrits)`);
  }
}

async function tournament(slug) {
  const data = await query(TOURNAMENT, { slug });
  if (!data.tournament) fail(`Tournoi introuvable : ${slug}`);
  const t = data.tournament;
  console.log(`${t.name}  ${sourceUrl(t.slug)}  (${date(t.startAt)})`);
  for (const e of t.events ?? []) {
    console.log(`- ${e.slug}  ${e.videogame?.name ?? "?"}  ${e.numEntrants ?? "?"} participants`);
  }
}

async function event(slug) {
  const rawDir = join(cacheDir, fileName(slug));
  const rawFile = join(rawDir, "reponses.json");
  if (values.cache) {
    if (!existsSync(rawFile))
      fail(`Pas de réponses enregistrées pour ${slug} : relancer sans --cache.`);
    const raw = JSON.parse(readFileSync(rawFile, "utf8"));
    report(raw.event, raw.phaseGroups, raw.seeds, raw.sets, raw.standings, raw.videogame);
    if (values.fixture) saveFixture(values.fixture, raw);
    return;
  }

  const { event: e } = await query(EVENT, { slug });
  if (!e) fail(`Événement introuvable : ${slug}`);
  const phaseGroups = [];
  const seeds = [];
  for (const phase of e.phases ?? []) {
    const groups = await paginate(
      PHASE_GROUPS,
      { phaseId: phase.id },
      (d) => d.phase.phaseGroups,
      32,
    );
    phaseGroups.push(...groups.map((group) => ({ ...group, phaseId: phase.id })));
    seeds.push(...(await paginate(PHASE_SEEDS, { phaseId: phase.id }, (d) => d.phase.seeds, 200)));
  }
  const sets = await paginate(EVENT_SETS, { eventId: e.id }, (d) => d.event.sets, SETS_PER_PAGE);
  const standings = await paginate(
    EVENT_STANDINGS,
    { eventId: e.id },
    (d) => d.event.standings,
    200,
  );
  const videogame = e.videogame ? (await query(VIDEOGAME, { id: e.videogame.id })).videogame : null;

  const raw = { event: e, phaseGroups, seeds, sets, standings, videogame };
  writeJson(rawDir, raw);
  console.log(`\nRéponses brutes (pseudos réels, non commitées) : ${rawDir}`);

  report(e, phaseGroups, seeds, sets, standings, videogame);
  if (values.fixture) saveFixture(values.fixture, raw);
}

// --- Rapport et fixtures -----------------------------------------------------

function report(e, phaseGroups, seeds, sets, standings, videogame) {
  console.log(`${e.tournament.name} · ${e.name} (${e.videogame?.name}) — ${sourceUrl(e.slug)}`);
  const c = measureCoverage(sets);
  const types = [...new Set(phaseGroups.map((g) => g.bracketType))].join(", ");
  console.log(`
Structure
  phases : ${e.phases?.length ?? 0} · groupes : ${phaseGroups.length} (${types || "?"})
  seeds : ${seeds.length} · classement : ${standings.length} lignes · participants : ${e.numEntrants}
Matchs
  sets : ${c.sets} · terminés : ${c.completedSets} · avec emplacement vide (exempt) : ${c.setsWithBye} · FFA : ${c.ffaSets}
  sets terminés avec le détail des manches : ${c.completedSetsWithGames} (${percent(c.completedSetsWithGames, c.completedSets)} %)
Manches
  manches : ${c.games}
  avec personnages : ${c.gamesWithCharacters} (${percent(c.gamesWithCharacters, c.games)} %), ${c.distinctCharacters} distincts sur ${videogame?.characters?.length ?? "?"}
  avec carte : ${c.gamesWithStage} (${percent(c.gamesWithStage, c.games)} %), ${c.distinctStages} distinctes sur ${videogame?.stages?.length ?? "?"}`);
}

function saveFixture(name, raw) {
  const groupId = values.groupe;
  const keep = (item) => !groupId || String(item.phaseGroup?.id) === groupId;
  const sets = raw.sets.filter(keep);
  if (sets.length > MAX_FIXTURE_SETS) {
    fail(
      `${sets.length} sets : trop lourd pour une fixture (max ${MAX_FIXTURE_SETS}). ` +
        "Choisir un groupe avec --groupe <id> (identifiants listés dans .startgg-cache).",
    );
  }

  // Avec un groupe, le classement est limité aux participants qui y jouent.
  const seeds = raw.seeds.filter(keep);
  const present = new Set(
    [...sets.flatMap((set) => set.slots ?? []), ...seeds]
      .map((item) => item?.entrant?.id)
      .filter((id) => id != null)
      .map(String),
  );
  const standings = groupId
    ? raw.standings.filter((line) => present.has(String(line.entrant?.id)))
    : raw.standings;

  // Un seul pseudonymiseur : un participant garde le même alias dans tous les fichiers.
  const pseudonymizer = createPseudonymizer();
  const dir = join(fixturesDir, fileName(name));
  const files = {
    "evenement.json": raw.event,
    "groupes.json": raw.phaseGroups.filter((g) => !groupId || String(g.id) === groupId),
    "sets.json": sets,
    "seeds.json": seeds,
    "classement.json": standings,
    "jeu.json": raw.videogame,
  };
  for (const [file, content] of Object.entries(files)) {
    writeJson(dir, pseudonymizer.pseudonymize(content), file);
  }
  const participants = pseudonymizer.size;
  writeJson(
    dir,
    {
      source: sourceUrl(raw.event.slug),
      attribution: "Données publiques start.gg, pseudonymisées pour les tests.",
      captureLe: new Date().toISOString().slice(0, 10),
      groupe: groupId ?? null,
      nombreDeParticipants: participants,
    },
    "source.json",
  );
  console.log(
    `\nFixture pseudonymisée : ${dir} (${participants} participants, ${sets.length} sets)`,
  );
}

// --- Appels à l'API ----------------------------------------------------------

/**
 * Lit toutes les pages d'une connexion. Si une page dépasse 1000 objets (un set riche
 * en manches coûte bien plus qu'un set sans détail), la taille de page est divisée et
 * la lecture reprend là où elle s'était arrêtée.
 */
async function paginate(document, variables, select, perPage) {
  const nodes = [];
  let page = 1;
  for (;;) {
    let connection;
    try {
      connection = select(await query(document, { ...variables, page, perPage }));
    } catch (error) {
      if (!(error instanceof ComplexityError) || perPage === 1) throw error;
      metrics.complexityErrors.push(error.message);
      // Nouvelle taille : diviseur du nombre de nœuds déjà lus, pour reprendre au bon endroit.
      let smaller = Math.floor(perPage / 2);
      while (nodes.length % smaller !== 0) smaller -= 1;
      console.warn(`\n${error.message}\n  → ${smaller} par page au lieu de ${perPage}`);
      perPage = smaller;
      page = nodes.length / perPage + 1;
      continue;
    }
    nodes.push(...(connection?.nodes ?? []));
    const totalPages = connection?.pageInfo?.totalPages ?? 1;
    if (totalPages > 1) process.stdout.write(`\r  page ${page}/${totalPages}`);
    if (page >= totalPages) {
      if (totalPages > 1) process.stdout.write("\n");
      return nodes;
    }
    page += 1;
  }
}

async function query(document, variables, attempt = 1) {
  const wait = lastRequestAt + STARTGG_MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const started = performance.now();
  const response = await fetch(STARTGG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: document, variables }),
  });
  metrics.requests += 1;
  metrics.totalMs += performance.now() - started;
  for (const [key, value] of response.headers) {
    if (/rate|limit|retry/i.test(key)) metrics.rateLimitHeaders[key] = value;
  }

  const body = await response.json().catch(() => null);
  const message = body?.message ?? "";

  if (response.status === 429 || /rate limit/i.test(message)) {
    if (attempt > 3) fail(`Limite de requêtes toujours atteinte après 3 essais : ${message}`);
    metrics.retries += 1;
    console.warn(`\nLimite atteinte (HTTP ${response.status}) : pause de 60 s.`);
    await sleep(STARTGG_LIMITS.windowMs);
    return query(document, variables, attempt + 1);
  }
  const errors = [message, ...(body?.errors ?? []).map((error) => error.message)].join(" ; ");
  if (/complexity/i.test(errors)) throw new ComplexityError(errors);
  if (!response.ok || body?.success === false) {
    fail(`HTTP ${response.status} : ${message || JSON.stringify(body)}`);
  }
  if (body.errors?.length) fail(`Erreur GraphQL : ${errors}`);
  const complexity = body.extensions?.queryComplexity;
  if (typeof complexity === "number") metrics.complexities.push(complexity);
  return body.data;
}

// --- Utilitaires -------------------------------------------------------------

function printMetrics() {
  const { requests, retries, totalMs, complexities, complexityErrors, rateLimitHeaders } = metrics;
  const max = complexities.length ? Math.max(...complexities) : "?";
  console.log(`
Mesures
  requêtes : ${requests} · relances après limite : ${retries} · durée moyenne : ${requests ? Math.round(totalMs / requests) : 0} ms
  complexité max : ${max} / ${STARTGG_LIMITS.maxObjectsPerRequest} objets · pages trop lourdes : ${complexityErrors.length}
  en-têtes de limite : ${JSON.stringify(rateLimitHeaders)}`);
}

/** Accepte un slug ou une URL start.gg. */
function normalizeSlug(input, kind) {
  const path = input.replace(/^https?:\/\/(www\.)?start\.gg\//, "").replace(/\/+$/, "");
  if (kind === "tournament") return path.split("/").slice(0, 2).join("/");
  return path.split("/").slice(0, 4).join("/");
}

function sourceUrl(slug) {
  return `https://www.start.gg/${slug}`;
}

function fileName(text) {
  return text.replace(/^tournament\//, "").replace(/[^a-z0-9-]+/gi, "_");
}

function writeJson(dir, content, file = "reponses.json") {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, file), `${JSON.stringify(content, null, 2)}\n`);
}

function date(timestamp) {
  return timestamp ? new Date(timestamp * 1000).toISOString().slice(0, 10) : "?";
}

function required(value, label) {
  if (!value) fail(`Argument manquant : ${label}.`);
  return value;
}

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

function fail(message) {
  throw new SpikeError(message);
}
