"""
EduNexus Feature Engineering Catalog & Pipeline (M8)
Synthesizes higher-order engineered features with documented formulas.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from data.uci_loader import get_master_dataset

FEATURE_CATALOG: List[Dict[str, str]] = [
    {
        "name": "semester_grade_change",
        "formula": "Curricular units 2nd sem (grade) - Curricular units 1st sem (grade)",
        "source_columns": "curricular_units_1st_sem_grade, curricular_units_2nd_sem_grade",
        "range": "-20.0 to +20.0",
        "interpretation": "Longitudinal grade trajectory between Semester 1 and Semester 2."
    },
    {
        "name": "semester_approval_change",
        "formula": "Curricular units 2nd sem (approved) - Curricular units 1st sem (approved)",
        "source_columns": "curricular_units_1st_sem_approved, curricular_units_2nd_sem_approved",
        "range": "-20 to +20",
        "interpretation": "Delta in total approved course units from Semester 1 to Semester 2."
    },
    {
        "name": "approval_rate_sem1",
        "formula": "Curricular units 1st sem (approved) / Curricular units 1st sem (enrolled)",
        "source_columns": "curricular_units_1st_sem_approved, curricular_units_1st_sem_enrolled",
        "range": "0.0 to 1.0",
        "interpretation": "Proportion of enrolled courses successfully passed in Semester 1."
    },
    {
        "name": "approval_rate_sem2",
        "formula": "Curricular units 2nd sem (approved) / Curricular units 2nd sem (enrolled)",
        "source_columns": "curricular_units_2nd_sem_approved, curricular_units_2nd_sem_enrolled",
        "range": "0.0 to 1.0",
        "interpretation": "Proportion of enrolled courses successfully passed in Semester 2."
    },
    {
        "name": "academic_progression_index",
        "formula": "((Grade_Sem1 * 0.4) + (Grade_Sem2 * 0.6)) * Approval_Rate_Sem2",
        "source_columns": "curricular_units_1st_sem_grade, curricular_units_2nd_sem_grade, approval_rate_sem2",
        "range": "0.0 to 20.0",
        "interpretation": "Composite metric capturing weighted academic performance adjusted for unit completion."
    },
    {
        "name": "financial_risk_indicator",
        "formula": "1 if (debtor == 1 and tuition_fees_up_to_date == 0) else 0",
        "source_columns": "debtor, tuition_fees_up_to_date",
        "range": "0 or 1",
        "interpretation": "Binary flag indicating compound financial risk (active debt + unpaid tuition)."
    },
    {
        "name": "academic_load_ratio",
        "formula": "Curricular units 1st sem (enrolled) / 6.0",
        "source_columns": "curricular_units_1st_sem_enrolled",
        "range": "0.0 to 3.0+",
        "interpretation": "Ratio of actual enrolled units relative to standard full-time course load (6 units)."
    },
    {
        "name": "performance_stability",
        "formula": "abs(Curricular units 2nd sem (grade) - Curricular units 1st sem (grade))",
        "source_columns": "curricular_units_1st_sem_grade, curricular_units_2nd_sem_grade",
        "range": "0.0 to 20.0",
        "interpretation": "Absolute grade variance quantifying academic stability (lower values indicate high consistency)."
    }
]


def run_feature_engineering_summary() -> Dict[str, Any]:
    """Calculate summary statistics for all engineered features."""
    df = get_master_dataset()
    feature_names = [f["name"] for f in FEATURE_CATALOG]
    
    distributions = []
    for f in FEATURE_CATALOG:
        fname = f["name"]
        if fname in df.columns:
            s = df[fname].dropna()
            distributions.append({
                "name": fname,
                "formula": f["formula"],
                "interpretation": f["interpretation"],
                "mean": round(float(s.mean()), 2),
                "median": round(float(s.median()), 2),
                "std_dev": round(float(s.std()), 2),
                "min": round(float(s.min()), 2),
                "max": round(float(s.max()), 2)
            })

    return {
        "status": "success",
        "feature_count": len(FEATURE_CATALOG),
        "catalog": FEATURE_CATALOG,
        "distributions": distributions
    }
