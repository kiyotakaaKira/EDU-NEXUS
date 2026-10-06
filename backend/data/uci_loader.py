"""
EduNexus UCI Dataset Loader & Master Pipeline
Loads primary UCI dataset, applies schema contract, assigns stable anonymous student IDs,
computes foundational feature engineering, and exposes clean accessors.
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple

from data.schema import UCI_RAW_COLUMNS_MAP, VARIABLE_DOMAINS, COLUMN_DESCRIPTIONS

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

os.makedirs(PROCESSED_DIR, exist_ok=True)

UCI_CSV_PATH = RAW_DIR / "uci_predict_students_dropout_and_academic_success.csv"
EXTENDED_CSV_PATH = Path(__file__).resolve().parent.parent.parent / "EduNexus_Extended_Real_Dataset (2) (2).csv"

PARQUET_MASTER_PATH = PROCESSED_DIR / "master_analytical_dataset.parquet"
CSV_MASTER_PATH = PROCESSED_DIR / "master_analytical_dataset.csv"

_CACHED_MASTER_DF: pd.DataFrame = None


def load_raw_uci_df() -> pd.DataFrame:
    """Load raw UCI CSV dataframe."""
    if not UCI_CSV_PATH.exists():
        raise FileNotFoundError(f"UCI dataset not found at {UCI_CSV_PATH}")
    df = pd.read_csv(UCI_CSV_PATH)
    # Strip whitespace from columns
    df.columns = [c.strip() for c in df.columns]
    return df


def load_extended_csv_status() -> Dict[str, Any]:
    """Inspect and return compatibility status of the secondary extended CSV."""
    if not EXTENDED_CSV_PATH.exists():
        return {"present": False, "reason": "File not found on disk."}
    
    try:
        df_ext = pd.read_csv(EXTENDED_CSV_PATH)
        return {
            "present": True,
            "filename": EXTENDED_CSV_PATH.name,
            "shape": list(df_ext.shape),
            "rows": len(df_ext),
            "columns": len(df_ext.columns),
            "has_entity_key": "Student_ID" in df_ext.columns,
            "compatible_with_uci_primary": False,
            "status_message": "Extended dataset retained as independent secondary source due to absence of shared entity join keys with the official UCI dataset."
        }
    except Exception as e:
        return {"present": False, "error": str(e)}


def build_master_analytical_dataset() -> pd.DataFrame:
    """Standardize raw UCI dataset, add synthetic anonymous student IDs, calculate core engineered features."""
    global _CACHED_MASTER_DF
    if _CACHED_MASTER_DF is not None:
        return _CACHED_MASTER_DF

    df = load_raw_uci_df()

    # Standardize column names
    clean_cols = {}
    for col in df.columns:
        clean_cols[col] = UCI_RAW_COLUMNS_MAP.get(col, col.lower().replace(" ", "_"))
    df = df.rename(columns=clean_cols)

    # Assign stable anonymous Student ID
    df.insert(0, "student_id", [f"EDU-{idx+1:06d}" for idx in range(len(df))])

    # Category Decoding / Friendly Labeling for key fields
    df["gender_label"] = df["gender"].map({1: "Male", 0: "Female"}).fillna("Unknown")
    df["scholarship_label"] = df["scholarship_holder"].map({1: "Yes", 0: "No"}).fillna("No")
    df["debtor_label"] = df["debtor"].map({1: "Yes", 0: "No"}).fillna("No")
    df["tuition_fees_label"] = df["tuition_fees_up_to_date"].map({1: "Up to Date", 0: "In Arrears"}).fillna("In Arrears")
    df["displaced_label"] = df["displaced"].map({1: "Yes", 0: "No"}).fillna("No")

    # Core Engineered Features
    df["semester_grade_change"] = (df["curricular_units_2nd_sem_grade"] - df["curricular_units_1st_sem_grade"]).round(2)
    df["semester_approval_change"] = df["curricular_units_2nd_sem_approved"] - df["curricular_units_1st_sem_approved"]
    
    # Approval Rates
    sem1_enrolled = df["curricular_units_1st_sem_enrolled"].replace(0, np.nan)
    sem2_enrolled = df["curricular_units_2nd_sem_enrolled"].replace(0, np.nan)
    
    df["approval_rate_sem1"] = (df["curricular_units_1st_sem_approved"] / sem1_enrolled).fillna(0.0).round(4)
    df["approval_rate_sem2"] = (df["curricular_units_2nd_sem_approved"] / sem2_enrolled).fillna(0.0).round(4)
    
    # Academic Progression Index
    weighted_grade = (df["curricular_units_1st_sem_grade"] * 0.4) + (df["curricular_units_2nd_sem_grade"] * 0.6)
    df["academic_progression_index"] = (weighted_grade * df["approval_rate_sem2"]).round(2)
    
    # Financial Risk Indicator (1 if debtor and tuition not paid)
    df["financial_risk_indicator"] = ((df["debtor"] == 1) & (df["tuition_fees_up_to_date"] == 0)).astype(int)
    
    # Academic Load Ratio
    df["academic_load_ratio"] = (df["curricular_units_1st_sem_enrolled"] / 6.0).round(2)
    
    # Performance Stability (abs grade delta)
    df["performance_stability"] = (df["curricular_units_2nd_sem_grade"] - df["curricular_units_1st_sem_grade"]).abs().round(2)

    # Save outputs
    try:
        df.to_parquet(PARQUET_MASTER_PATH, index=False)
    except Exception:
        pass
    df.to_csv(CSV_MASTER_PATH, index=False)

    _CACHED_MASTER_DF = df
    return df


def get_master_dataset() -> pd.DataFrame:
    """Return cached or newly constructed master analytical dataset."""
    global _CACHED_MASTER_DF
    if _CACHED_MASTER_DF is not None:
        return _CACHED_MASTER_DF
    if CSV_MASTER_PATH.exists():
        _CACHED_MASTER_DF = pd.read_csv(CSV_MASTER_PATH)
        return _CACHED_MASTER_DF
    return build_master_analytical_dataset()
