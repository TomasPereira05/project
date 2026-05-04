drop schema jagoz cascade;
drop type if exists member_category cascade;
drop type if exists member_status cascade;
drop type if exists sponsor_type cascade;
drop type if exists pub_option cascade;
drop type if exists team_category cascade;
drop type if exists equipment_placement cascade;
drop type if exists other_sport cascade;
drop type if exists sponsorship_status cascade;
drop type if exists user_role cascade;
drop type if exists charge_type cascade;
drop type if exists charge_status cascade;
drop type if exists payment_status cascade;

create schema if not exists jagoz;
set search_path to jagoz;

CREATE TYPE member_category AS ENUM ('SOCIO', 'ATLETA_SOCIO');
CREATE TYPE member_status AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO', 'REJEITADO');

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

CREATE TYPE sponsorship_status AS ENUM ('SUBMETIDO', 'APROVADO', 'PAGO', 'ATIVO', 'CANCELADO');

CREATE TABLE member (
    member_id        SERIAL PRIMARY KEY,
    user_id          INT UNIQUE,
    member_number    INT UNIQUE,
    complete_name    VARCHAR(255) NOT NULL,
    birth_date       DATE NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(20) NOT NULL,
    home_phone       VARCHAR(20),
    address          VARCHAR(255) NOT NULL,
    postal_code      VARCHAR(20) NOT NULL,
    city             VARCHAR(255) NOT NULL,
    nif              VARCHAR(50) UNIQUE,
    category         member_category NOT NULL,
    status           member_status NOT NULL DEFAULT 'PENDENTE',
    former_member    BOOLEAN NOT NULL,
    membership_quota INT NOT NULL DEFAULT 150,
    billing_location VARCHAR(255),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approval_date    DATE,
    privacy_accepted BOOLEAN NOT NULL,
    coms_accepted    BOOLEAN NOT NULL
);



CREATE TABLE athlete (
    athlete_id       SERIAL PRIMARY KEY,
    member_id        INT NOT NULL UNIQUE REFERENCES member(member_id) ON DELETE CASCADE,
    nationality      VARCHAR(100) NOT NULL,
    niss             VARCHAR(50) NOT NULL UNIQUE,
    nif              VARCHAR(50) NOT NULL UNIQUE,
    numero_utente    VARCHAR(50) NOT NULL UNIQUE,
    bi               VARCHAR(50) NOT NULL UNIQUE,
    bi_expiration_date DATE NOT NULL,
    school           VARCHAR(255),
    school_year      VARCHAR(50),
    school_class     VARCHAR(50),
    last_club        VARCHAR(255),
    season           VARCHAR(50),
    team_category    team_category NOT NULL,
    active           BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE guardian (
    guardian_id SERIAL PRIMARY KEY,
    athlete_id  INT NOT NULL REFERENCES athlete(athlete_id) ON DELETE CASCADE,
    member_id   INT REFERENCES member(member_id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    kinship     VARCHAR(50) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    work        VARCHAR(255),
    has_family_in_club BOOLEAN NOT NULL
);

CREATE TABLE sponsor (
    sponsor_id  SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    nif         VARCHAR(9)   NOT NULL UNIQUE
);

CREATE TABLE sponsorship (
    sponsorship_id SERIAL PRIMARY KEY,
    sponsor_id     INT                NOT NULL REFERENCES sponsor(sponsor_id) ON DELETE CASCADE,
    season         VARCHAR(9)         NOT NULL,
    status         sponsorship_status NOT NULL DEFAULT 'SUBMETIDO',
    type           sponsor_type       NOT NULL,
    price          INT                NOT NULL,
    pub_option     pub_option,
    team_category  team_category,
    placement      equipment_placement,
    sport          other_sport,
    CONSTRAINT chk_sponsorship_type CHECK (
        (type = 'PUB' AND pub_option IS NOT NULL AND team_category IS NULL AND placement IS NULL AND sport IS NULL) OR
        (type = 'TEAM' AND team_category IS NOT NULL AND placement IS NOT NULL AND pub_option IS NULL AND sport IS NULL) OR
        (type = 'OTHER' AND sport IS NOT NULL AND pub_option IS NULL AND team_category IS NULL AND placement IS NULL)
    )
);

CREATE TYPE user_role AS ENUM ('ADMIN', 'SECRETARIA', 'NORMAL');
CREATE TYPE charge_type AS ENUM ('MEMBER_FEE', 'ATHLETE_MONTHLY_FEE', 'SPONSORSHIP_FEE');
CREATE TYPE charge_status AS ENUM ('PAID', 'PENDING', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_validation VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    active_member_id INT REFERENCES member(member_id) ON DELETE SET NULL
);

CREATE TABLE user_token (
    token_validation VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE event (
    event_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL
);

CREATE TABLE ticket (
    ticket_id SERIAL PRIMARY KEY,
    member_id INT REFERENCES member(member_id) ON DELETE SET NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    event_id INT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    price INT NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMPTZ
);

CREATE TABLE charge (
    charge_id SERIAL PRIMARY KEY,
    type charge_type NOT NULL,
    member_id INT REFERENCES member(member_id) ON DELETE CASCADE,
    sponsorship_id INT REFERENCES sponsorship(sponsorship_id) ON DELETE CASCADE,
    value INT NOT NULL,
    status charge_status NOT NULL DEFAULT 'PENDING',
    season VARCHAR(50),
    month INT,
    created_at DATE NOT NULL,
    creation_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    charged_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    paid_at DATE,
    CONSTRAINT chk_charge_target CHECK (
        (type IN ('MEMBER_FEE', 'ATHLETE_MONTHLY_FEE') AND member_id IS NOT NULL) OR
        (type = 'SPONSORSHIP_FEE' AND sponsorship_id IS NOT NULL)
    )
);

CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    charge_id INT NOT NULL REFERENCES charge(charge_id) ON DELETE CASCADE,
    amount INT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_ref VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ
);
