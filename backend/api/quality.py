from fastapi import APIRouter, HTTPException
from analytics.quality import run_quality_audit

router = APIRouter(tags=["Quality"])

@router.get("/summary")
async def quality_summary():
    """Run full data quality audit on the UCI master dataset."""
    result = run_quality_audit()
    return result
