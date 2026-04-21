from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from services.auth_service import signup, login, get_user, create_token, verify_token

router = APIRouter(prefix="/auth")


class SignupInput(BaseModel):
    email: str
    password: str
    name: str
    age: int


class LoginInput(BaseModel):
    email: str
    password: str


@router.post("/signup")
def handle_signup(payload: SignupInput):
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if payload.age < 1 or payload.age > 150:
        raise HTTPException(status_code=400, detail="Please enter a valid age")

    user = signup(payload.email, payload.password, payload.name, payload.age)
    if user is None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    token = create_token(user["id"])
    return {"token": token, "user": user}


@router.post("/login")
def handle_login(payload: LoginInput):
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = login(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    return {"token": token, "user": user}


@router.get("/me")
def handle_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user
