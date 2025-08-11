from fastapi import FastAPI
from .api.routes import router as api_router
from .core.config import get_settings


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug,
)

app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to PDFToolkit API"}
