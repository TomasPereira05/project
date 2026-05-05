-- Test data for local development.
-- Auto-applied by Docker (docker-entrypoint-initdb.d) right after JagozSchema.sql.
-- Designed for a fresh DB: SERIAL ids start at 1 and the script assumes that.

-- =========================
-- OTHER SPORTS
-- =========================
INSERT INTO jagoz.other_sport (
    code, label, sort_order
) VALUES
    ('PATINAGEM', 'Patinagem',1),
    ('VOLEIBOL', 'Voleibol',2),
    ('FUTEBOL_PRAIA', 'Futebol de Praia',3),
    ('GOLF', 'Golf',4);

-- =========================
-- EQUIPMENT PLACEMENT OPTIONS
-- =========================
INSERT INTO jagoz.equipment_placement (
    code, label, sort_order
) VALUES
    ('COSTAS', 'Costas', 1),
    ('FRENTE', 'Frente',2),
    ('MANGA', 'Manga',3),
    ('CALCAO', 'Calção',4);

-- =========================
-- PUBLICITY OPTIONS
-- =========================
INSERT INTO jagoz.pub_option (
    code, label, sort_order
) VALUES
    ('LONA_3X0_8', 'Lona 3x0.8',1),
    ('LONA_5X2_3', 'Lona 5x2.3',2),
    ('OUTDOOR_2_8X1_3', 'Outdoor 2.8x1.3',3),
    ('OUTDOOR_3_8X1_3', 'Outdoor 3.8x1.3',4),
    ('OUTDOOR_3_8X1_8', 'Outdoor 3.8x1.8',5);

-- =========================
-- TEAM CATEGORIES
-- =========================
INSERT INTO jagoz.team_category (
    code, label, sort_order
) VALUES
    ('SENIORES', 'Seniores', 1),
    ('VETERANOS', 'Veteranos', 2),
    ('JUNIORES', 'Juniores', 3),
    ('JUVENIS', 'Juvenis', 4),
    ('INICIADOS', 'Iniciados', 5),
    ('BENJAMINS_10', 'Benjamins (10)', 6),
    ('BENJAMINS_9', 'Benjamins (9)', 7),
    ('TRAQUINAS', 'Traquinas', 8),
    ('PETIZES', 'Petizes', 9),
    ('FEMININO_FUT11', 'Feminino Futebol 11', 10),
    ('FEMININO_FUT7_9', 'Feminino Futebol 7/9', 11);


INSERT INTO jagoz.pub_option_price (pub_option_id, price)
SELECT pub_option_id,
       CASE code
           WHEN 'LONA_3X0_8' THEN 30000
           WHEN 'LONA_5X2_3' THEN 75000
           WHEN 'OUTDOOR_2_8X1_3' THEN 120000
           WHEN 'OUTDOOR_3_8X1_3' THEN 135000
           WHEN 'OUTDOOR_3_8X1_8' THEN 150000
           END
FROM jagoz.pub_option;

INSERT INTO jagoz.team_sponsorship_price (team_category_id, placement_id, price)
VALUES
    (1, 1, 200000), -- SENIORES COSTAS
    (1, 2, 350000), -- SENIORES FRENTE
    (1, 3, 35000), -- SENIORES MANGA
    (1, 4, 35000), -- SENIORES CALÇÃO
    (3, 1, 70000), -- JUNIORES COSTAS
    (3, 2, 90000), -- JUNIORES FRENTE
    (3, 3, 35000), -- JUNIORES MANGA
    (3, 4, 35000), -- JUNIORES CALÇÃO
    (6, 1, 45000), -- BENJAMINS_10 COSTAS
    (6, 2, 65000), -- BENJAMINS_10 FRENTE
    (6, 3, 35000), -- BENJAMINS_10 MANGA
    (6, 4, 35000); -- BENJAMINS_10 CALÇÃO

INSERT INTO jagoz.other_sport_price (sport_id, price)
SELECT sport_id,
       CASE code
           WHEN 'PATINAGEM' THEN 20000
           WHEN 'VOLEIBOL' THEN 25000
           WHEN 'FUTEBOL_PRAIA' THEN 30000
           WHEN 'GOLF' THEN 40000
           END
FROM jagoz.other_sport;

