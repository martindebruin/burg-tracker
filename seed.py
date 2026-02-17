#!/usr/bin/env python3
"""
Seed the bourgogne database with all Premier and Grand Crus.

Sources:
  - Premier Crus: recherche_produit.csv  (official INAO/bourgogne-wines data)
  - Grand Crus:   Wikipedia list (en.wikipedia.org/wiki/List_of_Burgundy_Grands_Crus)

Run after applying schema.sql:
  python seed.py
"""

import csv
import os
import re
import time
import psycopg2
import requests
from bs4 import BeautifulSoup

# Support both DATABASE_URL (docker) and legacy DSN (local dev)
_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://martin:expensivewino@localhost:5432/bourgogne"
)

# Convert postgres:// → postgresql:// (psycopg2 needs the latter)
DB_DSN = _DATABASE_URL.replace("postgres://", "postgresql://", 1)


def wait_for_db(retries=15, delay=3):
    for i in range(retries):
        try:
            conn = psycopg2.connect(DB_DSN)
            conn.close()
            return
        except Exception:
            print(f"  DB not ready, retrying in {delay}s… ({i+1}/{retries})")
            time.sleep(delay)
    raise RuntimeError("Could not connect to database")

# ---------------------------------------------------------------------------
# Commune → subregion mapping
# ---------------------------------------------------------------------------
COMMUNE_SUBREGION = {
    # Côte de Nuits
    "Marsannay":            "Côte de Nuits",
    "Marsannay-la-Côte":    "Côte de Nuits",
    "Fixin":                "Côte de Nuits",
    "Gevrey-Chambertin":    "Côte de Nuits",
    "Morey-Saint-Denis":    "Côte de Nuits",
    "Chambolle-Musigny":    "Côte de Nuits",
    "Vougeot":              "Côte de Nuits",
    "Flagey-Échézeaux":     "Côte de Nuits",
    "Vosne-Romanée":        "Côte de Nuits",
    "Nuits-Saint-Georges":  "Côte de Nuits",
    "Premeaux-Prissey":     "Côte de Nuits",
    # Côte de Beaune
    "Ladoix-Serrigny":      "Côte de Beaune",
    "Aloxe-Corton":         "Côte de Beaune",
    "Pernand-Vergelesses":  "Côte de Beaune",
    "Chorey-lès-Beaune":    "Côte de Beaune",
    "Savigny-lès-Beaune":   "Côte de Beaune",
    "Savigny":              "Côte de Beaune",
    "Beaune":               "Côte de Beaune",
    "Pommard":              "Côte de Beaune",
    "Volnay":               "Côte de Beaune",
    "Monthélie":            "Côte de Beaune",
    "Saint-Aubin":          "Côte de Beaune",
    "Saint-Romain":         "Côte de Beaune",
    "Auxey-Duresses":       "Côte de Beaune",
    "Meursault":            "Côte de Beaune",
    "Blagny":               "Côte de Beaune",
    "Puligny-Montrachet":   "Côte de Beaune",
    "Chassagne-Montrachet": "Côte de Beaune",
    "Santenay":             "Côte de Beaune",
    "Maranges":             "Côte de Beaune",
    "Dezize-lès-Maranges":  "Côte de Beaune",
    "Sampigny-lès-Maranges":"Côte de Beaune",
    "Cheilly-lès-Maranges": "Côte de Beaune",
    "Corton":               "Côte de Beaune",
    # Chablis / Grand Auxerrois
    "Chablis":              "Chablis",
    # Côte Chalonnaise
    "Rully":                "Côte Chalonnaise",
    "Mercurey":             "Côte Chalonnaise",
    "Givry":                "Côte Chalonnaise",
    "Montagny":             "Côte Chalonnaise",
}

def guess_subregion(commune: str) -> str:
    """Best-effort subregion from commune name."""
    return COMMUNE_SUBREGION.get(commune, "Bourgogne")


# ---------------------------------------------------------------------------
# Grand Crus from Wikipedia
# ---------------------------------------------------------------------------
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; bourgogne-tracker/1.0)"}


