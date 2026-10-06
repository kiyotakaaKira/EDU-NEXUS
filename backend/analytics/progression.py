"""
EduNexus Academic Progression Analytics Engine (M9)
Analyzes longitudinal academic progression across observed Semester 1 and Semester 2 stages.
Calculates grade progression, approval rate trajectory, and trajectory classifications.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from data.uci_loader import get_master_dataset

def run_progression_analytics() -> Dict[str, Any]:
    """Execute Academic Progression Analytics (Semester 1 -> Semester 2)."""
    df = get_master_dataset()

    # Trajectory Classification
    # Improving: grade_change > +0.5
    # Declining: grade_change < -0.5
    # Stable: within [-0.5, +0.5]
    improving_df = df[df["semester_grade_change"] > 0.5]
    declining_df = df[df["semester_grade_change"] < -0.5]
    stable_df = df[(df["semester_grade_change"] >= -0.5) & (df["semester_grade_change"] <= 0.5)]

    total = len(df)
    trend_distribution = {
        "Improving": {"count": len(improving_df), "pct": round((len(improving_df) / total) * 100, 1)},
        "Stable": {"count": len(stable_df), "pct": round((len(stable_df) / total) * 100, 1)},
        "Declining": {"count": len(declining_df), "pct": round((len(declining_df) / total) * 100, 1)}
    }

    # Semester Comparison Averages
    sem_comparison = {
        "sem1_avg_grade": round(float(df["curricular_units_1st_sem_grade"].mean()), 2),
        "sem2_avg_grade": round(float(df["curricular_units_2nd_sem_grade"].mean()), 2),
        "sem1_avg_approved": round(float(df["curricular_units_1st_sem_approved"].mean()), 2),
        "sem2_avg_approved": round(float(df["curricular_units_2nd_sem_approved"].mean()), 2),
        "sem1_avg_evaluations": round(float(df["curricular_units_1st_sem_evaluations"].mean()), 2),
        "sem2_avg_evaluations": round(float(df["curricular_units_2nd_sem_evaluations"].mean()), 2),
        "overall_mean_grade_change": round(float(df["semester_grade_change"].mean()), 2)
    }

    # Progression Slope Data for Visualizations (Sem 1 -> Sem 2 by Target Outcome)
    progression_by_outcome = []
    for target_val, group in df.groupby("target"):
        progression_by_outcome.append({
            "target": str(target_val),
            "sem1_grade": round(float(group["curricular_units_1st_sem_grade"].mean()), 2),
            "sem2_grade": round(float(group["curricular_units_2nd_sem_grade"].mean()), 2),
            "sem1_approved": round(float(group["curricular_units_1st_sem_approved"].mean()), 2),
            "sem2_approved": round(float(group["curricular_units_2nd_sem_approved"].mean()), 2),
            "count": len(group)
        })

    # Detailed progression distribution bins
    counts, bin_edges = np.histogram(df["semester_grade_change"].dropna(), bins=8)
    histogram = []
    for i in range(len(counts)):
        histogram.append({
            "bin": f"{round(bin_edges[i], 1)} to {round(bin_edges[i+1], 1)}",
            "count": int(counts[i])
        })

    return {
        "status": "success",
        "total_students": total,
        "semester_comparison": sem_comparison,
        "trend_distribution": trend_distribution,
        "progression_by_outcome": progression_by_outcome,
        "histogram": histogram
    }
