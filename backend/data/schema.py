"""
EduNexus Data Schema Contract
Defines canonical variable names, dtypes, semantic domains, and descriptions
for the primary UCI 'Predict Students' Dropout and Academic Success' dataset (Dataset 697).
"""

from typing import Dict, Any, List

UCI_RAW_COLUMNS_MAP = {
    "Marital status": "marital_status",
    "Application mode": "application_mode",
    "Application order": "application_order",
    "Course": "course",
    "Daytime/evening attendance\t": "daytime_evening_attendance",
    "Daytime/evening attendance": "daytime_evening_attendance",
    "Previous qualification": "previous_qualification",
    "Previous qualification (grade)": "previous_qualification_grade",
    "Nacionality": "nationality",
    "Mother's qualification": "mother_qualification",
    "Father's qualification": "father_qualification",
    "Mother's occupation": "mother_occupation",
    "Father's occupation": "father_occupation",
    "Admission grade": "admission_grade",
    "Displaced": "displaced",
    "Educational special needs": "educational_special_needs",
    "Debtor": "debtor",
    "Tuition fees up to date": "tuition_fees_up_to_date",
    "Gender": "gender",
    "Scholarship holder": "scholarship_holder",
    "Age at enrollment": "age_at_enrollment",
    "International": "international",
    "Curricular units 1st sem (credited)": "curricular_units_1st_sem_credited",
    "Curricular units 1st sem (enrolled)": "curricular_units_1st_sem_enrolled",
    "Curricular units 1st sem (evaluations)": "curricular_units_1st_sem_evaluations",
    "Curricular units 1st sem (approved)": "curricular_units_1st_sem_approved",
    "Curricular units 1st sem (grade)": "curricular_units_1st_sem_grade",
    "Curricular units 1st sem (without evaluations)": "curricular_units_1st_sem_without_evaluations",
    "Curricular units 2nd sem (credited)": "curricular_units_2nd_sem_credited",
    "Curricular units 2nd sem (enrolled)": "curricular_units_2nd_sem_enrolled",
    "Curricular units 2nd sem (evaluations)": "curricular_units_2nd_sem_evaluations",
    "Curricular units 2nd sem (approved)": "curricular_units_2nd_sem_approved",
    "Curricular units 2nd sem (grade)": "curricular_units_2nd_sem_grade",
    "Curricular units 2nd sem (without evaluations)": "curricular_units_2nd_sem_without_evaluations",
    "Unemployment rate": "unemployment_rate",
    "Inflation rate": "inflation_rate",
    "GDP": "gdp",
    "Target": "target"
}

VARIABLE_DOMAINS: Dict[str, List[str]] = {
    "DEMOGRAPHIC": ["marital_status", "nationality", "gender", "age_at_enrollment", "international"],
    "APPLICATION": ["application_mode", "application_order", "course", "daytime_evening_attendance", "previous_qualification", "previous_qualification_grade", "admission_grade"],
    "SOCIOECONOMIC": ["mother_qualification", "father_qualification", "mother_occupation", "father_occupation", "displaced", "educational_special_needs", "debtor", "tuition_fees_up_to_date", "scholarship_holder"],
    "ACADEMIC_SEM1": ["curricular_units_1st_sem_credited", "curricular_units_1st_sem_enrolled", "curricular_units_1st_sem_evaluations", "curricular_units_1st_sem_approved", "curricular_units_1st_sem_grade", "curricular_units_1st_sem_without_evaluations"],
    "ACADEMIC_SEM2": ["curricular_units_2nd_sem_credited", "curricular_units_2nd_sem_enrolled", "curricular_units_2nd_sem_evaluations", "curricular_units_2nd_sem_approved", "curricular_units_2nd_sem_grade", "curricular_units_2nd_sem_without_evaluations"],
    "MACROECONOMIC": ["unemployment_rate", "inflation_rate", "gdp"],
    "OUTCOME": ["target"]
}

COLUMN_DESCRIPTIONS: Dict[str, str] = {
    "student_id": "Anonymous analytical student record identifier (EDU-XXXXXX).",
    "marital_status": "Marital status code of the student.",
    "application_mode": "Application mode code used for university entry.",
    "application_order": "Application order preference (0-9).",
    "course": "Degree course program code.",
    "daytime_evening_attendance": "Attendance type: 1 = Daytime, 0 = Evening.",
    "previous_qualification": "Type of qualification prior to higher education.",
    "previous_qualification_grade": "Grade obtained in previous qualification (0-200).",
    "nationality": "Student nationality code.",
    "mother_qualification": "Mother's highest educational qualification level.",
    "father_qualification": "Father's highest educational qualification level.",
    "mother_occupation": "Mother's occupation category code.",
    "father_occupation": "Father's occupation category code.",
    "admission_grade": "University entrance admission grade (0-200 scale).",
    "displaced": "Whether the student is displaced from their home region (1=Yes, 0=No).",
    "educational_special_needs": "Special educational needs flag (1=Yes, 0=No).",
    "debtor": "Has outstanding tuition debt (1=Yes, 0=No).",
    "tuition_fees_up_to_date": "Tuition fees fully paid to date (1=Yes, 0=No).",
    "gender": "Gender: 1 = Male, 0 = Female.",
    "scholarship_holder": "Recipient of an academic scholarship (1=Yes, 0=No).",
    "age_at_enrollment": "Student age in years at higher education enrollment.",
    "international": "International student flag (1=Yes, 0=No).",
    "curricular_units_1st_sem_credited": "Curricular units credited in Semester 1.",
    "curricular_units_1st_sem_enrolled": "Curricular units enrolled in Semester 1.",
    "curricular_units_1st_sem_evaluations": "Curricular evaluations attended in Semester 1.",
    "curricular_units_1st_sem_approved": "Curricular units successfully passed in Semester 1.",
    "curricular_units_1st_sem_grade": "Average grade in Semester 1 (0-20 scale).",
    "curricular_units_1st_sem_without_evaluations": "Enrolled units without evaluations in Semester 1.",
    "curricular_units_2nd_sem_credited": "Curricular units credited in Semester 2.",
    "curricular_units_2nd_sem_enrolled": "Curricular units enrolled in Semester 2.",
    "curricular_units_2nd_sem_evaluations": "Curricular evaluations attended in Semester 2.",
    "curricular_units_2nd_sem_approved": "Curricular units successfully passed in Semester 2.",
    "curricular_units_2nd_sem_grade": "Average grade in Semester 2 (0-20 scale).",
    "curricular_units_2nd_sem_without_evaluations": "Enrolled units without evaluations in Semester 2.",
    "unemployment_rate": "Regional unemployment rate (%) during enrollment.",
    "inflation_rate": "National inflation rate (%) during enrollment.",
    "gdp": "GDP growth rate (%) during enrollment.",
    "target": "Final academic outcome: Graduate, Dropout, or Enrolled."
}
