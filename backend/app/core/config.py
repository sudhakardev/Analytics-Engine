"""
Application Configuration - Environment-based settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Future Decision Engine"
    DEBUG: bool = False

    # Database
    # Default to SQLite for local dev; override with PostgreSQL in Docker via .env
    DATABASE_URL: str = "sqlite+aiosqlite:///./fde_local.db"

    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://frontend:5173",
    ]

    # ML
    MODEL_SAVE_PATH: str = "./ml/saved_models"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Decision thresholds
    HIGH_CONFIDENCE_THRESHOLD: float = 0.75
    LOW_CONFIDENCE_THRESHOLD: float = 0.40

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
os.makedirs(settings.MODEL_SAVE_PATH, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
