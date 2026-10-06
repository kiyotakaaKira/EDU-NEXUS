from fastapi import APIRouter, HTTPException, Query
from analytics.cohorts import run_cohort_clustering

router = APIRouter(tags=["Cohorts"])

@router.get("/summary")
async def cohorts_summary(k: int = Query(default=4, ge=2, le=8)):
    """Run K-Means Student Cohort Analytics with PCA visualization."""
    try:
        return run_cohort_clustering(k=k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
