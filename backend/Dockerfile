FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy seed script and data (used by the seed service)
COPY seed.py ./seed.py
COPY recherche_produit.csv ./recherche_produit.csv

# Copy data population scripts
COPY geocode.py ./geocode.py
COPY terroir.py ./terroir.py
COPY migrate_terroir.py ./migrate_terroir.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
