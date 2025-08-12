"""Security middleware and dependencies for API protection."""

from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import secrets
from ..core.config import get_settings

settings = get_settings()
security = HTTPBearer()


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> bool:
    """Verify API key for general endpoints."""
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Include X-API-Key header.",
        )
    
    if not secrets.compare_digest(x_api_key, settings.api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )
    
    return True


def verify_admin_api_key(x_api_key: Optional[str] = Header(None)) -> bool:
    """Verify admin API key for sensitive endpoints like cleanup."""
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Admin API key required. Include X-API-Key header.",
        )
    
    if not secrets.compare_digest(x_api_key, settings.admin_api_key):
        raise HTTPException(
            status_code=403,
            detail="Admin access required. Invalid admin API key.",
        )
    
    return True


def verify_bearer_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> bool:
    """Alternative Bearer token authentication."""
    token = credentials.credentials
    
    if not secrets.compare_digest(token, settings.api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid bearer token",
        )
    
    return True


# Dependency aliases for easier use
RequireAPIKey = Depends(verify_api_key)
RequireAdminKey = Depends(verify_admin_api_key)
RequireBearerToken = Depends(verify_bearer_token)
