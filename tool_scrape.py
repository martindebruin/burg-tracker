import requests
from bs4 import BeautifulSoup
import psycopg2

# --- Konfiguration ---
DB_DSN = "host=localhost dbname=bourgogne user=martin password=expensivewino"

# --- Funktion: Hämta Grand Cru från Wikipedia ---
def fetch_grand_crus():
    url = "https://en.wikipedia.org/wiki/List_of_Burgundy_Grands_Crus"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table", class_="wikitable")

    entries = []

    for row in table.find_all("tr")[1:]:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue
        cru_name = cells[0].text.strip()
        subregion = cells[1].text.strip()
        commune = cells[2].text.strip()

        entries.append({
            "name": cru_name,
            "type": "grand",
            "region": "Bourgogne",
            "subregion": subregion,
            "commune": commune,
            "latitude": 0,
            "longitude": 0
        })
    return entries

# --- Funktion: Spara till PostgreSQL ---
def insert_into_postgres(entries):
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    for e in entries:
        cur.execute("""
            INSERT INTO cru (name, type, region, subregion, commune, latitude, longitude)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (name, commune) DO NOTHING;
        """, (
            e["name"], e["type"], e["region"],
            e["subregion"], e["commune"],
            e["latitude"], e["longitude"]
        ))

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ {len(entries)} Grand Crus importerade")

# --- Main ---
def main():
    grand_crus = fetch_grand_crus()
    insert_into_postgres(grand_crus)

if __name__ == "__main__":
    main()
