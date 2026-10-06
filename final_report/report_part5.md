# CHAPTER 7: RESULTS AND DISCUSSION

## 7.1 Experimental Setup
The experimental framework was executed on a virtualized environment with a multi-core processor. The dataset was preprocessed and subjected to an 80/20 train-test split. The evaluation metrics were computed on the held-out 20% testing set. A fixed random seed (42) was utilized.

## 7.2 Dataset Statistics
Prior to predictive modeling, the dataset underwent exploratory analysis. The master analytical dataset comprises exactly 4,424 records with zero non-imputed missing values. The target distribution was observed as:
- Graduate: ~47%
- Dropout: ~32%
- Enrolled: ~21%

## 7.3 Model Performance Overview
Table 7.1 presents the empirical evaluation metrics for all 9 machine learning models trained on the engineered dataset.

| Model | Accuracy | Macro Precision | Macro Recall | Macro F1 | ROC-AUC | Training Time (s) |
|---|---|---|---|---|---|---|
| Logistic Regression | 75.03% | 68.29% | 65.45% | 66.05% | 86.95% | 6.60s |
| Decision Tree | 69.27% | 63.72% | 63.94% | 63.76% | 74.13% | 0.49s |
| Random Forest | 77.63% | 71.89% | 69.10% | 69.91% | 87.39% | 5.10s |
| SVM | 76.05% | 69.84% | 66.23% | 67.02% | 87.01% | 16.91s |
| KNN | 70.62% | 62.26% | 60.03% | 60.26% | 80.31% | 3.60s |
| Naive Bayes | 70.17% | 64.07% | 61.26% | 61.87% | 82.49% | 0.14s |
| Gradient Boosting | 76.16% | 69.57% | 67.34% | 67.94% | 87.83% | 24.26s |
| AdaBoost | 73.33% | 64.43% | 63.01% | 62.98% | 83.30% | 2.50s |
| XGBoost | 77.18% | 71.69% | 69.28% | 70.05% | 88.27% | 68.47s |

## 7.4 Accuracy and F1 Comparison
As illustrated in Table 7.1, linear models such as Logistic Regression and probabilistic models like Naive Bayes established baseline performances. Ensemble methods, specifically Random Forest, Gradient Boosting, and XGBoost, significantly outperformed the baselines. **XGBoost** achieved the highest Macro F1 score of **70.05%**.

## 7.5 Confusion Matrix Analysis
The confusion matrix for the optimal model reveals strong diagnostic capability. 
While 'Graduate' and 'Dropout' classes are predicted with high confidence, the minority 'Enrolled' class exhibits higher misclassification rates. This is expected, as 'Enrolled' represents a transient state that shares feature distributions with both the dropout and graduate populations.

## 7.6 Feature Importance & SHAP Analysis
To interpret the model's decisions, we calculated SHAP values. The top contributing features across the ensemble models consistently included:
1. `curricular_units_2nd_sem_grade` (Semester 2 Grade)
2. `academic_progression_index` (Engineered Index)
3. `tuition_fees_up_to_date`
4. `curricular_units_2nd_sem_approved`

These results validate the hypothesis that academic momentum and financial stability are the primary drivers of student retention.

## 7.7 Early Warning Analysis (Temporal Ablation)
While Semester 2 grades are highly predictive, relying on them introduces temporal leakage if the system is deployed at the start of Semester 1. The ablation study running models without Semester 2 data showed a predictable drop in accuracy (~10-15%), indicating that early interventions must rely heavily on demographics and financial indicators until initial academic evaluations are recorded.

## 7.8 Discussion and Limitations
The findings affirm that Machine Learning, particularly XGBoost, can accurately forecast student trajectories. However, the system is fundamentally limited by the data it ingests; it cannot account for sudden personal emergencies or unrecorded psychological stressors. Thus, it remains a decision-support tool rather than an automated expulsion or intervention mechanism.

---

<div style="page-break-after: always"></div>
