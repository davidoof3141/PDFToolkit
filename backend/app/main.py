from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from .api.routes import router as api_router
from .core.config import get_settings
from .services.cleanup_service import CleanupService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# Global cleanup service instance
cleanup_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global cleanup_service

    # Startup
    logger.info("Starting PDFToolkit API...")

    # Ensure directories exist
    settings.uploads_dir.mkdir(exist_ok=True)
    settings.output_dir.mkdir(exist_ok=True)

    # Initialize and start cleanup service
    if settings.cleanup_enabled:
        cleanup_service = CleanupService(settings.uploads_dir, settings.output_dir)
        await cleanup_service.start_cleanup_scheduler(
            settings.cleanup_interval_minutes, settings.max_file_age_minutes
        )
        logger.info("Cleanup service started")

    yield

    # Shutdown
    logger.info("Shutting down PDFToolkit API...")
    if cleanup_service:
        await cleanup_service.stop_cleanup_scheduler()
        logger.info("Cleanup service stopped")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS setup (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to PDFToolkit API"}
