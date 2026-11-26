"""
AquaGuard AI – ML Model Performance & Explainability Routes
GET /api/model-performance   – Real evaluation metrics for all 7 models
GET /api/feature-importance  – Global feature importance & SHAP summary
GET /api/models              – Available model names & best model
"""

from fastapi import APIRouter
from app.services.model_service import (
    get_metrics,
    get_global_feature_importance,
    get_available_models,
    get_best_model_name,
)

router = APIRouter()


@router.get("/model-performance")
async def model_performance():
    return get_metrics()


@router.get("/feature-importance")
async def feature_importance():
    return get_global_feature_importance()


@router.get("/models")
async def list_models():
    return {
        "models": get_available_models(),
        "best_model": get_best_model_name(),
    }
