-- Test data for local development.
-- Auto-applied by Docker (docker-entrypoint-initdb.d) right after JagozSchema.sql.
-- Designed for a fresh DB: SERIAL ids start at 1 and the script assumes that.

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
-- ATHLETES (member_id refers to the rows inserted above, in order 3..7)
-- =========================
INSERT INTO jagoz.athlete (
    member_id, nationality, niss, nif, numero_utente, bi, bi_expiration_date,
    school, school_year, school_class, last_club, season, team_category, active
) VALUES
    -- athlete 1 -> Tiago (member 3, INICIADOS)
    (3, 'Portuguesa', '11122233301', '210000301', '300003001', 'CC30001', '2030-05-01',
     'Escola EB 2,3 Ericeira', '9.º ano', 'A', NULL, '2025/2026', 'INICIADOS', true),
    -- athlete 2 -> Mariana (member 4, JUNIORES)
    (4, 'Portuguesa', '11122233302', '210000302', '300003002', 'CC30002', '2031-08-15',
     'Escola Secundária de Mafra', '12.º ano', 'B', 'GD Mafra', '2025/2026', 'JUNIORES', true),
    -- athlete 3 -> Rui (member 5, SENIORES)
    (5, 'Portuguesa', '11122233303', '210000303', '300003003', 'CC30003', '2029-01-20',
     NULL, NULL, NULL, 'CF Os Belenenses', '2025/2026', 'SENIORES', true),
    -- athlete 4 -> Sofia (member 6, BENJAMINS_10)
    (6, 'Portuguesa', '11122233304', '210000304', '300003004', 'CC30004', '2032-03-10',
     'Escola Básica da Ericeira', '5.º ano', 'A', NULL, '2025/2026', 'BENJAMINS_10', true),
    -- athlete 5 -> Diogo (member 7, VETERANOS)
    (7, 'Portuguesa', '11122233305', '210000305', '300003005', 'CC30005', '2028-11-05',
     NULL, NULL, NULL, NULL, '2025/2026', 'VETERANOS', true);


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
