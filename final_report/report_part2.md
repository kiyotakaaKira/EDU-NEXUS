# CHAPTER 2: LITERATURE REVIEW

## 2.1 Introduction
The application of Machine Learning in education has garnered significant academic interest over the past decade. This chapter reviews the extant literature on Educational Data Mining (EDM), student dropout prediction, and the deployment of explainable AI in academic decision-support systems.

## 2.2 Educational Data Mining
Educational Data Mining (EDM) is an interdisciplinary research area focused on developing methods for exploring the unique and increasingly large-scale data that come from educational settings. According to Romero and Ventura (2010), EDM utilizes statistical, machine-learning, and data-mining algorithms over various types of educational data. Its primary goal is to better understand students and the settings in which they learn. Unlike commercial data mining, EDM must contend with pedagogical theories and the temporal nature of academic semesters.

## 2.3 Learning Analytics
While EDM focuses on the technical aspects of data extraction, Learning Analytics (LA) focuses on the measurement, collection, analysis, and reporting of data about learners for the purpose of optimizing learning environments. Siemens and Long (2011) define LA as the use of intelligent data, learner-produced data, and analysis models to discover information and social connections. Our proposed system bridges the gap between EDM's predictive modeling and LA's actionable insights.

## 2.4 Student Dropout Prediction
Predicting student dropout has been widely studied. Early models relied on logistic regression and demographic features. Tinto's institutional departure model (1975, 1993) is frequently cited as the theoretical foundation, suggesting that academic and social integration are the primary determinants of student retention. Recent studies have operationalized Tinto's theory by mapping academic records (grades, attendance) to academic integration, and demographic/financial data to external pressures.

## 2.5 Academic Success Prediction
Conversely, predicting academic success requires identifying the characteristics of high-performing students. Aulck et al. (2016) demonstrated that early-term GPA and STEM course performance are strong indicators of eventual graduation. Predicting success as a distinct class (rather than just 'not dropping out') introduces the need for multiclass classification, a challenge often overlooked in binary dropout models.

## 2.6 Machine Learning Approaches
Modern approaches heavily utilize ensemble methods. Random Forests and Gradient Boosting Machines (GBM) have shown superior performance in handling tabular educational data compared to traditional neural networks. XGBoost, in particular, has emerged as the state-of-the-art for tabular classification tasks due to its handling of missing values and execution speed.

## 2.7 Classification Algorithms
Research by various authors confirms that no single algorithm is universally optimal for EDM. 
- **Logistic Regression** is favored for its interpretability but often underperforms on non-linear data.
- **Support Vector Machines (SVM)** perform well in high-dimensional spaces but struggle with large, noisy datasets and interpretability.
- **Decision Trees** offer natural interpretability but are prone to overfitting.
- **Ensemble Methods** (Random Forest, AdaBoost, XGBoost) consistently achieve the highest accuracy and AUC metrics by aggregating weak learners, though they operate as black boxes.

## 2.8 Explainable AI in Education
The black-box nature of advanced ML models is a significant barrier to adoption in education. Educators require justification for algorithmic recommendations. Lundberg and Lee (2017) introduced SHAP (SHapley Additive exPlanations), a game-theoretic approach to explain the output of any machine learning model. In EDM context, SHAP allows institutions to see exactly which features (e.g., low first-semester approval rate, lack of scholarship) pushed a model to classify a student as high-risk.

## 2.9 Early Warning Systems
Early Warning Systems (EWS) operationalize predictive models. A highly cited limitation in EWS research is 'Temporal Leakage'—training a model on end-of-year data but deploying it at the beginning of the year. Effective EWS must rely solely on data available at the time of prediction (e.g., enrollment demographics and first-semester grades).

## 2.10 Existing Research
A seminal paper utilizing the exact UCI dataset employed in this project (Realinho et al., 2022) established baseline metrics using neural networks, random forests, and SVMs. They achieved high accuracy but primarily focused on binary classification (Dropout vs. Graduate), often merging or discarding the 'Enrolled' class. 

## 2.11 Comparative Analysis
| Paper | Year | Dataset | Algorithm | Best Result (Accuracy) | Explainability | Limitation |
|---|---|---|---|---|---|---|
| Realinho et.al | 2022 | UCI (4424) | RF, SVM, NN | 82.5% | None | Binary classification focus, black-box. |
| Aulck et al. | 2016 | Institutional | RF, LR | 81.2% | Feature Importance | Temporal leakage not fully addressed. |
| Delen | 2010 | Institutional | MLP, SVM | 80.5% | None | Did not model the 'Enrolled' state. |
| **Proposed (SENTINAL D)** | **2026** | **UCI (4424)** | **XGBoost/Ensembles** | **Multiclass Eval** | **SHAP Integration** | **Addresses temporal leakage & multiclass.** |

## 2.12 Research Gap
Based on the literature review, the primary research gaps are:
1. The lack of robust handling for the 'Enrolled' (ongoing/delayed) class in a multiclass setting.
2. The absence of instance-level explainability (SHAP) in deployed educational models.
3. Insufficient explicit discussion of temporal data leakage when modeling multi-semester data.

