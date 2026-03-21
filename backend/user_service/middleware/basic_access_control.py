import os
from typing import Optional

from bson import ObjectId
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

from model.repository import find_user_by_id


async def verify_access_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Mirrors verifyAccessToken middleware.
    Extracts + verifies the JWT, loads the latest user from DB,
    and returns the user dict (equivalent of setting req.user).
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

    # Authorization: Bearer <token>
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

    token = parts[1]
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

    # Load latest user info from DB
    db_user = await find_user_by_id(payload.get("id"))
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

    # Return the same shape as req.user in Node
    return {
        "id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "isAdmin": db_user.get("isAdmin", False),
    }


async def verify_is_admin(current_user: dict = Depends(verify_access_token)) -> dict:
    """Mirrors verifyIsAdmin middleware."""
    if not current_user.get("isAdmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    return current_user


def verify_is_owner_or_admin(user_id: str, current_user: dict = Depends(verify_access_token)) -> dict:
    """
    Mirrors verifyIsOwnerOrAdmin middleware.
    user_id comes from the path parameter (equivalent of req.params.id).
    """
    if current_user.get("isAdmin"):
        return current_user

    if current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )

    return current_user
