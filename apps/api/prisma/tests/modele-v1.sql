-- Run against an isolated database after applying the migration.
BEGIN;

INSERT INTO "utilisateurs" ("id", "pseudo", "email", "motDePasseHash", "updatedAt")
VALUES ('user', 'spectateur', 'spectateur@example.test', 'hash', now());
INSERT INTO "jeux" ("id", "slug", "nom", "updatedAt") VALUES ('jeu', 'jeu', 'Jeu', now());
INSERT INTO "tournois" ("id", "jeuId", "nom", "slug", "lieu", "visibilite", "modeParticipant", "modePronostic", "updatedAt")
VALUES ('tournoi', 'jeu', 'Tournoi', 'tournoi', 'EN_LIGNE', 'PUBLIQUE', 'SOLO', 'LES_DEUX', now());
INSERT INTO "etapes" ("id", "tournoiId", "nom", "ordre", "type", "format", "config", "updatedAt")
VALUES ('etape', 'tournoi', 'Etape', 1, 'PLAYOFF', 'DOUBLE_ELIMINATION', '{}', now());
INSERT INTO "joueurs" ("id", "pseudo", "updatedAt") VALUES ('joueur', 'competiteur', now());
INSERT INTO "inscriptions" ("id", "tournoiId", "joueurId", "updatedAt")
VALUES ('inscription', 'tournoi', 'joueur', now());
INSERT INTO "matchs" ("id", "etapeId", "ordre", "tour", "updatedAt")
VALUES ('winner', 'etape', 1, 2, now()), ('loser', 'etape', 2, 2, now()), ('initial', 'etape', 3, 1, now()),
       ('question-match', 'etape', 4, 1, now());
UPDATE "matchs" SET "matchSuivantVainqueurId" = 'winner', "slotSuivantVainqueur" = 1,
  "matchSuivantPerdantId" = 'loser', "slotSuivantPerdant" = 1 WHERE "id" = 'initial';
INSERT INTO "match_participants" ("id", "matchId", "slot", "updatedAt")
VALUES ('p1', 'initial', 1, now()), ('p2', 'initial', 2, now()), ('p3', 'initial', 3, now()),
       ('autre', 'winner', 1, now());
INSERT INTO "manches" ("id", "matchId", "numero", "updatedAt") VALUES ('manche', 'initial', 1, now());
INSERT INTO "manche_resultats" ("id", "mancheId", "matchId", "participantId", "placement", "updatedAt")
VALUES ('resultat', 'manche', 'initial', 'p3', 1, now());
INSERT INTO "pronostics" ("id", "utilisateurId", "matchId", "updatedAt")
VALUES ('pronostic', 'user', 'winner', now());
INSERT INTO "pronostic_participants" ("id", "pronosticId", "matchOrigineId", "resultatOrigine", "slot", "placement", "updatedAt")
VALUES ('prediction', 'pronostic', 'initial', 'VAINQUEUR', 1, 1, now());
INSERT INTO "questions" ("id", "matchId", "modele", "intitule", "configResolution", "ouvertAt", "fermeAt", "updatedAt")
VALUES ('q1', 'question-match', 'MODELE_PERSONNALISE', 'Question 1', '{}', now(), now(), now()),
       ('q2', 'question-match', 'CLASSEMENT', 'Question 2', '{}', now(), now(), now());
