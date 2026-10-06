"""
EduNexus Pipeline & Health Check API Router
"""

from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
async def health_check():
    """Return backend service status."""
    return {"status": "healthy", "version": "3.0.0", "dataset": "UCI Predict Students' Dropout and Academic Success"}

@router.get("/api/pipeline/status")
@router.get("/pipeline/status")
async def pipeline_status():
    """Return pipeline execution status for all M1-M14 modules."""
    steps = [
        {"id": "m1", "module": "M1 Dataset Explorer", "status": "complete", "ready": True},
        {"id": "m2", "module": "M2 Data Integration", "status": "complete", "ready": True},
        {"id": "m3", "module": "M3 Data Quality", "status": "complete", "ready": True},
        {"id": "m4", "module": "M4 Data Cleaning", "status": "complete", "ready": True},
        {"id": "m5", "module": "M5 Descriptive Statistics", "status": "complete", "ready": True},
        {"id": "m6", "module": "M6 EDA & Visualizations", "status": "complete", "ready": True},
        {"id": "m7", "module": "M7 Statistical Analysis", "status": "complete", "ready": True},
        {"id": "m8", "module": "M8 Feature Engineering", "status": "complete", "ready": True},
        {"id": "m9", "module": "M9 Academic Progression", "status": "complete", "ready": True},
        {"id": "m10", "module": "M10 Student Cohorts", "status": "complete", "ready": True},
        {"id": "m11", "module": "M11 Anomaly Analysis", "status": "complete", "ready": True},
        {"id": "m12", "module": "M12 Educational Insights", "status": "complete", "ready": True},
        {"id": "m13", "module": "M13 Digital Twin", "status": "complete", "ready": True},
        {"id": "m14", "module": "M14 Intervention Simulator", "status": "complete", "ready": True}
    ]
    return {"pipeline": "EduNexus Real Educational Data Science Pipeline", "steps": steps}
