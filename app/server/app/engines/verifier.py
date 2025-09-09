"""
Verifier Engine - Rules-based verification with optional local LLM repair.
Checks required fields, budget/date bounds, URL sanity, STAR bullets.
"""

import structlog
from typing import Dict, Any, List
import re
from urllib.parse import urlparse

logger = structlog.get_logger()

class VerificationResult:
    def __init__(self, passed: bool = True, issues: List[str] = None, fixes: List[str] = None):
        self.passed = passed
        self.issues = issues or []
        self.fixes = fixes or []

class VerifierEngine:
    """
    Verifier engine that validates quest completeness and data quality.
    """
    
    def __init__(self):
        self.rules = {
            'required_fields': self._check_required_fields,
            'budget_bounds': self._check_budget_bounds,
            'date_validity': self._check_date_validity,
            'url_sanity': self._check_url_sanity,
            'star_bullets': self._check_star_bullets
        }
    
    async def verify_quest(self, quest_id: str) -> VerificationResult:
        """
        Run all verification rules against a quest.
        """
        logger.info("Verifying quest", quest_id=quest_id)
        
        # Mock quest data - in production would fetch from database
        quest_data = {
            "budget": 15000,
            "scope": "Implementation for Acme Corp",
            "timeline": "2024-Q2",
            "company_url": "https://acme.com",
            "deliverables": [
                "Situation: Current system is outdated",
                "Task: Modernize infrastructure", 
                "Action: Deploy cloud solution",
                "Result: 50% performance improvement"
            ]
        }
        
        all_issues = []
        all_fixes = []
        
        # Run all verification rules
        for rule_name, rule_func in self.rules.items():
            try:
                result = await rule_func(quest_data)
                if not result.passed:
                    all_issues.extend(result.issues)
                    all_fixes.extend(result.fixes)
                    logger.warning("Verification rule failed", 
                                 quest_id=quest_id, 
                                 rule=rule_name,
                                 issues=result.issues)
            except Exception as e:
                logger.error("Verification rule error", 
                           quest_id=quest_id,
                           rule=rule_name, 
                           error=str(e))
                all_issues.append(f"Rule {rule_name} failed to execute")
        
        passed = len(all_issues) == 0
        
        logger.info("Verification complete", 
                   quest_id=quest_id, 
                   passed=passed,
                   issue_count=len(all_issues))
        
        return VerificationResult(passed=passed, issues=all_issues, fixes=all_fixes)
    
    async def _check_required_fields(self, data: Dict[str, Any]) -> VerificationResult:
        """Check that all required fields are present and non-empty."""
        required_fields = ['budget', 'scope', 'timeline']
        issues = []
        fixes = []
        
        for field in required_fields:
            if field not in data or not data[field]:
                issues.append(f"Required field '{field}' is missing or empty")
                fixes.append(f"Provide value for {field}")
        
        return VerificationResult(passed=len(issues) == 0, issues=issues, fixes=fixes)
    
    async def _check_budget_bounds(self, data: Dict[str, Any]) -> VerificationResult:
        """Check budget is within reasonable bounds."""
        budget = data.get('budget')
        issues = []
        fixes = []
        
        if not isinstance(budget, (int, float)):
            issues.append("Budget must be a number")
            fixes.append("Enter budget as numeric value")
        elif budget < 1000:
            issues.append("Budget seems too low (< $1,000)")
            fixes.append("Review budget amount")
        elif budget > 1000000:
            issues.append("Budget seems too high (> $1,000,000)")
            fixes.append("Review budget amount")
        
        return VerificationResult(passed=len(issues) == 0, issues=issues, fixes=fixes)
    
    async def _check_date_validity(self, data: Dict[str, Any]) -> VerificationResult:
        """Check timeline/date fields are reasonable."""
        timeline = data.get('timeline', '')
        issues = []
        fixes = []
        
        # Simple timeline validation
        if not timeline:
            return VerificationResult(passed=True)  # Optional field
        
        # Check for basic date formats
        date_patterns = [
            r'\d{4}-Q[1-4]',  # 2024-Q2
            r'\d{4}-\d{2}-\d{2}',  # 2024-06-01
            r'[A-Za-z]+ \d{4}'  # June 2024
        ]
        
        if not any(re.search(pattern, timeline) for pattern in date_patterns):
            issues.append("Timeline format not recognized")
            fixes.append("Use format like '2024-Q2' or '2024-06-01'")
        
        return VerificationResult(passed=len(issues) == 0, issues=issues, fixes=fixes)
    
    async def _check_url_sanity(self, data: Dict[str, Any]) -> VerificationResult:
        """Check any URLs in the data are valid."""
        issues = []
        fixes = []
        
        url_fields = ['company_url', 'website', 'reference_url']
        
        for field in url_fields:
            url = data.get(field)
            if url:
                try:
                    parsed = urlparse(url)
                    if not parsed.scheme or not parsed.netloc:
                        issues.append(f"Invalid URL in {field}: {url}")
                        fixes.append(f"Provide complete URL with https:// for {field}")
                except Exception:
                    issues.append(f"Malformed URL in {field}")
                    fixes.append(f"Fix URL format in {field}")
        
        return VerificationResult(passed=len(issues) == 0, issues=issues, fixes=fixes)
    
    async def _check_star_bullets(self, data: Dict[str, Any]) -> VerificationResult:
        """Check STAR (Situation, Task, Action, Result) bullet completeness."""
        deliverables = data.get('deliverables', [])
        issues = []
        fixes = []
        
        if not deliverables:
            return VerificationResult(passed=True)  # Optional
        
        star_keywords = ['situation', 'task', 'action', 'result']
        found_keywords = set()
        
        for bullet in deliverables:
            if isinstance(bullet, str):
                bullet_lower = bullet.lower()
                for keyword in star_keywords:
                    if keyword in bullet_lower:
                        found_keywords.add(keyword)
        
        missing_keywords = set(star_keywords) - found_keywords
        if missing_keywords:
            issues.append(f"STAR format incomplete. Missing: {', '.join(missing_keywords)}")
            fixes.append("Add bullets covering all STAR elements: Situation, Task, Action, Result")
        
        return VerificationResult(passed=len(issues) == 0, issues=issues, fixes=fixes)
