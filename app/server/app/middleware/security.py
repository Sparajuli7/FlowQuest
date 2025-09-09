"""
Security Middleware for FlowQuest
Implements security headers, CSP, and request validation.
"""

import re
from typing import List, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import structlog

from app.core.config import settings

logger = structlog.get_logger()

class SecurityMiddleware:
    """Security middleware for headers and request validation."""
    
    def __init__(self):
        self.allowed_origins = settings.CORS_ORIGINS
        self.allowed_hosts = settings.ALLOWED_HOSTS
        
    def get_security_headers(self) -> dict:
        """Get security headers to add to all responses."""
        return {
            # Prevent XSS attacks
            "X-XSS-Protection": "1; mode=block",
            
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            
            # Referrer policy
            "Referrer-Policy": "origin-when-cross-origin",
            
            # Content Security Policy
            "Content-Security-Policy": self.get_csp_header(),
            
            # HTTP Strict Transport Security (HSTS)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Permissions Policy
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            
            # Server identification
            "X-Powered-By": "FlowQuest",
            "Server": "FlowQuest/0.1.0"
        }
    
    def get_csp_header(self) -> str:
        """Generate Content Security Policy header."""
        # Base CSP for API endpoints
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Relaxed for dev
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "media-src 'self' https: blob:",
            "connect-src 'self' ws: wss: https:",
            "worker-src 'self' blob:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        
        return "; ".join(csp_directives)
    
    def validate_host(self, request: Request) -> bool:
        """Validate request host against allowed hosts."""
        host = request.headers.get('host', '').lower()
        
        if not host:
            return False
        
        # Check exact matches
        if host in [h.lower() for h in self.allowed_hosts]:
            return True
        
        # Check wildcard patterns
        for allowed_host in self.allowed_hosts:
            if allowed_host.startswith('*.'):
                domain = allowed_host[2:].lower()
                if host.endswith('.' + domain) or host == domain:
                    return True
        
        return '*' in self.allowed_hosts
    
    def validate_origin(self, request: Request) -> bool:
        """Validate request origin for CORS."""
        origin = request.headers.get('origin')
        
        if not origin:
            return True  # Allow requests without origin (direct API calls)
        
        return origin in self.allowed_origins or '*' in self.allowed_origins
    
    def sanitize_user_agent(self, user_agent: str) -> str:
        """Sanitize user agent string for logging."""
        # Remove potentially harmful characters
        sanitized = re.sub(r'[<>"\'&]', '', user_agent)
        # Limit length
        return sanitized[:200] if sanitized else 'Unknown'
    
    def detect_suspicious_patterns(self, request: Request) -> List[str]:
        """Detect suspicious patterns in request."""
        warnings = []
        
        # Check for SQL injection patterns in query params
        query_string = str(request.query_params)
        sql_patterns = [
            r'union\s+select',
            r'insert\s+into',
            r'delete\s+from',
            r'drop\s+table',
            r'exec\s*\(',
            r'script\s*>',
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, query_string, re.IGNORECASE):
                warnings.append(f"Suspicious SQL pattern detected: {pattern}")
        
        # Check for XSS patterns
        xss_patterns = [
            r'<script[^>]*>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>',
        ]
        
        for pattern in xss_patterns:
            if re.search(pattern, query_string, re.IGNORECASE):
                warnings.append(f"Suspicious XSS pattern detected: {pattern}")
        
        # Check for excessive header size
        total_header_size = sum(len(k) + len(v) for k, v in request.headers.items())
        if total_header_size > 8192:  # 8KB limit
            warnings.append("Excessive header size")
        
        # Check user agent
        user_agent = request.headers.get('user-agent', '')
        if len(user_agent) > 500:
            warnings.append("Excessive user agent length")
        
        if any(suspicious in user_agent.lower() for suspicious in ['sqlmap', 'nikto', 'nmap']):
            warnings.append("Suspicious user agent")
        
        return warnings


# Global security middleware instance
security_middleware = SecurityMiddleware()


async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses."""
    
    # Validate host
    if not security_middleware.validate_host(request):
        logger.warning(
            "Invalid host header",
            host=request.headers.get('host'),
            path=request.url.path,
            ip=request.client.host if request.client else 'unknown'
        )
        return JSONResponse(
            status_code=400,
            content={
                "error": "Invalid host header",
                "code": "INVALID_HOST",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        )
    
    # Validate origin for CORS
    if not security_middleware.validate_origin(request):
        logger.warning(
            "Invalid origin",
            origin=request.headers.get('origin'),
            path=request.url.path,
            ip=request.client.host if request.client else 'unknown'
        )
        return JSONResponse(
            status_code=403,
            content={
                "error": "Origin not allowed",
                "code": "INVALID_ORIGIN",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        )
    
    # Check for suspicious patterns
    warnings = security_middleware.detect_suspicious_patterns(request)
    if warnings:
        logger.warning(
            "Suspicious request patterns detected",
            warnings=warnings,
            path=request.url.path,
            ip=request.client.host if request.client else 'unknown',
            user_agent=security_middleware.sanitize_user_agent(
                request.headers.get('user-agent', '')
            )
        )
        
        # For now, just log warnings. In production, might want to block
        # certain patterns or implement additional monitoring
    
    # Process request
    response = await call_next(request)
    
    # Add security headers
    security_headers = security_middleware.get_security_headers()
    for header_name, header_value in security_headers.items():
        response.headers[header_name] = header_value
    
    return response


class RequestSizeLimit:
    """Middleware to limit request size."""
    
    MAX_REQUEST_SIZE = 50 * 1024 * 1024  # 50MB limit
    
    @classmethod
    async def check_request_size(cls, request: Request) -> Optional[HTTPException]:
        """Check if request size exceeds limit."""
        content_length = request.headers.get('content-length')
        
        if content_length:
            try:
                size = int(content_length)
                if size > cls.MAX_REQUEST_SIZE:
                    logger.warning(
                        "Request size limit exceeded",
                        size=size,
                        limit=cls.MAX_REQUEST_SIZE,
                        path=request.url.path
                    )
                    return HTTPException(
                        status_code=413,
                        detail="Request entity too large"
                    )
            except ValueError:
                logger.warning("Invalid content-length header", content_length=content_length)
        
        return None


async def request_size_middleware(request: Request, call_next):
    """Check request size limits."""
    size_error = await RequestSizeLimit.check_request_size(request)
    if size_error:
        return JSONResponse(
            status_code=size_error.status_code,
            content={
                "error": size_error.detail,
                "code": "REQUEST_TOO_LARGE",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        )
    
    return await call_next(request)
