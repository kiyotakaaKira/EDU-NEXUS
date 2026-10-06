"""
EduNexus Student Cohort Analytics Engine (M10)
Unsupervised K-Means clustering on standardized UCI student features.
Evaluates Silhouette Score and Davies-Bouldin Index.
Uses PCA strictly for 2D visualization.
Generates deterministic behavioral cohort labels.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score, davies_bouldin_score
from data.uci_loader import get_master_dataset

def run_cohort_clustering(k: int = 4) -> Dict[str, Any]:
    """Execute K-Means clustering and PCA visualization."""
    df = get_master_dataset()

    feature_cols = [
        "admission_grade",
        "age_at_enrollment",
        "curricular_units_1st_sem_approved",
        "curricular_units_1st_sem_grade",
        "curricular_units_2nd_sem_approved",
        "curricular_units_2nd_sem_grade",
        "semester_grade_change",
        "academic_progression_index"
    ]

    available_features = [c for c in feature_cols if c in df.columns]
    X = df[available_features].fillna(0.0)

    # Standardize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Fit K-Means
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    df_clustered = df.copy()
    df_clustered["cluster"] = clusters

    # Evaluation Metrics
    sil_score = float(silhouette_score(X_scaled, clusters)) if len(set(clusters)) > 1 else 0.0
    db_score = float(davies_bouldin_score(X_scaled, clusters)) if len(set(clusters)) > 1 else 0.0

    # PCA 2D Visualization Projection
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)
    explained_variance_total = round(float(np.sum(pca.explained_variance_ratio_) * 100), 1)

    # Cluster Profiles & Deterministic Labeling
    cluster_profiles = []
    pca_points = []

    # Map PCA points (400 random samples)
    sample_indices = np.random.choice(len(df), size=min(400, len(df)), replace=False)
    for idx in sample_indices:
        pca_points.append({
            "student_id": str(df.iloc[idx]["student_id"]),
            "pc1": round(float(X_pca[idx, 0]), 3),
            "pc2": round(float(X_pca[idx, 1]), 3),
            "cluster": int(clusters[idx]),
            "target": str(df.iloc[idx]["target"])
        })

    for c_id in range(k):
        c_df = df_clustered[df_clustered["cluster"] == c_id]
        c_size = len(c_df)
        c_pct = round((c_size / len(df)) * 100, 1)

        avg_admission = float(c_df["admission_grade"].mean())
        avg_sem1_grade = float(c_df["curricular_units_1st_sem_grade"].mean())
        avg_sem2_grade = float(c_df["curricular_units_2nd_sem_grade"].mean())
        avg_sem2_approved = float(c_df["curricular_units_2nd_sem_approved"].mean())
        dropout_pct = float((c_df["target"] == "Dropout").mean() * 100)
        graduate_pct = float((c_df["target"] == "Graduate").mean() * 100)

        # Deterministic Cohort Naming
        if avg_sem2_grade >= 13.5 and graduate_pct >= 70:
            label = "High Academic Progression Cohort"
        elif avg_sem2_approved <= 2.5 or dropout_pct >= 60:
            label = "Low Completion & Academic Risk Cohort"
        elif avg_sem1_grade >= 12.0 and (avg_sem2_grade < avg_sem1_grade - 1.0):
            label = "Declining Progression Cohort"
        else:
            label = "Moderate Academic Performance Cohort"

        cluster_profiles.append({
            "cluster_id": c_id,
            "label": label,
            "size": c_size,
            "percentage": c_pct,
            "avg_admission_grade": round(avg_admission, 2),
            "avg_sem1_grade": round(avg_sem1_grade, 2),
            "avg_sem2_grade": round(avg_sem2_grade, 2),
            "avg_sem2_approved": round(avg_sem2_approved, 2),
            "dropout_rate": round(dropout_pct, 1),
            "graduate_rate": round(graduate_pct, 1)
        })

    return {
        "status": "success",
        "total_students": len(df),
        "n_clusters": k,
        "silhouette_score": round(sil_score, 3),
        "davies_bouldin_score": round(db_score, 3),
        "pca_explained_variance": explained_variance_total,
        "cluster_profiles": cluster_profiles,
        "pca_points": pca_points
    }

