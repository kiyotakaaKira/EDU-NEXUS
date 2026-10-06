"""
EduNexus Student Success Digital Twin Engine (M13)
Provides an explainable, deterministic analytical profile for any selected student record.
Computes percentile ranks across population distributions, 5-dimensional radar scores,
nearest cohort comparisons, and deterministic evidence summaries.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from scipy import stats
from data.uci_loader import get_master_dataset
from analytics.cohorts import run_cohort_clustering

def get_student_list(limit: int = 100) -> List[Dict[str, Any]]:
    """Return selectable student record summaries for the frontend dropdown."""
    df = get_master_dataset()
    students = []
    for _, row in df.head(limit).iterrows():
        students.append({
            "student_id": str(row["student_id"]),
            "target": str(row["target"]),
            "age": int(row["age_at_enrollment"]),
            "admission_grade": float(row["admission_grade"]),
            "sem1_grade": float(row["curricular_units_1st_sem_grade"]),
            "sem2_grade": float(row["curricular_units_2nd_sem_grade"])
        })
    return students


def get_digital_twin_profile(student_id: str) -> Dict[str, Any]:
    """Compute complete analytical Digital Twin profile for a selected student ID."""
    df = get_master_dataset()

    match_df = df[df["student_id"] == student_id]
    if len(match_df) == 0:
        # Fallback to first student if ID not found
        match_df = df.iloc[[0]]
        student_id = str(match_df.iloc[0]["student_id"])

    row = match_df.iloc[0]

    # Academic Profile Attributes
    profile = {
        "student_id": student_id,
        "gender": str(row["gender_label"]),
        "age_at_enrollment": int(row["age_at_enrollment"]),
        "admission_grade": float(row["admission_grade"]),
        "previous_qualification_grade": float(row["previous_qualification_grade"]),
        "sem1_enrolled": int(row["curricular_units_1st_sem_enrolled"]),
        "sem1_approved": int(row["curricular_units_1st_sem_approved"]),
        "sem1_grade": float(row["curricular_units_1st_sem_grade"]),
        "sem2_enrolled": int(row["curricular_units_2nd_sem_enrolled"]),
        "sem2_approved": int(row["curricular_units_2nd_sem_approved"]),
        "sem2_grade": float(row["curricular_units_2nd_sem_grade"]),
        "scholarship": str(row["scholarship_label"]),
        "debtor": str(row["debtor_label"]),
        "tuition_fees": str(row["tuition_fees_label"]),
        "displaced": str(row["displaced_label"]),
        "target": str(row["target"])
    }

    # Population Percentiles calculation
    def get_percentile(col_name: str, value: float) -> float:
        series = df[col_name].dropna()
        if len(series) == 0:
            return 50.0
        return float(stats.percentileofscore(series, value))

    percentiles = {
        "admission_grade_pct": round(get_percentile("admission_grade", float(row["admission_grade"])), 1),
        "sem1_grade_pct": round(get_percentile("curricular_units_1st_sem_grade", float(row["curricular_units_1st_sem_grade"])), 1),
        "sem2_grade_pct": round(get_percentile("curricular_units_2nd_sem_grade", float(row["curricular_units_2nd_sem_grade"])), 1),
        "sem1_approval_pct": round(get_percentile("approval_rate_sem1", float(row["approval_rate_sem1"])), 1),
        "sem2_approval_pct": round(get_percentile("approval_rate_sem2", float(row["approval_rate_sem2"])), 1),
        "progression_index_pct": round(get_percentile("academic_progression_index", float(row["academic_progression_index"])), 1)
    }

    # 5-Dimensional Normalized Radar Profile (Scale 0 - 100)
    radar_dimensions = [
        {"dimension": "Entry Preparation", "value": percentiles["admission_grade_pct"], "population_median": 50.0},
        {"dimension": "Semester 1 Performance", "value": percentiles["sem1_grade_pct"], "population_median": 50.0},
        {"dimension": "Semester 2 Performance", "value": percentiles["sem2_grade_pct"], "population_median": 50.0},
        {"dimension": "Curricular Completion", "value": percentiles["sem2_approval_pct"], "population_median": 50.0},
        {"dimension": "Academic Progression", "value": percentiles["progression_index_pct"], "population_median": 50.0}
    ]

    # Similar Student Cohort Comparison (from M10)
    cohort_data = run_cohort_clustering(k=4)
    # Simple nearest cluster mapping based on sem2 grade
    sem2_g = float(row["curricular_units_2nd_sem_grade"])
    sem2_app = float(row["curricular_units_2nd_sem_approved"])
    
    assigned_cohort = cohort_data["cluster_profiles"][0]
    best_diff = 999.0
    for cp in cohort_data["cluster_profiles"]:
        diff = abs(cp["avg_sem2_grade"] - sem2_g) + abs(cp["avg_sem2_approved"] - sem2_app)
        if diff < best_diff:
            best_diff = diff
            assigned_cohort = cp

    # Deterministic Evidence Summary Text
    grade_delta = float(row["semester_grade_change"])
    trend_text = "improved" if grade_delta > 0 else "declined" if grade_delta < 0 else "maintained"
    
    evidence_text = (
        f"Record {student_id} exhibits an admission grade in the {percentiles['admission_grade_pct']}th percentile. "
        f"In Semester 1, the student achieved a grade of {row['curricular_units_1st_sem_grade']:.2f} ({percentiles['sem1_grade_pct']}th percentile). "
        f"During Semester 2, performance {trend_text} by {abs(grade_delta):.2f} grade points to {row['curricular_units_2nd_sem_grade']:.2f} "
        f"({percentiles['sem2_grade_pct']}th percentile), with {int(row['curricular_units_2nd_sem_approved'])} approved course units out of {int(row['curricular_units_2nd_sem_enrolled'])} enrolled. "
        f"This student matches the behavioral profile of '{assigned_cohort['label']}'."
    )

    return {
        "status": "success",
        "profile": profile,
        "percentiles": percentiles,
        "radar_dimensions": radar_dimensions,
        "assigned_cohort": assigned_cohort,
        "evidence_summary": evidence_text
    }
