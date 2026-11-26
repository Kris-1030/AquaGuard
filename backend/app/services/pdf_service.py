"""
AquaGuard AI – PDF Report Service (ReportLab)
Generates a professional A4 water quality assessment report.
"""

import os
import io
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

# ── Colour palette ──────────────────────────────────────────────────────────
NAVY    = colors.HexColor("#0A2342")
CYAN    = colors.HexColor("#00B4D8")
EMERALD = colors.HexColor("#06D6A0")
ROSE    = colors.HexColor("#EF476F")
AMBER   = colors.HexColor("#FFB703")
WHITE   = colors.white
LIGHT_GREY = colors.HexColor("#F0F4F8")
MID_GREY   = colors.HexColor("#94A3B8")
DARK_TEXT  = colors.HexColor("#1E293B")

REPORTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "reports"
)
os.makedirs(REPORTS_DIR, exist_ok=True)


def _styles():
    base = getSampleStyleSheet()
    custom = {
        "title": ParagraphStyle("title", parent=base["Heading1"],
                                fontSize=20, textColor=WHITE, alignment=TA_CENTER,
                                spaceAfter=4, fontName="Helvetica-Bold"),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"],
                                   fontSize=11, textColor=CYAN, alignment=TA_CENTER,
                                   spaceAfter=2),
        "section": ParagraphStyle("section", parent=base["Heading2"],
                                  fontSize=12, textColor=NAVY, fontName="Helvetica-Bold",
                                  spaceBefore=12, spaceAfter=4),
        "body": ParagraphStyle("body", parent=base["Normal"],
                               fontSize=9, textColor=DARK_TEXT, spaceAfter=3,
                               leading=14),
        "small": ParagraphStyle("small", parent=base["Normal"],
                                fontSize=7.5, textColor=MID_GREY, spaceAfter=2,
                                leading=11),
        "disclaimer": ParagraphStyle("disclaimer", parent=base["Normal"],
                                     fontSize=7.5, textColor=colors.HexColor("#64748B"),
                                     borderPad=4, leading=11),
        "result_potable": ParagraphStyle("res_p", parent=base["Heading1"],
                                          fontSize=22, textColor=EMERALD,
                                          alignment=TA_CENTER, fontName="Helvetica-Bold"),
        "result_non_potable": ParagraphStyle("res_np", parent=base["Heading1"],
                                              fontSize=22, textColor=ROSE,
                                              alignment=TA_CENTER, fontName="Helvetica-Bold"),
        "meta_key": ParagraphStyle("mk", parent=base["Normal"],
                                   fontSize=9, textColor=MID_GREY, fontName="Helvetica-Bold"),
        "meta_val": ParagraphStyle("mv", parent=base["Normal"],
                                   fontSize=9, textColor=DARK_TEXT),
    }
    return custom


