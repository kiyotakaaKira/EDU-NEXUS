"""
EduNexus Data Loaders Adapter
Proxies data requests to the real UCI Dataset Loader.
"""

from typing import Dict, Any, List
import pandas as pd
from data.uci_loader import get_master_dataset, load_extended_csv_status, UCI_CSV_PATH
from data.schema import VARIABLE_DOMAINS, COLUMN_DESCRIPTIONS

def check_dataset_status() -> Dict[str, Any]:
    """Return availability of the UCI Primary dataset and secondary extended CSV."""
    df_master = get_master_dataset()
    ext_status = load_extended_csv_status()
    
    return {
        "available": True,
        "dataset_name": "Predict Students' Dropout and Academic Success (UCI ID 697)",
        "primary_file": UCI_CSV_PATH.name if UCI_CSV_PATH.exists() else "uci_predict_students_dropout_and_academic_success.csv",
        "total_records": len(df_master),
        "total_variables": len(df_master.columns),
        "extended_dataset_status": ext_status
    }


def get_dataset_summary() -> Dict[str, Any]:
    """Return comprehensive profiling summary for M1 Dataset Explorer."""
    df = get_master_dataset()
    ext_status = load_extended_csv_status()
    
    # Categorize numeric vs categorical
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

    # Column Explorer metadata
    column_explorer = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        missing_count = int(df[col].isnull().sum())
        missing_pct = round((missing_count / len(df)) * 100, 2)
        unique_count = int(df[col].nunique())
        
        # Domain lookup
        domain = "GENERAL"
        for dom_name, dom_cols in VARIABLE_DOMAINS.items():
            if col in dom_cols or col.replace("_label", "") in dom_cols:
                domain = dom_name
                break

        col_meta = {
            "name": col,
            "type": dtype,
            "domain": domain,
            "unique_values": unique_count,
            "missing_pct": missing_pct,
            "description": COLUMN_DESCRIPTIONS.get(col, "Dataset attribute.")
        }

        if col in numeric_cols:
            col_meta["min"] = float(round(df[col].min(), 2))
            col_meta["max"] = float(round(df[col].max(), 2))
            col_meta["mean"] = float(round(df[col].mean(), 2))

        column_explorer.append(col_meta)

    # Domain Counts
    domain_counts = {}
    for col_meta in column_explorer:
        dom = col_meta["domain"]
        domain_counts[dom] = domain_counts.get(dom, 0) + 1

    # Target Distribution
    target_dist = df["target"].value_counts().to_dict()

    return {
        "dataset_name": "Predict Students' Dropout and Academic Success",
        "source": "UCI Machine Learning Repository (Dataset ID 697)",
        "total_records": len(df),
        "total_variables": len(df.columns),
        "numeric_variables_count": len(numeric_cols),
        "categorical_variables_count": len(categorical_cols),
        "missing_values_count": int(df.isnull().sum().sum()),
        "duplicate_rows_count": int(df.duplicated().sum()),
        "domain_distribution": domain_counts,
        "target_distribution": target_dist,
        "column_explorer": column_explorer,
        "extended_dataset": ext_status
    }
