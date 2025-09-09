"""
Authentication Middleware for FlowQuest
Implements JWT-based authentication with demo mode support.
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

from app.core.config import settings

logger = structlog.get_logger()
security = HTTPBearer(auto_error=False)

class JWTAuth:
    """JWT Authentication handler."""
    
    def __init__(self):
        self.secret_key = settings.JWT_SECRET
        self.algorithm = settings.JWT_ALGORITHM
        self.expiration_hours = settings.JWT_EXPIRATION_HOURS
    
    def create_token(self, user_data: Dict[str, Any]) -> str:
        """Create JWT token for user."""
        payload = {
            "user_id": user_data["id"],
            "email": user_data.get("email"),
            "is_demo": user_data.get("is_demo", False),
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=self.expiration_hours)
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                return None
            
            return payload
            
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid JWT token", error=str(e))
            return None
    
    def create_demo_user(self) -> Dict[str, Any]:
        """Create demo user data."""
        return {
            "id": "demo_user",
            "email": "demo@flowquest.dev",
            "is_demo": True,
            "is_active": True
        }
    
    def create_demo_token(self) -> str:
        """Create demo token for anonymous users."""
        demo_user = self.create_demo_user()
        return self.create_token(demo_user)


# Global JWT auth instance
jwt_auth = JWTAuth()


class AuthUser:
    """Authenticated user information."""
    
    def __init__(self, user_id: str, email: str = None, is_demo: bool = False):
        self.user_id = user_id
        self.email = email
        self.is_demo = is_demo
        self.is_authenticated = True
    
    def __str__(self):
        return f"AuthUser(id={self.user_id}, demo={self.is_demo})"


class AnonymousUser:
    """Anonymous user for demo mode."""
    
    def __init__(self):
        self.user_id = None
        self.email = None
        self.is_demo = True
        self.is_authenticated = False
    
    def __str__(self):
        return "AnonymousUser(demo=True)"


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthUser:
    """Get current authenticated user or demo user."""
    
    # Check for JWT token in Authorization header
    if credentials:
        token_data = jwt_auth.verify_token(credentials.credentials)
        if token_data:
            return AuthUser(
                user_id=token_data["user_id"],
                email=token_data.get("email"),
                is_demo=token_data.get("is_demo", False)
            )
    
    # Check for demo mode (anonymous access allowed)
    if _is_demo_mode_allowed(request):
        return AnonymousUser()
    
    # No valid authentication found
    raise HTTPException(
        status_code=401,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_authenticated_user(
    current_user: AuthUser = Depends(get_current_user)
) -> AuthUser:
    """Get authenticated user (no anonymous access)."""
    if not current_user.is_authenticated:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return current_user


def _is_demo_mode_allowed(request: Request) -> bool:
    """Check if demo mode is allowed for this endpoint."""
    # Allow demo mode for most endpoints except sensitive operations
    path = request.url.path
    
    # Endpoints that require authentication
    auth_required_paths = [
        '/v1/users/profile',
        '/v1/admin/',
        '/v1/billing/',
    ]
    
    for auth_path in auth_required_paths:
        if path.startswith(auth_path):
            return False
    
    # Demo mode allowed for all other endpoints
    return True


async def auth_middleware(request: Request, call_next):
    """Authentication middleware that sets user context."""
    
    # Skip auth for public endpoints
    if _is_public_endpoint(request.url.path):
        return await call_next(request)
    
    try:
        # Try to get user from request
        credentials = None
        auth_header = request.headers.get('authorization')
        if auth_header and auth_header.startswith('Bearer '):
            credentials = HTTPAuthorizationCredentials(
                scheme='Bearer',
                credentials=auth_header.split(' ', 1)[1]
            )
        
        # Get current user (authenticated or anonymous)
        if credentials:
            token_data = jwt_auth.verify_token(credentials.credentials)
            if token_data:
                user = AuthUser(
                    user_id=token_data["user_id"],
                    email=token_data.get("email"),
                    is_demo=token_data.get("is_demo", False)
                )
            else:
                user = AnonymousUser() if _is_demo_mode_allowed(request) else None
        else:
            user = AnonymousUser() if _is_demo_mode_allowed(request) else None
        
        # Set user in request state
        request.state.user = user
        if user:
            request.state.user_id = user.user_id
        
        # Process request
        response = await call_next(request)
        
        return response
        
    except Exception as e:
        logger.error("Authentication middleware error", error=str(e))
        # Continue without user context on auth errors for public endpoints
        request.state.user = AnonymousUser()
        return await call_next(request)


def _is_public_endpoint(path: str) -> bool:
    """Check if endpoint is public (no auth required)."""
    public_endpoints = [
        '/health',
        '/docs',
        '/redoc', 
        '/openapi.json',
        '/static/',
        '/v1/auth/login',
        '/v1/auth/register',
        '/v1/auth/demo',
    ]
    
    return any(path.startswith(endpoint) for endpoint in public_endpoints)


# Utility functions for creating auth tokens
def create_user_token(user_data: Dict[str, Any]) -> str:
    """Create JWT token for user."""
    return jwt_auth.create_token(user_data)


def create_demo_token() -> str:
    """Create demo token."""
    return jwt_auth.create_demo_token()


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token."""
    return jwt_auth.verify_token(token)
