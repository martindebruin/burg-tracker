from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from auth import require_admin, hash_password
from database import db

router = APIRouter(prefix="/admin", tags=["admin"])

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_admin: bool = False

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordReset(BaseModel):
    new_password: str

@router.post("/users", status_code=201)
def create_user(data: UserCreate, admin = Depends(require_admin)):
    """Create a new user (admin only)"""
    with db() as conn:
        cur = conn.cursor()

        # Check uniqueness
        cur.execute(
            "SELECT id FROM app_user WHERE username = %s OR email = %s",
            (data.username, data.email)
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Username or email already exists")

        # Create user
        hashed = hash_password(data.password)
        cur.execute(
            """
            INSERT INTO app_user (username, email, password_hash, is_admin)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, is_admin, created_at
            """,
            (data.username, data.email, hashed, data.is_admin)
        )
        user = dict(cur.fetchone())
        return user

@router.get("/users")
def list_users(
    limit: int = Query(50, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    admin = Depends(require_admin)
):
    with db() as conn:
        cur = conn.cursor()

        where = "WHERE username ILIKE %s OR email ILIKE %s" if search else ""
        params = [f"%{search}%", f"%{search}%"] if search else []

        # Count
        cur.execute(f"SELECT COUNT(*) FROM app_user {where}", params)
        total = cur.fetchone()["count"]

        # List
        sql = f"""
            SELECT id, username, email, is_admin, created_at
            FROM app_user
            {where}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(sql, params + [limit, offset])
        items = [dict(r) for r in cur.fetchall()]

        return {"total": total, "items": items}

@router.put("/users/{user_id}")
def update_user(user_id: int, updates: UserUpdate, admin = Depends(require_admin)):
    with db() as conn:
        cur = conn.cursor()

        set_parts = []
        params = []
        if updates.username:
            set_parts.append("username = %s")
            params.append(updates.username)
        if updates.email:
            set_parts.append("email = %s")
            params.append(updates.email)

        if not set_parts:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(user_id)
        sql = f"UPDATE app_user SET {', '.join(set_parts)} WHERE id = %s RETURNING id, username, email, is_admin"

        try:
            cur.execute(sql, params)
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            return dict(row)
        except Exception as e:
            if "unique" in str(e).lower():
                raise HTTPException(status_code=409, detail="Username or email already exists")
            raise

@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, admin = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    with db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM app_user WHERE id = %s", (user_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: int, data: PasswordReset, admin = Depends(require_admin)):
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    with db() as conn:
        cur = conn.cursor()
        hashed = hash_password(data.new_password)
        cur.execute(
            "UPDATE app_user SET password_hash = %s WHERE id = %s",
            (hashed, user_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "Password updated"}
