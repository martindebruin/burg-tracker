"""
Populate lat/lon for all crus by geocoding distinct communes via Nominatim.
Respects Nominatim ToS: 1 request/second, User-Agent set.

Usage:
    python geocode.py
Or via Docker:
    docker compose --profile geocode run --rm geocode
"""
import os
import time
import urllib.request
import urllib.parse
import json
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is required. "
        "Copy .env.example to .env and configure your credentials."
    )

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "BourgogneApp/1.0 (personal wine tracker; contact admin@localhost)"

# Manual overrides for communes where Nominatim returns poor results
OVERRIDES = {
    "Gevrey-Chambertin": (47.2270, 4.9712),
    "Chambolle-Musigny": (47.1957, 4.9581),
    "Vosne-Romanée":     (47.1739, 4.9578),
    "Nuits-Saint-Georges": (47.1421, 4.9523),
    "Aloxe-Corton":      (47.0683, 4.8656),
    "Beaune":            (47.0252, 4.8402),
    "Pommard":           (47.0043, 4.8073),
    "Volnay":            (46.9889, 4.7972),
    "Meursault":         (46.9780, 4.7680),
    "Puligny-Montrachet":(46.9508, 4.7575),
    "Chassagne-Montrachet":(46.9344, 4.7497),
    "Morey-Saint-Denis": (47.2112, 4.9631),
    "Flagey-Échézeaux":  (47.1769, 4.9641),
    "Chablis":           (47.8144, 3.7963),
    "Marsannay-la-Côte": (47.2734, 4.9965),
    "Fixin":             (47.2555, 4.9788),
    "Ladoix-Serrigny":   (47.0839, 4.8806),
    "Pernand-Vergelesses":(47.0762, 4.8422),
    "Savigny-lès-Beaune":(47.0542, 4.8180),
    "Chorey-lès-Beaune": (47.0417, 4.8502),
    "Saint-Aubin":       (46.9333, 4.7278),
    "Santenay":          (46.8994, 4.7022),
    "Maranges":          (46.8869, 4.6831),
}


def nominatim_search(commune: str) -> tuple[float, float] | None:
    params = urllib.parse.urlencode({
        "q": f"{commune}, Côte d'Or, France",
        "format": "json",
        "limit": 1,
        "addressdetails": 0,
    })
    url = f"{NOMINATIM_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"  Nominatim error for {commune!r}: {e}")
    return None


def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Get all distinct communes
    cur.execute("SELECT DISTINCT commune FROM cru ORDER BY commune")
    communes = [r["commune"] for r in cur.fetchall()]
    print(f"Found {len(communes)} distinct communes")

    results: dict[str, tuple[float, float]] = {}

    for commune in communes:
        if commune in OVERRIDES:
            lat, lon = OVERRIDES[commune]
            print(f"  {commune}: override ({lat}, {lon})")
            results[commune] = (lat, lon)
            continue

        print(f"  Geocoding {commune}…", end=" ", flush=True)
        coords = nominatim_search(commune)
        if coords:
            print(f"({coords[0]:.4f}, {coords[1]:.4f})")
            results[commune] = coords
        else:
            print("not found")
        time.sleep(1.1)  # stay safely within 1 req/s

    # Update crus
    updated = 0
    for commune, (lat, lon) in results.items():
        cur.execute(
            "UPDATE cru SET latitude = %s, longitude = %s WHERE commune = %s",
            (lat, lon, commune),
        )
        updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nGeocoded {len(results)}/{len(communes)} communes, updated {updated} crus.")


if __name__ == "__main__":
    run()
