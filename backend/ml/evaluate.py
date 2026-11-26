"""
AquaGuard AI – Model Evaluation
Computes real metrics: Accuracy, Precision, Recall, F1, ROC-AUC,
Confusion Matrix, and ROC curve coordinates for all trained models.
"""

import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, roc_curve
)


def evaluate_model(name: str, model, X_test, y_test) -> dict:
    """
    Evaluate a single fitted model and return a structured metrics dictionary.
    """
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    fpr, tpr, _ = roc_curve(y_test, y_prob)

    return {
        "name": name,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
        "confusion_matrix": {
            "tn": int(tn), "fp": int(fp),
            "fn": int(fn), "tp": int(tp)
        },
        "roc_curve": {
            "fpr": [round(float(v), 4) for v in fpr.tolist()],
            "tpr": [round(float(v), 4) for v in tpr.tolist()],
        }
    }


def evaluate_all(trained_models: dict, X_test, y_test) -> list:
    """
    Evaluate all trained models. Returns a list of metric dicts sorted by F1-score.
    """
    results = []
    for name, model in trained_models.items():
        print(f"  Evaluating: {name}...")
        result = evaluate_model(name, model, X_test, y_test)
        results.append(result)

    results.sort(key=lambda r: (r["f1_score"], r["roc_auc"]), reverse=True)
    return results


def select_best_model(results: list) -> str:
    """
    Returns the name of the best model based on composite F1 + ROC-AUC score.
    Does not rely on accuracy alone due to class imbalance (61% vs 39%).
    """
    return results[0]["name"]
