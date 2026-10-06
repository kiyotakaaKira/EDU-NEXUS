# CHAPTER 5: SYSTEM DESIGN AND ARCHITECTURE

## 5.1 System Architecture
SENTINAL D employs a modular, decoupled full-stack architecture that isolates data processing, machine learning training, inference, and the user interface. 
- **Data Layer**: Raw CSV files and Parquet analytical data stores.
- **Backend/MLOps Layer**: A FastAPI-based Python server that orchestrates model training, loads serialized model artifacts, and computes predictions.
- **Frontend Layer**: A React-based Single Page Application (SPA) providing visual analytics and form-based inference.

## 5.2 ML Architecture
The ML architecture consists of two distinct pipelines:
1. **Offline Training Pipeline**: Data Ingestion $\rightarrow$ Feature Engineering $\rightarrow$ Scaling $\rightarrow$ Model Training $\rightarrow$ Serialization (`.pkl`).
2. **Online Inference Pipeline**: REST API Request $\rightarrow$ Data Validation $\rightarrow$ Preprocessing $\rightarrow$ Deserialized Model Prediction $\rightarrow$ SHAP Calculation $\rightarrow$ JSON Response.

## 5.3 Data Flow Diagram
*(Figure 5.1: Overall SENTINAL D Data Flow Diagram - Extracted from system design documents)*

1. Raw student data is ingested from the `data/raw/` directory.
2. `uci_loader.py` applies the semantic mapping schema, generating engineered features.
3. The cleaned dataset is exported to `master_analytical_dataset.parquet` for optimized loading.
4. `trainer.py` splits the data, applies standard scaling, and fits 9 distinct classifiers.
5. Models and metrics are serialized via `joblib` into `models/saved_models/`.
6. FastAPI routes (`ml.py`) load these artifacts into memory upon boot.
7. Frontend Axios requests hit the `/predict` endpoint, returning real-time analytics.

## 5.4 Component Diagram
- **Frontend App (React)**: Contains components for Dashboard, Model Comparison, and Predictor.
- **API Gateway (FastAPI)**: Routes `/train`, `/predict`, `/models`, `/details`.
- **Trainer Module**: Contains `train_model()`, `preprocess_data()`.
- **Model Registry**: File-system based storage of `xgboost.pkl`, `random_forest.pkl`, etc.
- **Explainability Module**: SHAP `TreeExplainer` and `KernelExplainer`.

## 5.5 Database Design
While this project focuses heavily on the ML layer, it rests upon a conceptual database foundation previously designed for the system.
The primary schema involves:
- **Student Entity**: Demographics, ID.
- **Academic Entity**: Semester 1 & 2 performance metrics.
- **Macroeconomic Entity**: Inflation, GDP tied to enrollment year.

The ML layer abstracts this relational design into a flattened tabular matrix (DataFrame) necessary for algorithmic processing.

## 5.6 API Architecture
The prediction API is designed for stateless execution.
**Endpoint**: `POST /predict`
**Payload**:
```json
{
  "model_name": "XGBoost",
  "features": {
    "age_at_enrollment": 20,
    "debtor": 0,
    "curricular_units_1st_sem_grade": 14.5,
    "curricular_units_2nd_sem_grade": 15.0,
    ...
  }
}
```
**Response**:
```json
{
  "success": true,
  "prediction": "Graduate",
  "probabilities": {
    "Graduate": 0.82,
    "Enrolled": 0.15,
    "Dropout": 0.03
  }
}
```

## 5.7 Explainability Architecture
To provide transparency:
1. The inference request vector $X_{inf}$ is passed to the SHAP explainer.
2. The explainer calculates the marginal contribution of each feature in $X_{inf}$ relative to the model's expected base value.
3. The top 5 features driving the prediction are returned to the frontend to render a localized feature-importance bar chart.

---

<div style="page-break-after: always"></div>

# CHAPTER 6: IMPLEMENTATION

## 6.1 Development Environment
- **OS**: Windows 11 / Linux (Deployment)
- **Language**: Python 3.10
- **Virtual Environment**: `venv`
- **Frontend runtime**: Node.js v18+, Bun package manager.

## 6.2 Technology Stack
**Machine Learning**:
- `scikit-learn`: Data preprocessing, train-test splitting, metrics, and traditional ML models (LR, SVM, RF).
- `xgboost`: Extreme gradient boosting implementation.
- `shap`: Explainable AI.
- `pandas` & `numpy`: Data manipulation.

**Backend**:
- `fastapi`: High-performance asynchronous REST API.
- `uvicorn`: ASGI server.
- `joblib`: Model artifact serialization.

**Frontend**:
- `React 18` + `Vite`
- `Tailwind CSS`: Utility-first UI styling.
- `Recharts`: Data visualization (Bar charts, Line charts for metrics).

## 6.3 Dataset Processing Implementation
The dataset processing was implemented in `backend/data/uci_loader.py`. 
Key snippet of the feature engineering implementation:
```python
# Academic Progression Index
weighted_grade = (df["curricular_units_1st_sem_grade"] * 0.4) + \
                 (df["curricular_units_2nd_sem_grade"] * 0.6)
df["academic_progression_index"] = (weighted_grade * df["approval_rate_sem2"]).round(2)

# Financial Risk Indicator
df["financial_risk_indicator"] = ((df["debtor"] == 1) & \
                                 (df["tuition_fees_up_to_date"] == 0)).astype(int)
```

## 6.4 Model Training Implementation
The model training lifecycle is governed by `backend/ml_hub/trainer.py`. 
A dictionary maps string names to instantiated algorithm objects. A centralized function iterates over these algorithms, fitting them to the scaled training data.

```python
MODEL_MAPPING = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Random Forest": RandomForestClassifier(random_state=42),
    "XGBoost": xgb.XGBClassifier(random_state=42, eval_metric='mlogloss')
}
```

## 6.5 Evaluation Implementation
To handle the multiclass nature, metrics are explicitly calculated using `average='macro'` to prevent the majority class from masking poor performance on the minority 'Enrolled' class.

```python
prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
roc_auc = roc_auc_score(y_test, y_prob, multi_class='ovr')
```

## 6.6 Model Serialization
Fitted models, along with their `StandardScaler` and `LabelEncoder` objects, are packed into a dictionary and serialized via Joblib. This ensures the inference pipeline uses the exact same scaling parameters ($\mu, \sigma$) as the training pipeline.

## 6.7 SHAP Integration
SHAP computation varies by model architecture. Tree-based models utilize `TreeExplainer`, which is highly optimized. Other models (SVM, KNN) utilize `KernelExplainer`, which requires background data sampling for computational feasibility.

```python
if model_name in ["Random Forest", "Decision Tree", "Gradient Boosting", "XGBoost"]:
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
else:
    explainer = shap.KernelExplainer(model.predict, X_sample)
    shap_values = explainer.shap_values(X_sample, nsamples=100)
```

## 6.8 Testing
Integration testing was performed by executing the full `run_experiments.py` script. The script iteratively calls the training function for all 9 algorithms, validating that no memory leaks occur, scalers are properly applied, and predictions are generated successfully.

## 6.9 Deployment
The backend can be executed via `uvicorn main:app --reload`. The React frontend is built via `bun run build` and served as static files, resulting in a lightweight, cloud-deployable container footprint.

---

<div style="page-break-after: always"></div>
