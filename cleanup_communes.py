"""
Clean up commune names by removing bracket suffixes like [a], [b], etc.
This consolidates variants into their base commune names.
"""
import os
import re
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://martin:expensivewino@localhost:5432/bourgogne",
)


def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    # Find all variant communes
    cur.execute("SELECT DISTINCT commune FROM cru WHERE commune ~ '\\[.*\\]' ORDER BY commune")
    variant_communes = [r[0] for r in cur.fetchall()]

    print(f"Found {len(variant_communes)} commune variants to clean up:\n")

    updated = 0
    for variant in variant_communes:
        # Remove bracket suffix
        base = re.sub(r'\[.*\]$', '', variant)

        print(f"  {variant:35} → {base}")

        # Update all crus with this variant commune
        cur.execute(
            "UPDATE cru SET commune = %s WHERE commune = %s",
            (base, variant)
        )
        updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✓ Updated {updated} crus across {len(variant_communes)} commune variants")


if __name__ == "__main__":
    run()
