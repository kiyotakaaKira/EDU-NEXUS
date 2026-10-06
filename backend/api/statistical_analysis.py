from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from analytics.statistical_tests import run_statistical_test
from analytics.descriptive import get_columns_list

router = APIRouter(tags=["Statistical Analysis"])

class TestRequest(BaseModel):
    test_type: str
    var1: str
    var2: str

@router.post("/run")
async def run_test(req: TestRequest):
    """Execute formal statistical hypothesis test on selected variables."""
    try:
        return run_statistical_test(req.test_type, req.var1, req.var2)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/columns")
async def get_columns():
    """Return numeric and categorical columns available for testing."""
    return get_columns_list()
