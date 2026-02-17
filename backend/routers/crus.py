from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from pydantic import BaseModel
from database import db

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
):
    """List all crus with optional filtering. Also returns tasted status."""
    conditions = []
    params = []

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
        LEFT JOIN tasting_note tn ON tn.cru_id = c.id
        {where}
        GROUP BY c.id
        ORDER BY c.subregion, c.commune, c.name
        LIMIT %s OFFSET %s
    """
    params += [limit, offset]

    count_sql = f"""
        SELECT COUNT(DISTINCT c.id)
        FROM cru c
        LEFT JOIN tasting_note tn ON tn.cru_id = c.id
        {where}
    """

    with db() as conn:
        cur = conn.cursor()
        cur.execute(count_sql, params[:-2])
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
    """Update terroir fields for a cru"""
    allowed_fields = {"soil_type", "elevation_m", "aspect", "climate_notes", "area_ha", "latitude", "longitude"}

    # Filter to only allowed fields
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}

    if not filtered:
        raise HTTPException(status_code=400, detail="No valid fields to update")

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
