# CHAPTER 4: PROPOSED MACHINE LEARNING METHODOLOGY

## 4.1 Overall Methodology
The development of the SENTINAL D machine learning pipeline follows a rigorous, sequential methodology aligned with the Cross-Industry Standard Process for Data Mining (CRISP-DM). The lifecycle encompasses Data Understanding, Data Preparation, Modeling, Evaluation, and Deployment. 

## 4.2 Dataset Collection
The primary dataset is derived from the UCI Machine Learning Repository, tracking students enrolled in various undergraduate degrees. The dataset, comprising 4,424 records, encapsulates 36 independent variables (features) and 1 dependent variable (target). The features span three main domains:
1. **Demographic data**: Marital status, nationality, gender, age at enrollment.
2. **Socioeconomic/Macroeconomic data**: Scholarship status, debtor status, tuition fee status, inflation rate, GDP.
3. **Academic progression data**: First and second-semester grades, evaluations, and approvals.

## 4.3 Dataset Description
The target variable is categorical with three classes:
- **Graduate**: Students who successfully completed their degree.
- **Enrolled**: Students who are still active but have not yet graduated.
- **Dropout**: Students who abandoned their studies.

## 4.4 Data Understanding
Initial exploratory analysis revealed a class imbalance. While 'Graduate' and 'Dropout' represent the majority of the outcomes, the 'Enrolled' class acts as an intermediate, minority state. This structure necessitated the use of robust multiclass evaluation metrics rather than simplistic binary accuracy.

## 4.5 Data Validation
A comprehensive data validation script ensures schema contract adherence. It verifies:
- Data type consistency.
- Absence of critical missing values in the target column.
- Semantic boundaries (e.g., grades falling within the valid 0-20 scale).

## 4.6 Exploratory Data Analysis
Exploratory Data Analysis (EDA) forms the basis of our intuition. Statistical distributions of features were plotted against the target classes. Significant variances were observed in the `curricular_units_2nd_sem_grade` and `debtor` features between the Graduate and Dropout classes. 

## 4.7 Data Preprocessing
Machine learning algorithms mathematically compute decision boundaries based on numerical inputs; therefore, data preprocessing is essential.
- **Cleaning**: Removal of implicit identifiers (e.g., student IDs) that offer no predictive value.
- **Label Encoding**: Transformation of the string target variable into integers $Y \in \{0, 1, 2\}$.

## 4.8 Missing Value Handling
Missing values in numerical columns were handled via zero-imputation, reflecting the domain reality that a missing grade or enrollment usually indicates zero academic activity for that unit.

## 4.9 Duplicate Handling
Duplicate rows were scrubbed from the processed dataset to prevent train/test data leakage and artificially inflated performance metrics.

## 4.10 Outlier Analysis
Given the constrained domain (e.g., grades between 0 and 20), outliers were minimal. Statistical outliers in macroeconomic variables were retained as they reflect genuine economic volatility, which has a documented impact on tuition affordability.

## 4.11 Encoding
Categorical variables in the raw dataset were already provided as label-encoded integers (e.g., Gender: 1 for male, 0 for female).

## 4.12 Scaling
Feature scaling is critical for distance-based and gradient-based algorithms (SVM, KNN, Logistic Regression). We applied `StandardScaler`, which standardizes features by removing the mean and scaling to unit variance:

$$ z = \frac{x - \mu}{\sigma} $$

where $\mu$ is the mean of the training samples, and $\sigma$ is the standard deviation. Tree-based models (Random Forest, XGBoost) do not strictly require scaling, but applying it uniformly simplifies the pipeline architecture without degrading their performance.

## 4.13 Feature Engineering
Feature engineering transforms raw data into features that better represent the underlying problem to predictive models. We synthesized the following novel indicators:

1. **Semester Grade Change**: Evaluates academic momentum.
   $$ \Delta Grade = Grade_{Sem2} - Grade_{Sem1} $$

2. **Approval Rates**: Assesses academic efficiency.
   $$ ApprovalRate_{Sem1} = \frac{Approved_{Sem1}}{Enrolled_{Sem1}} $$

3. **Academic Progression Index (API)**: A weighted metric of overall performance stability.
   $$ API = ((Grade_{Sem1} \times 0.4) + (Grade_{Sem2} \times 0.6)) \times ApprovalRate_{Sem2} $$

4. **Financial Risk Indicator**: A binary flag indicating acute financial distress.
   $$ Risk = 1 \text{ if } (Debtor == 1 \land TuitionUpToDate == 0) \text{ else } 0 $$

5. **Academic Load Ratio**: Measures the burden of coursework.
   $$ LoadRatio = \frac{Enrolled_{Sem1}}{6.0} $$

## 4.14 Feature Selection
To prevent the curse of dimensionality, non-predictive String labels and zero-variance features were dropped. Correlation heatmaps were generated to ensure no two independent variables possessed perfect collinearity ($r > 0.95$), which would cause multicollinearity issues in Logistic Regression.

## 4.15 Leakage Prevention
Data leakage occurs when information from outside the training dataset is used to create the model. We ensured that:
- Scalers were fitted *only* on the training set. The test set was transformed using the learned parameters.
- Target variables were completely isolated before feature engineering to prevent label leakage.

### Temporal Leakage Discussion
A critical research component of this study is Temporal Leakage. Using Semester 2 grades to predict dropout is highly accurate but practically useless if an intervention is required in Semester 1. The framework supports ablation studies to train models using only entry-time features (demographics) vs. Semester 1 features to construct a true "Early Warning System".

