"""
FastAPI Router for M14 Academic Intervention Simulator
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from analytics.intervention_simulator import simulate_intervention

router = APIRouter(tags=["Intervention Simulator"])

class SimulationRequest(BaseModel):
    student_id: str
    new_sem2_approved: Optional[int] = None
    new_sem2_grade: Optional[float] = None
    tuition_fees_paid: Optional[int] = None

@router.post("/simulate")
async def run_simulation(req: SimulationRequest):
    """Execute what-if academic intervention simulation for a student."""
    try:
        return simulate_intervention(
            student_id=req.student_id,
            new_sem2_approved=req.new_sem2_approved,
            new_sem2_grade=req.new_sem2_grade,
            tuition_fees_paid=req.tuition_fees_paid
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
