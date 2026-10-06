from fastapi import APIRouter, HTTPException
from data.loaders import check_dataset_status, get_dataset_summary

router = APIRouter(tags=["Datasets"])

@router.get("/status")
async def dataset_status():
    """Return which OULAD CSV files are present and their sizes."""
    return check_dataset_status()

@router.get("/summary")
async def dataset_summary():
    """Return full profiling summary: row counts, schema, memory for each table."""
    result = get_dataset_summary()
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
