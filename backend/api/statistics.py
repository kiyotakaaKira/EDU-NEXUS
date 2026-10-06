from fastapi import APIRouter, HTTPException
from analytics.descriptive import get_columns_list, compute_variable_statistics

router = APIRouter(tags=["Statistics"])

@router.get("/columns")
async def get_columns():
    """Return available numeric and categorical columns for selection."""
    return get_columns_list()

@router.get("/variable/{col_name}")
async def variable_statistics(col_name: str):
    """Compute descriptive statistics for a selected variable."""
    try:
        return compute_variable_statistics(col_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/summary")
async def statistics_summary():
    """Return a summary overview of key academic statistics."""
    from data.uci_loader import get_master_dataset
    df = get_master_dataset()
    target_dist = df["target"].value_counts().to_dict()
    total = len(df)
    return {
        "total_students": total,
        "target_distribution": {k: {"count": int(v), "pct": round((v/total)*100,1)} for k, v in target_dist.items()},
        "avg_admission_grade": round(float(df["admission_grade"].mean()), 2),
        "avg_sem1_grade": round(float(df["curricular_units_1st_sem_grade"].mean()), 2),
        "avg_sem2_grade": round(float(df["curricular_units_2nd_sem_grade"].mean()), 2),
        "avg_age": round(float(df["age_at_enrollment"].mean()), 1),
    }
