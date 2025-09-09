from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime

from .shot_graph import Checkpoint, StepValue
from .outcome_receipt import OutcomeReceipt, VerificationResult, Artifacts

# Generate VideoQuest Request
class GenerateRequest(BaseModel):
    template_key: str
    inputs: Dict[str, Any]
    constraints: Optional[Dict[str, Any]] = None

# Generate VideoQuest Response
class GenerateResponse(BaseModel):
    quest_id: str
    checkpoints: List[Checkpoint]
    shotgraph_preview_url: HttpUrl

# Answer Step Request
class AnswerStepRequest(BaseModel):
    quest_id: str
    step_id: str
    value: StepValue

# Delta shot info
class DeltaShot(BaseModel):
    id: str
    url: HttpUrl

# Answer Step Response
class AnswerStepResponse(BaseModel):
    delta_shots: List[DeltaShot]
    new_preview_url: HttpUrl
    render_time_ms: Optional[int] = None

# Verify Request
class VerifyRequest(BaseModel):
    quest_id: str

# Export Request
class ExportRequest(BaseModel):
    quest_id: str
    formats: List[Literal['pdf', 'ics', 'md', 'csv']]
    include_receipt: bool = True

# Export Response
class ExportResponse(BaseModel):
    artifacts: Artifacts
    receipt: Optional[OutcomeReceipt] = None

# Error Response
class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
