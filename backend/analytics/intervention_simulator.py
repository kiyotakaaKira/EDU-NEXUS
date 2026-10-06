"""
EduNexus Academic Intervention Simulator Engine (M14)
Interactive WHAT-IF scenario analysis tool.
Recalculates analytical profiles, percentiles, and cohort memberships when adjustable
academic parameters (e.g. Semester 2 approved units or grades) are modified.
Includes explicit scientific disclaimer regarding association vs causation.
"""

from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
from data.uci_loader import get_master_dataset
from analytics.digital_twin import get_digital_twin_profile

def simulate_intervention(
    student_id: str,
    new_sem2_approved: Optional[int] = None,
    new_sem2_grade: Optional[float] = None,
    tuition_fees_paid: Optional[int] = None
) -> Dict[str, Any]:
    """Recalculate analytical profile under a WHAT-IF intervention scenario."""
    # Get baseline profile
    baseline = get_digital_twin_profile(student_id)
    b_prof = baseline["profile"]

    # Compute Scenario values
    s_sem2_approved = new_sem2_approved if new_sem2_approved is not None else b_prof["sem2_approved"]
    s_sem2_grade = new_sem2_grade if new_sem2_grade is not None else b_prof["sem2_grade"]
    s_tuition = tuition_fees_paid if tuition_fees_paid is not None else (1 if b_prof["tuition_fees"] == "Up to Date" else 0)

    # Compute scenario engineered metrics
    sem2_enrolled = max(1, b_prof["sem2_enrolled"])
    s_approval_rate_sem2 = round(min(1.0, max(0.0, s_sem2_approved / sem2_enrolled)), 4)
    
    weighted_grade = (b_prof["sem1_grade"] * 0.4) + (s_sem2_grade * 0.6)
    s_progression_index = round(weighted_grade * s_approval_rate_sem2, 2)
    s_grade_change = round(s_sem2_grade - b_prof["sem1_grade"], 2)

    # Calculate percentile movements
    df = get_master_dataset()
    
    def calc_pct(series_name: str, val: float) -> float:
        from scipy import stats
        s = df[series_name].dropna()
        if len(s) == 0:
            return 50.0
        return float(round(stats.percentileofscore(s, val), 1))

    b_pct = baseline["percentiles"]
    s_pct = {
        "admission_grade_pct": b_pct["admission_grade_pct"],
        "sem1_grade_pct": b_pct["sem1_grade_pct"],
        "sem2_grade_pct": calc_pct("curricular_units_2nd_sem_grade", s_sem2_grade),
        "sem1_approval_pct": b_pct["sem1_approval_pct"],
        "sem2_approval_pct": calc_pct("approval_rate_sem2", s_approval_rate_sem2),
        "progression_index_pct": calc_pct("academic_progression_index", s_progression_index)
    }

    # Radar comparison (Before vs Scenario)
    radar_comparison = [
        {
            "dimension": "Entry Preparation",
            "before": b_pct["admission_grade_pct"],
            "scenario": s_pct["admission_grade_pct"]
        },
        {
            "dimension": "Semester 1 Performance",
            "before": b_pct["sem1_grade_pct"],
            "scenario": s_pct["sem1_grade_pct"]
        },
        {
            "dimension": "Semester 2 Performance",
            "before": b_pct["sem2_grade_pct"],
            "scenario": s_pct["sem2_grade_pct"]
        },
        {
            "dimension": "Curricular Completion",
            "before": b_pct["sem2_approval_pct"],
            "scenario": s_pct["sem2_approval_pct"]
        },
        {
            "dimension": "Academic Progression",
            "before": b_pct["progression_index_pct"],
            "scenario": s_pct["progression_index_pct"]
        }
    ]

    # Metric Deltas
    deltas = [
        {
            "metric": "Semester 2 Approved Units",
            "before": int(b_prof["sem2_approved"]),
            "scenario": int(s_sem2_approved),
            "delta": int(s_sem2_approved - b_prof["sem2_approved"])
        },
        {
            "metric": "Semester 2 Grade",
            "before": float(b_prof["sem2_grade"]),
            "scenario": float(s_sem2_grade),
            "delta": round(float(s_sem2_grade - b_prof["sem2_grade"]), 2)
        },
        {
            "metric": "Academic Progression Index Percentile",
            "before": float(b_pct["progression_index_pct"]),
            "scenario": float(s_pct["progression_index_pct"]),
            "delta": round(float(s_pct["progression_index_pct"] - b_pct["progression_index_pct"]), 1)
        }
    ]

    # Scientific Disclaimer
    disclaimer = (
        "CRITICAL SCIENTIFIC METHODOLOGY NOTE: This what-if scenario simulation calculates "
        "empirical percentile shifts and historical cohort associations based on observed dataset distributions. "
        "It demonstrates analytical association and does NOT guarantee causal educational outcomes."
    )

    return {
        "status": "success",
        "student_id": student_id,
        "baseline": {
            "profile": b_prof,
            "percentiles": b_pct,
            "cohort": baseline["assigned_cohort"]["label"]
        },
        "scenario": {
            "sem2_approved": s_sem2_approved,
            "sem2_grade": s_sem2_grade,
            "tuition_fees_paid": s_tuition,
            "approval_rate_sem2": s_approval_rate_sem2,
            "academic_progression_index": s_progression_index,
            "percentiles": s_pct
        },
        "radar_comparison": radar_comparison,
        "deltas": deltas,
        "disclaimer": disclaimer
    }
