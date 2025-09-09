from typing import List, Optional
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from pydantic import Field
import os

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "FlowQuest"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # Redis
    REDIS_URL: str = Field("redis://localhost:6379", env="REDIS_URL")
    
    # Storage
    S3_ENDPOINT: str = Field(..., env="S3_ENDPOINT")
    S3_ACCESS_KEY: str = Field(..., env="S3_ACCESS_KEY")
    S3_SECRET_KEY: str = Field(..., env="S3_SECRET_KEY")
    S3_BUCKET: str = Field("flowquest", env="S3_BUCKET")
    
    # Security
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # CORS and Security
    CORS_ORIGINS: List[str] = Field(["http://localhost:3000"], env="CORS_ALLOWLIST")
    ALLOWED_HOSTS: List[str] = Field(["*"], env="ALLOWED_HOSTS")
    
    # LLM Providers
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    
    # TTS Providers
    ELEVENLABS_API_KEY: Optional[str] = Field(None, env="ELEVENLABS_API_KEY")
    COQUI_URL: Optional[str] = Field(None, env="COQUI_URL")
    
    # Feature Flags
    SAFE_MODE: bool = Field(False, env="SAFE_MODE")
    HQ_RENDER_ENABLED: bool = Field(False, env="HQ_RENDER_ENABLED")
    
    # Performance
    MAX_CONCURRENT_RENDERS: int = Field(4, env="MAX_CONCURRENT_RENDERS")
    RATE_LIMIT_PER_MINUTE: int = Field(60, env="RATE_LIMIT_PER_MINUTE")
    
    # Timeouts (seconds)
    LLM_TIMEOUT: int = 30
    RENDER_TIMEOUT: int = 180
    EXPORT_TIMEOUT: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()
