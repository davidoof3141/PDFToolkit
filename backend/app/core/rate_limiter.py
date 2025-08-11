"""Rate limiting middleware for API protection."""

import time
from collections import defaultdict, deque
from fastapi import HTTPException, Request
from typing import Dict, Deque
from ..core.config import get_settings

settings = get_settings()


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients: Dict[str, Deque[float]] = defaultdict(deque)
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if client is allowed to make a request."""
        now = time.time()
        client_requests = self.clients[client_id]
        
        # Remove old requests outside the window
        while client_requests and client_requests[0] <= now - self.window_seconds:
            client_requests.popleft()
        
        # Check if client has exceeded the limit
        if len(client_requests) >= self.max_requests:
            return False
        
        # Add current request
        client_requests.append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter(
    max_requests=settings.rate_limit_requests,
    window_seconds=settings.rate_limit_window
)


def check_rate_limit(request: Request) -> bool:
    """Middleware function to check rate limits."""
    client_ip = request.client.host if request.client else "unknown"
    
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {settings.rate_limit_requests} "
                   f"requests per {settings.rate_limit_window} seconds.",
        )
    
    return True
