import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    PROJECT_NAME: str = "StudyPath API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    
    # Anthropic Claude API
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    
    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://studypath.vercel.app",
        "*"
    ]
    
    # Upload limits
    UPLOAD_MAX_SIZE_MB: int = 100
    DOCUMENT_RETENTION_DAYS: int = 30
    
    # Storage dir for local uploads / cache
    LOCAL_STORAGE_DIR: str = "./storage_data"

settings = Settings()
