"""
AquaGuard AI – Preprocessing Pipeline
Handles missing value imputation + feature scaling with zero data leakage.
"""

import os
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "ph", "Hardness", "Solids", "Chloramines",
    "Sulfate", "Conductivity", "Organic_carbon",
    "Trihalomethanes", "Turbidity"
]
TARGET_COLUMN = "Potability"
# Absolute path: two levels up from ml/ → project root → dataset/
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(os.path.dirname(_THIS_DIR))
DATASET_PATH = os.path.join(_PROJECT_ROOT, "dataset", "water_potability.csv")
RANDOM_STATE = 42
TEST_SIZE = 0.20


def load_dataset(path: str = DATASET_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.drop_duplicates()
    return df


def build_preprocessing_pipeline() -> Pipeline:
    """
    Returns a scikit-learn Pipeline:
      Step 1 – SimpleImputer (strategy='median') handles missing values in
               ph, Sulfate, and Trihalomethanes without discarding rows.
      Step 2 – StandardScaler normalises all features to zero mean / unit variance.
    The pipeline is designed to be fit exclusively on training data to prevent leakage.
    """
    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    return pipeline


def prepare_data(df: pd.DataFrame):
    """
    Split the dataset into stratified train/test sets.
    Returns X_train, X_test, y_train, y_test (all as numpy arrays after pipeline fit).
    """
    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMN].values

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    pipeline = build_preprocessing_pipeline()
    X_train = pipeline.fit_transform(X_train_raw)   # Fit ONLY on training data
    X_test = pipeline.transform(X_test_raw)          # Apply (do NOT refit) on test data

    return X_train, X_test, y_train, y_test, pipeline


def preprocess_single(raw_input: dict, pipeline: Pipeline) -> np.ndarray:
    """
    Convert a dict of raw parameter values to a scaled numpy array for inference.
    Uses the already-fitted pipeline (no re-fitting on individual inputs).
    """
    row = np.array([[raw_input[col] for col in FEATURE_COLUMNS]], dtype=float)
    return pipeline.transform(row)


def preprocess_dataframe(df: pd.DataFrame, pipeline: Pipeline) -> np.ndarray:
    """
    Transform a dataframe (with FEATURE_COLUMNS present) using the fitted pipeline.
    Missing values in the dataframe are handled via the imputer step.
    """
    X = df[FEATURE_COLUMNS].values.astype(float)
    return pipeline.transform(X)
