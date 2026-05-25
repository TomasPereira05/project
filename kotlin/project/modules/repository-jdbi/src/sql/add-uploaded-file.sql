CREATE TYPE jagoz.file_owner_type AS ENUM ('USER', 'MEMBER', 'ATHLETE');

CREATE TYPE jagoz.file_kind AS ENUM (
    'USER_PROFILE_PHOTO',
    'MEMBER_PHOTO',
    'ATHLETE_PHOTO',
    'ATHLETE_ID_CARD',
    'ATHLETE_MEDICAL_EXAM'
);

CREATE TABLE jagoz.uploaded_file (
    file_id SERIAL PRIMARY KEY,
    owner_type jagoz.file_owner_type NOT NULL,
    owner_id INT NOT NULL,
    kind jagoz.file_kind NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    size BIGINT NOT NULL,
    storage_key VARCHAR(700) UNIQUE NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL,
    uploaded_by INT REFERENCES jagoz.users(user_id) ON DELETE SET NULL
);

CREATE INDEX uploaded_file_owner_idx ON jagoz.uploaded_file(owner_type, owner_id, kind, uploaded_at DESC);
