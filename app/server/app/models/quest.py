"""Quest model for video quests."""

from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base

class QuestStatus(enum.Enum):
    PREVIEW = "preview"
    RENDERING = "rendering"
    READY = "ready"
    EXPORTING = "exporting"
    COMPLETED = "completed"
    FAILED = "failed"

class Quest(Base):
    __tablename__ = "quests"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for demo mode
    template_key = Column(String, nullable=False)
    template_version = Column(String, nullable=False)
    
    # Quest data
    inputs = Column(JSON, nullable=False)
    constraints = Column(JSON, nullable=True)
    checkpoints = Column(JSON, nullable=False)
    steps_taken = Column(JSON, nullable=True, default=list)
    
    # Status and URLs
    status = Column(Enum(QuestStatus), default=QuestStatus.PREVIEW)
    preview_url = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    shots = relationship("Shot", back_populates="quest", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="quest", cascade="all, delete-orphan")
