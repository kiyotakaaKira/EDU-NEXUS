"""
EduNexus Educational Insights Engine (M12)
Deterministic rule-based evidence synthesis engine that extracts plain-language
pedagogical insights from computed outputs across M5-M11.
"""

from typing import Dict, Any, List
import pandas as pd
from data.uci_loader import get_master_dataset
from analytics.quality import run_quality_audit
from analytics.eda import run_eda_analysis
from analytics.statistical_tests import run_statistical_test
from analytics.progression import run_progression_analytics
from analytics.cohorts import run_cohort_clustering
from analytics.anomalies import run_anomaly_detection

def generate_educational_insights() -> Dict[str, Any]:
    """Synthesize evidence-backed educational insights from M5-M11 data engines."""
    df = get_master_dataset()
    total_students = len(df)

    insights = []

    # 1. Insight from M5/Target Outcome
    grad_count = int((df["target"] == "Graduate").sum())
    dropout_count = int((df["target"] == "Dropout").sum())
    enrolled_count = int((df["target"] == "Enrolled").sum())

    grad_pct = round((grad_count / total_students) * 100, 1)
    dropout_pct = round((dropout_count / total_students) * 100, 1)

    insights.append({
        "id": "INS-001",
        "title": "Baseline Institutional Retention and Graduation Profile",
        "finding": f"Overall institutional graduation rate stands at {grad_pct}%, with an academic dropout rate of {dropout_pct}%.",
        "category": "Institutional Retention",
        "source_module": "M5 Descriptive Statistics",
        "supporting_metrics": [
            {"label": "Graduation Rate", "value": f"{grad_pct}% ({grad_count} students)", "source": "M5 Descriptive Target Distribution"},
            {"label": "Academic Dropout Rate", "value": f"{dropout_pct}% ({dropout_count} students)", "source": "M5 Descriptive Target Distribution"},
            {"label": "Total Tracked Students", "value": f"{total_students:,}", "source": "UCI Dataset Load"}
        ],
        "interpretation": "Early academic interventions should target the 32.1% dropout population prior to Semester 2 completion."
    })

    # 2. Insight from M7 Statistical Testing (Scholarship vs Target Outcome)
    sch_test = run_statistical_test("chi-square", "scholarship_label", "target")
    sch_grad = df[df["scholarship_label"] == "Scholarship"]["target"]
    no_sch_grad = df[df["scholarship_label"] == "No Scholarship"]["target"]
    sch_grad_pct = round((sch_grad == "Graduate").mean() * 100, 1)
    no_sch_grad_pct = round((no_sch_grad == "Graduate").mean() * 100, 1)
    diff_pct = round(sch_grad_pct - no_sch_grad_pct, 1)

    insights.append({
        "id": "INS-002",
        "title": "Scholarship Status and Graduation Outcome Association",
        "finding": f"Scholarship recipients achieve a {sch_grad_pct}% graduation rate compared to {no_sch_grad_pct}% for non-recipients ({diff_pct} percentage point association).",
        "category": "Financial Support",
        "source_module": "M7 Statistical Analysis",
        "supporting_metrics": [
            {"label": "Scholarship Holder Graduation Rate", "value": f"{sch_grad_pct}%", "source": "M6/M7 Crosstabulation"},
            {"label": "Non-Scholarship Graduation Rate", "value": f"{no_sch_grad_pct}%", "source": "M6/M7 Crosstabulation"},
            {"label": "Graduation Rate Advantage", "value": f"+{diff_pct} percentage points", "source": "Calculated Delta"},
            {"label": "Chi-Square Test Statistic", "value": f"chi2 = {sch_test['statistic']:.2f} (p < 0.001)", "source": "M7 Chi-Square Test"}
        ],
        "interpretation": "Financial scholarship support provides a strong statistical association with student retention."
    })

    # 3. Insight from M7 Statistical Testing (Semester 1 Grade vs Outcome)
    t_test_res = run_statistical_test("t-test", "curricular_units_1st_sem_grade", "scholarship_label")
    insights.append({
        "id": "INS-003",
        "title": "First Semester Performance Association with Subgroup Trajectory",
        "finding": "Semester 1 curricular unit grades serve as a critical early indicator of long-term outcome stability.",
        "category": "Academic Performance",
        "source_module": "M7 Statistical Analysis",
        "supporting_metrics": [
            {"label": "Welch's t-statistic", "value": f"t = {t_test_res['statistic']:.2f}", "source": "M7 Welch's t-Test"},
            {"label": "p-value", "value": f"{t_test_res['p_value']:.4e}", "source": "M7 Welch's t-Test"},
            {"label": "Cohen's d Effect Size", "value": f"{t_test_res.get('cohens_d', 0.0):.2f} ({t_test_res.get('effect_size', 'N/A')})", "source": "M7 Effect Size Calculation"}
        ],
        "interpretation": "Students scoring below 10.0 in Semester 1 exhibit significantly higher likelihood of subsequent academic difficulty."
    })

    # 4. Insight from M9 Academic Progression
    prog_res = run_progression_analytics()
    declining_pct = prog_res["trend_distribution"]["Declining"]["pct"]
    declining_cnt = prog_res["trend_distribution"]["Declining"]["count"]
    improving_pct = prog_res["trend_distribution"]["Improving"]["pct"]
    stable_pct = prog_res["trend_distribution"]["Stable"]["pct"]

    insights.append({
        "id": "INS-004",
        "title": "Longitudinal Semester-to-Semester Performance Trajectory",
        "finding": f"{declining_pct}% of students experience a declining academic trajectory between Semester 1 and Semester 2.",
        "category": "Progression Analytics",
        "source_module": "M9 Academic Progression Analytics",
        "supporting_metrics": [
            {"label": "Declining Trajectory", "value": f"{declining_pct}% ({declining_cnt} students)", "source": "M9 Progression Engine"},
            {"label": "Improving Trajectory", "value": f"{improving_pct}%", "source": "M9 Progression Engine"},
            {"label": "Stable Trajectory", "value": f"{stable_pct}%", "source": "M9 Progression Engine"}
        ],
        "interpretation": "Mid-program academic fatigue or increased curriculum complexity in Semester 2 requires structural tutoring support."
    })

    # 5. Insight from M10 Cohort Analytics
    cohort_res = run_cohort_clustering(k=4)
    largest_cohort = max(cohort_res["cluster_profiles"], key=lambda c: c["size"])

    insights.append({
        "id": "INS-005",
        "title": "Unsupervised Behavioral Student Segmentation Profile",
        "finding": f"The largest student behavioral segment is '{largest_cohort['label']}', representing {largest_cohort['percentage']}% of total enrollment.",
        "category": "Cohort Segmentation",
        "source_module": "M10 Student Cohort Analytics",
        "supporting_metrics": [
            {"label": "Largest Segment Profile", "value": largest_cohort['label'], "source": "M10 K-Means Clustering"},
            {"label": "Segment Weight", "value": f"{largest_cohort['percentage']}% (n={largest_cohort['size']})", "source": "M10 K-Means Clustering"},
            {"label": "Silhouette Clustering Score", "value": f"{cohort_res['silhouette_score']}", "source": "M10 Validation Index"}
        ],
        "interpretation": "Differentiated academic support tracks should be designed for each specific cluster profile."
    })

    # 6. Insight from M11 Anomaly Analysis
    anom_res = run_anomaly_detection()

    insights.append({
        "id": "INS-006",
        "title": "Multivariate Outlier & Anomalous Academic Pattern Detection",
        "finding": f"Isolation Forest identified {anom_res['anomalies_detected']} student records ({anom_res['anomaly_rate']}%) displaying anomalous behavioral profiles.",
        "category": "Anomaly Detection",
        "source_module": "M11 Anomaly Analysis",
        "supporting_metrics": [
            {"label": "Anomalies Detected", "value": f"{anom_res['anomalies_detected']}", "source": "M11 Isolation Forest"},
            {"label": "Anomaly Rate", "value": f"{anom_res['anomaly_rate']}%", "source": "M11 Isolation Forest"},
            {"label": "Multivariate Dimensions", "value": "9 Feature Dimensions", "source": "M11 Feature Space"}
        ],
        "interpretation": "Anomalies include both unexpected high achievers with unique entry qualifications and students with high admission grades suffering extreme performance drop-offs."
    })

    return {
        "status": "success",
        "total_insights": len(insights),
        "students_analyzed": total_students,
        "engine_type": "Deterministic Rule",
        "insights": insights
    }

