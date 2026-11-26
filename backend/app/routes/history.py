"""
AquaGuard AI – Prediction History Routes
GET /api/history       – Paginated, filterable, searchable prediction history
GET /api/history/{id}  – Single assessment details
"""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.db import get_all_predictions, get_prediction_by_id, get_total_count

router = APIRouter()


def _parse_record(row: dict) -> dict:
    """Attach parsed feature_contributions from remarks JSON if available."""
    record = dict(row)
    remarks = record.get("remarks")
    if remarks:
        try:
            record["feature_contributions"] = json.loads(remarks)
        except Exception:
            record["feature_contributions"] = []
    else:
        record["feature_contributions"] = []
    return record


@router.get("/history")
async def list_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    filter_label: Optional[str] = Query(None, description="Filter by 'Potable' or 'Non-Potable'"),
    search: Optional[str] = Query(None, description="Search by model name or timestamp"),
):
    records = get_all_predictions(
        limit=limit,
        offset=offset,
        filter_label=filter_label,
        search=search,
    )
    total = get_total_count(filter_label=filter_label)
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "records": [_parse_record(r) for r in records],
    }


@router.get("/history/{pred_id}")
async def get_history_item(pred_id: int):
    row = get_prediction_by_id(pred_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Assessment {pred_id} not found.")
    return _parse_record(row)
