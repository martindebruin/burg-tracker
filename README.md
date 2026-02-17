# Burg Tracker

En personlig app för att utforska och dokumentera burgundiska crus — Premier och Grand Crus med provanteckningar, terroir-information och interaktiv karta.

![License](https://img.shields.io/badge/license-MIT-blue)
![Language](https://img.shields.io/badge/UI-Svenska-green)

## Funktioner

- **490+ Premier & Grand Crus** från Côte d'Or och Chablis
- **Multi-user autentisering** med JWT — registrera, logga in, personliga anteckningar
- **Admin-panel** — hantera användare, återställ lösenord, skapa nya användare
- **Community-betyg** — se genomsnittliga betyg från alla användare på varje cru
- **Interaktiv karta** med Leaflet — visualisera alla crus med färgkodade pins (Grand Cru i burgundy, Premier Cru i guld)
- **Terroir-data** för varje cru: jordmån, höjd, exponering, areal, klimatnoteringar (på svenska)
- **Provanteckningar** med −2 till +2 betyg (0 = som förväntat)
- **Filtrera och sök** efter typ, delregion, kommun, provade/ej provade (användarspecifikt)
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

### 1. Konfigurera miljövariabler

Kopiera `.env.example` till `.env` och uppdatera med dina credentials:

```bash
cp .env.example .env
```

Redigera `.env` och sätt dina databas-credentials:
```env
POSTGRES_USER=ditt_användarnamn
POSTGRES_PASSWORD=ditt_säkra_lösenord
POSTGRES_DB=bourgogne
```

**VIKTIGT**: Ändra lösenordet från standardvärdet för produktion!

### 2. Kör allt i Docker (rekommenderat)

```bash
# 1. Bygg och starta alla tjänster
docker compose up -d --build

# 2. Seed databasen med alla crus (kör en gång)
docker compose --profile seed run --rm seed

# 3. Lägg till geocoded koordinater (kör en gång, tar ~30s pga rate limiting)
docker compose --profile geocode run --rm geocode

# 4. Lägg till terroir-data (kör en gång)
docker compose --profile terroir run --rm terroir

# 5. Kör autentiserings-migration (lägger till is_admin kolumn)
python migrate_admin.py
# Ange lösenord för admin-användaren när du blir tillfrågad
```

Öppna sedan **http://localhost:3000**

**Standard admin-inloggning:**
- Användarnamn: `admin`
- Lösenord: (det du angav i steg 5)

API-dokumentation: **http://localhost:8080/docs**

### Lokal utveckling

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Lägg till SECRET_KEY i backend/.env (se .env i root-katalogen)
uvicorn main:app --reload  # port 8000
```

**Frontend:**
```bash
cd frontend
npm install
# Lägg till VITE_API_URL=http://localhost:8000 i frontend/.env
npm run dev  # port 5173
```

**Databas:**
```bash
docker compose up db -d
python seed.py           # seed data
python geocode.py        # add coordinates
python terroir.py        # add terroir
python migrate_admin.py  # setup auth (kör en gång)
```

## Projektstruktur

```
bourgogne/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # DB connection pool
│   ├── auth.py              # JWT authentication utilities
│   └── routers/
│       ├── auth.py          # Login, register, /me
│       ├── admin.py         # Admin user management
│       ├── crus.py          # Cru endpoints (list, get, create, update)
│       └── notes.py         # Tasting note CRUD
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router + topbar
│   │   ├── api.js           # API client
│   │   ├── auth.js          # Token/user storage
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Card grid + filters
│   │   │   ├── CruPage.jsx       # Detail view + community ratings
│   │   │   ├── MapPage.jsx       # Leaflet map
│   │   │   ├── LoginPage.jsx     # Login/register
│   │   │   └── AdminPage.jsx     # User management
│   │   └── components/
│   │       ├── ProtectedRoute.jsx # Auth guard
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
- `app_user` — Användare med JWT-autentisering, bcrypt-hashade lösenord, is_admin flagga
- `cru` — Alla Premier & Grand Crus med terroir + geografi
- `tasting_note` — Provanteckningar med årgång, datum, betyg, fri text (user_id FK)

**PostGIS:**
- Automatisk `geom` kolumn (geography) från lat/lon
- GIST index för spatial queries

**Autentisering:**
- JWT tokens med 7 dagars expiration
- Bcrypt password hashing (cost factor 12)
- OAuth2PasswordBearer schema

## Data källor

- **Grand Crus**: Wikipedia (37 st)
- **Premier Crus**: `recherche_produit.csv` från INAO/Bivb (460+ st)
- **Geocoding**: Nominatim (OpenStreetMap) + manuella overrides
- **Terroir**: Handkurerad data på svenska för 27 kommuner

## Migrations

### Terroir-migration (för äldre databaser)
Om du redan har en databas och vill lägga till terroir-kolumner:
```bash
python migrate_terroir.py
python terroir.py  # populate data
```

### Auth-migration (OBLIGATORISK för multi-user)
Lägger till `is_admin` kolumn och sätter admin-lösenord:
```bash
python migrate_admin.py
# Ange säkert lösenord när du blir tillfrågad
```

**VIKTIGT:** Glöm inte att lägga till `SECRET_KEY` i `.env` filen!

## Autentisering & Användare

### Registrera ny användare
1. Gå till inloggningssidan
2. Klicka på "Registrera"-fliken
3. Fyll i användarnamn, e-post och lösenord (minst 8 tecken)
4. Logga in med dina nya credentials

### Admin-funktioner
Administratörer kan:
- **Skapa nya användare** (med möjlighet att sätta admin-status)
- **Lista alla användare** med sökfunktion
- **Återställa lösenord** för andra användare
- **Ta bort användare** (förutom sig själva)

Gå till Admin-panelen via "Admin"-länken i topbar (endast synlig för admins).

### Användarspecifika funktioner
- **Personliga provanteckningar** — varje användare ser bara sina egna anteckningar
- **"Provade"-filter** — visar endast crus DU har provsmakat
- **Community-betyg** — se genomsnittliga betyg från ALLA användare på cru-detaljsidan

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

## Säkerhet

### Miljövariabler

Alla känsliga credentials lagras i `.env` filen som **inte** checkas in i git.

**Obligatoriska miljövariabler:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bourgogne

# JWT Authentication (generera med: openssl rand -hex 32)
SECRET_KEY=din-hemliga-nyckel-här
```

**Viktiga säkerhetsåtgärder:**
- Använd en stark, slumpmässig `SECRET_KEY` (generera med `openssl rand -hex 32`)
- Ändra alltid standardlösenordet för admin-användaren
- Exponera aldrig PostgreSQL-porten (5432) till internet
- Använd starka lösenord för alla användare i produktionsmiljöer
- `.env` är listad i `.gitignore` och ska aldrig committas
- JWT tokens lagras i browser localStorage (acceptabelt för personlig app)

### Credential rotation

Om credentials har läckt:
1. Ändra lösenord i `.env`
2. Återskapa Docker-containers: `docker compose down -v && docker compose up -d --build`

## Licens

MIT

## Erkännanden

- **INAO/Bivb** för Premier Cru-data
- **Wikipedia** för Grand Cru-lista
- **OpenStreetMap/Nominatim** för geocoding
- **Leaflet** för kartor

---

**Skål!**
