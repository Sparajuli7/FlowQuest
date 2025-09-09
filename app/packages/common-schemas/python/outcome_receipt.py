from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class StepTaken(BaseModel):
    id: str
    value: Any

class Artifacts(BaseModel):
    pdf: Optional[str] = None
    ics: Optional[str] = None
    md: Optional[str] = None
    csv: Optional[str] = None

class Versions(BaseModel):
    planner: str
    renderer: str
    exporter: str
    template: str

class OutcomeReceipt(BaseModel):
    quest_id: str
    template: str = Field(description="Template key with version, e.g., sales_quote_v1@1.0.0")
    shotgraph_hash: str = Field(description="SHA256 hash of the final shot graph")
    steps_taken: List[StepTaken]
    checks: List[str] = Field(description="Verification checks that passed")
    artifacts: Artifacts
    versions: Versions
    signature: Optional[str] = Field(None, description="Future signing capability")
    timestamp: datetime

class VerificationResult(BaseModel):
    passed: bool
    issues: List[str]
    fixes: List[str]
