import openai
from anthropic import Anthropic
import json
from typing import Dict, Any
from app.core.config import settings
import structlog

logger = structlog.get_logger()

class LLMPlanner:
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
    
    async def generate_shot_graph(self, template_key: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        if not self.openai_client and not self.anthropic_client:
            raise ValueError("No LLM provider configured")
        
        prompt = f"""
        Generate a shot graph for a {template_key} video with these inputs:
        {json.dumps(inputs, indent=2)}
        
        Return a JSON object with:
        - shots: array of shot objects with id, duration, overlays, bindings
        - edges: array of [from_id, to_id] pairs
        
        Make it compelling and professional.
        """
        
        if self.openai_client:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "system", "content": "You are a video planning expert."},
                         {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        
        # Fallback to Anthropic
        response = self.anthropic_client.messages.create(
            model="claude-3-sonnet-20240229",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        return json.loads(response.content[0].text)
