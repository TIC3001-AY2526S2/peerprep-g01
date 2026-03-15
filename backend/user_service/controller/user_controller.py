import bcrypt
from bson import ObjectId
from fastapi import HTTPException, status

from user_service.model.repository import (
    create_user,
    delete_user_by_id,
    find_all_users,
    find_user_by_email,
    find_user_by_id,
    find_user_by_username,
    find_user_by_username_or_email,
    update_user_by_id,
    update_user_privilege_by_id,
)


def format_user_response(user: dict) -> dict:
    """Mirrors formatUserResponse() in user-controller.js"""
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "isAdmin": user.get("isAdmin", False),
        "createdAt": user.get("createdAt"),
    }


def is_valid_object_id(id: str) -> bool:
    """Mirrors isValidObjectId() from mongoose"""
    try:
        ObjectId(id)
        return True
    except Exception:
        return False


async def create_user_handler(username: str, email: str, password: str) -> dict:
    try:
        if not username or not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="username and/or email and/or password are missing",
            )

        existing_user = await find_user_by_username_or_email(username, email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="username or email already exists",
            )

        salt = bcrypt.gensalt(10)
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

        created_user = await create_user(username, email, hashed_password)
        return {
            "message": f"Created new user {username} successfully",
            "data": format_user_response(created_user),
        }

    except HTTPException:
        raise
    except Exception as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error when creating new user!",
        )


async def get_user_handler(user_id: str) -> dict:
    try:
        if not is_valid_object_id(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        user = await find_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        return {"message": "Found user", "data": format_user_response(user)}

    except HTTPException:
        raise
    except Exception as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error when getting user!",
        )


async def get_all_users_handler() -> dict:
    try:
        users = await find_all_users()
        return {"message": "Found users", "data": [format_user_response(u) for u in users]}

    except Exception as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error when getting all users!",
        )


async def update_user_handler(user_id: str, username: str = None, email: str = None, password: str = None) -> dict:
    try:
        if not username and not email and not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No field to update: username and email and password are all missing!",
            )

        if not is_valid_object_id(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        user = await find_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        if username or email:
            if username:
                existing = await find_user_by_username(username)
                if existing and str(existing["_id"]) != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="username already exists",
                    )
            if email:
                existing = await find_user_by_email(email)
                if existing and str(existing["_id"]) != user_id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="email already exists",
                    )

        hashed_password = None
        if password:
            salt = bcrypt.gensalt(10)
            hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

        updated_user = await update_user_by_id(user_id, username, email, hashed_password)
        return {
            "message": f"Updated data for user {user_id}",
            "data": format_user_response(updated_user),
        }

    except HTTPException:
        raise
    except Exception as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error when updating user!",
        )


async def update_user_privilege_handler(user_id: str, is_admin) -> dict:
    try:
        if is_admin is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="isAdmin is missing!",
            )

        if not is_valid_object_id(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        user = await find_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        updated_user = await update_user_privilege_by_id(user_id, is_admin is True)
        return {
            "message": f"Updated privilege for user {user_id}",
            "data": format_user_response(updated_user),
        }

    except HTTPException:
        raise
    except Exception as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error when updating user privilege!",
        )


async def delete_user_handler(user_id: str) -> dict:
    try:
        if not is_valid_object_id(user_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        user = await find_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found",
            )

        await delete_user_by_id(user_id)
        return {"message": f"Deleted user {user_id} successfully"}

    except HTTPException:
        raise
    except Exception as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unknown error when deleting user!",
        )
