from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional
from auth import get_current_user
from database import db

router = APIRouter(prefix="/users", tags=["users"])

class ProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    mastodon_url: Optional[str] = None
    bluesky_url: Optional[str] = None
    vivino_url: Optional[str] = None
    cellartracker_url: Optional[str] = None
    delectable_url: Optional[str] = None

@router.get("/{username}")
def get_user_profile(username: str):
    """Get public user profile by username"""
    with db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                id, username, email, nickname, bio, created_at,
                mastodon_url, bluesky_url, vivino_url,
                cellartracker_url, delectable_url
            FROM app_user
            WHERE username = %s
        """, (username,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")

        user = dict(row)

        # Get stats
        cur.execute("""
            SELECT
                COUNT(*) as total_notes,
                COUNT(DISTINCT cru_id) as crus_tasted,
                AVG(rating)::FLOAT as avg_rating
            FROM tasting_note
            WHERE user_id = %s AND rating IS NOT NULL
        """, (user["id"],))
        stats = dict(cur.fetchone())
        user["stats"] = stats

        return user

@router.get("/{username}/top-wines")
def get_top_wines(username: str):
    """Get user's top 3 red and white wines"""
    with db() as conn:
        cur = conn.cursor()

        # Get user ID
        cur.execute("SELECT id FROM app_user WHERE username = %s", (username,))
        user_row = cur.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_row["id"]

        # Top 3 red wines
        cur.execute("""
            SELECT
                c.id, c.name, c.type, c.subregion, c.commune,
                tn.rating, tn.vintage, tn.tasted_on, tn.notes
            FROM tasting_note tn
            JOIN cru c ON c.id = tn.cru_id
            WHERE tn.user_id = %s
              AND c.color = 'rouge'
              AND tn.rating IS NOT NULL
            ORDER BY tn.rating DESC, tn.tasted_on DESC
            LIMIT 3
        """, (user_id,))
        red_wines = [dict(r) for r in cur.fetchall()]

        # Top 3 white wines
        cur.execute("""
            SELECT
                c.id, c.name, c.type, c.subregion, c.commune,
                tn.rating, tn.vintage, tn.tasted_on, tn.notes
            FROM tasting_note tn
            JOIN cru c ON c.id = tn.cru_id
            WHERE tn.user_id = %s
              AND c.color = 'blanc'
              AND tn.rating IS NOT NULL
            ORDER BY tn.rating DESC, tn.tasted_on DESC
            LIMIT 3
        """, (user_id,))
        white_wines = [dict(r) for r in cur.fetchall()]

        return {
            "red": red_wines,
            "white": white_wines
        }

@router.put("/me")
def update_profile(updates: ProfileUpdate, user = Depends(get_current_user)):
    """Update own profile"""
    with db() as conn:
        cur = conn.cursor()

        # Build update query
        set_parts = []
        params = []

        for field in ["nickname", "bio", "mastodon_url", "bluesky_url",
                      "vivino_url", "cellartracker_url", "delectable_url"]:
            value = getattr(updates, field, None)
            if value is not None:
                set_parts.append(f"{field} = %s")
                params.append(value)

        if not set_parts:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(user["id"])
        sql = f"""
            UPDATE app_user
            SET {', '.join(set_parts)}
            WHERE id = %s
            RETURNING id, username, email, nickname, bio,
                      mastodon_url, bluesky_url, vivino_url,
                      cellartracker_url, delectable_url
        """

        cur.execute(sql, params)
        row = cur.fetchone()
        return dict(row)
