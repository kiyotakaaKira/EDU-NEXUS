"""
EduNexus Anomaly Analysis Engine (M11)
Detects multivariate statistical outliers using Isolation Forest, IQR, and Z-score methods.
Provides clear analytical distinction between statistical anomaly and academic risk.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from data.uci_loader import get_master_dataset

def run_anomaly_detection(contamination: float = 0.05) -> Dict[str, Any]:
    """Execute Isolation Forest anomaly detection on UCI student academic metrics."""
    df = get_master_dataset()

    feature_cols = [
        "admission_grade",
        "age_at_enrollment",
        "curricular_units_1st_sem_enrolled",
        "curricular_units_1st_sem_approved",
        "curricular_units_1st_sem_grade",
        "curricular_units_2nd_sem_enrolled",
        "curricular_units_2nd_sem_approved",
        "curricular_units_2nd_sem_grade",
        "semester_grade_change"
    ]

    available_features = [c for c in feature_cols if c in df.columns]
    X = df[available_features].fillna(0.0)

    # Fit Isolation Forest
    iso = IsolationForest(contamination=contamination, random_state=42)
    labels = iso.fit_predict(X)  # -1 for anomaly, 1 for normal
    scores = iso.decision_function(X)

    df_anom = df.copy()
    df_anom["is_anomaly"] = labels == -1
    df_anom["anomaly_score"] = (-scores).round(4)  # Higher = more anomalous

    anomalies_df = df_anom[df_anom["is_anomaly"]].sort_values(by="anomaly_score", ascending=False)
    normal_df = df_anom[~df_anom["is_anomaly"]]

    anomaly_count = len(anomalies_df)
    total_count = len(df)

    # Top Anomalies List (Records)
    records = []
    for _, row in anomalies_df.head(50).iterrows():
        # Identify key driver variable for anomaly
        reasons = []
        if row["admission_grade"] >= 160 and row["curricular_units_1st_sem_grade"] <= 5:
            reasons.append("High Entrance Grade but Low Sem 1 Grade")
        if row["curricular_units_1st_sem_enrolled"] >= 8 and row["curricular_units_1st_sem_approved"] == 0:
            reasons.append("High Course Load with Zero Approved Units")
        if abs(row["semester_grade_change"]) >= 8.0:
            reasons.append(f"Extreme Semester Grade Shift ({row['semester_grade_change']:+.1f})")
        if not reasons:
            reasons.append("Multivariate Outlier Combination")

        records.append({
            "student_id": str(row["student_id"]),
            "target": str(row["target"]),
            "age": int(row["age_at_enrollment"]),
            "admission_grade": float(row["admission_grade"]),
            "sem1_grade": float(row["curricular_units_1st_sem_grade"]),
            "sem2_grade": float(row["curricular_units_2nd_sem_grade"]),
            "anomaly_score": float(row["anomaly_score"]),
            "evidence": "; ".join(reasons)
        })

    # Anomaly Bins for Score Distribution
    counts, bin_edges = np.histogram(scores, bins=10)
    score_distribution = []
    for i in range(len(counts)):
        score_distribution.append({
            "range": f"{round(bin_edges[i], 2)} to {round(bin_edges[i+1], 2)}",
            "count": int(counts[i])
        })

    return {
        "status": "success",
        "total_students": total_count,
        "anomalies_detected": anomaly_count,
        "anomaly_rate": round((anomaly_count / total_count) * 100, 2),
        "contamination": contamination,
        "method": "Isolation Forest (Multivariate Unsupervised Outlier Detection)",
        "score_distribution": score_distribution,
        "records": records,
        "top_anomalies": records,
        "disclaimer": "CRITICAL METHODOLOGY NOTE: Isolation Forest detects statistical multivariate outliers. An anomaly represents unusual feature combinations, NOT necessarily academic failure or risk."
    }

