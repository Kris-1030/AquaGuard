"""
AquaGuard AI – Analytics Routes
GET /api/dashboard   – KPI summary from SQLite
GET /api/eda         – Pre-computed EDA statistics
GET /api/standards   – WHO/BIS reference table
"""

from fastapi import APIRouter
from app.database.db import get_dashboard_stats
from app.services.model_service import get_eda, get_metrics
from app.utils.standards import WATER_STANDARDS

router = APIRouter()


@router.get("/dashboard")
async def dashboard():
    stats = get_dashboard_stats()
    metrics = get_metrics()
    best_model_name = metrics.get("best_model", "N/A")
    # Find the best model's metrics in the results list
    best_metrics = next(
        (r for r in metrics.get("results", []) if r["name"] == best_model_name),
        {}
    )
    return {
        **stats,
        "best_model": best_model_name,
        "best_model_metrics": {
            "accuracy": best_metrics.get("accuracy"),
            "f1_score": best_metrics.get("f1_score"),
            "roc_auc": best_metrics.get("roc_auc"),
        },
    }


@router.get("/eda")
async def eda():
    return get_eda()


@router.get("/standards")
async def water_standards():
    return {"standards": WATER_STANDARDS}