def fetch_grand_crus() -> list[dict]:
    url = "https://en.wikipedia.org/wiki/List_of_Burgundy_Grands_Crus"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table", class_="wikitable")
    if not table:
        print("WARNING: Could not find grand cru table on Wikipedia")
        return []

    # Detect column positions from header row
    header_row = table.find("tr")
    headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]
    col_name      = next((i for i, h in enumerate(headers) if "grand cru" in h or "cru" in h), 0)
    col_subregion = next((i for i, h in enumerate(headers) if "region" in h), 1)
    col_commune   = next((i for i, h in enumerate(headers) if "village" in h or "commune" in h), 2)
    col_style     = next((i for i, h in enumerate(headers) if "style" in h or "wine" in h), None)

    entries = []
    for row in table.find_all("tr")[1:]:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue
        name      = cells[col_name].get_text(strip=True)
        subregion = cells[col_subregion].get_text(strip=True)
        commune   = cells[col_commune].get_text(strip=True)
        style_raw = cells[col_style].get_text(strip=True).lower() if col_style and col_style < len(cells) else ""

        # Normalise color
        if "blanc" in style_raw or "white" in style_raw:
            color = "blanc"
        elif "rouge" in style_raw or "red" in style_raw:
            color = "rouge"
        elif "both" in style_raw or ("rouge" in style_raw and "blanc" in style_raw):
            color = "both"
        else:
            color = None

        entries.append({
            "name":      name,
            "type":      "grand",
            "subregion": subregion or guess_subregion(commune),
            "commune":   commune,
            "color":     color,
        })
    return entries


# ---------------------------------------------------------------------------
# Premier Crus from recherche_produit.csv
# ---------------------------------------------------------------------------
# Product label pattern:  "{commune} premier cru {cru_name} [blanc|rouge|gris]"
PREMIER_RE = re.compile(
    r"^(.+?)\s+premier cru\s+(.+?)(?:\s+(blanc|rouge|gris|rosé))?$",
    re.IGNORECASE
)
# Strip colors suffix when it's the whole name (e.g. "premier cru blanc" with no real name)
GENERIC_PREMIER_RE = re.compile(r"^(.+?)\s+premier cru\s*(blanc|rouge|gris)?$", re.IGNORECASE)


def fetch_premier_crus(csv_path: str = "recherche_produit.csv") -> list[dict]:
    seen = set()  # (name, commune) dedup
    entries = []

    with open(csv_path, encoding="iso-8859-1", newline="") as f:
        reader = csv.reader(f, delimiter=";")
        next(reader, None)  # skip header
        for row in reader:
            if len(row) < 3:
                continue
            label = row[2].strip()
            if "premier cru" not in label.lower():
                continue

            m = PREMIER_RE.match(label)
            if not m:
                continue

            commune   = m.group(1).strip()
            cru_name  = m.group(2).strip()
            color_raw = (m.group(3) or "").strip().lower()

            # Skip generic entries like "Chambolle-Musigny premier cru blanc"
            # (these have no specific vineyard name — the cru_name IS the color)
            if cru_name.lower() in ("blanc", "rouge", "gris", "rosé", ""):
                continue

            # Normalise color: if we've seen rouge + blanc → both
            key = (cru_name, commune)
            if key in seen:
                # Possibly upgrade to "both" if the other color now appears
                for e in entries:
                    if e["name"] == cru_name and e["commune"] == commune:
                        if color_raw and e["color"] and e["color"] != color_raw:
                            e["color"] = "both"
                        break
                continue

            seen.add(key)
            color = color_raw if color_raw in ("blanc", "rouge", "gris", "rosé") else None
            entries.append({
                "name":      cru_name,
                "type":      "premier",
                "subregion": guess_subregion(commune),
                "commune":   commune,
                "color":     color,
            })

    return entries


# ---------------------------------------------------------------------------
# Insert into PostgreSQL
# ---------------------------------------------------------------------------
def insert_crus(entries: list[dict], conn) -> int:
    cur = conn.cursor()
    inserted = 0
    for e in entries:
        cur.execute("""
            INSERT INTO cru (name, type, region, subregion, commune, color)
            VALUES (%s, %s, 'Bourgogne', %s, %s, %s)
            ON CONFLICT (name, commune) DO NOTHING
        """, (e["name"], e["type"], e["subregion"], e["commune"], e.get("color")))
        inserted += cur.rowcount
    conn.commit()
    cur.close()
    return inserted


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
CSV_PATH = os.getenv("CSV_PATH", "recherche_produit.csv")


def main():
    print("Waiting for database…")
    wait_for_db()
    print("Connecting to database…")
    conn = psycopg2.connect(DB_DSN)

    print("Fetching Grand Crus from Wikipedia…")
    grand_crus = fetch_grand_crus()
    print(f"  → {len(grand_crus)} Grand Crus found")
    n = insert_crus(grand_crus, conn)
    print(f"  → {n} new rows inserted")

    print("Parsing Premier Crus from CSV…")
    premier_crus = fetch_premier_crus(CSV_PATH)
    print(f"  → {len(premier_crus)} Premier Crus found (deduplicated)")
    n = insert_crus(premier_crus, conn)
    print(f"  → {n} new rows inserted")

    cur = conn.cursor()
    cur.execute("SELECT type, COUNT(*) FROM cru GROUP BY type ORDER BY type")
    for row in cur.fetchall():
        print(f"  DB total {row[0]:>8} crus: {row[1]}")
    cur.close()

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
