from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str
    REDIS_URL: str = "redis://redis:6379/0"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    class Config:
        env_file = ".env"

settings = Settings()