## 4.16 Train/Test Split
The dataset was partitioned using an 80/20 train/test split. A `random_state` of 42 was employed to ensure experimental reproducibility. Stratified sampling implicitly preserves the class distribution ratio in both sets.

## 4.17 Cross Validation
To assess model stability and variance, k-fold cross-validation ($k=3$) was performed on the training set. This technique partitions the data into 3 subsets, trains the model on 2 subsets, and validates on the 3rd, rotating iteratively.

## 4.18 Machine Learning Algorithms

The framework evaluates nine diverse algorithms.

### 4.18.1 Logistic Regression
A linear model utilized for multiclass classification via a One-vs-Rest (OvR) or multinomial (softmax) approach. It models the log-odds as a linear combination of features.
$$ P(y=c|x) = \frac{e^{\beta_c \cdot x}}{\sum_{k=1}^K e^{\beta_k \cdot x}} $$

### 4.18.2 Decision Tree
A non-parametric model that recursively splits the data space based on feature thresholds that maximize Information Gain or minimize Gini impurity.
$$ Gini = 1 - \sum_{i=1}^{c} p_i^2 $$
It is highly interpretable but prone to severe overfitting.

### 4.18.3 Random Forest
An ensemble bagging technique that constructs a multitude of decision trees at training time. It combats the overfitting of individual trees by averaging their predictions (or majority voting) and utilizing random subsets of features for node splitting.

### 4.18.4 Support Vector Machine (SVM)
SVM constructs hyperplanes in a high-dimensional space to separate classes. By utilizing the Radial Basis Function (RBF) kernel, it can model highly non-linear boundaries.
$$ K(x, x') = \exp\left(-\frac{||x - x'||^2}{2\sigma^2}\right) $$
SVM requires extensive tuning of the regularization parameter $C$.

### 4.18.5 K-Nearest Neighbors (KNN)
A lazy-learning algorithm that classifies a new sample based on the majority class of its $k$ nearest neighbors in the feature space, computed via Euclidean distance:
$$ d(p, q) = \sqrt{\sum_{i=1}^{n} (q_i - p_i)^2} $$

### 4.18.6 Naive Bayes
A probabilistic classifier based on applying Bayes' theorem with strong (naive) independence assumptions between features.
$$ P(C_k | x) = \frac{P(C_k) \prod_{i=1}^{n} P(x_i | C_k)}{P(x)} $$

### 4.18.7 Gradient Boosting
An ensemble technique that builds trees sequentially. Each new tree attempts to correct the residual errors of the combined ensemble of previous trees.

### 4.18.8 AdaBoost
Adaptive Boosting combines weak learners (typically shallow trees). It iteratively adjusts the weights of misclassified instances, forcing subsequent learners to focus on the hardest cases.

### 4.18.9 XGBoost (Extreme Gradient Boosting)
The premier implementation of gradient boosted trees. It includes advanced regularization ($L1$ and $L2$) in its objective function to prevent overfitting, alongside second-order gradient approximation for speed and accuracy.
$$ Obj(\theta) = \sum_{i=1}^n l(y_i, \hat{y}_i) + \sum_{k=1}^K \Omega(f_k) $$
Where $\Omega(f_k) = \gamma T + \frac{1}{2} \lambda ||w||^2$ penalizes tree complexity.

## 4.19 Model Training
Models are trained utilizing standard scikit-learn and xgboost APIs. 

## 4.20 Hyperparameter Tuning
Default hyperparameters were utilized as baselines, with `random_state=42` fixed for all stochastic models. Specific algorithmic complexities were bounded (e.g., Logistic Regression `max_iter=1000`) to ensure convergence.

## 4.21 Model Evaluation Metrics
Given the multiclass nature and class imbalance, relying solely on Accuracy is misleading. 
- **Macro Precision**: Average precision across all classes, treating all classes equally.
- **Macro Recall**: Average recall across all classes. Crucial for measuring how well the model identifies the minority 'Enrolled' class.
- **Macro F1-Score**: The harmonic mean of Macro Precision and Macro Recall. This is our primary evaluation metric.
$$ F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall} $$
- **Multiclass ROC-AUC**: Measures the model's ability to distinguish between classes, calculated using a One-vs-Rest strategy.

## 4.22 Best Model Selection
Model selection is determined empirically. The model exhibiting the highest Macro F1-score on the unseen test set, coupled with robust cross-validation stability and rapid inference time, is selected as the primary engine.

## 4.23 SHAP Explainability
To dismantle the black-box nature of the models, SHapley Additive exPlanations (SHAP) are computed. Based on cooperative game theory, SHAP assigns a payout (importance) to each feature representing its contribution to the final prediction.
$$ \phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} [f_x(S \cup \{i\}) - f_x(S)] $$
This enables generating individualized feedback for academic advisors.

## 4.24 Prediction Engine
The final pipeline encapsulates the Scaler, Label Encoder, and best Model object. A new inference request undergoes the exact same transformation pipeline before prediction.

## 4.25 Recommendation Engine
Based on the SHAP outputs, a rule-based recommendation layer maps negative feature contributions (e.g., negative impact from high debt) to actionable advice (e.g., "Refer student to Financial Aid Office").

---

<div style="page-break-after: always"></div>