## 2.13 Proposed Contribution
SENTINAL D addresses these gaps by implementing a strict multiclass pipeline, integrating SHAP for pedagogical transparency, and employing domain-specific feature engineering to capture longitudinal academic stability without violating temporal causality.

## 2.14 Summary
The literature strongly supports the use of ensemble Machine Learning techniques for student outcome prediction. However, to transition from a theoretical model to a practical decision-support system, the incorporation of explainability and rigorous validation methodologies is imperative.

---

<div style="page-break-after: always"></div>

# CHAPTER 3: PROBLEM DEFINITION AND REQUIREMENTS

## 3.1 Existing System
The existing approach in many institutions relies on retrospective database querying and simple business intelligence (BI) dashboards. Educators manually filter students based on arbitrary thresholds (e.g., GPA < 2.0). These systems are purely descriptive. They report what has already happened but fail to forecast future trajectories.

## 3.2 Limitations
- **Reactive Nature**: Interventions occur post-failure.
- **Single-variable Focus**: Educators cannot mentally compute the non-linear interaction of 30+ variables (e.g., age, debt, parent's occupation, and grades).
- **Scalability**: Manual counseling is unscalable for large cohorts.

## 3.3 Proposed System
The proposed SENTINAL D system introduces a predictive, Machine Learning layer on top of the existing database infrastructure. It automatically ingests student records, engineers complex behavioral features, scores each student's likelihood of dropping out, and provides plain-text justifications using SHAP.

## 3.4 Problem Formulation
Given a dataset $D = \{(x_1, y_1), (x_2, y_2), ..., (x_n, y_n)\}$, where $x_i \in \mathbb{R}^d$ represents a $d$-dimensional feature vector of student $i$, and $y_i \in \{0, 1, 2\}$ representing \{Dropout, Enrolled, Graduate\}, the objective is to learn a mapping function $f: X \rightarrow Y$ such that the predicted class $\hat{y}_i = f(x_i)$ minimizes the categorical cross-entropy loss over the validation set.

## 3.5 Research Questions
1. Which Machine Learning algorithm provides the optimal balance of predictive power and generalization for multiclass academic outcome prediction?
2. To what extent do engineered features (like Academic Progression Index) improve model performance compared to raw institutional data?
3. How can complex ensemble predictions be translated into interpretable formats for non-technical academic advisors?

## 3.6 Functional Requirements
- **Data Ingestion**: The system must securely load and parse tabular student data.
- **Model Training Engine**: The system must support the automated training of multiple ML classification algorithms.
- **Evaluation Module**: The system must generate and store accuracy, precision, recall, F1, and ROC-AUC metrics.
- **Inference API**: The system must expose a RESTful endpoint to accept new student data and return predictions.
- **Explainability Engine**: The system must compute SHAP values for individual predictions.

## 3.7 Non-functional Requirements
- **Performance**: Inference time per student must be under 500ms.
- **Scalability**: The training pipeline must handle datasets scaling up to 100,000 records.
- **Reliability**: The system must handle missing data inputs gracefully via imputation pipelines.
- **Interpretability**: Explanations must be deterministic and clinically relevant.

## 3.8 Hardware Requirements
- **Processor**: Multi-core CPU (Intel i5/i7 or AMD equivalent) for cross-validation and SHAP computation.
- **Memory**: Minimum 8GB RAM (16GB recommended for heavy ensemble training).
- **Storage**: SSD for rapid dataset loading and model artifact serialization.

## 3.9 Software Requirements
- **Language**: Python 3.9+
- **ML Frameworks**: Scikit-learn, XGBoost, SHAP
- **Data Processing**: Pandas, NumPy
- **Backend**: FastAPI, Uvicorn
- **Frontend**: React, Vite, TypeScript

## 3.10 Dataset Requirements
The system requires tabular data containing:
1. **Demographic/Socioeconomic data**: Age, gender, debt status, scholarship status.
2. **Macroeconomic data**: Inflation rate, GDP, unemployment rate at the time of enrollment.
3. **Academic data**: Curricular units enrolled, evaluated, and approved in the 1st and 2nd semesters.

## 3.11 ML Requirements
- Strict isolation of training and testing data to prevent data leakage.
- Implementation of stratified sampling to preserve class distribution across folds.
- Hyperparameter tuning using cross-validation.

## 3.12 Existing vs Proposed System

| Feature | Existing System | Proposed System (SENTINAL D) |
|---|---|---|
| Approach | Descriptive (Dashboards) | Predictive (Machine Learning) |
| Variable Analysis | Univariate / Bivariate | Multivariate Non-linear |
| Timing | Reactive | Proactive / Early Warning |
| Accuracy | Human heuristic-based | Data-driven optimization |
| Explainability | Manual justification | SHAP Algorithmic transparency |

## 3.13 Constraints
- **Data Privacy**: The system must not ingest personally identifiable information (PII). All student IDs must be pseudonymized.
- **Temporal Constraint**: Models must be evaluated under the constraint that Semester 2 data may not be available for early-warning deployment use cases.

---

<div style="page-break-after: always"></div>

