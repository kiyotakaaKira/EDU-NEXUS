from fastapi import APIRouter, HTTPException
from analytics.insights import generate_educational_insights

router = APIRouter(tags=["Insights"])

@router.get("/summary")
async def insights_summary():
    """Generate deterministic rule-based educational insights from M5-M11 evidence."""
    try:
        return generate_educational_insights()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
