"""
AquaGuard AI – Model Training
Trains 7 classification algorithms and returns fitted models.
"""

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier

RANDOM_STATE = 42

MODELS = {
    "Logistic Regression": LogisticRegression(
        max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced"
    ),
    "Decision Tree": DecisionTreeClassifier(
        random_state=RANDOM_STATE, max_depth=10, class_weight="balanced"
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=200, random_state=RANDOM_STATE, class_weight="balanced", n_jobs=-1
    ),
    "SVM": CalibratedClassifierCV(
        SVC(random_state=RANDOM_STATE, class_weight="balanced"), ensemble=False
    ),
    "KNN": KNeighborsClassifier(n_neighbors=7, n_jobs=-1),
    "Gradient Boosting": GradientBoostingClassifier(
        n_estimators=200, random_state=RANDOM_STATE, learning_rate=0.05
    ),
    "XGBoost": XGBClassifier(
        n_estimators=200, random_state=RANDOM_STATE, eval_metric="logloss",
        scale_pos_weight=1.56,
        verbosity=0, n_jobs=-1
    ),
}


def train_all(X_train, y_train) -> dict:
    """
    Train every model in MODELS using the same pre-processed training data.
    Returns a dict mapping model name -> fitted estimator.
    """
    trained = {}
    for name, model in MODELS.items():
        print(f"  Training: {name}...")
        model.fit(X_train, y_train)
        trained[name] = model
    return trained
