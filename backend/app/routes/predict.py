"""
AquaGuard AI – Prediction Routes
POST /api/predict        – Single sample prediction
POST /api/predict/bulk   – Bulk CSV prediction
GET  /api/bulk/template  – Download sample CSV template
"""

import io
import csv
import json
from datetime import datetime
from typing import Optional
import pandas as pd

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

from app.services.model_service import predict, get_available_models, get_best_model_name
from app.utils.standards import check_compliance
from app.database.db import insert_prediction

router = APIRouter()

FEATURE_COLUMNS = [
    "ph", "Hardness", "Solids", "Chloramines",
    "Sulfate", "Conductivity", "Organic_carbon",
    "Trihalomethanes", "Turbidity"
]

# ── Pydantic input schema ──────────────────────────────────────────────────

class WaterSampleInput(BaseModel):
    ph: float = Field(..., ge=0.0, le=14.0, description="pH level (0–14)")
    Hardness: float = Field(..., ge=0.0, le=1000.0, description="Hardness in mg/L")
    Solids: float = Field(..., ge=0.0, le=100000.0, description="Total Dissolved Solids in mg/L")
    Chloramines: float = Field(..., ge=0.0, le=20.0, description="Chloramines in mg/L")
    Sulfate: float = Field(..., ge=0.0, le=1000.0, description="Sulfate in mg/L")
    Conductivity: float = Field(..., ge=0.0, le=2000.0, description="Conductivity in μS/cm")
    Organic_carbon: float = Field(..., ge=0.0, le=50.0, description="Organic carbon in mg/L")
    Trihalomethanes: float = Field(..., ge=0.0, le=200.0, description="Trihalomethanes in μg/L")
    Turbidity: float = Field(..., ge=0.0, le=20.0, description="Turbidity in NTU")
    model_name: Optional[str] = Field(None, description="ML model to use (optional)")

    @field_validator("ph")
    @classmethod
    def ph_must_be_valid(cls, v):
        if v < 0 or v > 14:
            raise ValueError("pH must be between 0 and 14")
        return v


# ── Single prediction ──────────────────────────────────────────────────────

@router.post("/predict")
async def predict_single(sample: WaterSampleInput):
    raw = {
        "ph": sample.ph,
        "Hardness": sample.Hardness,
        "Solids": sample.Solids,
        "Chloramines": sample.Chloramines,
        "Sulfate": sample.Sulfate,
        "Conductivity": sample.Conductivity,
        "Organic_carbon": sample.Organic_carbon,
        "Trihalomethanes": sample.Trihalomethanes,
        "Turbidity": sample.Turbidity,
    }

    result = predict(raw, sample.model_name)
    compliance = check_compliance(raw)

    # Persist to SQLite
    record_id = insert_prediction({
        "timestamp": datetime.now().isoformat(),
        "ph": sample.ph,
        "hardness": sample.Hardness,
        "solids": sample.Solids,
        "chloramines": sample.Chloramines,
        "sulfate": sample.Sulfate,
        "conductivity": sample.Conductivity,
        "organic_carbon": sample.Organic_carbon,
        "trihalomethanes": sample.Trihalomethanes,
        "turbidity": sample.Turbidity,
        "prediction": result["prediction"],
        "potability_label": result["potability_label"],
        "confidence": result["confidence"],
        "model_used": result["model_used"],
        "remarks": json.dumps(result.get("feature_contributions", [])),
    })

    return {
        "assessment_id": record_id,
        **result,
        "compliance": compliance,
        "parameters": raw,
        "timestamp": datetime.now().isoformat(),
    }


# ── Bulk CSV prediction ────────────────────────────────────────────────────

