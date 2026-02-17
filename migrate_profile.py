import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

print("Adding profile columns to app_user table...")

# Add profile columns
columns_to_add = [
    ("nickname", "VARCHAR(100)"),
    ("bio", "TEXT"),
    ("mastodon_url", "VARCHAR(255)"),
    ("bluesky_url", "VARCHAR(255)"),
    ("vivino_url", "VARCHAR(255)"),
    ("cellartracker_url", "VARCHAR(255)"),
    ("delectable_url", "VARCHAR(255)"),
]

for column_name, column_type in columns_to_add:
    try:
        cur.execute(f"ALTER TABLE app_user ADD COLUMN IF NOT EXISTS {column_name} {column_type}")
        print(f"✓ Added {column_name} column")
    except Exception as e:
        print(f"⚠ Error adding {column_name}: {e}")

cur.close()
conn.close()
print("\n✅ Profile migration complete!")
