-- Test data for local development.
-- Auto-applied by Docker (docker-entrypoint-initdb.d) right after JagozSchema.sql.
-- Designed for a fresh DB: SERIAL ids start at 1 and the script assumes that.

-- =========================
-- OTHER SPORTS
-- =========================
INSERT INTO jagoz.other_sport (
    code, label, price, sort_order
) VALUES
    ('PATINAGEM', 'Patinagem', 20000, 1),
    ('VOLEIBOL', 'Voleibol', 25000, 2),
    ('FUTEBOL_PRAIA', 'Futebol de Praia', 30000, 3),
    ('GOLF', 'Golf', 40000, 4);

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
    code, label, available, free, occupied, price, sort_order
) VALUES
    ('LONA_3X0_8', 'Lona 3mx0.8m', 37, 32, 5, 30000, 1),
    ('LONA_5X2_3', 'Lona 5mx2.3m', 10, 10, 0, 75000, 2),
    ('LONA_3_80X1_3', 'Lona 3.8mx1.3m', 6, 5, 1, 60000, 3),
    ('OUTDOOR_2_8X1_3', 'Outdoor 2.8mx1.3m', 12, 10, 2, 120000, 4),
    ('OUTDOOR_3_8X1_3', 'Outdoor 3.8mx1.3m', 4, 4, 0, 135000, 5),
    ('OUTDOOR_3_8X1_8', 'Outdoor 3.8mx1.8m', 4, 3, 1, 150000, 6);

-- =========================
-- TEAM CATEGORIES
-- =========================
INSERT INTO jagoz.team_group (
    code, label, sort_order
) VALUES
    ('FUT11', 'Fut 11', 1),
    ('FUT9', 'Fut 9', 2),
    ('FUT7', 'Fut 7', 3),
    ('OUTROS', 'Outros', 4);

INSERT INTO jagoz.team_category (
    team_group_id, code, label, sort_order
) VALUES
    (1,'SENIORES', 'Seniores',1),
    (4,'VETERANOS', 'Veteranos',2),
    (1,'JUNIORES', 'Juniores',3),
    (1,'JUVENISA', 'Juvenis A',4),
    (1,'JUVENISB', 'Juvenis B',5),
    (1,'INICIADOSC', 'Iniciados C',6),
    (1,'INICIADOSC1', 'Iniciados C1',7),
    (2,'INFANTISA', 'INFANTIS A',8),
    (2,'INFANTISB', 'INFANTIS B',9),
    (3,'BENJAMINS_10', 'Benjamins (10)',10),
    (3,'BENJAMINS_9', 'Benjamins (9)',11),
    (4,'TRAQUINAS', 'Traquinas',12),
    (4,'PETIZES', 'Petizes',13),
    (4,'FEMININO_FUT11', 'Feminino Futebol 11',14),
    (4,'FEMININO_FUT7_9', 'Feminino Futebol 7/9',15);

INSERT INTO jagoz.team_group_price (
    team_group_id, placement_id, price
) VALUES
    (1, 1, 70000),
    (1, 2, 90000),
    (1, 3, 35000),
    (1, 4, 35000),

    (2, 1, 45000),
    (2, 2, 65000),
    (2, 3, 35000),
    (2, 4, 35000),

    (3, 1, 45000),
    (3, 2, 65000),
    (3, 3, 35000),
    (3, 4, 35000);

