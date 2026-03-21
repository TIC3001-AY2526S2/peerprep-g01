from fastapi import APIRouter, Depends

from controller.auth_controller import handle_login, handle_verify_token
from middleware.basic_access_control import verify_access_token, verify_is_admin
from models import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(payload: LoginRequest):
    """Mirrors: router.post("/login", handleLogin)"""
    return await handle_login(str(payload.email), payload.password)


@router.get("/verify-token")
async def verify_token(current_user: dict = Depends(verify_access_token)):
    """Mirrors: router.get("/verify-token", verifyAccessToken, handleVerifyToken)"""
    return await handle_verify_token(current_user)

@router.get("/verify-admin")
async def verify_admin_internal(user: dict = Depends(verify_is_admin)):
    return {"id": user["id"], "username": user["username"], "isAdmin": True}