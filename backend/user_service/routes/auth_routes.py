from fastapi import APIRouter, Depends

from user_service.controller.auth_controller import handle_login, handle_verify_token
from user_service.middleware.basic_access_control import verify_access_token
from user_service.models import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(payload: LoginRequest):
    """Mirrors: router.post("/login", handleLogin)"""
    return await handle_login(payload.email, payload.password)


@router.get("/verify-token")
async def verify_token(current_user: dict = Depends(verify_access_token)):
    """Mirrors: router.get("/verify-token", verifyAccessToken, handleVerifyToken)"""
    return await handle_verify_token(current_user)
