"""
Rate Limiting Middleware using Redis Token Bucket Algorithm
"""

import time
import json
from typing import Optional, Tuple
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
import redis
import structlog

from app.core.config import settings

logger = structlog.get_logger()

class RateLimiter:
    """Token bucket rate limiter using Redis."""
    
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.default_limit = settings.RATE_LIMIT_PER_MINUTE
        self.window_seconds = 60
        
    async def is_allowed(
        self, 
        key: str, 
        limit: Optional[int] = None, 
        window: Optional[int] = None
    ) -> Tuple[bool, dict]:
        """
        Check if request is allowed using token bucket algorithm.
        
        Returns:
            Tuple of (is_allowed, metadata_dict)
        """
        limit = limit or self.default_limit
        window = window or self.window_seconds
        
        current_time = time.time()
        bucket_key = f"rate_limit:{key}"
        
        try:
            # Get current bucket state
            bucket_data = self.redis.get(bucket_key)
            
            if bucket_data:
                bucket = json.loads(bucket_data)
                tokens = bucket.get('tokens', limit)
                last_refill = bucket.get('last_refill', current_time)
            else:
                tokens = limit
                last_refill = current_time
            
            # Calculate tokens to add based on time elapsed
            time_elapsed = current_time - last_refill
            tokens_to_add = (time_elapsed / window) * limit
            tokens = min(limit, tokens + tokens_to_add)
            
            # Check if request can be served
            if tokens >= 1:
                tokens -= 1
                allowed = True
            else:
                allowed = False
            
            # Update bucket state
            bucket_state = {
                'tokens': tokens,
                'last_refill': current_time
            }
            
            # Set expiration to window + 10 seconds for cleanup
            self.redis.setex(
                bucket_key, 
                window + 10,
                json.dumps(bucket_state)
            )
            
            metadata = {
                'limit': limit,
                'remaining': int(tokens),
                'reset': int(current_time + window),
                'retry_after': max(0, int((1 - tokens) / (limit / window))) if not allowed else 0
            }
            
            return allowed, metadata
            
        except redis.RedisError as e:
            logger.error("Redis error in rate limiter", error=str(e))
            # Fail open - allow request if Redis is down
            return True, {
                'limit': limit,
                'remaining': limit - 1,
                'reset': int(current_time + window),
                'retry_after': 0
            }
    
    def get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting."""
        # Try to get user ID from JWT (when auth is implemented)
        user_id = getattr(request.state, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            ip = forwarded_for.split(',')[0].strip()
        else:
            ip = request.client.host if request.client else 'unknown'
        
        return f"ip:{ip}"


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """FastAPI middleware for rate limiting."""
    
    # Skip rate limiting for health checks and static files
    if request.url.path in ['/health', '/docs', '/redoc', '/openapi.json']:
        return await call_next(request)
    
    if request.url.path.startswith('/static/'):
        return await call_next(request)
    
    # Get client identifier
    client_id = rate_limiter.get_client_id(request)
    
    # Check rate limit
    allowed, metadata = await rate_limiter.is_allowed(client_id)
    
    if not allowed:
        logger.warning(
            "Rate limit exceeded",
            client_id=client_id,
            path=request.url.path,
            method=request.method
        )
        
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "code": "RATE_LIMIT_EXCEEDED",
                "details": {
                    "limit": metadata['limit'],
                    "window": "60 seconds",
                    "retry_after": metadata['retry_after']
                },
                "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            },
            headers={
                "X-RateLimit-Limit": str(metadata['limit']),
                "X-RateLimit-Remaining": str(metadata['remaining']),
                "X-RateLimit-Reset": str(metadata['reset']),
                "Retry-After": str(metadata['retry_after'])
            }
        )
    
    # Process request
    response = await call_next(request)
    
    # Add rate limit headers to successful responses
    response.headers["X-RateLimit-Limit"] = str(metadata['limit'])
    response.headers["X-RateLimit-Remaining"] = str(metadata['remaining'])
    response.headers["X-RateLimit-Reset"] = str(metadata['reset'])
    
    return response


class RateLimitConfig:
    """Configuration for different rate limit tiers."""
    
    TIERS = {
        'anonymous': {'limit': 30, 'window': 60},      # 30/minute for anonymous
        'authenticated': {'limit': 100, 'window': 60}, # 100/minute for logged in
        'premium': {'limit': 500, 'window': 60},       # 500/minute for premium
        'api': {'limit': 1000, 'window': 60},          # 1000/minute for API keys
    }
    
    # Endpoint-specific limits
    ENDPOINTS = {
        '/v1/videoquests/generate': {'limit': 10, 'window': 300},      # 10 per 5 minutes
        '/v1/videoquests/answer-step': {'limit': 60, 'window': 60},    # 60 per minute
        '/v1/videoquests/export': {'limit': 20, 'window': 300},        # 20 per 5 minutes
    }
    
    @classmethod
    def get_limit_for_user(cls, user_tier: str = 'anonymous') -> dict:
        """Get rate limit config for user tier."""
        return cls.TIERS.get(user_tier, cls.TIERS['anonymous'])
    
    @classmethod
    def get_limit_for_endpoint(cls, endpoint: str) -> Optional[dict]:
        """Get specific rate limit for endpoint."""
        return cls.ENDPOINTS.get(endpoint)
