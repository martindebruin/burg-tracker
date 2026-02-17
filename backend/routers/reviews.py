from fastapi import APIRouter, Query, Depends
from typing import Optional
from auth import get_current_user
from database import db

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/by-color")
def get_reviews_by_color(
    color: str = Query(..., regex="^(rouge|blanc)$"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user = Depends(get_current_user)
):
    """Get all reviews for wines of a specific color"""
    with db() as conn:
        cur = conn.cursor()

        # Get aggregate stats
        cur.execute("""
            SELECT
                COUNT(*) as total_reviews,
                COUNT(DISTINCT c.id) as unique_wines,
                AVG(tn.rating)::FLOAT as avg_rating,
                COUNT(DISTINCT tn.user_id) as reviewers
            FROM tasting_note tn
            JOIN cru c ON c.id = tn.cru_id
            WHERE (c.color = %s OR c.color = 'both' OR c.color IS NULL OR c.color = '') AND tn.rating IS NOT NULL
        """, (color,))
        stats = dict(cur.fetchone())

        # Get reviews
        cur.execute("""
            SELECT
                tn.id, tn.vintage, tn.tasted_on, tn.rating, tn.notes,
                c.id as cru_id, c.name as cru_name, c.type as cru_type,
                c.subregion, c.commune,
                u.id as user_id, u.username, u.nickname
            FROM tasting_note tn
            JOIN cru c ON c.id = tn.cru_id
            JOIN app_user u ON u.id = tn.user_id
            WHERE c.color = %s OR c.color = 'both' OR c.color IS NULL OR c.color = ''
            ORDER BY tn.tasted_on DESC, tn.rating DESC
            LIMIT %s OFFSET %s
        """, (color, limit, offset))

        reviews = []
        for row in cur.fetchall():
            r = dict(row)
            reviews.append({
                "id": r["id"],
                "vintage": r["vintage"],
                "tasted_on": r["tasted_on"],
                "rating": r["rating"],
                "notes": r["notes"],
                "cru": {
                    "id": r["cru_id"],
                    "name": r["cru_name"],
                    "type": r["cru_type"],
                    "subregion": r["subregion"],
                    "commune": r["commune"]
                },
                "user": {
                    "id": r["user_id"],
                    "username": r["username"],
                    "nickname": r["nickname"]
                }
            })

        return {
            "stats": stats,
            "reviews": reviews
        }

@router.get("/top-wines")
def get_top_wines_by_color(
    color: str = Query(..., regex="^(rouge|blanc)$"),
    limit: int = Query(10, le=50),
    user = Depends(get_current_user)
):
    """Get top-rated wines by color"""
    with db() as conn:
        cur = conn.cursor()

        cur.execute("""
            SELECT
                c.id, c.name, c.type, c.subregion, c.commune,
                AVG(tn.rating)::FLOAT as avg_rating,
                COUNT(tn.id) as review_count,
                MAX(tn.rating) as best_rating
            FROM cru c
            JOIN tasting_note tn ON tn.cru_id = c.id
            WHERE (c.color = %s OR c.color = 'both' OR c.color IS NULL OR c.color = '') AND tn.rating IS NOT NULL
            GROUP BY c.id
            HAVING COUNT(tn.id) >= 1  -- At least 1 review
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT %s
        """, (color, limit))

        return [dict(r) for r in cur.fetchall()]
