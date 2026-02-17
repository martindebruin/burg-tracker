from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from database import db
from auth import get_current_user

router = APIRouter(prefix="/crus", tags=["crus"])


class CruCreate(BaseModel):
    name: str
    type: str  # "grand" or "premier"
    region: str = "Bourgogne"
    subregion: str
    commune: str
    color: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = None
    elevation_m: Optional[int] = None
    aspect: Optional[str] = None
    climate_notes: Optional[str] = None
    area_ha: Optional[float] = None


@router.post("")
def create_cru(cru: CruCreate):
    """Create a new cru"""
    if cru.type not in ("grand", "premier"):
        raise HTTPException(status_code=400, detail="Type must be 'grand' or 'premier'")

    if cru.color and cru.color not in ("rouge", "blanc", "both"):
        raise HTTPException(status_code=400, detail="Color must be 'rouge', 'blanc', or 'both'")

    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO cru (
                name, type, region, subregion, commune, color,
                latitude, longitude, soil_type, elevation_m, aspect, climate_notes, area_ha
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                cru.name, cru.type, cru.region, cru.subregion, cru.commune, cru.color,
                cru.latitude, cru.longitude, cru.soil_type, cru.elevation_m,
                cru.aspect, cru.climate_notes, cru.area_ha
            )
        )
        row = cur.fetchone()
        conn.commit()
        return dict(row)


@router.get("")
def list_crus(
    q: Optional[str] = Query(None, description="Search by name or commune"),
    type: Optional[str] = Query(None, description="grand or premier"),
    subregion: Optional[str] = Query(None),
    commune: Optional[str] = Query(None),
    tasted: Optional[bool] = Query(None, description="Filter to crus you have/haven't tasted"),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user)
):
    """List all crus with optional filtering. Also returns tasted status."""
    conditions = []
    params = [user["id"]]  # First param is always user_id for the JOIN

    if q:
        conditions.append("(c.name ILIKE %s OR c.commune ILIKE %s)")
        params += [f"%{q}%", f"%{q}%"]
    if type:
        conditions.append("c.type = %s")
        params.append(type)
    if subregion:
        conditions.append("c.subregion = %s")
        params.append(subregion)
    if commune:
        conditions.append("c.commune ILIKE %s")
        params.append(f"%{commune}%")
    if tasted is True:
        conditions.append("tn.id IS NOT NULL")
    elif tasted is False:
        conditions.append("tn.id IS NULL")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    sql = f"""
        SELECT
            c.id, c.name, c.type, c.subregion, c.commune, c.color, c.region,
            c.latitude, c.longitude,
            c.soil_type, c.elevation_m, c.aspect, c.area_ha,
            COUNT(tn.id) AS note_count,
            MAX(tn.rating) AS best_rating,
            bool_or(tn.id IS NOT NULL) AS tasted
        FROM cru c
        LEFT JOIN tasting_note tn ON tn.cru_id = c.id AND tn.user_id = %s
        {where}
        GROUP BY c.id
        ORDER BY c.subregion, c.commune, c.name
        LIMIT %s OFFSET %s
    """
    params += [limit, offset]

    count_sql = f"""
        SELECT COUNT(DISTINCT c.id)
        FROM cru c
        LEFT JOIN tasting_note tn ON tn.cru_id = c.id AND tn.user_id = %s
        {where}
    """

    with db() as conn:
        cur = conn.cursor()
        cur.execute(count_sql, [user["id"]] + params[1:-2])
        total = cur.fetchone()["count"]

        cur.execute(sql, params)
        rows = cur.fetchall()

    return {"total": total, "items": [dict(r) for r in rows]}


@router.get("/subregions")
def list_subregions():
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT subregion FROM cru ORDER BY subregion")
        return [r["subregion"] for r in cur.fetchall()]


@router.get("/communes")
def list_communes(subregion: Optional[str] = None):
    with db() as conn:
        cur = conn.cursor()
        if subregion:
            cur.execute(
                "SELECT DISTINCT commune FROM cru WHERE subregion = %s ORDER BY commune",
                (subregion,)
            )
        else:
            cur.execute("SELECT DISTINCT commune FROM cru ORDER BY commune")
        return [r["commune"] for r in cur.fetchall()]


@router.get("/{cru_id}")
def get_cru(cru_id: int):
    with db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM cru WHERE id = %s", (cru_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cru not found")
        return dict(row)


@router.put("/{cru_id}")
def update_cru(cru_id: int, updates: dict):
    """Update fields for a cru"""
    allowed_fields = {"name", "color", "type", "subregion", "commune", "soil_type", "elevation_m", "aspect", "climate_notes", "area_ha", "latitude", "longitude"}

    # Filter to only allowed fields
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}

    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    # Validate color if provided
    if "color" in filtered and filtered["color"] not in (None, "", "rouge", "blanc", "both"):
        raise HTTPException(status_code=400, detail="Color must be 'rouge', 'blanc', or 'both'")

    # Validate type if provided
    if "type" in filtered and filtered["type"] not in ("grand", "premier"):
        raise HTTPException(status_code=400, detail="Type must be 'grand' or 'premier'")

    # Build SET clause
    set_parts = []
    params = []
    for field, value in filtered.items():
        set_parts.append(f"{field} = %s")
        params.append(value)

    params.append(cru_id)

    with db() as conn:
        cur = conn.cursor()
        sql = f"UPDATE cru SET {', '.join(set_parts)} WHERE id = %s RETURNING *"
        cur.execute(sql, params)
        row = cur.fetchone()
        conn.commit()

        if not row:
            raise HTTPException(status_code=404, detail="Cru not found")

        return dict(row)


@router.get("/{cru_id}/community")
def get_community_notes(cru_id: int, user = Depends(get_current_user)):
    """Get aggregated ratings and all notes from all users for a cru"""
    with db() as conn:
        cur = conn.cursor()

        # Aggregated stats
        cur.execute("""
            SELECT
                AVG(rating)::FLOAT AS avg_rating,
                COUNT(*)::INT AS rating_count
            FROM tasting_note
            WHERE cru_id = %s AND rating IS NOT NULL
        """, (cru_id,))
        stats = dict(cur.fetchone())

        # All notes with usernames
        cur.execute("""
            SELECT
                tn.id, tn.vintage, tn.tasted_on, tn.rating, tn.notes,
                u.id AS user_id, u.username
            FROM tasting_note tn
            JOIN app_user u ON u.id = tn.user_id
            WHERE tn.cru_id = %s
            ORDER BY tn.tasted_on DESC
        """, (cru_id,))

        notes = []
        for row in cur.fetchall():
            r = dict(row)
            notes.append({
                "id": r["id"],
                "vintage": r["vintage"],
                "tasted_on": r["tasted_on"],
                "rating": r["rating"],
                "notes": r["notes"],
                "user": {
                    "id": r["user_id"],
                    "username": r["username"]
                }
            })

        return {
            "avg_rating": stats["avg_rating"],
            "rating_count": stats["rating_count"],
            "notes": notes
        }
