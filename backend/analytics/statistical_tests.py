"""
EduNexus Statistical Analysis Engine (M7)
Executes formal hypothesis tests using SciPy:
Pearson correlation, Spearman correlation, Welch's t-Test, Cohen's d, and Chi-Square test of independence.
"""

from typing import Dict, Any
import pandas as pd
import numpy as np
from scipy import stats
from data.uci_loader import get_master_dataset

def run_statistical_test(test_type: str, var1: str, var2: str, alpha: float = 0.05) -> Dict[str, Any]:
    """Execute formal statistical hypothesis test on selected dataset variables."""
    df = get_master_dataset()
    
    if var1 not in df.columns or var2 not in df.columns:
        raise ValueError(f"Variables '{var1}' or '{var2}' not found in dataset.")

    valid_df = df[[var1, var2]].dropna()
    n = len(valid_df)

    if test_type in ["pearson", "spearman"]:
        s1 = valid_df[var1]
        s2 = valid_df[var2]

        if test_type == "pearson":
            corr, p_val = stats.pearsonr(s1, s2)
            test_name = "Pearson Product-Moment Correlation (Parametric)"
            h0 = f"There is no linear correlation between {var1} and {var2} (r = 0)."
            h1 = f"There is a statistically significant linear correlation between {var1} and {var2} (r != 0)."
        else:
            corr, p_val = stats.spearmanr(s1, s2)
            test_name = "Spearman Rank Correlation (Non-Parametric)"
            h0 = f"There is no monotonic relationship between {var1} and {var2} (rho = 0)."
            h1 = f"There is a statistically significant monotonic relationship between {var1} and {var2} (rho != 0)."

        abs_corr = abs(corr)
        if abs_corr < 0.1:
            effect_size = "Negligible"
        elif abs_corr < 0.3:
            effect_size = "Small"
        elif abs_corr < 0.5:
            effect_size = "Medium"
        else:
            effect_size = "Large"

        decision = "Reject Null Hypothesis (H0)" if p_val < alpha else "Fail to Reject Null Hypothesis (H0)"
        direction = "Positive" if corr > 0 else "Negative"
        
        interp = (
            f"At alpha = {alpha}, we {decision.lower()}. "
            f"The computed correlation coefficient is r = {corr:.4f} (p = {p_val:.4e}). "
            f"This indicates a statistically {effect_size.lower()} {direction.lower()} relationship between {var1} and {var2}."
        )

        return {
            "test_name": test_name,
            "variables": [var1, var2],
            "statistic": float(corr),
            "p_value": float(p_val),
            "alpha": alpha,
            "sample_size": n,
            "decision": decision,
            "effect_size": effect_size,
            "direction": direction,
            "hypotheses": {"H0": h0, "H1": h1},
            "interpretation": interp
        }

    elif test_type == "t-test":
        # Welch's t-test comparing two groups of numeric var1 grouped by binary/categorical var2
        groups = valid_df[var2].unique()
        if len(groups) < 2:
            raise ValueError(f"Categorical variable '{var2}' must have at least 2 groups for t-test.")
        
        g1 = valid_df[valid_df[var2] == groups[0]][var1]
        g2 = valid_df[valid_df[var2] == groups[1]][var1]

        t_stat, p_val = stats.ttest_ind(g1, g2, equal_var=False)

        # Cohen's d calculation
        n1, n2 = len(g1), len(g2)
        s1, s2 = g1.std(), g2.std()
        s_pooled = np.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
        cohens_d = float((g1.mean() - g2.mean()) / s_pooled) if s_pooled != 0 else 0.0

        abs_d = abs(cohens_d)
        if abs_d < 0.2:
            effect_size = "Small"
        elif abs_d < 0.8:
            effect_size = "Medium"
        else:
            effect_size = "Large"

        h0 = f"There is no difference in mean {var1} between group '{groups[0]}' and group '{groups[1]}'."
        h1 = f"There is a statistically significant difference in mean {var1} between group '{groups[0]}' and group '{groups[1]}'."
        decision = "Reject Null Hypothesis (H0)" if p_val < alpha else "Fail to Reject Null Hypothesis (H0)"

        interp = (
            f"Welch's t-test yields t = {t_stat:.4f}, p = {p_val:.4e}. "
            f"At alpha = {alpha}, we {decision.lower()}. "
            f"Cohen's d = {cohens_d:.4f} ({effect_size} effect size)."
        )

        return {
            "test_name": "Welch's Independent Two-Sample t-Test",
            "variables": [f"{var1} by {var2} ({groups[0]} vs {groups[1]})"],
            "statistic": float(t_stat),
            "p_value": float(p_val),
            "cohens_d": round(cohens_d, 4),
            "alpha": alpha,
            "sample_size": n,
            "decision": decision,
            "effect_size": effect_size,
            "hypotheses": {"H0": h0, "H1": h1},
            "interpretation": interp
        }

    elif test_type == "chi-square":
        # Chi-Square Test of Independence for two categorical variables
        contingency_table = pd.crosstab(valid_df[var1], valid_df[var2])
        chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)

        h0 = f"{var1} and {var2} are independent."
        h1 = f"{var1} and {var2} are statistically associated."
        decision = "Reject Null Hypothesis (H0)" if p_val < alpha else "Fail to Reject Null Hypothesis (H0)"

        interp = (
            f"Chi-square test of independence yields chi2 = {chi2:.4f} (dof = {dof}, p = {p_val:.4e}). "
            f"At alpha = {alpha}, we {decision.lower()}."
        )

        return {
            "test_name": "Chi-Square Test of Independence",
            "variables": [var1, var2],
            "statistic": float(chi2),
            "p_value": float(p_val),
            "degrees_of_freedom": dof,
            "alpha": alpha,
            "sample_size": n,
            "decision": decision,
            "hypotheses": {"H0": h0, "H1": h1},
            "interpretation": interp
        }

    else:
        raise ValueError(f"Unsupported test type '{test_type}'.")
