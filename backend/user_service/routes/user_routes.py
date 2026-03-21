from fastapi import APIRouter, Depends

from controller.user_controller import (
    create_user_handler,
    delete_user_handler,
    get_all_users_handler,
    get_user_handler,
    update_user_handler,
    update_user_privilege_handler,
)
from middleware.basic_access_control import (
    verify_access_token,
    verify_is_admin,
    verify_is_owner_or_admin,
)
from models import RegisterRequest, UpdateUserRequest, UpdatePrivilegeRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", status_code=201)
async def create_user(payload: RegisterRequest):
    """Mirrors: router.post("/", createUser)"""
    return await create_user_handler(payload.username, payload.email, payload.password)


@router.get("/")
async def get_all_users(_: dict = Depends(verify_is_admin)):
    """Mirrors: router.get("/", verifyAccessToken, verifyIsAdmin, getAllUsers)"""
    return await get_all_users_handler()


# Note: /:id/privilege must be defined BEFORE /:id to avoid FastAPI
# matching "privilege" as a user_id
@router.patch("/{user_id}/privilege")
async def update_user_privilege(
    user_id: str,
    payload: UpdatePrivilegeRequest,
    _: dict = Depends(verify_is_admin),
):
    """Mirrors: router.patch("/:id/privilege", verifyAccessToken, verifyIsAdmin, updateUserPrivilege)"""
    return await update_user_privilege_handler(user_id, payload.isAdmin)


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(verify_access_token),
):
    """Mirrors: router.get("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, getUser)"""
    verify_is_owner_or_admin(user_id, current_user)
    return await get_user_handler(user_id)


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    current_user: dict = Depends(verify_access_token),
):
    """Mirrors: router.patch("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, updateUser)"""
    verify_is_owner_or_admin(user_id, current_user)
    return await update_user_handler(
        user_id,
        payload.username,
        payload.email,
        payload.password,
    )


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(verify_access_token),
):
    """Mirrors: router.delete("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, deleteUser)"""
    verify_is_owner_or_admin(user_id, current_user)
    return await delete_user_handler(user_id)
