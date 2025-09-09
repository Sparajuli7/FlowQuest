"""Shot model for individual video segments."""

from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Integer, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Shot(Base):
    __tablename__ = "shots"
    
    id = Column(String, primary_key=True)
    quest_id = Column(String, ForeignKey("quests.id"), nullable=False)
    
    # Shot definition
    step_ids = Column(JSON, nullable=False)  # Array of step IDs that can invalidate this shot
    seed = Column(Integer, nullable=False)
    bindings = Column(JSON, nullable=False)
    duration = Column(Float, nullable=False)
    overlays = Column(JSON, nullable=False, default=list)
    
    # Rendering info
    render_url = Column(String, nullable=True)
    cache_key = Column(String, nullable=True)
    is_cached = Column(Boolean, default=False)
    render_time_ms = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quest = relationship("Quest", back_populates="shots")
