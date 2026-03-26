-- Enumerados

CREATE TYPE sponsor_type AS ENUM ('PUB', 'TEAM', 'OTHER');

CREATE TYPE pub_option AS ENUM (
    'LONA_3X0_8',
    'LONA_5X2_3',
    'OUTDOOR_2_8X1_3',
    'OUTDOOR_3_8X1_3',
    'OUTDOOR_3_8X1_8'
);

CREATE TYPE team_category AS ENUM (
    'SENIORES',
    'VETERANOS',
    'JUNIORES',
    'JUVENIS',
    'INICIADOS',
    'BENJAMINS_10',
    'BENJAMINS_9',
    'TRAQUINAS',
    'PETIZES',
    'FEMININO_FUT11',
    'FEMININO_FUT7_9'
);

CREATE TYPE equipment_placement AS ENUM ('FRENTE', 'COSTAS', 'MANGA', 'CALCAO');

CREATE TYPE other_sport AS ENUM ('PATINAGEM', 'VOLEIBOL', 'FUTEBOL_PRAIA', 'GOLF');

CREATE TYPE sponsorship_status AS ENUM ('SUBMETIDO', 'APROVADO', 'PAGO', 'ATIVO');

-- Tabelas

CREATE TABLE sponsor (
    sponsor_id  SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    nif         VARCHAR(9)   NOT NULL UNIQUE
);

CREATE TABLE sponsorship_package (
    sponsorship_package_id SERIAL PRIMARY KEY,
    type                   sponsor_type        NOT NULL,
    price                  DOUBLE PRECISION    NOT NULL,
    pub_option             pub_option,
    team_category          team_category,
    placement              equipment_placement,
    sport                  other_sport
);

CREATE TABLE sponsorship (
    sponsorship_id SERIAL PRIMARY KEY,
    sponsor_id     INT                NOT NULL REFERENCES sponsor(sponsor_id),
    season         VARCHAR(9)         NOT NULL,
    status         sponsorship_status NOT NULL DEFAULT 'SUBMETIDO'
);

CREATE TABLE sponsorship_package_selection (
    sponsorship_id         INT NOT NULL REFERENCES sponsorship(sponsorship_id),
    sponsorship_package_id INT NOT NULL REFERENCES sponsorship_package(sponsorship_package_id),
    PRIMARY KEY (sponsorship_id, sponsorship_package_id)
);