INSERT INTO "reponses" ("id", "questionId", "code", "libelle", "updatedAt")
VALUES ('r1', 'q1', 'A', 'A', now()), ('r2', 'q2', 'B', 'B', now());
INSERT INTO "reponses_pickem" ("id", "utilisateurId", "questionId", "reponseId", "updatedAt")
VALUES ('pick1', 'user', 'q1', 'r1', now());
INSERT INTO "reponses_pickem" ("id", "utilisateurId", "questionId", "valeur", "updatedAt")
VALUES ('pick2', 'user', 'q2', '[1,2,3]', now());
INSERT INTO "classements_pronostiqueurs" ("id", "utilisateurId", "rang", "updatedAt")
VALUES ('general', 'user', 1, now());
INSERT INTO "statistique_definitions" ("id", "jeuId", "cle", "libelle", "type", "updatedAt")
VALUES ('definition', 'jeu', 'points', 'Points', 'ENTIER', now());
INSERT INTO "statistique_valeurs" ("id", "mancheId", "definitionId", "valeur", "updatedAt")
VALUES ('stat', 'manche', 'definition', '5', now());
INSERT INTO "statistique_valeurs" ("id", "mancheId", "definitionId", "inscriptionId", "joueurId", "valeur", "updatedAt")
VALUES ('stat-membre', 'manche', 'definition', 'inscription', 'joueur', '4', now());

DO $$
BEGIN
  BEGIN
    INSERT INTO "questions" ("id", "modele", "intitule", "configResolution", "ouvertAt", "fermeAt", "updatedAt")
    VALUES ('no-scope', 'MODELE_PERSONNALISE', 'X', '{}', now(), now(), now());
    RAISE EXCEPTION 'question without scope accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "questions" ("id", "tournoiId", "matchId", "modele", "intitule", "configResolution", "ouvertAt", "fermeAt", "updatedAt")
    VALUES ('invalid-scope', 'tournoi', 'initial', 'MODELE_PERSONNALISE', 'X', '{}', now(), now(), now());
    RAISE EXCEPTION 'question with multiple scopes accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "reponses_pickem" SET "reponseId" = 'r2' WHERE "id" = 'pick1';
    RAISE EXCEPTION 'answer from another question accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    UPDATE "reponses_pickem" SET "valeur" = '3' WHERE "id" = 'pick1';
    RAISE EXCEPTION 'two answer forms accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "manche_resultats" ("id", "mancheId", "matchId", "participantId", "updatedAt")
    VALUES ('invalid-resultat', 'manche', 'initial', 'autre', now());
    RAISE EXCEPTION 'participant from another match accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "classements_pronostiqueurs" ("id", "utilisateurId", "rang", "updatedAt")
    VALUES ('general-duplicate', 'user', 2, now());
    RAISE EXCEPTION 'duplicate general ranking accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "statistique_valeurs" ("id", "mancheId", "definitionId", "valeur", "updatedAt")
    VALUES ('duplicate-stat', 'manche', 'definition', '6', now());
    RAISE EXCEPTION 'duplicate statistic accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "statistique_valeurs" ("id", "mancheId", "definitionId", "inscriptionId", "joueurId", "valeur", "updatedAt")
    VALUES ('duplicate-stat-membre', 'manche', 'definition', 'inscription', 'joueur', '6', now());
    RAISE EXCEPTION 'duplicate member statistic accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "pronostic_participants" ("id", "pronosticId", "matchOrigineId", "resultatOrigine", "slot", "placement", "updatedAt")
    VALUES ('second-winner', 'pronostic', 'initial', 'PERDANT', 2, 1, now());
    RAISE EXCEPTION 'duplicate winner accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    UPDATE "matchs" SET "slotSuivantVainqueur" = NULL WHERE "id" = 'initial';
    RAISE EXCEPTION 'partial bracket destination accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    DELETE FROM "reponses" WHERE "id" = 'r1';
    RAISE EXCEPTION 'used answer deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

DELETE FROM "matchs" WHERE "id" = 'question-match';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "questions" WHERE "id" IN ('q1', 'q2'))
    OR EXISTS (SELECT 1 FROM "reponses_pickem" WHERE "id" IN ('pick1', 'pick2')) THEN
    RAISE EXCEPTION 'match question cascade failed';
  END IF;
END $$;

DELETE FROM "tournois" WHERE "id" = 'tournoi';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "matchs" WHERE "etapeId" = 'etape') THEN
    RAISE EXCEPTION 'tournament cascade failed';
  END IF;
END $$;

ROLLBACK;