INSERT INTO jagoz.team_category_price_override (
    team_category_id, placement_id, price
) VALUES
(1, 1, 200000),
(1, 2, 350000),
(1, 3, 35000),
(1, 4, 35000);

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
    (1001, 'Tomás', '1985-03-12', 'tomas@example.pt', '912345001', NULL,
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
     150, NULL, '2026-04-28', NULL, true, true),
    -- 10: SOCIO inativo
    (1008, 'Joao Ferreira', '1978-01-09', 'joao.ferreira@example.pt', '912345010', NULL,
     'Rua da Fonte 18', '2655-010', 'Ericeira', '111111120', 'SOCIO', 'INATIVO', true,
     150, 'Ericeira', '2022-03-10', '2022-03-12', true, false),
    -- 11: SOCIO rejeitado
    (NULL, 'Beatriz Sousa', '1999-08-19', 'beatriz.sousa@example.pt', '912345011', NULL,
     'Rua Nova 41', '2640-011', 'Mafra', '111111121', 'SOCIO', 'REJEITADO', false,
     150, NULL, '2026-03-15', NULL, true, false),
    -- 12: ATLETA_SOCIO ativo (INFANTIS B)
    (1009, 'Pedro Almeida', '2012-02-02', 'pedro.almeida@example.pt', '912345012', '261860012',
     'Rua das Escolas 6', '2655-012', 'Ericeira', '111111122', 'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2024-08-28', '2024-09-02', true, true),
    -- 13: ATLETA_SOCIO pendente (FEMININO FUT11)
    (NULL, 'Lara Nunes', '2009-10-21', 'lara.nunes@example.pt', '912345013', NULL,
     'Largo da Igreja 2', '2640-013', 'Mafra', '111111123', 'ATLETA_SOCIO', 'PENDENTE', false,
     0, NULL, '2026-05-02', NULL, true, true),
    -- 14: ATLETA_SOCIO inativo (JUVENIS B)
    (1010, 'Miguel Baptista', '2008-06-04', 'miguel.baptista@example.pt', '912345014', NULL,
     'Rua do Campo 27', '2655-014', 'Ericeira', '111111124', 'ATLETA_SOCIO', 'INATIVO', false,
     0, NULL, '2023-09-03', '2023-09-06', true, false),
    -- 15: ATLETA_SOCIO ativo (FEMININO FUT7/9)
    (1011, 'Carolina Esteves', '2006-12-30', 'carolina.esteves@example.pt', '912345015', NULL,
     'Avenida do Parque 55', '2640-015', 'Mafra', '111111125', 'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2024-09-11', '2024-09-13', true, true),
    -- 16: SOCIO ativo com quota diferente
    (1012, 'Manuel Antunes', '1965-05-14', 'manuel.antunes@example.pt', '912345016', '261860016',
     'Rua Principal 100', '2655-016', 'Ericeira', '111111126', 'SOCIO', 'ATIVO', true,
     200, 'Mafra', '2021-01-20', '2021-01-22', true, true),
    -- 17: SOCIO pendente com quota reduzida
    (NULL, 'Ines Ramos', '1993-03-27', 'ines.ramos@example.pt', '912345017', NULL,
     'Travessa da Serra 4', '2710-017', 'Sintra', '111111127', 'SOCIO', 'PENDENTE', false,
     100, NULL, '2026-05-07', NULL, true, false),
    -- 18: ATLETA_SOCIO ativo (PETIZES)
    (1013, 'Gustavo Martins', '2017-04-18', 'gustavo.martins@example.pt', '912345018', '261860018',
     'Rua do Norte 15', '2655-018', 'Ericeira', '111111128', 'ATLETA_SOCIO', 'ATIVO', false,
     0, NULL, '2025-09-01', '2025-09-03', true, true);

