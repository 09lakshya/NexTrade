from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import re
from services.auth_service import (
    signup,
    login,
    get_user,
    update_profile,
    change_password,
    create_token,
    verify_token,
)

router = APIRouter(prefix="/auth")


class SignupInput(BaseModel):
    email: str
    password: str
    name: str
    age: int


class LoginInput(BaseModel):
    email: str
    password: str


class UpdateProfileInput(BaseModel):
    name: str


class ChangePasswordInput(BaseModel):
    current_password: str
    new_password: str


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _is_valid_email(email: str) -> bool:
    return bool(email and EMAIL_RE.match(email.strip()))


def _require_user_id(authorization: Optional[str]) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


@router.post("/signup")
def handle_signup(payload: SignupInput):
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if not _is_valid_email(payload.email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
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
    if not _is_valid_email(payload.email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    user = login(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    return {"token": token, "user": user}


@router.get("/me")
def handle_me(authorization: Optional[str] = Header(None)):
    user_id = _require_user_id(authorization)

    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.patch("/profile")
def handle_update_profile(payload: UpdateProfileInput, authorization: Optional[str] = Header(None)):
    user_id = _require_user_id(authorization)
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    user = update_profile(user_id, payload.name)
    if user is None:
        raise HTTPException(status_code=400, detail="Could not update profile")
    return user


@router.post("/change-password")
def handle_change_password(payload: ChangePasswordInput, authorization: Optional[str] = Header(None)):
    user_id = _require_user_id(authorization)
    if not payload.current_password or not payload.new_password:
        raise HTTPException(status_code=400, detail="Both current and new password are required")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    ok = change_password(user_id, payload.current_password, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    return {"success": True}
