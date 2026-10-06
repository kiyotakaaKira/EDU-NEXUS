from fastapi import APIRouter
from analytics.feature_engineering import run_feature_engineering_summary

router = APIRouter(tags=["Features"])

@router.get("/summary")
async def features_summary():
    """Return full Feature Engineering catalog and distribution statistics."""
    return run_feature_engineering_summary()
