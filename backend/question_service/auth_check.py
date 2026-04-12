import httpx
import os
from fastapi import Header, HTTPException

USER_SERVICE_VERIFY_TOKEN_URL = os.getenv("USER_SERVICE_VERIFY_TOKEN_URL")
USER_SERVICE_VERIFY_ADMIN_URL = os.getenv("USER_SERVICE_VERIFY_ADMIN_URL")

async def verify_access_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_VERIFY_TOKEN_URL, headers={"Authorization": authorization})
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User Service is unreachable")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")

    full_payload = response.json()

    user_data = full_payload.get("data")

    if user_data is None:
        user_data = full_payload

    if not user_data or not (user_data.get("username") or user_data.get("id")):
        raise HTTPException(status_code=401, detail="Could not retrieve user profile")

    return user_data


async def verify_is_admin(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(USER_SERVICE_VERIFY_ADMIN_URL, headers={"Authorization": authorization})
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="User Service is unreachable")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")

    # 1. Get the full JSON body
    full_payload = response.json()

    # 2. Try to find 'isAdmin' in the top level OR inside a 'data' key
    # This handles BOTH: {"isAdmin": true} AND {"data": {"isAdmin": true}}
    is_admin = full_payload.get("isAdmin")
    if is_admin is None and "data" in full_payload:
        is_admin = full_payload.get("data", {}).get("isAdmin")

    # 3. Final Check
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return full_payload