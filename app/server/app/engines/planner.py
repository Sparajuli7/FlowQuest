"""
Planner Engine - Generates step plans and shot graphs from templates.
Provider-agnostic: can use OpenAI, Anthropic, or Safe Mode (templated heuristics).
"""

import structlog
from typing import Dict, Any, List
import json

from app.core.config import settings
from app.engines.llm_planner import LLMPlanner

logger = structlog.get_logger()

class PlannerEngine:
    """
    Planner engine that generates step plans and shot graphs.
    """
    
    def __init__(self):
        self.safe_mode = settings.SAFE_MODE
        self.llm_planner = LLMPlanner() if not self.safe_mode else None
        
    async def generate_plan(
        self,
        template_key: str,
        inputs: Dict[str, Any],
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a complete plan including steps and shot graph.
        """
        logger.info("Generating plan", template=template_key, safe_mode=self.safe_mode)
        
        if self.safe_mode:
            return await self._generate_safe_mode_plan(template_key, inputs, constraints)
        else:
            return await self._generate_llm_plan(template_key, inputs, constraints)
    
    async def _generate_safe_mode_plan(
        self,
        template_key: str,
        inputs: Dict[str, Any],
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate plan using templated heuristics (no external LLM).
        """
        # Mock implementation for sales_quote_v1
        if template_key == "sales_quote_v1":
            return {
                "steps": [
                    {
                        "id": "budget",
                        "label": "Budget",
                        "type": "currency",
                        "required": True,
                        "value": inputs.get("budget", 15000)
                    },
                    {
                        "id": "scope",
                        "label": "Project Scope",
                        "type": "text",
                        "required": True,
                        "value": f"Implementation for {inputs.get('company', 'client')}"
                    },
                    {
                        "id": "timeline",
                        "label": "Timeline",
                        "type": "date",
                        "required": True,
                        "value": "2024-Q2"
                    }
                ],
                "shot_graph": {
                    "version": "1.0",
                    "shots": [
                        {
                            "id": "s1",
                            "step_ids": ["budget"],
                            "seed": 12345,
                            "bindings": {"company": inputs.get("company", "Client")},
                            "duration": 8.0,
                            "overlays": [
                                {"type": "title", "text": "Sales Quote"}
                            ]
                        },
                        {
                            "id": "s2",
                            "step_ids": ["budget"],
                            "seed": 12346,
                            "bindings": {"budget": inputs.get("budget", 15000)},
                            "duration": 12.0,
                            "overlays": [
                                {"type": "figure", "chart_type": "budget_breakdown"}
                            ]
                        }
                    ],
                    "edges": [["s1", "s2"]]
                }
            }
        
        raise ValueError(f"Unknown template: {template_key}")
    
    async def _generate_llm_plan(
        self,
        template_key: str,
        inputs: Dict[str, Any],
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate plan using LLM (OpenAI/Anthropic).
        """
        logger.info("Using LLM for planning", template=template_key)
        
        try:
            # Generate shot graph using LLM
            shot_graph = await self.llm_planner.generate_shot_graph(template_key, inputs)
            
            # Extract steps from shot graph bindings
            steps = self._extract_steps_from_shot_graph(shot_graph, inputs)
            
            return {
                "steps": steps,
                "shot_graph": shot_graph
            }
        except Exception as e:
            logger.error("LLM planning failed, falling back to safe mode", error=str(e))
            return await self._generate_safe_mode_plan(template_key, inputs, constraints)
    
    def _extract_steps_from_shot_graph(self, shot_graph: Dict[str, Any], inputs: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract step definitions from shot graph bindings.
        """
        steps = []
        
        # Collect all unique binding keys from shots
        binding_keys = set()
        for shot in shot_graph.get("shots", []):
            bindings = shot.get("bindings", {})
            binding_keys.update(bindings.keys())
        
        # Create steps for each binding key
        for key in binding_keys:
            step = {
                "id": key,
                "label": key.replace("_", " ").title(),
                "type": self._infer_step_type(key, inputs.get(key)),
                "required": True,
                "value": inputs.get(key)
            }
            steps.append(step)
        
        return steps
    
    def _infer_step_type(self, key: str, value: Any) -> str:
        """
        Infer step type from key name and value.
        """
        if "budget" in key.lower() or "cost" in key.lower() or "price" in key.lower():
            return "currency"
        elif "date" in key.lower() or "time" in key.lower():
            return "date"
        elif "email" in key.lower():
            return "url"
        elif isinstance(value, list):
            return "multiselect"
        elif isinstance(value, bool):
            return "select"
        elif isinstance(value, (int, float)):
            return "number"
        else:
            return "text"
