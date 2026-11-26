"""
AquaGuard AI – generate_artifacts.py
Master training script.  Run once to train all models, evaluate them,
compute EDA statistics, and persist all artefacts to saved_models/.

Usage:
    cd backend
    python -m ml.generate_artifacts
"""

import sys
import os
import json
import numpy as np
import pandas as pd
import joblib

# Add backend root to path so relative imports work when run from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.preprocessing import (
    load_dataset, prepare_data,
    FEATURE_COLUMNS, TARGET_COLUMN
)
from ml.train import train_all, MODELS
from ml.evaluate import evaluate_all, select_best_model

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "saved_models")
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# EDA SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

def build_eda_summary(df: pd.DataFrame) -> dict:
    """Pre-compute all EDA statistics so the backend serves them instantly."""
    target_counts = df[TARGET_COLUMN].value_counts().to_dict()

    # Feature statistics per potability class
    feature_stats = {}
    for col in FEATURE_COLUMNS:
        feature_stats[col] = {
            "mean": round(float(df[col].mean(skipna=True)), 4),
            "median": round(float(df[col].median(skipna=True)), 4),
            "std": round(float(df[col].std(skipna=True)), 4),
            "min": round(float(df[col].min(skipna=True)), 4),
            "max": round(float(df[col].max(skipna=True)), 4),
            "missing": int(df[col].isnull().sum()),
            "q1": round(float(df[col].quantile(0.25)), 4),
            "q3": round(float(df[col].quantile(0.75)), 4),
            "potable_mean": round(float(df[df[TARGET_COLUMN]==1][col].mean(skipna=True)), 4),
            "nonpotable_mean": round(float(df[df[TARGET_COLUMN]==0][col].mean(skipna=True)), 4),
        }
        # Histogram
        clean = df[col].dropna()
        counts, edges = np.histogram(clean, bins=25)
        feature_stats[col]["hist_counts"] = counts.tolist()
        feature_stats[col]["hist_edges"] = [round(float(e), 4) for e in edges.tolist()]

    # Correlation matrix (drop Potability for feature-only heatmap)
    corr = df[FEATURE_COLUMNS].corr().round(4)
    correlation_matrix = corr.to_dict()

    # Box-plot whisker data (for each feature, by potability)
    boxplot_data = {}
    for col in FEATURE_COLUMNS:
        boxplot_data[col] = {}
        for label, value in [(0, "non_potable"), (1, "potable")]:
            subset = df[df[TARGET_COLUMN]==label][col].dropna()
            q1 = float(subset.quantile(0.25))
            q3 = float(subset.quantile(0.75))
            iqr = q3 - q1
            lower = max(float(subset.min()), q1 - 1.5 * iqr)
            upper = min(float(subset.max()), q3 + 1.5 * iqr)
            boxplot_data[col][value] = {
                "min": round(lower, 4),
                "q1": round(q1, 4),
                "median": round(float(subset.median()), 4),
                "q3": round(q3, 4),
                "max": round(upper, 4),
            }

    return {
        "shape": {"rows": len(df), "cols": len(df.columns)},
        "target_distribution": {
            "potable": int(target_counts.get(1, 0)),
            "non_potable": int(target_counts.get(0, 0)),
        },
        "feature_stats": feature_stats,
        "correlation_matrix": correlation_matrix,
        "boxplot_data": boxplot_data,
        "missing_values": {col: int(df[col].isnull().sum()) for col in FEATURE_COLUMNS},
    }


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL FEATURE IMPORTANCE
# ─────────────────────────────────────────────────────────────────────────────

def compute_feature_importance(trained_models: dict) -> dict:
    """
    Collect tree-based feature importances from ensemble models.
    Returns a dict: model_name -> [{feature, importance}]
    """
    result = {}
    for name, model in trained_models.items():
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
            result[name] = [
                {"feature": f, "importance": round(float(v), 6)}
                for f, v in zip(FEATURE_COLUMNS, fi)
            ]
            result[name].sort(key=lambda x: x["importance"], reverse=True)
    return result


# ─────────────────────────────────────────────────────────────────────────────
# SHAP GLOBAL VALUES
# ─────────────────────────────────────────────────────────────────────────────

