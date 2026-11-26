"""
AquaGuard AI – PDF Report Generation Route
GET /api/report/{id} – Generate and download A4 PDF assessment report
"""

import json
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.database.db import get_prediction_by_id
from app.services.pdf_service import generate_report

router = APIRouter()


@router.get("/report/{pred_id}")
async def download_report(pred_id: int):
    row = get_prediction_by_id(pred_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Assessment {pred_id} not found.")

    record = dict(row)
    remarks = record.get("remarks")
    if remarks:
        try:
            record["feature_contributions"] = json.loads(remarks)
        except Exception:
            record["feature_contributions"] = []

    filepath = generate_report(record)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=500, detail="Failed to generate PDF report.")

    filename = f"AquaGuard_Assessment_AQ-{pred_id:04d}.pdf"
    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=filename,
    )
