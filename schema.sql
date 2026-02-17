-------------------------------------------------
-- 1. Enable PostGIS
-------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-------------------------------------------------
-- 2. Users  (single-user for now, kept for future auth)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS app_user (
    id            SERIAL PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Default single user
INSERT INTO app_user (username, email, password_hash)
VALUES ('admin', 'admin@localhost', 'not-used')
ON CONFLICT DO NOTHING;

-------------------------------------------------
-- 3. Cru  (all Premier & Grand Crus)
-------------------------------------------------
CREATE TABLE IF NOT EXISTS cru (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('grand', 'premier')),
    region      TEXT NOT NULL DEFAULT 'Bourgogne',
    subregion   TEXT NOT NULL,     -- Côte de Nuits / Côte de Beaune / Chablis / etc.
    commune     TEXT NOT NULL,
    color       TEXT CHECK (color IN ('rouge', 'blanc', 'both', NULL)),
    latitude    DOUBLE PRECISION,  -- NULL when unknown
    longitude   DOUBLE PRECISION,  -- NULL when unknown
    soil_type   TEXT,
    elevation_m SMALLINT,
    aspect      TEXT,              -- e.g. "south-southeast"
    climate_notes TEXT,
    area_ha     DECIMAL(6,2),
    geom        GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
                    CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL
                    THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                    ELSE NULL END
                ) STORED,
    UNIQUE (name, commune)
);

CREATE INDEX IF NOT EXISTS idx_cru_geom ON cru USING GIST (geom) WHERE geom IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cru_type ON cru (type);
CREATE INDEX IF NOT EXISTS idx_cru_subregion ON cru (subregion);
CREATE INDEX IF NOT EXISTS idx_cru_commune ON cru (commune);

-------------------------------------------------
-- 4. Tasting notes
-- rating: -2 = disappointing, -1 = below expectations,
--          0 = as expected, +1 = above expectations, +2 = exceptional
-------------------------------------------------
CREATE TABLE IF NOT EXISTS tasting_note (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES app_user(id) ON DELETE CASCADE DEFAULT 1,
    cru_id      INTEGER REFERENCES cru(id) ON DELETE CASCADE NOT NULL,
    vintage     SMALLINT CHECK (vintage BETWEEN 1850 AND EXTRACT(YEAR FROM now())::INT + 5),
    tasted_on   DATE NOT NULL DEFAULT CURRENT_DATE,
    rating      SMALLINT CHECK (rating BETWEEN -2 AND 2),
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, cru_id, vintage, tasted_on)
);

CREATE INDEX IF NOT EXISTS idx_note_cru ON tasting_note (cru_id);
CREATE INDEX IF NOT EXISTS idx_note_user ON tasting_note (user_id);
