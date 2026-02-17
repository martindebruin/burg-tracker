"""
Populate terroir columns (soil_type, elevation_m, aspect, climate_notes, area_ha)
using two-tier approach:
  1. Commune-level defaults (hardcoded dict)
  2. Grand Cru specific overrides from Wikipedia (area_ha, elevation)

Usage:
    python terroir.py
Or via Docker:
    docker compose --profile terroir run --rm terroir
"""
import os
import re
import time
import urllib.request
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

# ---------------------------------------------------------------------------
# Commune-level defaults
# Keys are commune names as stored in the DB.
# ---------------------------------------------------------------------------
COMMUNE_DEFAULTS: dict[str, dict] = {
    "Gevrey-Chambertin": {
        "soil_type": "Kalksten, lerkalksten (Comblanchien)",
        "elevation_m": 280,
        "aspect": "öst till ostsydost",
        "climate_notes": "Kontinentalt; varma somrar, kalla vintrar. Skyddad av Côte-sluttningen.",
    },
    "Morey-Saint-Denis": {
        "soil_type": "Brun kalksten över Bathoniansk kalksten",
        "elevation_m": 275,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; något svalare än Gevrey. Pinot Noir dominerar.",
    },
    "Chambolle-Musigny": {
        "soil_type": "Tunn, kritig kalksten över Comblanchien-berggrund",
        "elevation_m": 285,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; svalt, väldrä nerat. Ger delikata, aromatiska viner.",
    },
    "Vougeot": {
        "soil_type": "Lerkalksten, varierar med höjden",
        "elevation_m": 250,
        "aspect": "öst",
        "climate_notes": "Kontinentalt; Clos de Vougeot sträcker sig över flera terroir-band.",
    },
    "Flagey-Échézeaux": {
        "soil_type": "Lera och kalksten över Bajosiansk kalksten",
        "elevation_m": 250,
        "aspect": "öst till nordost",
        "climate_notes": "Kontinentalt; något tyngre jordar än Vosne.",
    },
    "Vosne-Romanée": {
        "soil_type": "Kalksten och lera över hård Bajosiansk kalksten",
        "elevation_m": 260,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; varmt, väldrä nerat mittsluttning. Burgundys främsta terroir.",
    },
    "Nuits-Saint-Georges": {
        "soil_type": "Röd lerkalksten, järnrik i söder",
        "elevation_m": 275,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; fastare, mer tanninska viner än norra Côte de Nuits.",
    },
    "Aloxe-Corton": {
        "soil_type": "Kalkstenskärv och mergel på Corton-kullen",
        "elevation_m": 300,
        "aspect": "syd till sydost",
        "climate_notes": "Kontinentalt; kullen medger flera exponeringar. Röda och vita Grand Crus.",
    },
    "Pernand-Vergelesses": {
        "soil_type": "Kalksten, mergel, lera — svalare nordvända parceller",
        "elevation_m": 310,
        "aspect": "sydost till syd",
        "climate_notes": "Kontinentalt; svalare mikroklimat. Corton-Charlemagne-sluttningar.",
    },
    "Ladoix-Serrigny": {
        "soil_type": "Kalksten och mergel vid Corton-kullens fot",
        "elevation_m": 280,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; nordligaste kommunen i Côte de Beaune.",
    },
    "Savigny-lès-Beaune": {
        "soil_type": "Lätt, sandig kalksten över grus",
        "elevation_m": 265,
        "aspect": "öst till nordost",
        "climate_notes": "Kontinentalt; lättare, tidigare mognande röda.",
    },
    "Chorey-lès-Beaune": {
        "soil_type": "Alluvialt grus och lera öster om Côte",
        "elevation_m": 230,
        "aspect": "öst",
        "climate_notes": "Kontinentalt; platt, bördig mark — ger mjuka röda.",
    },
    "Beaune": {
        "soil_type": "Kalkstengrus och lerkalksten",
        "elevation_m": 270,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; stor kommun med varierande terroir. Premier Cru-huvudstad.",
    },
    "Pommard": {
        "soil_type": "Tung lerkalksten, järnoxid",
        "elevation_m": 265,
        "aspect": "öst till nordost",
        "climate_notes": "Kontinentalt; fasta, strukturerade röda från tunga lerjordar.",
    },
    "Volnay": {
        "soil_type": "Tunn kalkstenjord över hård Comblanchien",
        "elevation_m": 285,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; elegant, parfymerad Pinot Noir från väldrä nerad kalksten.",
    },
    "Monthélie": {
        "soil_type": "Lerkalksten, liknar Volnay",
        "elevation_m": 290,
        "aspect": "sydost",
        "climate_notes": "Kontinentalt; ofta överskuggad granne till Volnay och Meursault.",
    },
    "Auxey-Duresses": {
        "soil_type": "Kalksten och lera i en dalgång",
        "elevation_m": 295,
        "aspect": "öst till syd",
        "climate_notes": "Kontinentalt; svalare dalläge. Både röda och vita produceras.",
    },
    "Meursault": {
        "soil_type": "Vit kalksten och mergel — idealisk för Chardonnay",
        "elevation_m": 255,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; främsta vitvinkommun. Rika, smöriga Chardonnay.",
    },
    "Puligny-Montrachet": {
        "soil_type": "Kalksten och vit mergel över hård Bathoniansk",
        "elevation_m": 250,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; Grand Cru-vitvinshjärtat. Mineral precision.",
    },
    "Chassagne-Montrachet": {
        "soil_type": "Kalksten, lera och mergel — mer lera än Puligny",
        "elevation_m": 255,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; rikare, bredare vita än Puligny. Även röda.",
    },
    "Saint-Aubin": {
        "soil_type": "Kalksten och lera bakom Montrachet-åsen",
        "elevation_m": 295,
        "aspect": "öst till nord",
        "climate_notes": "Kontinentalt; svalare, senare mognad. Prisvärda vita viner.",
    },
    "Santenay": {
        "soil_type": "Lerkalksten, alltmer sandig söderut",
        "elevation_m": 260,
        "aspect": "öst till nordost",
        "climate_notes": "Kontinentalt; sydligaste Côte de Beaune. Rustika röda.",
    },
    "Maranges": {
        "soil_type": "Lätt sandig kalksten vid södra Côte-spetsen",
        "elevation_m": 295,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; svalare, högsta höjd i Côte de Beaune.",
    },
    "Marsannay-la-Côte": {
        "soil_type": "Kalkstengrus och lera vid Côte-foten",
        "elevation_m": 270,
        "aspect": "öst",
        "climate_notes": "Kontinentalt; nordligaste Côte de Nuits. Känd för rosé.",
    },
    "Fixin": {
        "soil_type": "Hård kalksten och lerkalksten",
        "elevation_m": 280,
        "aspect": "öst till sydost",
        "climate_notes": "Kontinentalt; fast, strukturerad Pinot Noir. Underskattad kommun.",
    },
    "Chablis": {
        "soil_type": "Kimmeridgisk kalksten (ostronfossil)",
        "elevation_m": 135,
        "aspect": "syd till sydväst",
        "climate_notes": "Semikontinentalt; kallare, frostbenäget. Stålaktig mineral Chardonnay.",
    },
}

