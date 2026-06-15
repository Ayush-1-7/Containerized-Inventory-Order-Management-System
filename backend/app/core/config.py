"""Application configuration loaded exclusively from environment variables.

No credentials are ever hardcoded. See `.env.example` for the full reference.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_PREFIX: str = ""
    ENVIRONMENT: str = "development"

    # --- Database ---
    # Full SQLAlchemy URL. On most PaaS this is provided as DATABASE_URL.
    DATABASE_URL: str = "postgresql+psycopg2://ioms:ioms@db:5432/ioms"

    # --- CORS ---
    # Comma-separated list of allowed origins (the deployed frontend URL(s)).
    FRONTEND_ORIGIN: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"

    # --- Business rules ---
    LOW_STOCK_THRESHOLD: int = 10

    # --- Seed ---
    SEED_ON_STARTUP: bool = False

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_db_url(cls, v: str) -> str:
        # Render/Heroku hand out `postgres://` which SQLAlchemy 2.x rejects.
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg2://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
