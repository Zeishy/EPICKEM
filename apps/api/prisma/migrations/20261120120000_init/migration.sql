-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'UTILISATEUR');

-- CreateEnum
CREATE TYPE "TournoiFormat" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'GROUP_STAGE', 'SWISS', 'FFA');

-- CreateEnum
CREATE TYPE "TournoiStatut" AS ENUM ('DRAFT', 'UPCOMING', 'LIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TournoiLieu" AS ENUM ('EN_LIGNE', 'PRESENTIEL', 'MIXTE');

-- CreateEnum
CREATE TYPE "TournoiVisibilite" AS ENUM ('PUBLIQUE', 'INVITATION');

-- CreateEnum
CREATE TYPE "ModeParticipant" AS ENUM ('SOLO', 'EQUIPE');

-- CreateEnum
CREATE TYPE "ModePronostic" AS ENUM ('MATCH', 'ARBRE', 'LES_DEUX');

-- CreateEnum
CREATE TYPE "EtapeType" AS ENUM ('QUALIFICATION', 'GROUP_STAGE', 'PLAYOFF', 'GRAND_FINAL');

-- CreateEnum
CREATE TYPE "EtapeStatut" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BracketCote" AS ENUM ('WINNER', 'LOSER', 'GRAND_FINAL');

-- CreateEnum
CREATE TYPE "ResultatOrigine" AS ENUM ('VAINQUEUR', 'PERDANT');

-- CreateEnum
CREATE TYPE "MatchStatut" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'FORFEIT', 'DISQUALIFIED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InscriptionStatut" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MembreRole" AS ENUM ('TITULAIRE', 'REMPLACANT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MATCH_WINNER', 'SCORE_EXACT', 'BONUS', 'CHOIX', 'NOMBRE', 'CLASSEMENT');

-- CreateEnum
CREATE TYPE "QuestionStatut" AS ENUM ('OUVERTE', 'FERMEE', 'RESOLUE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "PronosticStatut" AS ENUM ('SUBMITTED', 'LOCKED', 'SCORED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SourceProvider" AS ENUM ('START_GG', 'FILE_IMPORT', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatistiqueType" AS ENUM ('LISTE', 'ENTIER', 'BOOLEEN', 'JOUEUR');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'UTILISATEUR',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jeux" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "editeur" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jeux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistique_definitions" (
    "id" TEXT NOT NULL,
    "jeuId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "StatistiqueType" NOT NULL,
    "options" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "statistique_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistique_valeurs" (
    "id" TEXT NOT NULL,
    "mancheId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "joueurId" TEXT,
    "valeur" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "statistique_valeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournois" (
    "id" TEXT NOT NULL,
    "jeuId" TEXT NOT NULL,
    "sourceId" TEXT,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lieu" "TournoiLieu" NOT NULL,
    "visibilite" "TournoiVisibilite" NOT NULL,
    "description" TEXT,
    "reglement" TEXT,
    "modeParticipant" "ModeParticipant" NOT NULL,
    "tailleEquipeMin" INTEGER,
    "tailleEquipeMax" INTEGER,
    "modePronostic" "ModePronostic" NOT NULL,
    "statut" "TournoiStatut" NOT NULL DEFAULT 'DRAFT',
    "commenceAt" TIMESTAMPTZ(3),
    "termineAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tournois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapes" (
    "id" TEXT NOT NULL,
    "tournoiId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "type" "EtapeType" NOT NULL,
    "format" "TournoiFormat" NOT NULL,
    "config" JSONB NOT NULL,
    "modePronostic" "ModePronostic",
    "statut" "EtapeStatut" NOT NULL DEFAULT 'UPCOMING',
    "commenceAt" TIMESTAMPTZ(3),
    "termineAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "etapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matchs" (
    "id" TEXT NOT NULL,
    "etapeId" TEXT NOT NULL,
    "sourceId" TEXT,
    "matchSuivantVainqueurId" TEXT,
    "slotSuivantVainqueur" INTEGER,
    "matchSuivantPerdantId" TEXT,
    "slotSuivantPerdant" INTEGER,
    "ordre" INTEGER NOT NULL,
    "tour" INTEGER NOT NULL,
    "bracket" "BracketCote",
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "statut" "MatchStatut" NOT NULL DEFAULT 'SCHEDULED',
    "dureeEstimee" INTEGER,
    "emplacement" TEXT,
    "commenceAt" TIMESTAMPTZ(3),
    "termineAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "matchs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_participants" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "slot" INTEGER NOT NULL,
    "score" INTEGER,
    "placement" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manches" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "joueAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "manches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manche_resultats" (
    "id" TEXT NOT NULL,
    "mancheId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "score" INTEGER,
    "placement" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "manche_resultats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipes" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "nom" TEXT NOT NULL,
    "tag" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "joueurs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "utilisateurId" TEXT,
    "equipeId" TEXT,
    "pseudo" TEXT NOT NULL,
    "nomAffiche" TEXT,
    "role" TEXT,
    "nationalite" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

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
    "inscritAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInAt" TIMESTAMPTZ(3),
    "champsPersonnalises" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscription_membres" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "joueurId" TEXT NOT NULL,
    "role" "MembreRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inscription_membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "tournoiId" TEXT,
    "etapeId" TEXT,
    "matchId" TEXT,
    "type" "QuestionType" NOT NULL,
    "statut" "QuestionStatut" NOT NULL DEFAULT 'OUVERTE',
    "intitule" TEXT NOT NULL,
    "configResolution" JSONB NOT NULL,
    "pointsBase" INTEGER NOT NULL DEFAULT 0,
    "ouvertAt" TIMESTAMPTZ(3) NOT NULL,
    "fermeAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "estCorrecte" BOOLEAN,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses_pickem" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reponseId" TEXT,
    "valeur" JSONB,
    "statut" "PronosticStatut" NOT NULL DEFAULT 'SUBMITTED',
    "pointsObtenus" INTEGER NOT NULL DEFAULT 0,
    "soumisAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evalueAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reponses_pickem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronostics" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "statut" "PronosticStatut" NOT NULL DEFAULT 'SUBMITTED',
    "pointsObtenus" INTEGER NOT NULL DEFAULT 0,
    "soumisAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evalueAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pronostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronostic_participants" (
    "id" TEXT NOT NULL,
    "pronosticId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "matchOrigineId" TEXT,
    "resultatOrigine" "ResultatOrigine",
    "slot" INTEGER NOT NULL,
    "score" INTEGER,
    "placement" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pronostic_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classements_etape" (
    "id" TEXT NOT NULL,
    "etapeId" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rang" INTEGER NOT NULL,
    "calculeAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "classements_etape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classements_pronostiqueurs" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "tournoiId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rang" INTEGER NOT NULL,
    "calculeAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "classements_pronostiqueurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "provider" "SourceProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT,
    "payload" JSONB,
    "synchroniseAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_pseudo_key" ON "utilisateurs"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jeux_slug_key" ON "jeux"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "statistique_definitions_jeuId_cle_key" ON "statistique_definitions"("jeuId", "cle");

-- CreateIndex
CREATE INDEX "statistique_valeurs_mancheId_definitionId_idx" ON "statistique_valeurs"("mancheId", "definitionId");

-- CreateIndex
CREATE INDEX "statistique_valeurs_definitionId_idx" ON "statistique_valeurs"("definitionId");

-- CreateIndex
CREATE INDEX "statistique_valeurs_inscriptionId_idx" ON "statistique_valeurs"("inscriptionId");

-- CreateIndex
CREATE INDEX "statistique_valeurs_joueurId_idx" ON "statistique_valeurs"("joueurId");

-- CreateIndex
CREATE UNIQUE INDEX "tournois_sourceId_key" ON "tournois"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "tournois_slug_key" ON "tournois"("slug");

-- CreateIndex
CREATE INDEX "tournois_jeuId_idx" ON "tournois"("jeuId");

-- CreateIndex
CREATE UNIQUE INDEX "etapes_tournoiId_ordre_key" ON "etapes"("tournoiId", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "matchs_sourceId_key" ON "matchs"("sourceId");

-- CreateIndex
CREATE INDEX "matchs_matchSuivantVainqueurId_idx" ON "matchs"("matchSuivantVainqueurId");

-- CreateIndex
CREATE INDEX "matchs_matchSuivantPerdantId_idx" ON "matchs"("matchSuivantPerdantId");

-- CreateIndex
CREATE UNIQUE INDEX "matchs_etapeId_ordre_key" ON "matchs"("etapeId", "ordre");

-- CreateIndex
CREATE INDEX "match_participants_inscriptionId_idx" ON "match_participants"("inscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_matchId_slot_key" ON "match_participants"("matchId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_matchId_inscriptionId_key" ON "match_participants"("matchId", "inscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_id_matchId_key" ON "match_participants"("id", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "manches_matchId_numero_key" ON "manches"("matchId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "manches_id_matchId_key" ON "manches"("id", "matchId");

-- CreateIndex
CREATE INDEX "manche_resultats_participantId_idx" ON "manche_resultats"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "manche_resultats_mancheId_participantId_key" ON "manche_resultats"("mancheId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "equipes_sourceId_key" ON "equipes"("sourceId");

-- CreateIndex
CREATE INDEX "equipes_nom_idx" ON "equipes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "joueurs_sourceId_key" ON "joueurs"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "joueurs_utilisateurId_key" ON "joueurs"("utilisateurId");

-- CreateIndex
CREATE INDEX "joueurs_equipeId_idx" ON "joueurs"("equipeId");

-- CreateIndex
CREATE INDEX "joueurs_pseudo_idx" ON "joueurs"("pseudo");

-- CreateIndex
CREATE INDEX "inscriptions_equipeId_idx" ON "inscriptions"("equipeId");

-- CreateIndex
CREATE INDEX "inscriptions_joueurId_idx" ON "inscriptions"("joueurId");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_tournoiId_equipeId_key" ON "inscriptions"("tournoiId", "equipeId");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_tournoiId_joueurId_key" ON "inscriptions"("tournoiId", "joueurId");

-- CreateIndex
CREATE INDEX "inscription_membres_joueurId_idx" ON "inscription_membres"("joueurId");

-- CreateIndex
CREATE UNIQUE INDEX "inscription_membres_inscriptionId_joueurId_key" ON "inscription_membres"("inscriptionId", "joueurId");

-- CreateIndex
CREATE INDEX "questions_tournoiId_idx" ON "questions"("tournoiId");

-- CreateIndex
CREATE INDEX "questions_etapeId_idx" ON "questions"("etapeId");

-- CreateIndex
CREATE INDEX "questions_matchId_idx" ON "questions"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "reponses_questionId_code_key" ON "reponses"("questionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "reponses_id_questionId_key" ON "reponses"("id", "questionId");

-- CreateIndex
CREATE INDEX "reponses_pickem_questionId_idx" ON "reponses_pickem"("questionId");

-- CreateIndex
CREATE INDEX "reponses_pickem_reponseId_questionId_idx" ON "reponses_pickem"("reponseId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "reponses_pickem_utilisateurId_questionId_key" ON "reponses_pickem"("utilisateurId", "questionId");

-- CreateIndex
CREATE INDEX "pronostics_matchId_idx" ON "pronostics"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "pronostics_utilisateurId_matchId_key" ON "pronostics"("utilisateurId", "matchId");

-- CreateIndex
CREATE INDEX "pronostic_participants_inscriptionId_idx" ON "pronostic_participants"("inscriptionId");

-- CreateIndex
CREATE INDEX "pronostic_participants_matchOrigineId_idx" ON "pronostic_participants"("matchOrigineId");

-- CreateIndex
CREATE UNIQUE INDEX "pronostic_participants_pronosticId_slot_key" ON "pronostic_participants"("pronosticId", "slot");

-- CreateIndex
CREATE INDEX "classements_etape_etapeId_rang_idx" ON "classements_etape"("etapeId", "rang");

-- CreateIndex
CREATE INDEX "classements_etape_inscriptionId_idx" ON "classements_etape"("inscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "classements_etape_etapeId_inscriptionId_key" ON "classements_etape"("etapeId", "inscriptionId");

-- CreateIndex
CREATE INDEX "classements_pronostiqueurs_tournoiId_rang_idx" ON "classements_pronostiqueurs"("tournoiId", "rang");

-- CreateIndex
CREATE INDEX "classements_pronostiqueurs_utilisateurId_idx" ON "classements_pronostiqueurs"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "classements_pronostiqueurs_tournoiId_utilisateurId_key" ON "classements_pronostiqueurs"("tournoiId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "sources_provider_externalId_key" ON "sources"("provider", "externalId");

-- AddForeignKey
ALTER TABLE "statistique_definitions" ADD CONSTRAINT "statistique_definitions_jeuId_fkey" FOREIGN KEY ("jeuId") REFERENCES "jeux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistique_valeurs" ADD CONSTRAINT "statistique_valeurs_mancheId_fkey" FOREIGN KEY ("mancheId") REFERENCES "manches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistique_valeurs" ADD CONSTRAINT "statistique_valeurs_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "statistique_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistique_valeurs" ADD CONSTRAINT "statistique_valeurs_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistique_valeurs" ADD CONSTRAINT "statistique_valeurs_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "joueurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournois" ADD CONSTRAINT "tournois_jeuId_fkey" FOREIGN KEY ("jeuId") REFERENCES "jeux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournois" ADD CONSTRAINT "tournois_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapes" ADD CONSTRAINT "etapes_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_matchSuivantVainqueurId_fkey" FOREIGN KEY ("matchSuivantVainqueurId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matchs" ADD CONSTRAINT "matchs_matchSuivantPerdantId_fkey" FOREIGN KEY ("matchSuivantPerdantId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manches" ADD CONSTRAINT "manches_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manche_resultats" ADD CONSTRAINT "manche_resultats_mancheId_matchId_fkey" FOREIGN KEY ("mancheId", "matchId") REFERENCES "manches"("id", "matchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manche_resultats" ADD CONSTRAINT "manche_resultats_participantId_matchId_fkey" FOREIGN KEY ("participantId", "matchId") REFERENCES "match_participants"("id", "matchId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "joueurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscription_membres" ADD CONSTRAINT "inscription_membres_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscription_membres" ADD CONSTRAINT "inscription_membres_joueurId_fkey" FOREIGN KEY ("joueurId") REFERENCES "joueurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses" ADD CONSTRAINT "reponses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_pickem" ADD CONSTRAINT "reponses_pickem_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_pickem" ADD CONSTRAINT "reponses_pickem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_pickem" ADD CONSTRAINT "reponses_pickem_reponseId_questionId_fkey" FOREIGN KEY ("reponseId", "questionId") REFERENCES "reponses"("id", "questionId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronostics" ADD CONSTRAINT "pronostics_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronostics" ADD CONSTRAINT "pronostics_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronostic_participants" ADD CONSTRAINT "pronostic_participants_pronosticId_fkey" FOREIGN KEY ("pronosticId") REFERENCES "pronostics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronostic_participants" ADD CONSTRAINT "pronostic_participants_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronostic_participants" ADD CONSTRAINT "pronostic_participants_matchOrigineId_fkey" FOREIGN KEY ("matchOrigineId") REFERENCES "matchs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classements_etape" ADD CONSTRAINT "classements_etape_etapeId_fkey" FOREIGN KEY ("etapeId") REFERENCES "etapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classements_etape" ADD CONSTRAINT "classements_etape_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classements_pronostiqueurs" ADD CONSTRAINT "classements_pronostiqueurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classements_pronostiqueurs" ADD CONSTRAINT "classements_pronostiqueurs_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "tournois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostgreSQL constraints not expressible in Prisma.
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_equipe_xor_joueur_check"
    CHECK (num_nonnulls("equipeId", "joueurId") = 1);

ALTER TABLE "questions" ADD CONSTRAINT "questions_scope_check"
    CHECK (num_nonnulls("tournoiId", "etapeId", "matchId") = 1);

ALTER TABLE "reponses_pickem" ADD CONSTRAINT "reponses_pickem_choix_check"
    CHECK (num_nonnulls("reponseId", "valeur") = 1);

ALTER TABLE "matchs" ADD CONSTRAINT "matchs_suivants_check" CHECK (
    (("matchSuivantVainqueurId" IS NULL) = ("slotSuivantVainqueur" IS NULL)) AND
    (("matchSuivantPerdantId" IS NULL) = ("slotSuivantPerdant" IS NULL))
);

ALTER TABLE "pronostic_participants" ADD CONSTRAINT "pronostic_participants_origine_check" CHECK (
    ("inscriptionId" IS NOT NULL AND "matchOrigineId" IS NULL AND "resultatOrigine" IS NULL) OR
    ("inscriptionId" IS NULL AND "matchOrigineId" IS NOT NULL AND "resultatOrigine" IS NOT NULL)
);

CREATE UNIQUE INDEX "pronostic_participants_vainqueur_key"
    ON "pronostic_participants"("pronosticId") WHERE "placement" = 1;

CREATE UNIQUE INDEX "classements_pronostiqueurs_general_key"
    ON "classements_pronostiqueurs"("utilisateurId") WHERE "tournoiId" IS NULL;

CREATE UNIQUE INDEX "statistique_valeurs_generale_key"
    ON "statistique_valeurs"("mancheId", "definitionId")
    WHERE "inscriptionId" IS NULL AND "joueurId" IS NULL;
CREATE UNIQUE INDEX "statistique_valeurs_inscription_key"
    ON "statistique_valeurs"("mancheId", "definitionId", "inscriptionId")
    WHERE "inscriptionId" IS NOT NULL AND "joueurId" IS NULL;
CREATE UNIQUE INDEX "statistique_valeurs_joueur_key"
    ON "statistique_valeurs"("mancheId", "definitionId", "joueurId")
    WHERE "inscriptionId" IS NULL AND "joueurId" IS NOT NULL;
CREATE UNIQUE INDEX "statistique_valeurs_membre_key"
    ON "statistique_valeurs"("mancheId", "definitionId", "inscriptionId", "joueurId")
    WHERE "inscriptionId" IS NOT NULL AND "joueurId" IS NOT NULL;
