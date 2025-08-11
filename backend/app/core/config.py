from pydantic import BaseModel
from functools import lru_cache
from pathlib import Path
from typing import List
import os


class Settings(BaseModel):
    app_name: str = "PDFToolkit API"
    environment: str = os.getenv("ENVIRONMENT", "dev")
    debug: bool = environment == "dev"
    version: str = "0.1.0"

    # File directories
    uploads_dir: Path = Path("uploads")
    output_dir: Path = Path("output")

    # Cleanup settings
    cleanup_enabled: bool = True
    cleanup_interval_minutes: int = int(
        os.getenv("CLEANUP_INTERVAL_MINUTES", "1440")
    )  # 24 hours
    max_file_age_minutes: int = int(
        os.getenv("MAX_FILE_AGE_MINUTES", "2880")
    )  # 48 hours
    
    # Security settings
    api_key: str = os.getenv("API_KEY", "your-secret-api-key-change-this")
    admin_api_key: str = os.getenv("ADMIN_API_KEY", "your-admin-secret-key")
    allowed_origins: List[str] = [
        origin.strip() 
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    ]
    
    # Rate limiting
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    rate_limit_window: int = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour


@lru_cache
def get_settings() -> Settings:
    return Settings()
