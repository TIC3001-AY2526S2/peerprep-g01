import os
from datetime import datetime, timezone, timedelta

import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, status

from model.repository import find_user_by_email
from controller.user_controller import format_user_response


async def handle_login(email: str, password: str) -> dict:
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing email and/or password",
        )

    try:
        user = await find_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Wrong email and/or password",
            )

        match = bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8"))
        if not match:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Wrong email and/or password",
            )

        access_token = jwt.encode(
            {
                "id": str(user["_id"]),
                "exp": datetime.now(timezone.utc) + timedelta(days=1),  # "1d"
            },
            os.environ["JWT_SECRET"],
            algorithm="HS256",
        )

        return {
            "message": "User logged in",
            "data": {"accessToken": access_token, **format_user_response(user)},
        }

    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err),
        )


async def handle_verify_token(verified_user: dict) -> dict:
    try:
        return {"message": "Token verified", "data": verified_user}
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err),
        )
