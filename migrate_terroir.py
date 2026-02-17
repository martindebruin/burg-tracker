"""
Idempotent migration: add terroir columns to existing cru table.
Run once against the live DB after pulling this change.

Usage:
    python migrate_terroir.py
Or via Docker:
    docker compose --profile migrate run --rm migrate
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is required. "
        "Copy .env.example to .env and configure your credentials."
    )


def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    columns = [
        ("soil_type",     "TEXT"),
        ("elevation_m",   "SMALLINT"),
        ("aspect",        "TEXT"),
        ("climate_notes", "TEXT"),
        ("area_ha",       "DECIMAL(6,2)"),
    ]

    for col, col_type in columns:
        cur.execute(
            f"ALTER TABLE cru ADD COLUMN IF NOT EXISTS {col} {col_type}"
        )
        print(f"  column {col} ({col_type}) — ok")

    cur.close()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    run()
