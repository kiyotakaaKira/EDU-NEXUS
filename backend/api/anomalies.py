from fastapi import APIRouter, HTTPException, Query
from analytics.anomalies import run_anomaly_detection

router = APIRouter(tags=["Anomalies"])

@router.get("/summary")
async def anomaly_summary(contamination: float = Query(default=0.05, ge=0.01, le=0.3)):
    """Run Isolation Forest Anomaly Detection on the UCI dataset."""
    try:
        return run_anomaly_detection(contamination=contamination)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
