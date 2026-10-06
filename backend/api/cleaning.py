from fastapi import APIRouter, HTTPException
from analytics.cleaning import run_data_cleaning, get_cleaning_summary

router = APIRouter(tags=["Cleaning"])

@router.get("/summary")
async def cleaning_summary():
    """Get cleaning audit log summary."""
    return get_cleaning_summary()

@router.post("/run")
async def run_cleaning():
    """Execute data cleaning pipeline and generate audit log."""
    result = run_data_cleaning()
    return result
