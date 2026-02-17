import pdfplumber
import re
import json

PDF_URL = "https://www.bourgogne-wines.com/shop/gallery_files/site/12881/12905/26305.pdf"
OUTPUT_JSON = "crus_from_bourgogne.pdf.json"

def clean_text(text):
    return text.strip().replace("\xa0", " ")

def extract_crus():
    crus = []

    with pdfplumber.open(PDF_URL) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if not text or ("Premier Cru" not in text and "Grand Cru" not in text):
                continue

            lines = text.split("\n")
            current_appellation = None

            for line in lines:
                line = clean_text(line)
                # Titelrader med AREAS/KOMMUNE
                m = re.match(r"^([A-Za-z\-\s’]+)(?:\s+\((\d+(?:\.\d+)?)\s*ha\))?$", line)
                if m:
                    appell, area = m.groups()
                    current_appellation = appell.strip()
                    continue

                # Cru-rader typiskt:
                # Les Grèves (Beaune)
                m2 = re.match(r"^(.+?)\s*\(([^)]+)\)$", line)
                if m2 and current_appellation:
                    cru_name, commune = [c.strip() for c in m2.groups()]
                    cru_type = "Premier Cru" if "Premiers" in current_appellation else "Grand Cru"
                    crus.append({
                        "name": cru_name,
                        "type": cru_type,
                        "appellation": current_appellation,
                        "commune": commune,
                        "subregion": "",  # kan fyllas i senare
                        "area_ha": float(area) if area else None
                    })
    return crus

def main():
    cru_list = extract_crus()
    print(f"✅ Extraherade {len(cru_list)} crus från PDF")
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(cru_list, f, indent=2, ensure_ascii=False)
        print(f"✅ JSON sparad → {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
