"""
AquaGuard AI – Water Quality Standards
Reference limits from WHO (2022), EPA, and BIS IS 10500:2012.
Used for compliance checking — NOT for making potability predictions.
"""

WATER_STANDARDS = {
    "ph": {
        "unit": "",
        "who_min": 6.5,
        "who_max": 8.5,
        "ideal_min": 6.5,
        "ideal_max": 8.5,
        "description": "Measure of acidity or alkalinity of water on a 0–14 scale.",
        "health_impact": "Very low or high pH causes corrosion of pipes and can affect absorption of harmful metals. Optimal drinking water pH is 7.0–8.5.",
        "source": "WHO 2022 / BIS IS 10500",
    },
    "Hardness": {
        "unit": "mg/L",
        "who_max": 300,
        "permissible_max": 600,
        "description": "Concentration of calcium and magnesium salts.",
        "health_impact": "Very hard water is not directly harmful but affects taste and may contribute to kidney stones in susceptible individuals.",
        "source": "BIS IS 10500:2012",
    },
    "Solids": {
        "unit": "mg/L",
        "who_max": 500,
        "permissible_max": 2000,
        "description": "Total Dissolved Solids (TDS) — total amount of dissolved substances.",
        "health_impact": "High TDS causes unpleasant taste; above 1000 mg/L may indicate heavy metal contamination.",
        "source": "WHO 2022 / BIS IS 10500",
    },
    "Chloramines": {
        "unit": "mg/L",
        "who_max": 4.0,
        "permissible_max": 4.0,
        "description": "Disinfectants formed by combining chlorine with ammonia; used in water treatment.",
        "health_impact": "Above 4 mg/L may cause eye and nose irritation and anaemia in infants.",
        "source": "EPA / WHO 2022",
    },
    "Sulfate": {
        "unit": "mg/L",
        "who_max": 250,
        "permissible_max": 400,
        "description": "Naturally occurring ions; can also originate from industrial discharge.",
        "health_impact": "Causes laxative effects above 600 mg/L; WHO aesthetic limit is 250 mg/L.",
        "source": "WHO 2022 / BIS IS 10500",
    },
    "Conductivity": {
        "unit": "μS/cm",
        "who_max": 400,
        "permissible_max": 1000,
        "description": "Electrical conductivity — indicates ionic content and dissolved salts.",
        "health_impact": "Very high conductivity suggests elevated salinity or dissolved metals.",
        "source": "BIS IS 10500:2012",
    },
    "Organic_carbon": {
        "unit": "mg/L",
        "who_max": 2.0,
        "permissible_max": 4.0,
        "description": "Total Organic Carbon (TOC) — measure of organic matter in water.",
        "health_impact": "High TOC increases disinfection by-product (DBP) formation risk during chlorination.",
        "source": "EPA / WHO 2022",
    },
    "Trihalomethanes": {
        "unit": "μg/L",
        "who_max": 80,
        "permissible_max": 100,
        "description": "By-products formed during water chlorination.",
        "health_impact": "Long-term exposure above 80 μg/L is associated with increased cancer risk.",
        "source": "EPA (80 μg/L) / WHO 2022",
    },
    "Turbidity": {
        "unit": "NTU",
        "who_max": 1.0,
        "permissible_max": 5.0,
        "description": "Cloudiness of water caused by suspended particles.",
        "health_impact": "High turbidity protects pathogens from disinfection and indicates possible contamination.",
        "source": "WHO 2022 / BIS IS 10500",
    },
}


def check_compliance(params: dict) -> dict:
    """
    Given a dict of parameter values (may include None),
    return a compliance report: each param → {value, status, limit, unit}.
    Status: 'OK', 'CAUTION', 'EXCEED', 'MISSING'.
    """
    report = {}
    for param, standards in WATER_STANDARDS.items():
        value = params.get(param) or params.get(param.lower())
        if value is None:
            report[param] = {"status": "MISSING", "value": None,
                             "unit": standards.get("unit", "")}
            continue

        value = float(value)
        who_max = standards.get("who_max")
        who_min = standards.get("who_min")
        perm_max = standards.get("permissible_max")

        status = "OK"
        limit_note = ""

        if who_min is not None and value < who_min:
            status = "CAUTION"
            limit_note = f"Below WHO min ({who_min} {standards.get('unit', '')})"
        elif who_max is not None and perm_max is not None:
            if value > perm_max:
                status = "EXCEED"
                limit_note = f"Exceeds permissible limit ({perm_max} {standards.get('unit', '')})"
            elif value > who_max:
                status = "CAUTION"
                limit_note = f"Exceeds WHO ideal limit ({who_max} {standards.get('unit', '')})"
        elif who_max is not None and value > who_max:
            status = "CAUTION"
            limit_note = f"Exceeds WHO limit ({who_max} {standards.get('unit', '')})"

        report[param] = {
            "value": round(value, 4),
            "status": status,
            "unit": standards.get("unit", ""),
            "who_max": who_max,
            "who_min": who_min,
            "permissible_max": perm_max,
            "limit_note": limit_note,
            "description": standards["description"],
            "health_impact": standards["health_impact"],
            "source": standards["source"],
        }
    return report
