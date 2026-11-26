"""
AquaGuard AI – Model Service
Loads serialised model artefacts and provides inference + local explainability.
"""

import os
import json
import numpy as np
import joblib
from typing import Optional

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_MODELS_DIR = os.path.join(_BASE, "..", "saved_models")
METRICS_PATH = os.path.join(SAVED_MODELS_DIR, "metrics.json")
EDA_PATH = os.path.join(SAVED_MODELS_DIR, "eda_summary.json")

FEATURE_COLUMNS = [
    "ph", "Hardness", "Solids", "Chloramines",
    "Sulfate", "Conductivity", "Organic_carbon",
    "Trihalomethanes", "Turbidity"
]

# ── Lazy singletons ────────────────────────────────────────────────────────
_all_models_cache = None
_metrics_cache = None
_eda_cache = None


def _load_all_models():
    global _all_models_cache
    if _all_models_cache is None:
        path = os.path.join(SAVED_MODELS_DIR, "all_models.joblib")
        if not os.path.exists(path):
            raise FileNotFoundError(
                "Models not found. Please run: python -m ml.generate_artifacts"
            )
        _all_models_cache = joblib.load(path)
    return _all_models_cache


def _load_metrics() -> dict:
    global _metrics_cache
    if _metrics_cache is None:
        with open(METRICS_PATH) as f:
            _metrics_cache = json.load(f)
    return _metrics_cache


def _load_eda() -> dict:
    global _eda_cache
    if _eda_cache is None:
        with open(EDA_PATH) as f:
            _eda_cache = json.load(f)
    return _eda_cache


def get_available_models() -> list:
    data = _load_all_models()
    return list(data["models"].keys())


def get_best_model_name() -> str:
    data = _load_all_models()
    return data["best_model_name"]


def predict(raw_input: dict, model_name: Optional[str] = None) -> dict:
    """
    Given a dict of raw parameter values and an optional model name,
    return a structured prediction result with confidence.
    """
    data = _load_all_models()
    pipeline = data["preprocessing_pipeline"]
    models = data["models"]

    if model_name is None or model_name not in models:
        model_name = data["best_model_name"]

    model = models[model_name]

    # Prepare input
    row = np.array([[raw_input[col] for col in FEATURE_COLUMNS]], dtype=float)
    X_scaled = pipeline.transform(row)

    # Inference
    pred_label = int(model.predict(X_scaled)[0])
    proba = model.predict_proba(X_scaled)[0]
    confidence = round(float(proba[pred_label]) * 100, 2)

    # Local feature contribution (permutation-based approximation)
    contributions = compute_local_contributions(model, pipeline, raw_input)

    return {
        "prediction": pred_label,
        "potability_label": "Potable" if pred_label == 1 else "Non-Potable",
        "confidence": confidence,
        "probability_potable": round(float(proba[1]) * 100, 2),
        "probability_non_potable": round(float(proba[0]) * 100, 2),
        "model_used": model_name,
        "feature_contributions": contributions,
    }


def compute_local_contributions(model, pipeline, raw_input: dict) -> list:
    """
    Compute approximate local feature contributions by measuring the change
    in predicted probability when each feature is set to its median value.
    Uses the imputer step's statistics to get median values.
    """
    try:
        import shap
        row = np.array([[raw_input[col] for col in FEATURE_COLUMNS]], dtype=float)
        X_scaled = pipeline.transform(row)

        base_model = model
        # For CalibratedClassifierCV unwrap to check if TreeExplainer can be used
        inner = getattr(base_model, "estimator", None) or \
                getattr(base_model, "base_estimator", None) or base_model

        model_type = type(inner).__name__
        use_tree = any(t in model_type for t in
                       ["RandomForest", "GradientBoosting", "XGB", "DecisionTree", "ExtraTrees"])

        if use_tree:
            explainer = shap.TreeExplainer(base_model if use_tree else inner)
        else:
            background = shap.sample(X_scaled, 1)
            explainer = shap.KernelExplainer(base_model.predict_proba, background)

        shap_vals = explainer.shap_values(X_scaled)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]  # class 1 (Potable)

        shap_vals_flat = shap_vals.flatten()
        return [
            {
                "feature": FEATURE_COLUMNS[i],
                "value": round(float(raw_input[FEATURE_COLUMNS[i]]), 4),
                "contribution": round(float(shap_vals_flat[i]), 6),
            }
            for i in range(len(FEATURE_COLUMNS))
        ]
    except Exception:
        # Fallback: use feature importances (tree-based models) or uniform weights
        try:
            if hasattr(model, "feature_importances_"):
                fi = model.feature_importances_
            elif hasattr(getattr(model, "calibrated_classifiers_", [None])[0],
                         "estimator") and hasattr(
                model.calibrated_classifiers_[0].estimator, "feature_importances_"
            ):
                fi = model.calibrated_classifiers_[0].estimator.feature_importances_
            else:
                fi = np.ones(len(FEATURE_COLUMNS)) / len(FEATURE_COLUMNS)
        except Exception:
            fi = np.ones(len(FEATURE_COLUMNS)) / len(FEATURE_COLUMNS)

        return [
            {
                "feature": FEATURE_COLUMNS[i],
                "value": round(float(raw_input[FEATURE_COLUMNS[i]]), 4),
                "contribution": round(float(fi[i]), 6),
            }
            for i in range(len(FEATURE_COLUMNS))
        ]


def get_metrics() -> dict:
    return _load_metrics()


def get_eda() -> dict:
    return _load_eda()


def get_global_feature_importance() -> dict:
    metrics = _load_metrics()
    return {
        "feature_importances": metrics.get("feature_importances", {}),
        "shap_global": metrics.get("shap_global", []),
        "best_model": metrics.get("best_model"),
    }
