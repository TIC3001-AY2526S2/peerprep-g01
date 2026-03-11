import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from user_service.models.models import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserProfile,
)

#Config
SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production-use-env-var")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#  In-memory "database" (replace with real DB later)
USERS_DB: dict[str, dict] = {}


#  Helpers 
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# RBAC 
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "admin": ["read", "write", "delete", "manage_users"],
    "user":  ["read", "write"],
    "guest": ["read"],
}


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, [])


def require_permission(role: str, permission: str) -> None:
    if not has_permission(role, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{role}' lacks '{permission}' permission",
        )


# Services
async def register_service(payload: RegisterRequest) -> AuthResponse:
    if any(u["email"].lower() == payload.email.lower() for u in USERS_DB.values()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )

    user_id = str(uuid.uuid4())
    USERS_DB[user_id] = {
        "id": user_id,
        "username": payload.username,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "role": payload.role if payload.role in ROLE_PERMISSIONS else "user",
    }

    token = create_access_token({"sub": user_id, "role": USERS_DB[user_id]["role"]})
    user = UserProfile(**{k: v for k, v in USERS_DB[user_id].items() if k != "hashed_password"})

    return AuthResponse(message="Registration successful", access_token=token, user=user)


async def login_service(payload: LoginRequest) -> AuthResponse:
    user_record = next(
        (u for u in USERS_DB.values() if u["email"].lower() == payload.email.lower()), None
    )

    if not user_record or not verify_password(payload.password, user_record["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": user_record["id"], "role": user_record["role"]})
    user = UserProfile(**{k: v for k, v in user_record.items() if k != "hashed_password"})

    return AuthResponse(message="Login successful", access_token=token, user=user)


async def get_profile_service(token: str) -> UserProfile:
    payload = decode_token(token)
    user_id: Optional[str] = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )

    user_record = USERS_DB.get(user_id)

    if not user_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserProfile(**{k: v for k, v in user_record.items() if k != "hashed_password"})
