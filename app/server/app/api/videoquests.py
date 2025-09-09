from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Dict, Any
import structlog
import uuid
import time
import asyncio

from app.engines.planner import PlannerEngine
from app.engines.renderer import RendererEngine  
from app.engines.verifier import VerifierEngine
from app.engines.exporter import ExporterEngine

# Import schemas from common schemas (we'll create a local copy for now)
from pydantic import BaseModel
from typing import List, Optional

# Simplified schemas for now - would import from common-schemas in production
class GenerateRequest(BaseModel):
    template_key: str
    inputs: Dict[str, Any]
    constraints: Optional[Dict[str, Any]] = None

class Checkpoint(BaseModel):
    id: str
    label: str
    type: str
    options: Optional[List[str]] = None

class GenerateResponse(BaseModel):
    quest_id: str
    checkpoints: List[Checkpoint]
    shotgraph_preview_url: str

class AnswerStepRequest(BaseModel):
    quest_id: str
    step_id: str
    value: Any

class DeltaShot(BaseModel):
    id: str
    url: str

class AnswerStepResponse(BaseModel):
    delta_shots: List[DeltaShot]
    new_preview_url: str
    render_time_ms: Optional[int] = None

class VerifyRequest(BaseModel):
    quest_id: str

class VerificationResult(BaseModel):
    passed: bool
    issues: List[str]
    fixes: List[str]

class ExportRequest(BaseModel):
    quest_id: str
    formats: List[str]
    include_receipt: bool = True

class ExportResponse(BaseModel):
    artifacts: Dict[str, Optional[str]]
    receipt: Optional[Dict[str, Any]] = None

router = APIRouter()
logger = structlog.get_logger()

# Mock storage for demo purposes
quest_storage: Dict[str, Dict[str, Any]] = {}

@router.post("/generate", response_model=GenerateResponse)
async def generate_videoquest(
    request: GenerateRequest,
    background_tasks: BackgroundTasks
) -> GenerateResponse:
    """
    Generate a new video quest from a template.
    
    Example:
    ```json
    {
        "template_key": "sales_quote_v1",
        "inputs": {
            "company": "Acme Corp",
            "seats": 25,
            "region": "EU",
            "budget": 16000
        }
    }
    ```
    """
    try:
        quest_id = f"q_{uuid.uuid4().hex[:8]}"
        logger.info("Generating quest", quest_id=quest_id, template=request.template_key)
        
        # Initialize engines
        planner = PlannerEngine()
        renderer = RendererEngine()
        
        # Generate plan and shot graph
        plan_result = await planner.generate_plan(
            template_key=request.template_key,
            inputs=request.inputs,
            constraints=request.constraints or {}
        )
        
        # Store quest data
        quest_storage[quest_id] = {
            "template_key": request.template_key,
            "inputs": request.inputs,
            "plan": plan_result,
            "status": "preview",
            "created_at": time.time()
        }
        
        # Start background rendering of preview
        background_tasks.add_task(
            _generate_preview,
            quest_id=quest_id,
            shot_graph=plan_result["shot_graph"]
        )
        
        # Mock response for now
        response = GenerateResponse(
            quest_id=quest_id,
            checkpoints=[
                Checkpoint(id="budget", label="Budget", type="currency"),
                Checkpoint(id="scope", label="Scope", type="text"),
                Checkpoint(id="timeline", label="Timeline", type="date")
            ],
            shotgraph_preview_url=f"https://cdn.flowquest.dev/preview/{quest_id}/master.m3u8"
        )
        
        return response
        
    except Exception as e:
        logger.error("Failed to generate quest", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/answer-step", response_model=AnswerStepResponse)
async def answer_step(
    request: AnswerStepRequest,
    background_tasks: BackgroundTasks
) -> AnswerStepResponse:
    """
    Answer a checkpoint step and trigger delta rendering.
    
    Example:
    ```json
    {
        "quest_id": "q_12345678",
        "step_id": "budget",
        "value": 14000
    }
    ```
    """
    try:
        if request.quest_id not in quest_storage:
            raise HTTPException(status_code=404, detail="Quest not found")
            
        start_time = time.time()
        logger.info("Processing step answer", quest_id=request.quest_id, step_id=request.step_id)
        
        # Mock delta rendering logic
        delta_shots = [
            DeltaShot(
                id="s2",
                url=f"https://cdn.flowquest.dev/delta/{request.quest_id}/s2.m3u8"
            )
        ]
        
        render_time_ms = int((time.time() - start_time) * 1000)
        
        response = AnswerStepResponse(
            delta_shots=delta_shots,
            new_preview_url=f"https://cdn.flowquest.dev/preview/{request.quest_id}/v2.m3u8",
            render_time_ms=render_time_ms
        )
        
        return response
        
    except Exception as e:
        logger.error("Failed to answer step", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify", response_model=VerificationResult)
async def verify_quest(request: VerifyRequest) -> VerificationResult:
    """
    Verify a quest's completeness and validity.
    """
    try:
        if request.quest_id not in quest_storage:
            raise HTTPException(status_code=404, detail="Quest not found")
            
        logger.info("Verifying quest", quest_id=request.quest_id)
        
        verifier = VerifierEngine()
        result = await verifier.verify_quest(request.quest_id)
        
        return result
        
    except Exception as e:
        logger.error("Failed to verify quest", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export", response_model=ExportResponse)
async def export_quest(
    request: ExportRequest,
    background_tasks: BackgroundTasks
) -> ExportResponse:
    """
    Export a quest to various formats (PDF, ICS, MD, CSV).
    
    Example:
    ```json
    {
        "quest_id": "q_12345678",
        "formats": ["pdf", "ics", "md"],
        "include_receipt": true
    }
    ```
    """
    try:
        if request.quest_id not in quest_storage:
            raise HTTPException(status_code=404, detail="Quest not found")
            
        logger.info("Exporting quest", quest_id=request.quest_id, formats=request.formats)
        
        exporter = ExporterEngine()
        result = await exporter.export_quest(
            quest_id=request.quest_id,
            formats=request.formats,
            include_receipt=request.include_receipt
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to export quest", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

async def _generate_preview(quest_id: str, shot_graph: Dict[str, Any]):
    """Background task to generate video preview."""
    logger.info("Generating preview", quest_id=quest_id)
    # Mock preview generation
    await asyncio.sleep(2)  # Simulate rendering time
    logger.info("Preview ready", quest_id=quest_id)
