from fastapi import APIRouter, Depends

from controller.auth_controller import handle_login, handle_verify_token
from middleware.basic_access_control import verify_access_token, verify_is_admin
from fastapi.security import HTTPBearer
from models import LoginRequest

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(payload: LoginRequest):
    """Mirrors: router.post("/login", handleLogin)"""
    return await handle_login(str(payload.email), payload.password)

@router.get("/verify-token", dependencies=[Depends(security)])
async def verify_token(current_user: dict = Depends(verify_access_token)):
    return await handle_verify_token(current_user)

@router.get("/verify-admin", dependencies=[Depends(security)])
async def verify_admin_internal(user: dict = Depends(verify_is_admin)):
    return {"id": user["id"], "username": user["username"], "isAdmin": True}