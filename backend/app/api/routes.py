from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


@router.get("/version", tags=["meta"])
async def version():
    return {"version": "0.1.0"}
