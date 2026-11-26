<<<<<<< HEAD
# AquaGuard AI: Intelligent Water Quality & Potability Assessment System

A full-stack Machine Learning web application for water quality screening, exploratory data analysis, model benchmarking, explainable AI, and automated PDF reporting.

> **Disclaimer:** Predictions and confidence scores are statistical screening results from ML models trained on historical physicochemical data. They are **not** official drinking-water safety certifications.

---

## Project Architecture

```
Water-Potability/
├── backend/
│   ├── app/
│   │   ├── database/db.py          # SQLite schema & CRUD operations
│   │   ├── routes/                 # FastAPI REST endpoints
│   │   ├── services/               # Model inference & ReportLab PDF generator
│   │   ├── utils/standards.py      # WHO 2022 / BIS IS 10500:2012 limits
│   │   └── main.py                 # FastAPI entrypoint
│   ├── ml/
│   │   ├── preprocessing.py        # Leakage-free Imputer + StandardScaler pipeline
│   │   ├── train.py                # 7 ML classifiers
│   │   ├── evaluate.py             # Accuracy, Precision, Recall, F1, ROC-AUC, CM
│   │   └── generate_artifacts.py   # Training & artifact export script
│   ├── saved_models/               # Serialized .joblib models & JSON metrics/EDA
│   ├── reports/                    # Generated A4 PDF reports
│   └── requirements.txt
├── frontend/                       # React + Vite + Tailwind CSS + Recharts
├── dataset/water_potability.csv    # 3,276 samples, 9 features, Potability target
├── tests/test_api.py               # Automated integration tests
└── run_app.bat                     # One-click Windows launcher
```

---

## Setup & Running Locally

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m ml.generate_artifacts   # Optional: artifacts are pre-generated
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. One-Click Windows Launcher
Double-click `run_app.bat` from the project root to start both the FastAPI backend (`:8000`) and Vite frontend (`:5173`).

---

## Implemented Modules
1. **Overview Dashboard** — KPIs, potability distribution, average parameters, recent history.
2. **Water Quality Prediction** — 9-parameter validated input form, model selector, confidence score, WHO/BIS compliance check, local feature contributions, and PDF download.
3. **Bulk CSV Prediction** — Batch upload, template download, auto-imputation, preview table, and downloadable CSV results.
4. **Exploratory Data Analysis (EDA)** — Target distribution, missing values, interactive feature histograms, Pearson correlation matrix, and boxplot quartile comparisons.
5. **ML Model Comparison** — Real test-set comparison of Logistic Regression, Decision Tree, Random Forest, SVM, KNN, Gradient Boosting, and XGBoost, plus ROC curves and confusion matrices.
6. **Explainable AI (XAI)** — Global feature importance across tree-based models and per-sample attribution.
7. **Prediction History** — Searchable, filterable, paginated SQLite history with detail modal and PDF export.
8. **About & Water Standards** — Full WHO 2022, EPA, and BIS IS 10500:2012 reference limits.
=======
# AquaGuard
Water Quality and potability Assessment - Automated Water Potability Classifier: This area applies to public health, environmental monitoring, and water utilities. Projects analyze physical and chemical properties to classify potability or predict pollution levels
>>>>>>> 74ca5f8f5f07dbb4216b95852d9da17b22ea3e5a
