"""
EduNexus Exploratory Data Analysis Engine (M6)
Calculates correlation matrices, bivariate scatter/box plots,
and outcome distributions across key academic & socioeconomic variables.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from data.uci_loader import get_master_dataset

def run_eda_analysis() -> Dict[str, Any]:
    """Execute complete EDA calculations on the UCI dataset."""
    df = get_master_dataset()

    # 1. Key Correlation Matrix (Numeric Variables Only)
    corr_cols = [
        "admission_grade",
        "previous_qualification_grade",
        "age_at_enrollment",
        "curricular_units_1st_sem_approved",
        "curricular_units_1st_sem_grade",
        "curricular_units_2nd_sem_approved",
        "curricular_units_2nd_sem_grade",
        "semester_grade_change",
        "academic_progression_index"
    ]

    available_corr_cols = [c for c in corr_cols if c in df.columns]
    corr_matrix = df[available_corr_cols].corr().round(3).to_dict()

    # 2. Admission Grade vs Academic Outcome (Boxplot stats)
    admission_by_target = []
    for target_val, group in df.groupby("target"):
        admission_by_target.append({
            "target": str(target_val),
            "min": round(float(group["admission_grade"].min()), 1),
            "q1": round(float(group["admission_grade"].quantile(0.25)), 1),
            "median": round(float(group["admission_grade"].median()), 1),
            "q3": round(float(group["admission_grade"].quantile(0.75)), 1),
            "max": round(float(group["admission_grade"].max()), 1),
            "mean": round(float(group["admission_grade"].mean()), 1),
            "sample_size": len(group)
        })

    # 3. Sem 1 Grade vs Sem 2 Grade Progression by Target (Scatter Sample)
    scatter_sample = []
    sample_df = df.sample(min(300, len(df)), random_state=42)
    for _, row in sample_df.iterrows():
        scatter_sample.append({
            "student_id": row["student_id"],
            "sem1_grade": round(float(row["curricular_units_1st_sem_grade"]), 2),
            "sem2_grade": round(float(row["curricular_units_2nd_sem_grade"]), 2),
            "admission_grade": round(float(row["admission_grade"]), 2),
            "target": str(row["target"]),
            "scholarship": str(row["scholarship_label"])
        })

    # 4. Scholarship Status vs Outcome Distribution
    scholarship_dist = []
    for (sch, target), group in df.groupby(["scholarship_label", "target"]):
        scholarship_dist.append({
            "scholarship": str(sch),
            "target": str(target),
            "count": len(group)
        })

    # 5. Tuition Status vs Outcome Distribution
    tuition_dist = []
    for (tuit, target), group in df.groupby(["tuition_fees_label", "target"]):
        tuition_dist.append({
            "tuition_status": str(tuit),
            "target": str(target),
            "count": len(group)
        })

    return {
        "status": "success",
        "sample_size": len(df),
        "correlation_matrix": corr_matrix,
        "admission_by_target": admission_by_target,
        "scatter_sample": scatter_sample,
        "scholarship_distribution": scholarship_dist,
        "tuition_distribution": tuition_dist
    }


def run_custom_bivariate(x_col: str, y_col: str, group_col: str = "target") -> Dict[str, Any]:
    """Calculate interactive bivariate scatter/grouped data for user selections."""
    df = get_master_dataset()
    if x_col not in df.columns or y_col not in df.columns:
        raise ValueError("Selected columns not found in dataset.")

    points = []
    sample_df = df.sample(min(400, len(df)), random_state=42)
    for _, row in sample_df.iterrows():
        points.append({
            "x": float(row[x_col]),
            "y": float(row[y_col]),
            "group": str(row[group_col]) if group_col in df.columns else "All"
        })

    return {
        "x_variable": x_col,
        "y_variable": y_col,
        "group_variable": group_col,
        "points": points
    }