-- =========================
-- USERS (active_member_id refers to the rows inserted above)
-- =========================
INSERT INTO jagoz.users(
    email, username, password_validation, role, active_member_id
) VALUES
    ('tomascorreiapereira@gmail.com', 'tomas', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'ADMIN', 1),
    ('secretaria@example.pt', 'tomas22', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'SECRETARIA', NULL),
    ('ana.costa@example.pt', 'ana.costa', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 2),
    ('tiago.rocha@example.pt', 'tiago.rocha', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 3),
    ('mariana.santos@example.pt', 'mariana.santos', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 4),
    ('rita.lopes@example.pt', 'rita.lopes', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 8),
    ('joao.ferreira@example.pt', 'joao.ferreira', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 10),
    ('pedro.almeida@example.pt', 'pedro.almeida', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 12),
    ('lara.nunes@example.pt', 'lara.nunes', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 13),
    ('carolina.esteves@example.pt', 'carolina.esteves', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', 15),
    ('sponsor.atlantico@example.pt', 'sponsor.atlantico', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', NULL),
    ('sponsor.mira@example.pt', 'sponsor.mira', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', NULL),
    ('sponsor.prado@example.pt', 'sponsor.prado', '$2a$10$2.1kuBavH7H4jf0dGC2URuBktUoiXilzo4z.rqGBwyi.ZMtboJ.9y', 'NORMAL', NULL);

UPDATE jagoz.member AS m
SET user_id = u.user_id
FROM jagoz.users AS u
WHERE u.active_member_id = m.member_id;

-- =========================
-- ATHLETES (member_id refers to the rows inserted above, in order 3..7)
-- =========================
INSERT INTO jagoz.athlete (
    member_id, nationality, niss, numero_utente, bi, bi_expiration_date,
    school, school_year, school_class, last_club, season, team_category_id, active
) VALUES
      (
          3, 'Portuguesa', '11122233301', '300003001', 'CC30001', '2030-05-01',
          'Escola EB 2,3 Ericeira', '9.º ano', 'A', NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'INICIADOSC'),
          true
      ),
      (
          4, 'Portuguesa', '11122233302', '300003002', 'CC30002', '2031-08-15',
          'Escola Secundária de Mafra', '12.º ano', 'B', 'GD Mafra', '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'JUNIORES'),
          true
      ),
      (
          5, 'Portuguesa', '11122233303', '300003003', 'CC30003', '2029-01-20',
          NULL, NULL, NULL, 'CF Os Belenenses', '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'SENIORES'),
          true
      ),
      (
          6, 'Portuguesa', '11122233304', '300003004', 'CC30004', '2032-03-10',
          'Escola Básica da Ericeira', '5.º ano', 'A', NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'BENJAMINS_10'),
          true
      ),
      (
          7, 'Portuguesa', '11122233305', '300003005', 'CC30005', '2028-11-05',
          NULL, NULL, NULL, NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'VETERANOS'),
          true
      ),
      (
          12, 'Portuguesa', '11122233306', '300003006', 'CC30006', '2032-07-19',
          'Escola EB 2,3 Ericeira', '7. ano', 'C', NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'INFANTISB'),
          true
      ),
      (
          13, 'Portuguesa', '11122233307', '300003007', 'CC30007', '2031-09-11',
          'Escola Secundaria de Mafra', '10. ano', 'A', 'SU Sintrense', '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'FEMININO_FUT11'),
          false
      ),
      (
          14, 'Portuguesa', '11122233308', '300003008', 'CC30008', '2030-02-22',
          'Escola Secundaria de Mafra', '11. ano', 'D', 'GD Estoril Praia', '2024/2025',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'JUVENISB'),
          false
      ),
      (
          15, 'Portuguesa', '11122233309', '300003009', 'CC30009', '2032-12-01',
          NULL, NULL, NULL, 'AD Oeiras', '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'FEMININO_FUT7_9'),
          true
      ),
      (
          18, 'Portuguesa', '11122233310', '300003010', 'CC30010', '2034-04-18',
          'Jardim Escola da Ericeira', '3. ano', 'B', NULL, '2025/2026',
          (SELECT team_category_id FROM jagoz.team_category WHERE code = 'PETIZES'),
          true
      );

-- =========================
-- GUARDIANS (apenas para atletas menores)
-- =========================
INSERT INTO jagoz.guardian (
    athlete_id, member_id, name, role, kinship, email, phone, professional_activity, contact_phone
) VALUES
    -- Tiago (athlete 1) -> pai
    (1, NULL, 'Manuel Rocha', 'FATHER', NULL, 'manuel.rocha@example.pt', '912000001',
     'Engenheiro civil', NULL),
    -- Sofia (athlete 4) -> mãe
    (4, NULL, 'Helena Carvalho', 'MOTHER', NULL, 'helena.carvalho@example.pt', '912000002',
     'Professora', NULL),
    -- Pedro (athlete 6) -> mae
    (6, NULL, 'Patricia Almeida', 'MOTHER', NULL, 'patricia.almeida@example.pt', '912000003',
     'Contabilista', NULL),
    -- Lara (athlete 7) -> pai
    (7, NULL, 'Nuno Nunes', 'FATHER', NULL, 'nuno.nunes@example.pt', '912000004',
     'Tecnico de informatica', NULL),
    -- Miguel (athlete 8) -> encarregado legal
    (8, NULL, 'Teresa Batista', 'LEGAL_GUARDIAN', 'Tia', 'teresa.batista@example.pt', '912000005',
     'Enfermeira', '912000105'),
    -- Gustavo (athlete 10) -> mae
    (10, NULL, 'Raquel Martins', 'MOTHER', NULL, 'raquel.martins@example.pt', '912000006',
     'Designer', NULL),
    -- Gustavo (athlete 10) -> pai
    (10, NULL, 'Andre Martins', 'FATHER', NULL, 'andre.martins@example.pt', '912000007',
     'Eletricista', NULL);

