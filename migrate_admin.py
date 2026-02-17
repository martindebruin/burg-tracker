import os
import psycopg2
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

# Add column
cur.execute("ALTER TABLE app_user ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE")
print("✓ Added is_admin column")

# Set admin password (change 'admin123' to something secure!)
admin_password = input("Enter password for admin user (user ID 1): ")
if len(admin_password) < 8:
    print("❌ Password must be at least 8 characters")
    exit(1)

hashed = pwd_context.hash(admin_password)
cur.execute(
    "UPDATE app_user SET password_hash = %s, is_admin = TRUE WHERE id = 1",
    (hashed,)
)
print("✓ Updated admin user with password and admin privileges")

cur.close()
conn.close()
print("\n✅ Migration complete!")
