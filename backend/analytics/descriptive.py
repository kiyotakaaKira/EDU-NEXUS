"""
EduNexus Descriptive Statistics Engine (M5)
Calculates real 13-metric descriptive statistics for numeric variables
and frequency distributions for categorical variables on the UCI dataset.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from scipy import stats
from data.uci_loader import get_master_dataset

def get_columns_list() -> Dict[str, List[str]]:
    """Return available numeric and categorical columns for selection."""
    df = get_master_dataset()
    numeric = df.select_dtypes(include=['number']).columns.tolist()
    categorical = df.select_dtypes(include=['object', 'category']).columns.tolist()
    return {"numeric": numeric, "categorical": categorical}


def compute_variable_statistics(col_name: str) -> Dict[str, Any]:
    """Calculate 13 descriptive statistics and histogram/boxplot bins for a selected variable."""
    df = get_master_dataset()
    if col_name not in df.columns:
        raise ValueError(f"Variable '{col_name}' not found in dataset.")

    s = df[col_name].dropna()

    if pd.api.types.is_numeric_dtype(s):
        mean_val = float(s.mean())
        median_val = float(s.median())
        mode_res = s.mode()
        mode_val = float(mode_res.iloc[0]) if len(mode_res) > 0 else mean_val
        variance_val = float(s.var())
        std_val = float(s.std())
        min_val = float(s.min())
        q1_val = float(s.quantile(0.25))
        q3_val = float(s.quantile(0.75))
        max_val = float(s.max())
        iqr_val = float(q3_val - q1_val)
        skew_val = float(stats.skew(s))
        kurtosis_val = float(stats.kurtosis(s))
        cv_val = float((std_val / mean_val) * 100) if mean_val != 0 else 0.0

        # Build Histogram Bins
        counts, bin_edges = np.histogram(s, bins=10)
        hist_bins = []
        for i in range(len(counts)):
            hist_bins.append({
                "range": f"{round(bin_edges[i], 1)}-{round(bin_edges[i+1], 1)}",
                "count": int(counts[i])
            })

        # Outliers calculation via 1.5*IQR rule
        lower_fence = q1_val - (1.5 * iqr_val)
        upper_fence = q3_val + (1.5 * iqr_val)
        outliers_count = int(((s < lower_fence) | (s > upper_fence)).sum())

        return {
            "variable": col_name,
            "type": "numeric",
            "sample_size": len(s),
            "stats": {
                "mean": round(mean_val, 2),
                "median": round(median_val, 2),
                "mode": round(mode_val, 2),
                "variance": round(variance_val, 2),
                "std_dev": round(std_val, 2),
                "min": round(min_val, 2),
                "q1": round(q1_val, 2),
                "q3": round(q3_val, 2),
                "max": round(max_val, 2),
                "iqr": round(iqr_val, 2),
                "skewness": round(skew_val, 3),
                "kurtosis": round(kurtosis_val, 3),
                "cv_percentage": round(cv_val, 2)
            },
            "histogram": hist_bins,
            "outliers_count": outliers_count,
            "fences": {"lower": round(lower_fence, 2), "upper": round(upper_fence, 2)}
        }

    else:
        freq = s.value_counts()
        total = len(s)
        categories = []
        for cat, cnt in freq.items():
            categories.append({
                "category": str(cat),
                "count": int(cnt),
                "percentage": round((cnt / total) * 100, 2)
            })

        return {
            "variable": col_name,
            "type": "categorical",
            "sample_size": total,
            "cardinality": len(freq),
            "mode": str(freq.index[0]),
            "categories": categories
        }