def compute_shap_global(best_model, X_train, model_name: str) -> list:
    """
    Compute mean absolute SHAP values for the best model.
    Falls back to feature_importances_ for tree models when SHAP fails.
    """
    try:
        import shap
        if "XGBoost" in model_name or "Random Forest" in model_name or \
           "Gradient Boosting" in model_name or "Decision Tree" in model_name:
            explainer = shap.TreeExplainer(best_model)
        else:
            # Use KernelExplainer with a small background sample for other models
            background = shap.sample(X_train, min(100, len(X_train)))
            explainer = shap.KernelExplainer(best_model.predict_proba, background)

        shap_sample = X_train[:200] if len(X_train) > 200 else X_train
        shap_values = explainer.shap_values(shap_sample)

        # For binary classification, shap_values may be a list [class0, class1]
        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        result = [
            {"feature": f, "shap_importance": round(float(v), 6)}
            for f, v in zip(FEATURE_COLUMNS, mean_abs_shap)
        ]
        result.sort(key=lambda x: x["shap_importance"], reverse=True)
        return result
    except Exception as e:
        print(f"  SHAP computation failed ({e}), falling back to feature_importances_")
        if hasattr(best_model, "feature_importances_"):
            fi = best_model.feature_importances_
            result = [
                {"feature": f, "shap_importance": round(float(v), 6)}
                for f, v in zip(FEATURE_COLUMNS, fi)
            ]
            result.sort(key=lambda x: x["shap_importance"], reverse=True)
            return result
        return []


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("AquaGuard AI – Model Training & Artefact Generation")
    print("=" * 60)

    # ── Load & preprocess ────────────────────────────────────────
    print("\n[1/5] Loading dataset...")
    df = load_dataset()
    print(f"      Loaded {len(df)} rows × {len(df.columns)} columns")

    print("\n[2/5] Preprocessing & splitting...")
    X_train, X_test, y_train, y_test, pipeline = prepare_data(df)
    print(f"      Train: {len(X_train)} | Test: {len(X_test)}")
    print(f"      Train potable ratio: {y_train.mean():.2%}")

    # ── Train ────────────────────────────────────────────────────
    print("\n[3/5] Training all 7 models...")
    trained_models = train_all(X_train, y_train)

    # ── Evaluate ─────────────────────────────────────────────────
    print("\n[4/5] Evaluating models...")
    results = evaluate_all(trained_models, X_test, y_test)
    best_name = select_best_model(results)
    best_model = trained_models[best_name]

    print(f"\n  {'Model':<25} {'Acc':>6} {'Prec':>6} {'Rec':>6} {'F1':>6} {'AUC':>6}")
    print(f"  {'-'*55}")
    for r in results:
        marker = " << BEST" if r["name"] == best_name else ""
        print(f"  {r['name']:<25} {r['accuracy']:>6.4f} {r['precision']:>6.4f} "
              f"{r['recall']:>6.4f} {r['f1_score']:>6.4f} {r['roc_auc']:>6.4f}{marker}")

    # ── EDA summary ──────────────────────────────────────────────
    print("\n[5/5] Computing EDA summary and feature importances...")
    eda_summary = build_eda_summary(df)
    feature_importances = compute_feature_importance(trained_models)
    shap_global = compute_shap_global(best_model, X_train, best_name)

    # ── Persist artefacts ────────────────────────────────────────
    # 1) Best model pipeline (preprocessing + model)
    from sklearn.pipeline import Pipeline as SKPipeline
    best_pipeline_obj = {
        "preprocessing_pipeline": pipeline,
        "model": best_model,
        "best_model_name": best_name,
    }
    joblib.dump(best_pipeline_obj, os.path.join(SAVED_MODELS_DIR, "best_model.joblib"))

    # 2) All trained models (for comparison / on-demand prediction)
    all_models_obj = {
        "preprocessing_pipeline": pipeline,
        "models": trained_models,
        "best_model_name": best_name,
    }
    joblib.dump(all_models_obj, os.path.join(SAVED_MODELS_DIR, "all_models.joblib"))

    # 3) Metrics JSON
    metrics_payload = {
        "results": results,
        "best_model": best_name,
        "feature_importances": feature_importances,
        "shap_global": shap_global,
    }
    with open(os.path.join(SAVED_MODELS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics_payload, f, indent=2)

    # 4) EDA summary JSON
    with open(os.path.join(SAVED_MODELS_DIR, "eda_summary.json"), "w") as f:
        json.dump(eda_summary, f, indent=2)

    print("\n[OK] Artefacts saved to saved_models/")
    print(f"[OK] Best model: {best_name}")
    print("=" * 60)


if __name__ == "__main__":
    main()
