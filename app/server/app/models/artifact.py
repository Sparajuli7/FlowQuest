"""Artifact model for exported files and outcome receipts."""

from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Enum, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base

class ArtifactType(enum.Enum):
    PDF = "pdf"
    ICS = "ics"
    MARKDOWN = "md"
    CSV = "csv"
    RECEIPT = "receipt"

class Artifact(Base):
    __tablename__ = "artifacts"
    
    id = Column(String, primary_key=True)
    quest_id = Column(String, ForeignKey("quests.id"), nullable=False)
    
    # Artifact info
    type = Column(Enum(ArtifactType), nullable=False)
    filename = Column(String, nullable=False)
    url = Column(String, nullable=False)
    content_hash = Column(String, nullable=True)  # SHA256 hash
    size_bytes = Column(Integer, nullable=True)
    
    # Receipt-specific data
    receipt_data = Column(JSON, nullable=True)  # For RECEIPT type artifacts
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    quest = relationship("Quest", back_populates="artifacts")