-- =========================
-- SPONSORS
-- =========================
INSERT INTO jagoz.sponsor (
    user_id, name, email, phone, nif
) VALUES
    ((SELECT user_id FROM jagoz.users WHERE username = 'sponsor.atlantico'),
     'Atlantico Cafe', 'geral@atlanticocafe.pt', '211000001', '222333441'),
    ((SELECT user_id FROM jagoz.users WHERE username = 'sponsor.mira'),
     'Mira Surf School', 'info@mirasurf.pt', '211000002', '222333442'),
    ((SELECT user_id FROM jagoz.users WHERE username = 'sponsor.prado'),
     'Prado Seguros', 'contacto@pradoseguros.pt', '211000003', '222333443'),
    (NULL, 'Oficina Central Mafra', 'oficina@centralmafra.pt', '211000004', '222333444'),
    (NULL, 'Restaurante Mar Azul', 'reservas@marazul.pt', '211000005', '222333445'),
    (NULL, 'Clinica Boa Forma', 'geral@clinicaboaforma.pt', '211000006', '222333446'),
    (NULL, 'Mercado Fresco Local', 'geral@mercadofresco.pt', '211000007', '222333447');

-- =========================
-- SPONSORSHIPS
-- =========================
INSERT INTO jagoz.sponsorship (
    sponsor_id, season, status, type, price,
    pub_option_id, team_category_id, placement_id, sport_id, other_details
) VALUES
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333441'),
        '2025/2026', 'APROVADO', 'PUB', 30000,
        (SELECT pub_option_id FROM jagoz.pub_option WHERE code = 'LONA_3X0_8'),
        NULL, NULL, NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333442'),
        '2025/2026', 'PAGO', 'TEAM', 65000,
        NULL,
        (SELECT team_category_id FROM jagoz.team_category WHERE code = 'INFANTISA'),
        (SELECT placement_id FROM jagoz.equipment_placement WHERE code = 'FRENTE'),
        NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333443'),
        '2025/2026', 'SUBMETIDO', 'OTHER', 25000,
        NULL, NULL, NULL,
        (SELECT sport_id FROM jagoz.other_sport WHERE code = 'VOLEIBOL'),
        'Apoio ao torneio de voleibol de praia'
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333444'),
        '2025/2026', 'ATIVO', 'TEAM', 35000,
        NULL,
        (SELECT team_category_id FROM jagoz.team_category WHERE code = 'JUNIORES'),
        (SELECT placement_id FROM jagoz.equipment_placement WHERE code = 'MANGA'),
        NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333445'),
        '2024/2025', 'CANCELADO', 'PUB', 75000,
        (SELECT pub_option_id FROM jagoz.pub_option WHERE code = 'LONA_5X2_3'),
        NULL, NULL, NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333446'),
        '2025/2026', 'APROVADO', 'OTHER', 20000,
        NULL, NULL, NULL,
        (SELECT sport_id FROM jagoz.other_sport WHERE code = 'PATINAGEM'),
        'Presenca da marca no evento de patinagem'
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333447'),
        '2025/2026', 'SUBMETIDO', 'TEAM', 45000,
        NULL,
        (SELECT team_category_id FROM jagoz.team_category WHERE code = 'BENJAMINS_9'),
        (SELECT placement_id FROM jagoz.equipment_placement WHERE code = 'COSTAS'),
        NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333441'),
        '2024/2025', 'PAGO', 'PUB', 120000,
        (SELECT pub_option_id FROM jagoz.pub_option WHERE code = 'OUTDOOR_2_8X1_3'),
        NULL, NULL, NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333442'),
        '2025/2026', 'APROVADO', 'TEAM', 35000,
        NULL,
        (SELECT team_category_id FROM jagoz.team_category WHERE code = 'SENIORES'),
        (SELECT placement_id FROM jagoz.equipment_placement WHERE code = 'CALCAO'),
        NULL, NULL
    ),
    (
        (SELECT sponsor_id FROM jagoz.sponsor WHERE nif = '222333443'),
        '2025/2026', 'SUBMETIDO', 'PUB', 60000,
        (SELECT pub_option_id FROM jagoz.pub_option WHERE code = 'LONA_3_80X1_3'),
        NULL, NULL, NULL, NULL
    );