# ---------------------------------------------------------------------------
# Grand Cru specific data (Wikipedia / well-known sources)
# area_ha and elevation override commune defaults where known
# ---------------------------------------------------------------------------
GRAND_CRU_DATA: dict[str, dict] = {
    "Chambertin":             {"area_ha": 12.90, "elevation_m": 285},
    "Chambertin-Clos de Bèze": {"area_ha": 15.40, "elevation_m": 290},
    "Chapelle-Chambertin":    {"area_ha": 5.49,  "elevation_m": 285},
    "Charmes-Chambertin":     {"area_ha": 31.63, "elevation_m": 275},
    "Griotte-Chambertin":     {"area_ha": 2.73,  "elevation_m": 285},
    "Latricières-Chambertin": {"area_ha": 7.35,  "elevation_m": 290},
    "Mazis-Chambertin":       {"area_ha": 9.10,  "elevation_m": 285},
    "Mazoyères-Chambertin":   {"area_ha": 18.59, "elevation_m": 275},
    "Ruchottes-Chambertin":   {"area_ha": 3.30,  "elevation_m": 295},
    "Clos Saint-Denis":       {"area_ha": 6.62,  "elevation_m": 275},
    "Clos de la Roche":       {"area_ha": 16.90, "elevation_m": 270},
    "Clos des Lambrays":      {"area_ha": 8.84,  "elevation_m": 280},
    "Clos de Tart":           {"area_ha": 7.53,  "elevation_m": 290},
    "Bonnes-Mares":           {"area_ha": 15.06, "elevation_m": 285},
    "Musigny":                {"area_ha": 10.86, "elevation_m": 290},
    "Clos de Vougeot":        {"area_ha": 50.59, "elevation_m": 245},
    "Échézeaux":              {"area_ha": 37.69, "elevation_m": 250},
    "Grands Échézeaux":       {"area_ha": 9.14,  "elevation_m": 255},
    "La Romanée":             {"area_ha": 0.85,  "elevation_m": 265},
    "La Tâche":               {"area_ha": 6.06,  "elevation_m": 260},
    "Richebourg":             {"area_ha": 8.03,  "elevation_m": 260},
    "Romanée-Conti":          {"area_ha": 1.81,  "elevation_m": 263},
    "Romanée-Saint-Vivant":   {"area_ha": 9.44,  "elevation_m": 255},
    "La Grande Rue":          {"area_ha": 1.65,  "elevation_m": 262},
    "Corton":                 {"area_ha": 99.22, "elevation_m": 305},
    "Corton-Charlemagne":     {"area_ha": 51.84, "elevation_m": 310},
    "Charlemagne":            {"area_ha": 0.36,  "elevation_m": 320},
    "Montrachet":             {"area_ha": 7.99,  "elevation_m": 260},
    "Chevalier-Montrachet":   {"area_ha": 7.36,  "elevation_m": 260},
    "Bâtard-Montrachet":      {"area_ha": 11.86, "elevation_m": 255},
    "Criots-Bâtard-Montrachet": {"area_ha": 1.57, "elevation_m": 255},
    "Bienvenues-Bâtard-Montrachet": {"area_ha": 3.69, "elevation_m": 255},
    "Chablis Grand Cru":      {"area_ha": 100.46, "elevation_m": 155},
}


