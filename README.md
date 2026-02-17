# Burg Tracker

En personlig app för att utforska och dokumentera burgundiska crus — Premier och Grand Crus med provanteckningar, terroir-information och interaktiv karta.

![License](https://img.shields.io/badge/license-MIT-blue)
![Language](https://img.shields.io/badge/UI-Svenska-green)

## Funktioner

- **490+ Premier & Grand Crus** från Côte d'Or och Chablis
- **Interaktiv karta** med Leaflet — visualisera alla crus med färgkodade pins (Grand Cru i burgundy, Premier Cru i guld)
- **Terroir-data** för varje cru: jordmån, höjd, exponering, areal, klimatnoteringar (på svenska)
- **Provanteckningar** med −2 till +2 betyg (0 = som förväntat)
- **Filtrera och sök** efter typ, delregion, kommun, provade/ej provade
- **Snygga kort-vy** med Grand Cru (rosa-lavendel) och Premier Cru (periwinkle blå) färgkodning
- **Redigera terroir & koordinater** direkt i UI:t
- **Lägg till nya crus** via formulär

## Design

- Modern sans-serif typografi (Inter)
- Färgkodade kort: Grand Cru = varm rosa/lavendel, Premier Cru = kall blå, Provade = guld
- Avrundade "orb"-kort med gradients och glödande skuggor
- Sticky topbar med gradient och guld-accentlinje
- Helt på svenska

## Stack

- **DB**: PostgreSQL 16 + PostGIS (geografi & geocoding)
- **Backend**: FastAPI (Python 3.12) på port 8000
- **Frontend**: React 19 + Vite, serveras via nginx på port 3000
- **Kartor**: Leaflet + react-leaflet med OpenStreetMap tiles
- **Styling**: Custom CSS med Inter font från Google Fonts

## Kom igång

### Kör allt i Docker (rekommenderat)

```bash
# 1. Bygg och starta alla tjänster
docker compose up -d --build

# 2. Seed databasen med alla crus (kör en gång)
docker compose --profile seed run --rm seed

# 3. Lägg till geocoded koordinater (kör en gång, tar ~30s pga rate limiting)
docker compose --profile geocode run --rm geocode

# 4. Lägg till terroir-data (kör en gång)
docker compose --profile terroir run --rm terroir
```

Öppna sedan **http://localhost:3000**

API-dokumentation: **http://localhost:8080/docs**

### Lokal utveckling

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload  # port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # port 5173
```

**Databas:**
```bash
docker compose up db -d
python seed.py           # seed data
python geocode.py        # add coordinates
python terroir.py        # add terroir
```

## Projektstruktur

```
bourgogne/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # DB connection pool
│   └── routers/
│       ├── crus.py          # Cru endpoints (list, get, create, update)
│       ├── notes.py         # Tasting note CRUD
│       └── stats.py         # Stats (counts)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router + topbar
│   │   ├── api.js           # API client
│   │   ├── pages/
│   │   │   ├── HomePage.jsx # Card grid + filters
│   │   │   ├── CruPage.jsx  # Detail view + terroir edit
│   │   │   └── MapPage.jsx  # Leaflet map
│   │   └── components/
│   │       ├── NoteForm.jsx       # Tasting note form
│   │       ├── TerroirForm.jsx    # Terroir edit form
│   │       ├── AddCruForm.jsx     # New cru form
│   │       └── RatingWidget.jsx   # −2…+2 rating buttons
│   └── index.css            # Custom styles
├── schema.sql               # PostgreSQL schema with PostGIS
├── seed.py                  # Populate crus from Wikipedia + CSV
├── geocode.py               # Nominatim geocoding (commune-level)
├── terroir.py               # Terroir data (Swedish)
├── migrate_terroir.py       # Add terroir columns to existing DB
├── cleanup_communes.py      # Remove [a], [b] variants
└── docker-compose.yml       # All services + seed/geocode/terroir profiles
```

## Databas

**Tabeller:**
- `app_user` — Användare (single-user MVP, default: admin)
- `cru` — Alla Premier & Grand Crus med terroir + geografi
- `tasting_note` — Provanteckningar med årgång, datum, betyg, fri text

**PostGIS:**
- Automatisk `geom` kolumn (geography) från lat/lon
- GIST index för spatial queries

## Data källor

- **Grand Crus**: Wikipedia (37 st)
- **Premier Crus**: `recherche_produit.csv` från INAO/Bivb (460+ st)
- **Geocoding**: Nominatim (OpenStreetMap) + manuella overrides
- **Terroir**: Handkurerad data på svenska för 27 kommuner

## Migrations

Om du redan har en databas och vill lägga till terroir-kolumner:

```bash
python migrate_terroir.py
python terroir.py  # populate data
```

## Användning

### Bläddra bland crus
- Se alla crus som kort (3 per rad)
- Filtrera efter typ (Grand/Premier), delregion, kommun, provad/ej provad
- Sök efter namn eller kommun

### Kartvyn
- Klicka "Karta" i topbar
- Pins färgade efter typ (burgundy = Grand, guld = Premier)
- Fylld = provad, outline = ej provad
- Klicka på pin för popup med länk till detalj

### Lägg till provanteckning
1. Klicka på ett kort → detaljsida
2. Klicka "+ Lägg till"
3. Fyll i årgång, datum, betyg (−2…+2), anteckningar
4. Spara

### Redigera terroir
1. Gå till en cru-detaljsida
2. Klicka "Redigera" i Terroir-sektionen
3. Uppdatera jordmån, höjd, exponering, areal, klimat, koordinater
4. Spara

### Lägg till ny cru
1. Klicka "+ Ny cru" på startsidan
2. Fyll i obligatoriska fält (namn, typ, delregion, kommun)
3. Valfritt: lägg till färg, koordinater, terroir
4. Spara → omdirigeras till detalj

## Reset database

```bash
docker compose down -v
docker compose up -d --build
docker compose --profile seed run --rm seed
docker compose --profile geocode run --rm geocode
docker compose --profile terroir run --rm terroir
```

## Betyg-skala

| Värde | Betydelse |
|-------|-----------|
| −2 | Besviken |
| −1 | Under förväntan |
|  0 | Som förväntat |
| +1 | Över förväntan |
| +2 | Exceptionellt |

## Portar

| Tjänst  | Port | Beskrivning |
|---------|------|-------------|
| DB      | 5432 | PostgreSQL |
| Backend | 8080 | FastAPI (proxied via nginx) |
| Frontend| 3000 | React (nginx) |

## Utveckling

**Hot reload:**
- Backend: `uvicorn main:app --reload`
- Frontend: `npm run dev` (Vite)

**Bygg frontend:**
```bash
cd frontend
npm run build  # → dist/
```

**Rebuild Docker:**
```bash
docker compose build backend frontend
docker compose up -d
```

## Licens

MIT

## Erkännanden

- **INAO/Bivb** för Premier Cru-data
- **Wikipedia** för Grand Cru-lista
- **OpenStreetMap/Nominatim** för geocoding
- **Leaflet** för kartor

---

**Skål!**
