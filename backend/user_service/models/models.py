from pydantic import BaseModel, EmailStr, field_validator
# Fix: Optional is no longer needed for these models (unused import removed)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"

    # Fix: strip whitespace from username to avoid storage of padded values
    @field_validator("username")
    @classmethod
    def username_must_not_be_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username must not be blank")
        return v


class UserProfile(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str


class AuthResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# Fix: ProfileResponse was defined but never used anywhere; kept for completeness
class ProfileResponse(BaseModel):
    user: UserProfile
