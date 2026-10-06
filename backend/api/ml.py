from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import time

from ml_hub.trainer import (
    get_available_models,
    train_model,
    get_model_details,
    predict as predict_model
)

router = APIRouter(tags=["Machine Learning Hub"])

class TrainRequest(BaseModel):
    model_name: str

class PredictRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]

@router.get("/models")
async def list_models():
    """List all available models and their current status/metrics if trained."""
    models = get_available_models()
    result = []
    for m in models:
        details = get_model_details(m)
        if details:
            result.append({
                "name": m,
                "is_trained": True,
                "metrics": details["metrics"],
                "shap": details.get("shap", [])
            })
        else:
            result.append({
                "name": m,
                "is_trained": False,
                "metrics": None,
                "shap": None
            })
    return {"models": result}

@router.post("/train")
async def train_model_endpoint(req: TrainRequest):
    """Train a specific model synchronously."""
    try:
        start_time = time.time()
        result = train_model(req.model_name)
        duration = time.time() - start_time
        return {
            "success": True,
            "message": f"Model '{req.model_name}' trained successfully in {duration:.2f}s.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict")
async def predict_endpoint(req: PredictRequest):
    """Run prediction for a specific model."""
    try:
        result = predict_model(req.model_name, req.features)
        return {
            "success": True,
            "prediction": result["prediction"],
            "probabilities": result["probabilities"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/details/{model_name}")
async def get_details_endpoint(model_name: str):
    """Get metrics and SHAP values for a trained model."""
    details = get_model_details(model_name)
    if not details:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found or not trained.")
    return {"success": True, "data": details}