@router.post("/predict/bulk")
async def predict_bulk(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None)
):
    # Validate file type
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum 10 MB.")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {e}")

    # Validate required columns
    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required columns: {missing_cols}. "
                   f"Required: {FEATURE_COLUMNS}"
        )

    # Keep only required columns (ignore extras)
    df_clean = df[FEATURE_COLUMNS].copy()

    # Coerce to numeric; non-parseable values become NaN
    for col in FEATURE_COLUMNS:
        df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

    # Drop fully empty rows
    df_clean = df_clean.dropna(how="all")
    if len(df_clean) == 0:
        raise HTTPException(status_code=422, detail="No valid data rows found in the uploaded file.")

    if len(df_clean) > 5000:
        raise HTTPException(status_code=413, detail="Too many rows. Maximum 5000 per bulk request.")

    # Row-wise prediction
    results = []
    potable_count = 0
    non_potable_count = 0

    for _, row in df_clean.iterrows():
        raw = row.to_dict()
        # Replace NaN with column median from the row (model imputer handles it)
        for col in FEATURE_COLUMNS:
            if pd.isna(raw[col]):
                raw[col] = df_clean[col].median()

        try:
            pred_result = predict(raw, model_name)
        except Exception:
            pred_result = {
                "prediction": -1,
                "potability_label": "Error",
                "confidence": 0,
                "model_used": model_name or "N/A",
            }

        label = pred_result["potability_label"]
        if label == "Potable":
            potable_count += 1
        elif label == "Non-Potable":
            non_potable_count += 1

        results.append({**raw, **{
            "Predicted_Potability": label,
            "Prediction_Code": pred_result["prediction"],
            "Confidence_Pct": pred_result["confidence"],
            "Model_Used": pred_result["model_used"],
        }})

    # Build output CSV in memory
    output = io.StringIO()
    if results:
        writer = csv.DictWriter(output, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)

    output.seek(0)
    total = potable_count + non_potable_count

    response_headers = {
        "X-Total-Rows": str(total),
        "X-Potable-Count": str(potable_count),
        "X-NonPotable-Count": str(non_potable_count),
    }

    return {
        "total_rows": total,
        "potable_count": potable_count,
        "non_potable_count": non_potable_count,
        "potability_rate": round(potable_count / total * 100 if total > 0 else 0, 1),
        "model_used": model_name or get_best_model_name(),
        "results": results[:500],  # Cap preview at 500 rows in JSON
        "has_more": len(results) > 500,
        "csv_data": output.getvalue(),
    }


# ── Template download ──────────────────────────────────────────────────────

@router.get("/bulk/template")
async def get_bulk_template():
    """Return a sample CSV with realistic test data for demonstration."""
    rows = [
        # Format: ph, Hardness, Solids, Chloramines, Sulfate, Conductivity, Organic_carbon, Trihalomethanes, Turbidity
        dict(zip(FEATURE_COLUMNS, [7.08, 204.89, 20791.3, 7.30, 368.52, 564.31, 10.38, 86.99, 2.96])),
        dict(zip(FEATURE_COLUMNS, [3.72, 129.42, 18630.1, 6.64, 310.14, 592.89, 15.18, 56.33, 4.50])),
        dict(zip(FEATURE_COLUMNS, [8.09, 224.24, 19909.5, 9.28, 416.69, 418.62, 16.87, 66.42, 3.30])),
        dict(zip(FEATURE_COLUMNS, [8.32, 214.37, 22018.4, 8.06, None, 356.89, 8.06, 100.34, 4.63])),
        dict(zip(FEATURE_COLUMNS, [9.09, 181.10, 17978.9, 6.55, 310.14, 398.41, 11.56, 31.99, 4.08])),
        dict(zip(FEATURE_COLUMNS, [6.98, 193.68, 11427.1, 7.55, 341.70, 453.09, 15.18, 70.08, 3.11])),
        dict(zip(FEATURE_COLUMNS, [7.59, 203.36, 13672.1, 7.20, 358.87, 526.42, 12.09, 52.97, 3.73])),
        dict(zip(FEATURE_COLUMNS, [5.58, 331.61, 48348.4, 7.26, 215.35, 382.74, 14.37, 48.48, 2.95])),
        dict(zip(FEATURE_COLUMNS, [7.78, 220.82, 15997.4, 5.92, 426.44, 410.21, 7.98, 59.74, 2.73])),
        dict(zip(FEATURE_COLUMNS, [5.75, 170.00, 14520.3, 8.12, 301.22, 450.11, 13.44, 61.80, 3.95])),
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=FEATURE_COLUMNS)
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aquaguard_sample_bulk.csv"}
    )
