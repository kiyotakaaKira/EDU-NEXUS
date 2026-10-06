from fastapi import APIRouter
from analytics.progression import run_progression_analytics

router = APIRouter(tags=["Temporal/Progression"])

@router.get("/summary")
async def temporal_summary():
    """Run Academic Progression Analytics (M9)."""
    return run_progression_analytics()
