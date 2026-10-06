from fastapi import APIRouter, HTTPException
from data.integrator import run_integration_pipeline, get_integration_summary

router = APIRouter(tags=["Integration"])

@router.post("/run")
async def run_integration():
    """Execute the Semantic Preparation & Integration Pipeline."""
    result = run_integration_pipeline()
    if result.get("status") != "success":
        raise HTTPException(status_code=400, detail="Integration pipeline failed.")
    return result

@router.get("/summary")
async def integration_summary():
    """Return status and metadata of the existing integrated dataset."""
    return get_integration_summary()
