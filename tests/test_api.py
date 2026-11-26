"""
AquaGuard AI – Automated Integration Tests
Tests ML inference, SQLite persistence, WHO/BIS compliance, and PDF generation.
"""

import os
import sys
import unittest

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database.db import init_db, insert_prediction, get_prediction_by_id, get_dashboard_stats
from app.services.model_service import predict, get_available_models, get_metrics, get_eda
from app.services.pdf_service import generate_report
from app.utils.standards import check_compliance


class TestAquaGuardSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_models_loaded(self):
        models = get_available_models()
        self.assertGreaterEqual(len(models), 7)
        self.assertIn("Random Forest", models)

    def test_metrics_and_eda_artifacts(self):
        metrics = get_metrics()
        self.assertIn("results", metrics)
        self.assertIn("best_model", metrics)
        eda = get_eda()
        self.assertEqual(eda["shape"]["rows"], 3276)
        self.assertEqual(eda["shape"]["cols"], 10)

    def test_prediction_compliance_db_and_pdf(self):
        sample = {
            "ph": 7.08,
            "Hardness": 204.89,
            "Solids": 20791.3,
            "Chloramines": 7.30,
            "Sulfate": 368.52,
            "Conductivity": 564.31,
            "Organic_carbon": 10.38,
            "Trihalomethanes": 86.99,
            "Turbidity": 2.96,
        }
        res = predict(sample)
        self.assertIn(res["prediction"], (0, 1))
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 100.0)

        comp = check_compliance(sample)
        self.assertEqual(comp["ph"]["status"], "OK")

        pred_id = insert_prediction({
            "ph": sample["ph"],
            "hardness": sample["Hardness"],
            "solids": sample["Solids"],
            "chloramines": sample["Chloramines"],
            "sulfate": sample["Sulfate"],
            "conductivity": sample["Conductivity"],
            "organic_carbon": sample["Organic_carbon"],
            "trihalomethanes": sample["Trihalomethanes"],
            "turbidity": sample["Turbidity"],
            "prediction": res["prediction"],
            "potability_label": res["potability_label"],
            "confidence": res["confidence"],
            "model_used": res["model_used"],
        })
        row = get_prediction_by_id(pred_id)
        self.assertIsNotNone(row)

        row["feature_contributions"] = res["feature_contributions"]
        pdf_path = generate_report(row)
        self.assertTrue(os.path.exists(pdf_path))
        self.assertGreater(os.path.getsize(pdf_path), 1000)

        stats = get_dashboard_stats()
        self.assertGreaterEqual(stats["total_assessments"], 1)


if __name__ == "__main__":
    unittest.main()