-- =========================
-- MEMBERS
-- =========================
INSERT INTO jagoz.member (
    member_number, complete_name, birth_date, email, phone, home_phone,
    address, postal_code, city,nif, category, status, former_member,
    membership_quota, billing_location, registration_date, approval_date,
    privacy_accepted, coms_accepted
) VALUES
    -- 1: SOCIO ativo (sem atleta)
    (1001, 'João Silva', '1985-03-12', 'joao.silva@example.pt', '912345001', NULL,
     'Rua das Flores 12', '2655-001', 'Ericeira','111111111','SOCIO', 'ATIVO', false,
     150, NULL, '2024-09-01', '2024-09-05', true, true),
    -- 2: SOCIO ativo (sem atleta)
    (1002, 'Ana Costa', '1990-07-22', 'ana.costa@example.pt', '912345002', NULL,
     'Avenida da Liberdade 88', '2640-002', 'Mafra','111111112', 'SOCIO', 'ATIVO', false,
     150, NULL, '2024-10-15', '2024-10-20', true, false),

    -- 3: ATLETA_SOCIO (Tiago, INICIADOS)
    (1003, 'Tiago Rocha', '2010-05-18', 'tiago.rocha@example.pt', '912345003', '261860003',
     'Travessa do Mar 5', '2655-101', 'Ericeira','111111113',  'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2024-08-20', '2024-08-25', true, true),
    -- 4: ATLETA_SOCIO (Mariana, JUNIORES)
    (1004, 'Mariana Santos', '2007-11-03', 'mariana.santos@example.pt', '912345004', NULL,
     'Rua do Sol 23', '2640-104', 'Mafra', '111111114', 'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2024-09-10', '2024-09-12', true, true),
    -- 5: ATLETA_SOCIO (Rui, SENIORES)
    (1005, 'Rui Mendes', '1997-02-14', 'rui.mendes@example.pt', '912345005', NULL,
     'Praceta das Hortênsias 7', '1000-105', 'Lisboa', '111111115', 'ATLETA_SOCIO', 'ATIVO', true,
     0, NULL, '2023-08-15', '2023-08-18', true, true),
    -- 6: ATLETA_SOCIO (Sofia, BENJAMINS_10)
    (1006, 'Sofia Carvalho', '2013-09-30', 'sofia.carvalho@example.pt', '912345006', '261860006',
     'Rua dos Pescadores 14', '2655-201', 'Ericeira','111111116',  'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2024-09-05', '2024-09-08', true, true),
    -- 7: ATLETA_SOCIO (Diogo, VETERANOS)
    (1007, 'Diogo Pereira', '1985-06-25', 'diogo.pereira@example.pt', '912345007', NULL,
     'Avenida 25 de Abril 102', '2640-207', 'Mafra','111111117',  'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2024-09-01', '2024-09-04', true, true),

    -- 8: PENDENTE (admin pode aprovar)
    (NULL, 'Rita Lopes', '1995-12-08', 'rita.lopes@example.pt', '912345008', NULL,
     'Rua dos Lírios 3', '1500-008', 'Lisboa','111111118',  'SOCIO', 'PENDENTE', false,
     150, NULL, '2026-04-25', NULL, true, false),
    -- 9: PENDENTE (admin pode aprovar)
    (NULL, 'Carlos Marques', '1988-04-17', 'carlos.marques@example.pt', '912345009', NULL,
     'Travessa do Castelo 9', '2710-009', 'Sintra','111111119',  'SOCIO', 'PENDENTE', false,
     150, NULL, '2026-04-28', NULL, true, true);

-- =========================
-- USERS (active_member_id refers to the rows inserted above)
-- =========================
INSERT INTO jagoz.users(
    email, username, password_validation, role, active_member_id
) VALUES
    ('tomascorreiapereira@gmail.com', 'tomas', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'ADMIN', 1);

-- =========================
-- ATHLETES (member_id refers to the rows inserted above, in order 3..7)
-- =========================
INSERT INTO jagoz.athlete (
    member_id, nationality, niss, nif, numero_utente, bi, bi_expiration_date,
    school, school_year, school_class, last_club, season, team_category_id, active
) VALUES
      (
          3, 'Portuguesa', '11122233301', '210000301', '300003001', 'CC30001', '2030-05-01',
          'Escola EB 2,3 Ericeira', '9.º ano', 'A', NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'INICIADOS'),
          true
      ),
      (
          4, 'Portuguesa', '11122233302', '210000302', '300003002', 'CC30002', '2031-08-15',
          'Escola Secundária de Mafra', '12.º ano', 'B', 'GD Mafra', '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'JUNIORES'),
          true
      ),
      (
          5, 'Portuguesa', '11122233303', '210000303', '300003003', 'CC30003', '2029-01-20',
          NULL, NULL, NULL, 'CF Os Belenenses', '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'SENIORES'),
          true
      ),
      (
          6, 'Portuguesa', '11122233304', '210000304', '300003004', 'CC30004', '2032-03-10',
          'Escola Básica da Ericeira', '5.º ano', 'A', NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'BENJAMINS_10'),
          true
      ),
      (
          7, 'Portuguesa', '11122233305', '210000305', '300003005', 'CC30005', '2028-11-05',
          NULL, NULL, NULL, NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'VETERANOS'),
          true
      );

-- =========================
-- GUARDIANS (apenas para atletas menores)
-- =========================
INSERT INTO jagoz.guardian (
    athlete_id, member_id, name, kinship, email, phone, work, has_family_in_club
) VALUES
    -- Tiago (athlete 1) -> pai
    (1, NULL, 'Manuel Rocha', 'Pai', 'manuel.rocha@example.pt', '912000001',
     'Engenheiro civil', false),
    -- Sofia (athlete 4) -> mãe
    (4, NULL, 'Helena Carvalho', 'Mãe', 'helena.carvalho@example.pt', '912000002',
     'Professora', false);