-- Exécuter sur une base isolée après application de la migration.
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
INSERT INTO "classements_etape" ("id", "etapeId", "inscriptionId", "rang", "details", "updatedAt")
VALUES ('classement', 'etape', 'inscription', 1, '{"victoires": 3, "buchholz": 7}', now());
INSERT INTO "tournois" ("id", "jeuId", "nom", "slug", "lieu", "visibilite", "modeParticipant", "modePronostic", "tailleEquipeMin", "tailleEquipeMax", "updatedAt")
VALUES ('equipe', 'jeu', 'Équipe', 'equipe', 'EN_LIGNE', 'PUBLIQUE', 'EQUIPE', 'MATCH', 2, 2, now());
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
    RAISE EXCEPTION 'question sans portée acceptée';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "questions" ("id", "tournoiId", "matchId", "modele", "intitule", "configResolution", "ouvertAt", "fermeAt", "updatedAt")
    VALUES ('invalid-scope', 'tournoi', 'initial', 'MODELE_PERSONNALISE', 'X', '{}', now(), now(), now());
    RAISE EXCEPTION 'question avec plusieurs portées acceptée';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "reponses_pickem" SET "reponseId" = 'r2' WHERE "id" = 'pick1';
    RAISE EXCEPTION 'réponse issue d''une autre question acceptée';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    UPDATE "reponses_pickem" SET "valeur" = '3' WHERE "id" = 'pick1';
    RAISE EXCEPTION 'deux formes de réponse acceptées';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "manche_resultats" ("id", "mancheId", "matchId", "participantId", "updatedAt")
    VALUES ('invalid-resultat', 'manche', 'initial', 'autre', now());
    RAISE EXCEPTION 'participant issu d''un autre match accepté';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "classements_pronostiqueurs" ("id", "utilisateurId", "rang", "updatedAt")
    VALUES ('general-duplicate', 'user', 2, now());
    RAISE EXCEPTION 'classement général en double accepté';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "statistique_valeurs" ("id", "mancheId", "definitionId", "valeur", "updatedAt")
    VALUES ('duplicate-stat', 'manche', 'definition', '6', now());
    RAISE EXCEPTION 'statistique en double acceptée';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "statistique_valeurs" ("id", "mancheId", "definitionId", "inscriptionId", "joueurId", "valeur", "updatedAt")
    VALUES ('duplicate-stat-membre', 'manche', 'definition', 'inscription', 'joueur', '6', now());
    RAISE EXCEPTION 'statistique de membre en double acceptée';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO "pronostic_participants" ("id", "pronosticId", "matchOrigineId", "resultatOrigine", "slot", "placement", "updatedAt")
    VALUES ('second-winner', 'pronostic', 'initial', 'PERDANT', 2, 1, now());
    RAISE EXCEPTION 'vainqueur en double accepté';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    UPDATE "matchs" SET "slotSuivantVainqueur" = NULL WHERE "id" = 'initial';
    RAISE EXCEPTION 'destination d''arbre incomplète acceptée';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    DELETE FROM "reponses" WHERE "id" = 'r1';
    RAISE EXCEPTION 'réponse utilisée supprimée';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    UPDATE "tournois" SET "tailleEquipeMin" = NULL WHERE "id" = 'equipe';
    RAISE EXCEPTION 'taille minimale manquante acceptée';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "tournois" SET "tailleEquipeMax" = NULL WHERE "id" = 'equipe';
    RAISE EXCEPTION 'taille maximale manquante acceptée';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "tournois" SET "tailleEquipeMin" = 3, "tailleEquipeMax" = 2 WHERE "id" = 'equipe';
    RAISE EXCEPTION 'bornes de taille inversées acceptées';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "tournois" SET "tailleEquipeMin" = 3, "tailleEquipeMax" = 2 WHERE "id" = 'tournoi';
    RAISE EXCEPTION 'bornes de taille inversées acceptées en solo';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE "matchs" SET "bestOf" = 0 WHERE "id" = 'initial';
    RAISE EXCEPTION 'bestOf inférieur à un accepté';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT "details"->>'buchholz' FROM "classements_etape" WHERE "id" = 'classement') <> '7' THEN
    RAISE EXCEPTION 'détails de départage incorrects';
  END IF;
END $$;

DELETE FROM "matchs" WHERE "id" = 'question-match';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "questions" WHERE "id" IN ('q1', 'q2'))
    OR EXISTS (SELECT 1 FROM "reponses_pickem" WHERE "id" IN ('pick1', 'pick2')) THEN
    RAISE EXCEPTION 'suppression en cascade des questions du match échouée';
  END IF;
END $$;

DELETE FROM "tournois" WHERE "id" = 'tournoi';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "matchs" WHERE "etapeId" = 'etape') THEN
    RAISE EXCEPTION 'suppression en cascade du tournoi échouée';
  END IF;
END $$;

ROLLBACK;
