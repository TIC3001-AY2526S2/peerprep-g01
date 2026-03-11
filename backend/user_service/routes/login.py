from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from user_service.models.models import LoginRequest, RegisterRequest

from user_service.services.auth_services import (
    login_service,
    register_service,
    get_profile_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", summary="Register a new user")
async def register_user(payload: RegisterRequest):
    return await register_service(payload)


@router.post("/login", summary="Login with email and password")
async def login_user(payload: LoginRequest):
    return await login_service(payload)


@router.get("/profile", summary="Get current user profile")
async def get_profile(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    return await get_profile_service(token)
