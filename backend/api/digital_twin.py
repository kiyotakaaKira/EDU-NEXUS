"""
FastAPI Router for M13 Student Success Digital Twin
"""

from fastapi import APIRouter, HTTPException, Query
from analytics.digital_twin import get_student_list, get_digital_twin_profile

router = APIRouter(tags=["Digital Twin"])

@router.get("/students")
async def list_students(limit: int = Query(default=100, ge=1, le=500)):
    """Return list of selectable student records."""
    return get_student_list(limit=limit)

@router.get("/profile/{student_id}")
async def digital_twin_profile(student_id: str):
    """Return full Digital Twin profile for a selected student ID."""
    try:
        return get_digital_twin_profile(student_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
