from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import db

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

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

@router.post("/register", status_code=201)
def register(data: RegisterSchema):
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
            INSERT INTO app_user (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, username, email, created_at
            """,
            (data.username, data.email, hashed)
        )
        user = dict(cur.fetchone())
        return user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, email, password_hash, is_admin FROM app_user WHERE username = %s",
            (form_data.username,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Incorrect username or password")

        user = dict(row)
        if not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Incorrect username or password")

        # Create token (sub must be string for JWT)
        token = create_access_token(data={"sub": str(user["id"])})

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "is_admin": user.get("is_admin", False)
            }
        }

@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    return user
