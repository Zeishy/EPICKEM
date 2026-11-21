-- CreateEnum
CREATE TYPE "TournoiFormat" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'GROUP_STAGE', 'SWISS', 'FFA');

-- CreateEnum
CREATE TYPE "TournoiStatut" AS ENUM ('DRAFT', 'UPCOMING', 'LIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EtapeType" AS ENUM ('QUALIFICATION', 'GROUP_STAGE', 'PLAYOFF', 'GRAND_FINAL');

-- CreateEnum
CREATE TYPE "EtapeStatut" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MatchStatut" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'FORFEIT', 'CANCELED');

-- CreateEnum
CREATE TYPE "InscriptionStatut" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MATCH_WINNER', 'SCORE_EXACT', 'BONUS');

-- CreateEnum
CREATE TYPE "PronosticStatut" AS ENUM ('SUBMITTED', 'LOCKED', 'SCORED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SourceProvider" AS ENUM ('START_GG', 'FILE_IMPORT', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatistiqueCible" AS ENUM ('TOURNOI', 'ETAPE', 'MATCH', 'EQUIPE', 'JOUEUR');

-- CreateTable
CREATE TABLE "jeux" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "editeur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jeux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistiques" (
    "id" TEXT NOT NULL,
    "cibleType" "StatistiqueCible" NOT NULL,
    "cibleId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "tournoiId" TEXT,
    "etapeId" TEXT,
    "matchId" TEXT,
    "equipeId" TEXT,
    "joueurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statistiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournois" (
    "id" TEXT NOT NULL,
    "jeuId" TEXT NOT NULL,
    "sourceId" TEXT,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "format" "TournoiFormat" NOT NULL,
    "statut" "TournoiStatut" NOT NULL DEFAULT 'DRAFT',
    "commenceAt" TIMESTAMP(3),
    "termineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapes" (
    "id" TEXT NOT NULL,
    "tournoiId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "type" "EtapeType" NOT NULL,
    "statut" "EtapeStatut" NOT NULL DEFAULT 'UPCOMING',
    "commenceAt" TIMESTAMP(3),
    "termineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchs" (
    "id" TEXT NOT NULL,
    "etapeId" TEXT NOT NULL,
    "sourceId" TEXT,
    "parentMatchId" TEXT,
    "equipeAId" TEXT,
    "equipeBId" TEXT,
    "equipeGagnanteId" TEXT,
    "ordre" INTEGER NOT NULL,
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "statut" "MatchStatut" NOT NULL DEFAULT 'SCHEDULED',
    "commenceAt" TIMESTAMP(3),
    "termineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matchs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manches" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "scoreEquipeA" INTEGER NOT NULL DEFAULT 0,
    "scoreEquipeB" INTEGER NOT NULL DEFAULT 0,
    "equipeGagnanteId" TEXT,
    "joueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "nom" TEXT NOT NULL,
    "tag" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "joueurs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "equipeId" TEXT,
    "pseudo" TEXT NOT NULL,
    "nomAffiche" TEXT,
    "role" TEXT,
    "nationalite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "joueurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "tournoiId" TEXT NOT NULL,
    "equipeId" TEXT,
    "joueurId" TEXT,
    "seed" INTEGER,
    "statut" "InscriptionStatut" NOT NULL DEFAULT 'PENDING',
    "inscritAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "tournoiId" TEXT,
    "etapeId" TEXT,
    "matchId" TEXT,
    "type" "QuestionType" NOT NULL,
    "intitule" TEXT NOT NULL,
    "pointsBase" INTEGER NOT NULL DEFAULT 0,
    "ouvertAt" TIMESTAMP(3) NOT NULL,
    "fermeAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "estCorrecte" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronostics" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reponseId" TEXT NOT NULL,
    "statut" "PronosticStatut" NOT NULL DEFAULT 'SUBMITTED',
    "pointsObtenus" INTEGER NOT NULL DEFAULT 0,
    "soumisAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evalueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classements" (
    "id" TEXT NOT NULL,
    "tournoiId" TEXT NOT NULL,
    "etapeId" TEXT,
    "inscriptionId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rang" INTEGER NOT NULL,
    "calculeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "provider" "SourceProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT,
    "payload" JSONB,
    "synchroniseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jeux_slug_key" ON "jeux"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "statistiques_cibleType_cibleId_cle_key" ON "statistiques"("cibleType", "cibleId", "cle");
CREATE INDEX "statistiques_tournoiId_idx" ON "statistiques"("tournoiId");
CREATE INDEX "statistiques_etapeId_idx" ON "statistiques"("etapeId");
CREATE INDEX "statistiques_matchId_idx" ON "statistiques"("matchId");
CREATE INDEX "statistiques_equipeId_idx" ON "statistiques"("equipeId");
CREATE INDEX "statistiques_joueurId_idx" ON "statistiques"("joueurId");

-- CreateIndex
CREATE UNIQUE INDEX "tournois_slug_key" ON "tournois"("slug");
CREATE INDEX "tournois_jeuId_idx" ON "tournois"("jeuId");
CREATE INDEX "tournois_sourceId_idx" ON "tournois"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "etapes_tournoiId_ordre_key" ON "etapes"("tournoiId", "ordre");
CREATE INDEX "etapes_tournoiId_idx" ON "etapes"("tournoiId");

-- CreateIndex
CREATE UNIQUE INDEX "matchs_etapeId_ordre_key" ON "matchs"("etapeId", "ordre");
CREATE INDEX "matchs_etapeId_idx" ON "matchs"("etapeId");
CREATE INDEX "matchs_sourceId_idx" ON "matchs"("sourceId");
CREATE INDEX "matchs_parentMatchId_idx" ON "matchs"("parentMatchId");
CREATE INDEX "matchs_equipeAId_idx" ON "matchs"("equipeAId");
CREATE INDEX "matchs_equipeBId_idx" ON "matchs"("equipeBId");
CREATE INDEX "matchs_equipeGagnanteId_idx" ON "matchs"("equipeGagnanteId");

-- CreateIndex
CREATE UNIQUE INDEX "manches_matchId_numero_key" ON "manches"("matchId", "numero");
CREATE INDEX "manches_matchId_idx" ON "manches"("matchId");
CREATE INDEX "manches_equipeGagnanteId_idx" ON "manches"("equipeGagnanteId");

-- CreateIndex
CREATE INDEX "equipes_sourceId_idx" ON "equipes"("sourceId");
CREATE INDEX "equipes_nom_idx" ON "equipes"("nom");

-- CreateIndex
CREATE INDEX "joueurs_sourceId_idx" ON "joueurs"("sourceId");
CREATE INDEX "joueurs_equipeId_idx" ON "joueurs"("equipeId");
CREATE INDEX "joueurs_pseudo_idx" ON "joueurs"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_tournoiId_equipeId_key" ON "inscriptions"("tournoiId", "equipeId");
CREATE UNIQUE INDEX "inscriptions_tournoiId_joueurId_key" ON "inscriptions"("tournoiId", "joueurId");
CREATE INDEX "inscriptions_tournoiId_idx" ON "inscriptions"("tournoiId");
CREATE INDEX "inscriptions_equipeId_idx" ON "inscriptions"("equipeId");
CREATE INDEX "inscriptions_joueurId_idx" ON "inscriptions"("joueurId");

-- CreateIndex
CREATE INDEX "questions_tournoiId_idx" ON "questions"("tournoiId");
CREATE INDEX "questions_etapeId_idx" ON "questions"("etapeId");
CREATE INDEX "questions_matchId_idx" ON "questions"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "reponses_questionId_code_key" ON "reponses"("questionId", "code");
CREATE INDEX "reponses_questionId_idx" ON "reponses"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "pronostics_inscriptionId_questionId_key" ON "pronostics"("inscriptionId", "questionId");
CREATE INDEX "pronostics_questionId_idx" ON "pronostics"("questionId");
CREATE INDEX "pronostics_reponseId_idx" ON "pronostics"("reponseId");

-- CreateIndex
CREATE UNIQUE INDEX "classements_tournoiId_etapeId_inscriptionId_key" ON "classements"("tournoiId", "etapeId", "inscriptionId");
CREATE UNIQUE INDEX "classements_tournoiId_inscriptionId_etapeId_null_key" ON "classements"("tournoiId", "inscriptionId") WHERE "etapeId" IS NULL;
CREATE INDEX "classements_tournoiId_rang_idx" ON "classements"("tournoiId", "rang");
CREATE INDEX "classements_etapeId_idx" ON "classements"("etapeId");
CREATE INDEX "classements_inscriptionId_idx" ON "classements"("inscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "sources_provider_externalId_key" ON "sources"("provider", "externalId");
CREATE INDEX "sources_provider_idx" ON "sources"("provider");

-- AddForeignKey
ALTER TABLE "statistiques" ADD CONSTRAINT "statistiques_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "statistiques" ADD CONSTRAINT "statistiques_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "statistiques" ADD CONSTRAINT "statistiques_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "statistiques" ADD CONSTRAINT "statistiques_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "statistiques" ADD CONSTRAINT "statistiques_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "joueurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournois" ADD CONSTRAINT "tournois_jeuId_fkey" FOREIGN KEY ("jeuId") REFERENCES "jeux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tournois" ADD CONSTRAINT "tournois_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapes" ADD CONSTRAINT "etapes_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_parentMatchId_fkey" FOREIGN KEY ("parentMatchId") REFERENCES "matchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_equipeAId_fkey" FOREIGN KEY ("equipeAId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_equipeBId_fkey" FOREIGN KEY ("equipeBId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_equipeGagnanteId_fkey" FOREIGN KEY ("equipeGagnanteId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manches" ADD CONSTRAINT "manches_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manches" ADD CONSTRAINT "manches_equipeGagnanteId_fkey" FOREIGN KEY ("equipeGagnanteId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "joueurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses" ADD CONSTRAINT "reponses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_equipe_xor_joueur_check" CHECK (
    ("equipeId" IS NOT NULL AND "joueurId" IS NULL) OR
    ("equipeId" IS NULL AND "joueurId" IS NOT NULL)
);

ALTER TABLE "questions" ADD CONSTRAINT "questions_scope_check" CHECK (
    "tournoiId" IS NOT NULL OR "etapeId" IS NOT NULL OR "matchId" IS NOT NULL
);

-- AddForeignKey
ALTER TABLE "pronostics" ADD CONSTRAINT "pronostics_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pronostics" ADD CONSTRAINT "pronostics_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pronostics" ADD CONSTRAINT "pronostics_reponseId_fkey" FOREIGN KEY ("reponseId") REFERENCES "reponses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classements" ADD CONSTRAINT "classements_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "classements" ADD CONSTRAINT "classements_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "classements" ADD CONSTRAINT "classements_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
