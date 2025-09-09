from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
import os
from contextlib import asynccontextmanager
from datetime import datetime

from app.api import api_router
from app.core.config import settings
from app.db.database import create_tables
from app.middleware.rate_limiter import rate_limit_middleware
from app.middleware.security import security_headers_middleware, request_size_middleware
from app.middleware.auth import auth_middleware

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FlowQuest server", version="0.1.0")
    await create_tables()
    yield
    # Shutdown
    logger.info("Shutting down FlowQuest server")

# Create FastAPI app
app = FastAPI(
    title="FlowQuest API",
    description="Video-as-a-Primitive: Generate, edit, and export interactive video content",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Custom security middleware (in order)
app.middleware("http")(request_size_middleware)
app.middleware("http")(rate_limit_middleware) 
app.middleware("http")(security_headers_middleware)
app.middleware("http")(auth_middleware)

# Include API routes
app.include_router(api_router, prefix="/v1")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc, path=str(request.url))
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "FlowQuest API",
        "version": "0.1.0",
        "description": "Video-as-a-Primitive platform",
        "docs_url": "/docs"
    }
