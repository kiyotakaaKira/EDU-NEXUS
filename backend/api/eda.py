from fastapi import APIRouter, HTTPException, Query
from analytics.eda import run_eda_analysis, run_custom_bivariate

router = APIRouter(tags=["EDA"])

@router.get("/summary")
async def eda_summary():
    """Run full EDA analysis on the UCI dataset."""
    return run_eda_analysis()

@router.get("/bivariate")
async def bivariate_analysis(x: str = Query(...), y: str = Query(...), group: str = Query(default="target")):
    """Run custom bivariate scatter analysis for user-selected variables."""
    try:
        return run_custom_bivariate(x, y, group)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
