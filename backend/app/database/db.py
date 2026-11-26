"""
AquaGuard AI – SQLite Database
Handles schema creation and all CRUD operations for prediction history.
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "aquaguard.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the predictions table if it does not exist."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT NOT NULL,
                ph              REAL,
                hardness        REAL,
                solids          REAL,
                chloramines     REAL,
                sulfate         REAL,
                conductivity    REAL,
                organic_carbon  REAL,
                trihalomethanes REAL,
                turbidity       REAL,
                prediction      INTEGER NOT NULL,
                potability_label TEXT NOT NULL,
                confidence      REAL,
                model_used      TEXT,
                remarks         TEXT
            )
        """)
        conn.commit()


def insert_prediction(data: dict) -> int:
    """Insert one prediction record. Returns the new row id."""
    sql = """
        INSERT INTO predictions
            (timestamp, ph, hardness, solids, chloramines, sulfate,
             conductivity, organic_carbon, trihalomethanes, turbidity,
             prediction, potability_label, confidence, model_used, remarks)
        VALUES
            (:timestamp, :ph, :hardness, :solids, :chloramines, :sulfate,
             :conductivity, :organic_carbon, :trihalomethanes, :turbidity,
             :prediction, :potability_label, :confidence, :model_used, :remarks)
    """
    defaults = {
        "timestamp": datetime.now().isoformat(),
        "ph": None, "hardness": None, "solids": None,
        "chloramines": None, "sulfate": None, "conductivity": None,
        "organic_carbon": None, "trihalomethanes": None, "turbidity": None,
        "prediction": 0, "potability_label": "Non-Potable",
        "confidence": None, "model_used": None, "remarks": None,
    }
    defaults.update(data)
    with get_connection() as conn:
        cursor = conn.execute(sql, defaults)
        conn.commit()
        return cursor.lastrowid


def get_all_predictions(
    limit: int = 100,
    offset: int = 0,
    filter_label: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    conditions = []
    params: list = []

    if filter_label and filter_label in ("Potable", "Non-Potable"):
        conditions.append("potability_label = ?")
        params.append(filter_label)

    if search:
        conditions.append("(model_used LIKE ? OR remarks LIKE ? OR timestamp LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"SELECT * FROM predictions {where} ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_connection() as conn:
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]


def get_prediction_by_id(pred_id: int) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,)).fetchone()
        return dict(row) if row else None


def get_total_count(filter_label: Optional[str] = None) -> int:
    where = ""
    params: list = []
    if filter_label and filter_label in ("Potable", "Non-Potable"):
        where = "WHERE potability_label = ?"
        params.append(filter_label)
    with get_connection() as conn:
        row = conn.execute(f"SELECT COUNT(*) FROM predictions {where}", params).fetchone()
        return row[0]


def get_dashboard_stats() -> dict:
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        potable = conn.execute("SELECT COUNT(*) FROM predictions WHERE prediction=1").fetchone()[0]
        non_potable = conn.execute("SELECT COUNT(*) FROM predictions WHERE prediction=0").fetchone()[0]

        # Average parameter values from all stored records
        avg_row = conn.execute("""
            SELECT AVG(ph), AVG(hardness), AVG(solids), AVG(chloramines),
                   AVG(sulfate), AVG(conductivity), AVG(organic_carbon),
                   AVG(trihalomethanes), AVG(turbidity)
            FROM predictions
        """).fetchone()

        avg_params = {
            "ph": round(avg_row[0] or 0, 3),
            "hardness": round(avg_row[1] or 0, 3),
            "solids": round(avg_row[2] or 0, 3),
            "chloramines": round(avg_row[3] or 0, 3),
            "sulfate": round(avg_row[4] or 0, 3),
            "conductivity": round(avg_row[5] or 0, 3),
            "organic_carbon": round(avg_row[6] or 0, 3),
            "trihalomethanes": round(avg_row[7] or 0, 3),
            "turbidity": round(avg_row[8] or 0, 3),
        }

        recent = conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT 10"
        ).fetchall()

        return {
            "total_assessments": total,
            "potable_count": potable,
            "non_potable_count": non_potable,
            "potability_rate": round((potable / total * 100) if total > 0 else 0, 1),
            "average_parameters": avg_params,
            "recent_assessments": [dict(r) for r in recent],
        }
