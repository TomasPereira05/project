drop schema if exists jagoz cascade;
drop type if exists member_category cascade;
drop type if exists member_status cascade;
drop type if exists sponsor_type cascade;
drop type if exists sponsorship_status cascade;
drop type if exists user_role cascade;
drop type if exists charge_type cascade;
drop type if exists charge_status cascade;
drop type if exists payment_status cascade;
drop type if exists guardian_role cascade;
drop type if exists file_owner_type cascade;
drop type if exists file_kind cascade;
drop type if exists event_status cascade;
drop type if exists ticket_status cascade;
drop type if exists ticket_price_type cascade;

create schema if not exists jagoz;
set search_path to jagoz;

CREATE TYPE member_category AS ENUM ('SOCIO', 'ATLETA_SOCIO');
CREATE TYPE member_status AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO', 'REJEITADO');

CREATE TYPE sponsor_type AS ENUM ('PUB', 'TEAM', 'OTHER');

CREATE TYPE sponsorship_status AS ENUM ('SUBMETIDO', 'APROVADO', 'PAGO', 'ATIVO', 'CANCELADO');

CREATE TYPE guardian_role AS ENUM ('FATHER', 'MOTHER', 'LEGAL_GUARDIAN');

CREATE TABLE member (
    member_id        SERIAL PRIMARY KEY,
    user_id          INT UNIQUE,
    member_number    INT UNIQUE,
    complete_name    VARCHAR(255) NOT NULL,
    birth_date       DATE NOT NULL,
    birthplace       VARCHAR(255),
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

CREATE TABLE team_group (
    team_group_id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT
);

CREATE TABLE team_category (
    team_category_id SERIAL PRIMARY KEY,
    team_group_id INT NOT NULL REFERENCES team_group(team_group_id),
    code VARCHAR(50) UNIQUE NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE club_season (
    season_id SERIAL PRIMARY KEY,
    name VARCHAR(9) UNIQUE NOT NULL,
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT chk_club_season_name CHECK (name ~ '^[0-9]{4}/[0-9]{4}$'),
    CONSTRAINT chk_club_season_dates CHECK (starts_at < ends_at)
);

CREATE UNIQUE INDEX club_season_single_active_idx
    ON club_season (active)
    WHERE active = true;

CREATE TABLE training_schedule (
    training_schedule_id SERIAL PRIMARY KEY,
    team_category_id INT NOT NULL REFERENCES team_category(team_category_id) ON DELETE CASCADE,
    season VARCHAR(9) NOT NULL,
    weekday INT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    field_name VARCHAR(120) NOT NULL,
    field_zone VARCHAR(120),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,

    CONSTRAINT chk_training_schedule_time_format CHECK (
        start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        AND start_time < end_time
    )
);

CREATE INDEX training_schedule_week_idx
    ON training_schedule (season, active, weekday, start_time);

CREATE TABLE athlete (
    athlete_id       SERIAL PRIMARY KEY,
    member_id        INT NOT NULL UNIQUE REFERENCES member(member_id) ON DELETE CASCADE,
    nationality      VARCHAR(100) NOT NULL,
    niss             VARCHAR(50) NOT NULL UNIQUE,
    numero_utente    VARCHAR(50) NOT NULL UNIQUE,
    bi               VARCHAR(50) NOT NULL UNIQUE,
    bi_expiration_date DATE NOT NULL,
    school           VARCHAR(255),
    school_year      VARCHAR(50),
    school_class     VARCHAR(50),
    last_club        VARCHAR(255),
    season           VARCHAR(50),
    team_category_id INT REFERENCES team_category(team_category_id),
    jersey_number    INT,
    position         VARCHAR(50),
    photo_url        VARCHAR(500),
    has_family_in_club BOOLEAN NOT NULL DEFAULT false,
    school_certification_accepted BOOLEAN NOT NULL DEFAULT false,
    active           BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE guardian (
    guardian_id SERIAL PRIMARY KEY,
    member_id   INT REFERENCES member(member_id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    role        guardian_role NOT NULL,
    kinship     VARCHAR(50),
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    professional_activity VARCHAR(255),
    contact_phone VARCHAR(20),

    CONSTRAINT chk_guardian_role_fields CHECK (
        (role = 'LEGAL_GUARDIAN'
            AND kinship IS NOT NULL
            AND contact_phone IS NOT NULL
            )
            OR
        (role IN ('FATHER', 'MOTHER')
            AND kinship IS NULL
            AND contact_phone IS NULL
            )
        )
);

-- Associação N:N entre encarregados de educação e atletas.
-- Permite que o mesmo guardian (ex.: um pai sócio) fique ligado a vários filhos atletas.
CREATE TABLE guardian_athlete (
    guardian_id INT NOT NULL REFERENCES guardian(guardian_id) ON DELETE CASCADE,
    athlete_id  INT NOT NULL REFERENCES athlete(athlete_id)  ON DELETE CASCADE,
    PRIMARY KEY (guardian_id, athlete_id)
);

CREATE TABLE other_sport (
    sport_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    price INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE equipment_placement (
    placement_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE pub_option (
    pub_option_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    available INT NOT NULL DEFAULT 0,
    free INT NOT NULL DEFAULT 0,
    occupied INT NOT NULL DEFAULT 0,
    price INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,

    CONSTRAINT chk_pub_option_capacity CHECK (
        available >= 0
        AND free >= 0
        AND occupied >= 0
        AND free + occupied <= available
    )
);

CREATE TABLE team_group_price (
    id SERIAL PRIMARY KEY,
    team_group_id INT NOT NULL REFERENCES team_group(team_group_id),
    placement_id INT NOT NULL REFERENCES equipment_placement(placement_id),
    price INT NOT NULL,

    UNIQUE (team_group_id, placement_id)
);

CREATE TABLE team_category_price_override (
    id SERIAL PRIMARY KEY,
    team_category_id INT NOT NULL REFERENCES team_category(team_category_id),
    placement_id INT NOT NULL REFERENCES equipment_placement(placement_id),
    price INT NOT NULL,

    UNIQUE (team_category_id, placement_id)
);

CREATE TABLE sponsor (
    sponsor_id  SERIAL PRIMARY KEY,
    user_id     INT,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    nif         VARCHAR(9)   NOT NULL UNIQUE
);

CREATE TABLE sponsorship (
    sponsorship_id SERIAL PRIMARY KEY,
    sponsor_id INT NOT NULL REFERENCES sponsor(sponsor_id) ON DELETE CASCADE,

    season VARCHAR(9) NOT NULL,
    status sponsorship_status NOT NULL DEFAULT 'SUBMETIDO',
    type sponsor_type NOT NULL,
    price INT NOT NULL,

    pub_option_id INT REFERENCES pub_option(pub_option_id),
    team_category_id INT REFERENCES team_category(team_category_id),
    placement_id INT REFERENCES equipment_placement(placement_id),
    sport_id INT REFERENCES other_sport(sport_id),
    other_details TEXT,

    CONSTRAINT chk_sponsorship_type CHECK (
        (type = 'PUB'
        AND pub_option_id IS NOT NULL
        AND team_category_id IS NULL
        AND placement_id IS NULL
        AND sport_id IS NULL
        AND other_details IS NULL
        )
        OR
        (type = 'TEAM'
        AND team_category_id IS NOT NULL
        AND placement_id IS NOT NULL
        AND pub_option_id IS NULL
        AND sport_id IS NULL
        AND other_details IS NULL
        )
        OR
        (type = 'OTHER'
        AND sport_id IS NOT NULL
        AND pub_option_id IS NULL
        AND team_category_id IS NULL
        AND placement_id IS NULL
        AND other_details IS NOT NULL
        AND length(trim(other_details)) > 0
        )
    )
);

CREATE TYPE user_role AS ENUM ('ADMIN', 'SECRETARIA', 'NORMAL');
CREATE TYPE charge_type AS ENUM ('MEMBER_FEE', 'ATHLETE_MONTHLY_FEE', 'SPONSORSHIP_FEE', 'TICKET_PURCHASE');
CREATE TYPE charge_status AS ENUM ('PAID', 'PENDING', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');
CREATE TYPE event_status AS ENUM ('SCHEDULED', 'CANCELLED');
CREATE TYPE ticket_status AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED', 'USED');
CREATE TYPE ticket_price_type AS ENUM ('NORMAL', 'MEMBER');
CREATE TYPE file_owner_type AS ENUM ('USER', 'MEMBER', 'ATHLETE');
CREATE TYPE file_kind AS ENUM (
    'USER_PROFILE_PHOTO',
    'MEMBER_PHOTO',
    'ATHLETE_PHOTO',
    'ATHLETE_ID_CARD',
    'ATHLETE_MEDICAL_EXAM'
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_validation VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    active_member_id INT REFERENCES member(member_id) ON DELETE SET NULL
);

ALTER TABLE sponsor
    ADD CONSTRAINT sponsor_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Atletas geridos por uma conta de user (encarregado de educação a gerir os filhos).
-- É o que alimenta a secção "Os Meus Atletas" do perfil e autoriza o pagamento da quota.
-- A inscrição do próprio user como atleta usa member.user_id, não esta tabela.
CREATE TABLE user_athlete (
    user_id    INT NOT NULL REFERENCES users(user_id)   ON DELETE CASCADE,
    athlete_id INT NOT NULL REFERENCES athlete(athlete_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, athlete_id)
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
    starts_at TIMESTAMPTZ NOT NULL,
    location VARCHAR(255) NOT NULL,
    status event_status NOT NULL DEFAULT 'SCHEDULED',
    price_normal INT NOT NULL DEFAULT 0,
    price_member INT NOT NULL DEFAULT 0,
    -- price_member <= price_normal intencional (preços iguais / eventos gratuitos permitidos; frontend avisa quando iguais)
    CONSTRAINT chk_event_prices CHECK (price_normal >= 0 AND price_member >= 0 AND price_member <= price_normal)
);

CREATE TABLE event_sector (
    sector_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity >= 0),
    occupied INT NOT NULL DEFAULT 0 CHECK (occupied >= 0),
    CONSTRAINT chk_sector_capacity CHECK (occupied <= capacity),
    UNIQUE (event_id, name)
);

-- (tabela ticket definida depois de charge, por causa da FK charge_id)

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
    creation_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    charged_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    paid_at DATE,
    CONSTRAINT chk_charge_target CHECK (
        (type IN ('MEMBER_FEE', 'ATHLETE_MONTHLY_FEE') AND member_id IS NOT NULL) OR
        (type = 'SPONSORSHIP_FEE' AND sponsorship_id IS NOT NULL) OR
        (type = 'TICKET_PURCHASE')
    )
);

CREATE TABLE ticket (
    ticket_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
    sector_id INT NOT NULL REFERENCES event_sector(sector_id),
    charge_id INT REFERENCES charge(charge_id) ON DELETE SET NULL,
    member_id INT REFERENCES member(member_id) ON DELETE SET NULL,
    member_number INT,
    price_type ticket_price_type NOT NULL DEFAULT 'NORMAL',
    price INT NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    status ticket_status NOT NULL DEFAULT 'RESERVED',
    qr_code VARCHAR(255) UNIQUE,
    used_at TIMESTAMPTZ,
    -- decisão #3: bilhete MEMBER tem sempre member_id (faz o índice parcial cobrir compras anónimas)
    CONSTRAINT chk_ticket_member_consistency CHECK (
        (price_type = 'MEMBER' AND member_id IS NOT NULL) OR price_type = 'NORMAL'
    )
);

-- decisão #6: 1 bilhete-sócio ativo por sócio por evento
CREATE UNIQUE INDEX uq_ticket_member_event ON ticket (event_id, member_id)
    WHERE price_type = 'MEMBER' AND status <> 'CANCELLED';
CREATE INDEX ticket_event_idx ON ticket (event_id);
CREATE INDEX ticket_charge_idx ON ticket (charge_id);

CREATE TABLE charge_item (
    charge_item_id SERIAL PRIMARY KEY,
    charge_id INT NOT NULL REFERENCES charge(charge_id) ON DELETE CASCADE,
    season VARCHAR(50) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    amount INT NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,

    UNIQUE (charge_id, season, month)
);

CREATE TABLE email_notification_log (
    email_notification_log_id SERIAL PRIMARY KEY,
    notification_type VARCHAR(80) NOT NULL,
    member_id INT NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
    charge_id INT REFERENCES charge(charge_id) ON DELETE SET NULL,
    charge_type charge_type NOT NULL,
    season VARCHAR(50) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX email_notification_log_lookup_idx
    ON email_notification_log (notification_type, member_id, charge_type, season, month, sent_at DESC);

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

CREATE TABLE uploaded_file (
    file_id SERIAL PRIMARY KEY,
    owner_type file_owner_type NOT NULL,
    owner_id INT NOT NULL,
    kind file_kind NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    size BIGINT NOT NULL,
    storage_key VARCHAR(700) UNIQUE NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL,
    uploaded_by INT REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX uploaded_file_owner_idx ON uploaded_file(owner_type, owner_id, kind, uploaded_at DESC);
