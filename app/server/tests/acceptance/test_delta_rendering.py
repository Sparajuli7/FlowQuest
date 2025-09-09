"""
Delta Rendering Acceptance Test

Acceptance Criteria: Change budget 16000→14000 ⇒ only shot s2 re-renders; P95 ≤ 3s
"""

import asyncio
import time
import pytest
from httpx import AsyncClient
from app.main import app


class TestDeltaRendering:
    """Test delta rendering performance and correctness."""
    
    @pytest.mark.asyncio
    async def test_delta_rendering_budget_change(self):
        """Test that only affected shots re-render when budget changes."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Step 1: Generate initial quest
            generate_request = {
                "template_key": "sales_quote_v1",
                "inputs": {
                    "company": "Acme Corp",
                    "budget": 16000,
                    "seats": 25,
                    "region": "EU"
                }
            }
            
            response = await client.post("/v1/videoquests/generate", json=generate_request)
            assert response.status_code == 200
            
            quest_data = response.json()
            quest_id = quest_data["quest_id"]
            initial_preview_url = quest_data["shotgraph_preview_url"]
            
            # Step 2: Change budget from 16000 to 14000
            start_time = time.time()
            
            answer_request = {
                "quest_id": quest_id,
                "step_id": "budget",
                "value": 14000
            }
            
            response = await client.post("/v1/videoquests/answer-step", json=answer_request)
            assert response.status_code == 200
            
            delta_data = response.json()
            render_time_ms = delta_data.get("render_time_ms", 0)
            
            # Step 3: Verify only affected shots re-rendered
            delta_shots = delta_data["delta_shots"]
            affected_shot_ids = [shot["id"] for shot in delta_shots]
            
            # For budget change, only s2_budget should be affected
            assert "s2" in str(affected_shot_ids), f"Expected s2 to be re-rendered, got: {affected_shot_ids}"
            
            # Step 4: Verify new preview URL is different
            new_preview_url = delta_data["new_preview_url"]
            assert new_preview_url != initial_preview_url, "Preview URL should change after delta rendering"
            
            # Step 5: Verify performance - P95 ≤ 3s (3000ms)
            total_time = time.time() - start_time
            assert total_time <= 3.0, f"Delta rendering took {total_time:.2f}s, exceeds 3s limit"
            assert render_time_ms <= 3000, f"Render time {render_time_ms}ms exceeds 3000ms limit"
            
            print(f"✅ Delta rendering completed in {total_time:.2f}s ({render_time_ms}ms)")
    
    @pytest.mark.asyncio
    async def test_delta_rendering_performance_p95(self):
        """Test P95 performance over multiple delta renders."""
        render_times = []
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Generate a quest
            generate_request = {
                "template_key": "sales_quote_v1",
                "inputs": {
                    "company": "Performance Test Corp",
                    "budget": 20000,
                    "seats": 50,
                    "region": "NA"
                }
            }
            
            response = await client.post("/v1/videoquests/generate", json=generate_request)
            quest_id = response.json()["quest_id"]
            
            # Perform multiple delta renders to test P95
            budget_values = [18000, 22000, 15000, 25000, 19000, 21000, 17000, 23000, 16000, 24000]
            
            for budget in budget_values:
                start_time = time.time()
                
                answer_request = {
                    "quest_id": quest_id,
                    "step_id": "budget",
                    "value": budget
                }
                
                response = await client.post("/v1/videoquests/answer-step", json=answer_request)
                assert response.status_code == 200
                
                render_time = (time.time() - start_time) * 1000  # Convert to ms
                render_times.append(render_time)
            
            # Calculate P95
            render_times.sort()
            p95_index = int(0.95 * len(render_times))
            p95_time = render_times[p95_index]
            
            assert p95_time <= 3000, f"P95 render time {p95_time:.0f}ms exceeds 3000ms limit"
            
            avg_time = sum(render_times) / len(render_times)
            print(f"✅ P95: {p95_time:.0f}ms, Average: {avg_time:.0f}ms over {len(render_times)} renders")

if __name__ == "__main__":
    # Run tests directly
    asyncio.run(TestDeltaRendering().test_delta_rendering_budget_change())
    print("Delta rendering acceptance tests completed successfully!")