def generate_report(record: dict) -> str:
    """
    Generate a PDF for the given prediction record dict.
    Returns the absolute path to the saved PDF file.
    """
    pred_id = record.get("id", "unknown")
    filename = f"report_{pred_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=1.5 * cm, leftMargin=1.5 * cm,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
    )

    s = _styles()
    story = []

    # ── HEADER BANNER ────────────────────────────────────────────
    header_data = [[
        Paragraph("AquaGuard AI", s["title"]),
    ]]
    header_table = Table(header_data, colWidths=[doc.width])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(header_table)

    sub_data = [[Paragraph("Water Quality Assessment Report", s["subtitle"])]]
    sub_table = Table(sub_data, colWidths=[doc.width])
    sub_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0E3460")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
    ]))
    story.append(sub_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── META INFO ────────────────────────────────────────────────
    ts = record.get("timestamp", datetime.now().isoformat())
    try:
        ts_fmt = datetime.fromisoformat(ts).strftime("%d %b %Y  %H:%M:%S")
    except Exception:
        ts_fmt = ts

    meta_data = [
        ["Assessment ID", f"AQ-{pred_id:04d}" if isinstance(pred_id, int) else f"AQ-{pred_id}",
         "Date & Time", ts_fmt],
        ["ML Model Used", record.get("model_used", "N/A"),
         "Confidence", f"{record.get('confidence', 0):.2f}%"],
    ]
    meta_table = Table(meta_data, colWidths=[3.5*cm, 6*cm, 3.5*cm, 5.5*cm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), LIGHT_GREY),
        ("BACKGROUND",    (2, 0), (2, -1), LIGHT_GREY),
        ("FONTNAME",      (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",      (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR",     (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR",     (2, 0), (2, -1), NAVY),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_GREY]),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── RESULT BADGE ─────────────────────────────────────────────
    is_potable = record.get("prediction", 0) == 1
    result_label = "POTABLE" if is_potable else "NON-POTABLE"
    result_color = EMERALD if is_potable else ROSE
    result_bg = colors.HexColor("#D1FAE5") if is_potable else colors.HexColor("#FEE2E2")
    result_text = (
        "This water sample has been classified as SAFE FOR CONSUMPTION "
        "based on the ML screening model."
        if is_potable else
        "This water sample has been classified as POTENTIALLY UNSAFE "
        "based on the ML screening model."
    )
    result_style = s["result_potable"] if is_potable else s["result_non_potable"]

    result_data = [[Paragraph(result_label, result_style)]]
    result_table = Table(result_data, colWidths=[doc.width])
    result_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), result_bg),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [4]),
        ("BOX",           (0, 0), (-1, -1), 1.5, result_color),
    ]))
    story.append(result_table)
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(result_text, s["body"]))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1")))
    story.append(Spacer(1, 0.2 * cm))

    # ── PARAMETER TABLE ──────────────────────────────────────────
    story.append(Paragraph("Water Quality Parameters", s["section"]))

    PARAM_INFO = {
        "ph":              ("pH",               "",       "6.5 – 8.5"),
        "hardness":        ("Hardness",          "mg/L",   "< 300"),
        "solids":          ("Total Dissolved Solids", "mg/L", "< 500"),
        "chloramines":     ("Chloramines",       "mg/L",   "< 4.0"),
        "sulfate":         ("Sulfate",           "mg/L",   "< 250"),
        "conductivity":    ("Conductivity",      "μS/cm",  "< 400"),
        "organic_carbon":  ("Organic Carbon",    "mg/L",   "< 2.0"),
        "trihalomethanes": ("Trihalomethanes",   "μg/L",   "< 80"),
        "turbidity":       ("Turbidity",         "NTU",    "< 1.0"),
    }

    table_data = [["Parameter", "Unit", "Measured Value", "WHO Reference", "Status"]]
    for key, (name, unit, ref) in PARAM_INFO.items():
        val = record.get(key)
        if val is None:
            val_str = "N/A"
            status = "N/A"
            status_color = MID_GREY
        else:
            val_str = f"{float(val):.4f}"
            # Simple compliance check
            status = "OK"
            status_color = EMERALD
            if key == "ph":
                if float(val) < 6.5 or float(val) > 8.5:
                    status = "CAUTION"
                    status_color = AMBER
            elif key in ("chloramines",) and float(val) > 4.0:
                status = "EXCEED"
                status_color = ROSE
            elif key == "turbidity" and float(val) > 5.0:
                status = "EXCEED"
                status_color = ROSE
            elif key == "turbidity" and float(val) > 1.0:
                status = "CAUTION"
                status_color = AMBER

        table_data.append([name, unit, val_str, ref, status])

    param_table = Table(
        table_data,
        colWidths=[4.2*cm, 2*cm, 3.5*cm, 3.5*cm, 2.5*cm]
    )
    param_style = [
        ("BACKGROUND",    (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
        ("ALIGN",         (2, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
    ]
    # Colour status cells
    for i, row in enumerate(table_data[1:], start=1):
        status_text = row[4]
        if status_text == "EXCEED":
            param_style.append(("TEXTCOLOR", (4, i), (4, i), ROSE))
            param_style.append(("FONTNAME",  (4, i), (4, i), "Helvetica-Bold"))
        elif status_text == "CAUTION":
            param_style.append(("TEXTCOLOR", (4, i), (4, i), AMBER))
        else:
            param_style.append(("TEXTCOLOR", (4, i), (4, i), EMERALD))

    param_table.setStyle(TableStyle(param_style))
    story.append(param_table)
    story.append(Spacer(1, 0.3 * cm))

    # ── FEATURE CONTRIBUTIONS ────────────────────────────────────
    contributions = record.get("feature_contributions") or []
    if contributions:
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1")))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph("Key Contributing Factors (AI Explanation)", s["section"]))

        sorted_contrib = sorted(contributions, key=lambda x: abs(x.get("contribution", 0)), reverse=True)
        contrib_data = [["Feature", "Measured Value", "Contribution Score", "Direction"]]
        for c in sorted_contrib[:6]:
            score = c.get("contribution", 0)
            direction = "Positive (toward Potable)" if score > 0 else "Negative (toward Non-Potable)"
            dir_color = EMERALD if score > 0 else ROSE
            contrib_data.append([
                c.get("feature", ""),
                f"{c.get('value', 0):.4f}",
                f"{abs(score):.6f}",
                direction,
            ])

        contrib_table = Table(contrib_data, colWidths=[4*cm, 3.5*cm, 4*cm, 7*cm])
        contrib_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#0E3460")),
            ("TEXTCOLOR",     (0, 0), (-1, 0), WHITE),
            ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
            ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ]))
        story.append(contrib_table)
        story.append(Spacer(1, 0.3 * cm))

    # ── DISCLAIMER ───────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1")))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("IMPORTANT DISCLAIMER", s["section"]))

    disclaimer_text = (
        "This report is generated by the AquaGuard AI Machine Learning screening system "
        "as part of an academic demonstration. The prediction and confidence score presented "
        "herein are outputs of a statistical model trained on a publicly available dataset "
        "and do NOT constitute an official drinking water safety certification or regulatory "
        "compliance determination. Model confidence does not represent a guarantee that water "
        "is safe to consume. Actual drinking water quality must be determined through "
        "accredited laboratory analysis in accordance with applicable national standards "
        "(e.g. BIS IS 10500:2012, WHO 2022, EPA) and must be certified by authorised "
        "testing authorities. This system is intended for educational purposes only."
    )
    story.append(Paragraph(disclaimer_text, s["disclaimer"]))
    story.append(Spacer(1, 0.3 * cm))

    # ── FOOTER ───────────────────────────────────────────────────
    footer_data = [[
        Paragraph("AquaGuard AI  |  B.Tech CSE Final Year Project  |  2024-2025", s["small"]),
        Paragraph(f"Generated: {datetime.now().strftime('%d %b %Y %H:%M')}", s["small"]),
    ]]
    footer_table = Table(footer_data, colWidths=[doc.width * 0.65, doc.width * 0.35])
    footer_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, -1), WHITE),
        ("ALIGN",         (1, 0), (1, 0), "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
    ]))
    story.append(footer_table)

    doc.build(story)
    return filepath
