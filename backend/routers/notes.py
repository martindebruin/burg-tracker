from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from database import db
from auth import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


class NoteIn(BaseModel):
    cru_id: int
    vintage: Optional[int] = None
    tasted_on: Optional[date] = None
    rating: Optional[int] = None  # -2 to +2
    notes: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if v is not None and v not in (-2, -1, 0, 1, 2):
            raise ValueError("rating must be between -2 and 2")
        return v

    @field_validator("vintage")
    @classmethod
    def vintage_range(cls, v):
        if v is not None and not (1850 <= v <= 2030):
            raise ValueError("vintage must be between 1850 and 2030")
        return v


@router.get("")
def list_notes(cru_id: Optional[int] = None, user = Depends(get_current_user)):
    with db() as conn:
        cur = conn.cursor()
        if cru_id:
            cur.execute("""
                SELECT tn.*, c.name AS cru_name, c.commune, c.type AS cru_type, c.subregion
                FROM tasting_note tn
                JOIN cru c ON c.id = tn.cru_id
                WHERE tn.user_id = %s AND tn.cru_id = %s
                ORDER BY tn.tasted_on DESC
            """, (user["id"], cru_id))
        else:
            cur.execute("""
                SELECT tn.*, c.name AS cru_name, c.commune, c.type AS cru_type, c.subregion
                FROM tasting_note tn
                JOIN cru c ON c.id = tn.cru_id
                WHERE tn.user_id = %s
                ORDER BY tn.tasted_on DESC
            """, (user["id"],))
        return [dict(r) for r in cur.fetchall()]


@router.post("", status_code=201)
def create_note(note: NoteIn, user = Depends(get_current_user)):
    with db() as conn:
        cur = conn.cursor()
        # Verify cru exists
        cur.execute("SELECT id FROM cru WHERE id = %s", (note.cru_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Cru not found")

        tasted_on = note.tasted_on or date.today()
        try:
            cur.execute("""
                INSERT INTO tasting_note (user_id, cru_id, vintage, tasted_on, rating, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (user["id"], note.cru_id, note.vintage, tasted_on, note.rating, note.notes))
            return dict(cur.fetchone())
        except Exception as e:
            if "unique" in str(e).lower():
                raise HTTPException(status_code=409, detail="A note for this cru/vintage/date already exists")
            raise


@router.put("/{note_id}")
def update_note(note_id: int, note: NoteIn, user = Depends(get_current_user)):
    with db() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE tasting_note
            SET vintage = %s, tasted_on = %s, rating = %s, notes = %s
            WHERE id = %s AND user_id = %s
            RETURNING *
        """, (note.vintage, note.tasted_on or date.today(), note.rating, note.notes,
              note_id, user["id"]))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Note not found")
        return dict(row)


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, user = Depends(get_current_user)):
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM tasting_note WHERE id = %s AND user_id = %s",
            (note_id, user["id"])
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note not found")
