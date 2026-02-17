from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import crus, notes, auth, admin, users, reviews
from auth import get_current_user

app = FastAPI(title="Bourgogne Wine Tracker", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(reviews.router)
app.include_router(crus.router)
app.include_router(notes.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "Bourgogne Wine Tracker"}


@app.get("/stats")
def stats(user = Depends(get_current_user)):
    from database import db
    with db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                (SELECT COUNT(*) FROM cru WHERE type = 'grand')  AS grand_crus,
                (SELECT COUNT(*) FROM cru WHERE type = 'premier') AS premier_crus,
                (SELECT COUNT(*) FROM tasting_note WHERE user_id = %s) AS total_notes,
                (SELECT COUNT(DISTINCT cru_id) FROM tasting_note WHERE user_id = %s) AS crus_tasted
        """, (user["id"], user["id"]))
        return dict(cur.fetchone())