def run():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Apply commune defaults (force overwrite)
    commune_count = 0
    for commune, defaults in COMMUNE_DEFAULTS.items():
        cur.execute(
            """
            UPDATE cru SET
                soil_type     = %s,
                elevation_m   = %s,
                aspect        = %s,
                climate_notes = %s
            WHERE commune = %s
            """,
            (
                defaults["soil_type"],
                defaults["elevation_m"],
                defaults["aspect"],
                defaults["climate_notes"],
                commune,
            ),
        )
        commune_count += cur.rowcount

    print(f"Applied commune defaults to {commune_count} crus")

    # Apply Grand Cru specific overrides
    gc_count = 0
    for cru_name, data in GRAND_CRU_DATA.items():
        sets = []
        vals = []
        if "area_ha" in data:
            sets.append("area_ha = %s")
            vals.append(data["area_ha"])
        if "elevation_m" in data:
            sets.append("elevation_m = %s")
            vals.append(data["elevation_m"])
        if not sets:
            continue
        vals.append(cru_name)
        cur.execute(
            f"UPDATE cru SET {', '.join(sets)} WHERE name = %s",
            vals,
        )
        gc_count += cur.rowcount

    print(f"Applied Grand Cru specific data to {gc_count} Grand Crus")

    conn.commit()
    cur.close()
    conn.close()
    print("Terroir population complete.")


if __name__ == "__main__":
    run()
