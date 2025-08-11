from pydantic import BaseModel
from functools import lru_cache
import os


class Settings(BaseModel):
    app_name: str = "PDFToolkit API"
    environment: str = os.getenv("ENVIRONMENT", "dev")
    debug: bool = environment == "dev"
    version: str = "0.1.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()
