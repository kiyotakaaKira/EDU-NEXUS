import os
import joblib
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from pathlib import Path

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB

import xgboost as xgb
import shap

from data.uci_loader import get_master_dataset

MODELS_DIR = Path(__file__).resolve().parent.parent / "models" / "saved_models"
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_MAPPING = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(random_state=42),
    "SVM": SVC(probability=True, random_state=42),
    "KNN": KNeighborsClassifier(),
    "Naive Bayes": GaussianNB(),
    "Gradient Boosting": GradientBoostingClassifier(random_state=42),
    "AdaBoost": AdaBoostClassifier(random_state=42),
    "XGBoost": xgb.XGBClassifier(random_state=42, eval_metric='mlogloss')
}

def preprocess_data(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, LabelEncoder]:
    # Drop string/identifier columns that shouldn't be used for training
    cols_to_drop = ["student_id"]
    for col in df.columns:
        if col.endswith("_label"):
            cols_to_drop.append(col)
            
    df_clean = df.drop(columns=[col for col in cols_to_drop if col in df.columns]).copy()
    
    # Handle missing values
    df_clean = df_clean.fillna(0)
    
    # Target
    if "target" not in df_clean.columns:
        raise ValueError("Target column not found in dataset")
        
    X = df_clean.drop(columns=["target"])
    y_raw = df_clean["target"]
    
    le = LabelEncoder()
    y = pd.Series(le.fit_transform(y_raw), name="target")
    
    return X, y, le

def get_available_models() -> List[str]:
    return list(MODEL_MAPPING.keys())

def train_model(model_name: str) -> Dict[str, Any]:
    if model_name not in MODEL_MAPPING:
        raise ValueError(f"Model {model_name} not supported")
        
    df = get_master_dataset()
    X, y, le = preprocess_data(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Needs dataframe for SHAP feature names later if applicable, but standard scaler returns numpy array.
    X_train_scaled = pd.DataFrame(X_train_scaled, columns=X.columns)
    X_test_scaled = pd.DataFrame(X_test_scaled, columns=X.columns)
    
    model = MODEL_MAPPING[model_name]
    model.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)
    
    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
    rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
    
    try:
        roc_auc = roc_auc_score(y_test, y_prob, multi_class='ovr')
    except Exception:
        roc_auc = 0.0
        
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=3)
    cv_mean = float(np.mean(cv_scores))
    
    # SHAP (Sampled for speed)
    shap_data = None
    try:
        sample_size = min(100, len(X_train_scaled))
        X_sample = shap.sample(X_train_scaled, sample_size)
        if False:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_sample)
        else:
            shap_values = []
            
        # Format SHAP summary
        if isinstance(shap_values, list):
            # Multiclass SHAP values is a list of arrays. We take the mean absolute across all classes
            shap_val_mean = np.abs(np.array(shap_values)).mean(axis=0).mean(axis=0)
        else:
            # Multi-output might have shape (samples, features, classes) in newer SHAP
            if len(shap_values.shape) == 3:
                shap_val_mean = np.abs(shap_values).mean(axis=0).mean(axis=1)
            else:
                shap_val_mean = np.abs(shap_values).mean(axis=0)
            
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': shap_val_mean
        }).sort_values('importance', ascending=False).head(15)
        
        shap_data = feature_importance.to_dict('records')
    except Exception as e:
        print(f"SHAP generation failed for {model_name}: {e}")
        shap_data = []

    metrics = {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "confusion_matrix": cm,
        "cv_score": float(cv_mean),
        "classes": list(le.classes_)
    }
    
    # Save Model & Metadata
    model_filename = model_name.replace(" ", "_").lower()
    joblib.dump({
        "model": model,
        "scaler": scaler,
        "label_encoder": le,
        "features": list(X.columns),
        "metrics": metrics,
        "shap": shap_data
    }, MODELS_DIR / f"{model_filename}.pkl")
    
    return {
        "model_name": model_name,
        "metrics": metrics,
        "shap": shap_data
    }

def get_model_details(model_name: str) -> Dict[str, Any]:
    model_filename = model_name.replace(" ", "_").lower()
    model_path = MODELS_DIR / f"{model_filename}.pkl"
    if not model_path.exists():
        return None
    data = joblib.load(model_path)
    return {
        "model_name": model_name,
        "metrics": data["metrics"],
        "shap": data.get("shap", [])
    }

def predict(model_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    model_filename = model_name.replace(" ", "_").lower()
    model_path = MODELS_DIR / f"{model_filename}.pkl"
    if not model_path.exists():
        raise ValueError(f"Model {model_name} not found. Train it first.")
        
    data = joblib.load(model_path)
    model = data["model"]
    scaler = data["scaler"]
    le = data["label_encoder"]
    features = data["features"]
    
    df = pd.DataFrame([input_data])
    
    # Ensure all required features are present
    missing_cols = set(features) - set(df.columns)
    for col in missing_cols:
        df[col] = 0
    df = df[features]
    
    X_scaled = scaler.transform(df)
    pred_idx = model.predict(X_scaled)[0]
    prob = model.predict_proba(X_scaled)[0].tolist()
    
    pred_label = le.inverse_transform([pred_idx])[0]
    
    return {
        "prediction": pred_label,
        "probabilities": dict(zip(le.classes_, prob))
    }
