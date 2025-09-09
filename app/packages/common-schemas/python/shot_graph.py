from typing import List, Dict, Any, Union, Tuple, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class Overlay(BaseModel):
    type: Literal['title', 'figure', 'caption', 'map']
    # Allow additional fields
    model_config = {"extra": "allow"}

class Shot(BaseModel):
    id: str
    step_ids: List[str] = Field(description="Steps that can invalidate this shot")
    seed: int
    bindings: Dict[str, Any]
    duration: float = Field(description="Duration in seconds")
    overlays: List[Overlay]

class ShotGraph(BaseModel):
    version: str
    shots: List[Shot]
    edges: List[Tuple[str, str]] = Field(description="Shot dependency edges")

# Step value types for checkpoints
StepValue = Union[str, int, float, bool, List[str], Dict[str, Any]]

class Checkpoint(BaseModel):
    id: str
    label: str
    type: Literal['number', 'text', 'select', 'multiselect', 'date', 'currency', 'url']
    options: Optional[List[str]] = None
    min: Optional[float] = None
    max: Optional[float] = None
    placeholder: Optional[str] = None
    required: bool = True
