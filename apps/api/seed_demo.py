#!/usr/bin/env python3
"""Seed demo reports and test results so the trends page shows meaningful data.

Usage:
    cd apps/api && .venv/bin/python seed_demo.py

This script:
1. Cleans up duplicate TestResult entries
2. Creates 3 additional "reports" with test results that show trends over time
3. Updates the existing report's report_date from extraction
"""

import json
import sqlite3
import uuid
from datetime import datetime, timedelta

DB_PATH = "prisma/dev.db"

# ── Reference test catalog IDs ──────────────────────────

TEST_IDS = {
    "Hemoglobin": "aab4fce6-7c41-4608-8657-85f475dc3b10",
    "Glucose": "36f4f637-8039-4476-bd63-53437469532e",
    "Cholesterol Total": "a84d9b2b-9a47-41a6-b403-5110aa4e971e",
    "HDL Cholesterol": "cd06cf2d-88e9-40e8-847c-f520287b4590",
    "LDL Cholesterol": "986b647c-87e1-47cf-9ab5-94669f402f5e",
    "Triglycerides": "c14440fc-bb38-4061-bcf7-d8cadc24d63d",
    "HbA1c": "4a863fe0-199f-4649-b014-8f0af9563783",
    "Creatinine": "99c8df47-f56d-4c6e-a3d1-45b58ba3a9d7",
    "ALT": "2c0a78b5-01aa-4f6f-880d-262fe966fb73",
    "AST": "e765b9b7-5530-49e0-a10c-723e56aaa870",
    "Vitamin D": None,  # not in catalog, stored without test_id
}

EXISTING_REPORT_ID = "1a34c1db-b24c-4967-87d1-08797d053293"
EXISTING_USER_ID = "8001e2fa-0a31-441e-a6f1-91696dc21eb3"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Ensure the reportDate column exists (added by models.py but schema
    # needs to be created on API startup, or we add it here for the seed)
    try:
        conn.execute('SELECT "reportDate" FROM Report LIMIT 1')
    except sqlite3.OperationalError:
        print("Adding reportDate column to Report table...")
        conn.execute('ALTER TABLE Report ADD COLUMN "reportDate" TEXT')
        conn.commit()

    # Also ensure the column exists for TestResult's new structure
    # (already exists since it was created with the table)

    return conn


def cleanup_duplicates(conn):
    """Remove duplicate TestResult entries for the same report + test_name + value."""
    print("Cleaning up duplicate TestResult entries...")
    deleted = conn.execute("""
        DELETE FROM TestResult WHERE rowid NOT IN (
            SELECT MIN(rowid) FROM TestResult
            GROUP BY "reportId", "testName", value
        )
    """)
    print(f"  Deleted {deleted.rowcount} duplicates")
    conn.commit()


def update_existing_report_date(conn):
    """Update the existing report's report_date from its parsedData."""
    print("Updating existing report's report_date...")
    row = conn.execute(
        'SELECT parsedData FROM Report WHERE id = ?', (EXISTING_REPORT_ID,)
    ).fetchone()
    if not row:
        print("  Existing report not found, skipping")
        return

    data = json.loads(row[0])
    extraction = data.get("extraction", data)
    report_date = extraction.get("report_date", "")

    if report_date and report_date != "unknown":
        conn.execute(
            'UPDATE Report SET "reportDate" = ? WHERE id = ?',
            (report_date, EXISTING_REPORT_ID),
        )
        conn.commit()
        print(f"  Set report_date = {report_date}")
    else:
        print("  No report_date found in extracted data")
        # Set it to the upload date as fallback
        conn.execute(
            'UPDATE Report SET "reportDate" = ? WHERE id = ?',
            ("2026-03-25", EXISTING_REPORT_ID),
        )
        conn.commit()
        print("  Set fallback report_date = 2026-03-25")


# ── Demo data definitions ──────────────────────────────

# "Report 2" — 1 month later, some values trending
DEMO_REPORT_2 = {
    "filename": "Health Checkup - Apr 2026.pdf",
    "report_date": "22/Apr/2026",
    "uploaded_at": (datetime.now() - timedelta(days=14)).isoformat(),
    "tests": [
        # Hemoglobin slightly lower (trending down)
        dict(test_name="Hemoglobin", value="12.8", unit="g/dL", reference_range="13.0 - 17.0", flagged=True, status="low"),
        # Glucose higher (trending up)
        dict(test_name="Glucose", value="102", unit="mg/dL", reference_range="70 - 99", flagged=True, status="high"),
        # Cholesterol total up
        dict(test_name="Cholesterol Total", value="172", unit="mg/dL", reference_range="<= 199.9", flagged=False, status="normal"),
        # HDL same
        dict(test_name="HDL Cholesterol", value="35", unit="mg/dL", reference_range=">= 39.9", flagged=True, status="low"),
        # LDL up
        dict(test_name="LDL Cholesterol", value="88", unit="mg/dL", reference_range="<= 99.9", flagged=False, status="normal"),
        # Triglycerides up more
        dict(test_name="Triglycerides", value="185", unit="mg/dL", reference_range="<= 149.9", flagged=True, status="high"),
        # HbA1c up
        dict(test_name="HbA1c", value="5.1", unit="%", reference_range="4 - 5.6", flagged=False, status="normal"),
        # Creatinine same
        dict(test_name="Creatinine", value="0.62", unit="mg/dL", reference_range="0.7 - 1.3", flagged=False, status="normal"),
        # ALT slightly higher
        dict(test_name="ALT", value="92", unit="U/L", reference_range="10 - 49", flagged=True, status="high"),
        # AST slightly lower (still high)
        dict(test_name="AST", value="195", unit="U/L", reference_range="0 - 33.9", flagged=True, status="high"),
        # Vitamin D added
        dict(test_name="Vitamin D", value="28", unit="ng/mL", reference_range="30 - 100", flagged=True, status="low"),
    ],
}

# "Report 3" — 2 months later, improving
DEMO_REPORT_3 = {
    "filename": "Health Checkup - Jun 2026.pdf",
    "report_date": "15/Jun/2026",
    "uploaded_at": (datetime.now() - timedelta(days=7)).isoformat(),
    "tests": [
        # Hemoglobin recovering
        dict(test_name="Hemoglobin", value="13.5", unit="g/dL", reference_range="13.0 - 17.0", flagged=False, status="normal"),
        # Glucose back to normal
        dict(test_name="Glucose", value="91", unit="mg/dL", reference_range="70 - 99", flagged=False, status="normal"),
        # Cholesterol total slightly down
        dict(test_name="Cholesterol Total", value="165", unit="mg/dL", reference_range="<= 199.9", flagged=False, status="normal"),
        # HDL improving
        dict(test_name="HDL Cholesterol", value="38", unit="mg/dL", reference_range=">= 39.9", flagged=True, status="low"),
        # LDL steady
        dict(test_name="LDL Cholesterol", value="85", unit="mg/dL", reference_range="<= 99.9", flagged=False, status="normal"),
        # Triglycerides down
        dict(test_name="Triglycerides", value="165", unit="mg/dL", reference_range="<= 149.9", flagged=True, status="high"),
        # HbA1c stable
        dict(test_name="HbA1c", value="5.0", unit="%", reference_range="4 - 5.6", flagged=False, status="normal"),
        # Creatinine normal
        dict(test_name="Creatinine", value="0.71", unit="mg/dL", reference_range="0.7 - 1.3", flagged=False, status="normal"),
        # ALT improving
        dict(test_name="ALT", value="65", unit="U/L", reference_range="10 - 49", flagged=True, status="high"),
        # AST improving
        dict(test_name="AST", value="85", unit="U/L", reference_range="0 - 33.9", flagged=True, status="high"),
        # Vitamin D improving
        dict(test_name="Vitamin D", value="32", unit="ng/mL", reference_range="30 - 100", flagged=False, status="normal"),
    ],
}

# "Report 4" — 3 months later, mostly normal
DEMO_REPORT_4 = {
    "filename": "Health Checkup - Sep 2026.pdf",
    "report_date": "02/Sep/2026",
    "uploaded_at": datetime.now().isoformat(),
    "tests": [
        # Hemoglobin normal
        dict(test_name="Hemoglobin", value="14.1", unit="g/dL", reference_range="13.0 - 17.0", flagged=False, status="normal"),
        # Glucose normal
        dict(test_name="Glucose", value="85", unit="mg/dL", reference_range="70 - 99", flagged=False, status="normal"),
        # Cholesterol total normal
        dict(test_name="Cholesterol Total", value="152", unit="mg/dL", reference_range="<= 199.9", flagged=False, status="normal"),
        # HDL normal
        dict(test_name="HDL Cholesterol", value="42", unit="mg/dL", reference_range=">= 39.9", flagged=False, status="normal"),
        # LDL normal
        dict(test_name="LDL Cholesterol", value="78", unit="mg/dL", reference_range="<= 99.9", flagged=False, status="normal"),
        # Triglycerides borderline
        dict(test_name="Triglycerides", value="142", unit="mg/dL", reference_range="<= 149.9", flagged=False, status="normal"),
        # HbA1c normal
        dict(test_name="HbA1c", value="4.9", unit="%", reference_range="4 - 5.6", flagged=False, status="normal"),
        # Creatinine normal
        dict(test_name="Creatinine", value="0.68", unit="mg/dL", reference_range="0.7 - 1.3", flagged=False, status="normal"),
        # ALT near normal
        dict(test_name="ALT", value="48", unit="U/L", reference_range="10 - 49", flagged=False, status="normal"),
        # AST improving
        dict(test_name="AST", value="42", unit="U/L", reference_range="0 - 33.9", flagged=True, status="high"),
        # Vitamin D normal
        dict(test_name="Vitamin D", value="38", unit="ng/mL", reference_range="30 - 100", flagged=False, status="normal"),
    ],
}


def build_parsed_data(tests: list[dict]) -> str:
    """Build minimal valid parsed_data JSON for a demo report."""
    extraction = {
        "document_type": "Health Checkup",
        "report_date": "",  # filled per report
        "patient_information": {
            "name": "Udit Agarwal",
            "age": "21 Yrs",
            "gender": "Male",
            "patient_id": "JPR92592",
        },
        "tests": tests,
    }
    interpretation = {
        "summary": "Demo report — simulated data for testing.",
        "abnormal_findings": [],
        "alerts": [],
        "recommendations": ["Consult your healthcare provider."],
        "limitations": ["This is simulated data."],
    }
    return json.dumps({"extraction": extraction, "interpretation": interpretation})


def seed_report(conn, user_id: str, demo: dict) -> str:
    """Insert a demo report + its test results. Returns the new report ID."""
    report_id = str(uuid.uuid4())

    # Set report_date in parsedData too
    tests = demo["tests"]
    parsed = build_parsed_data(tests)
    parsed_obj = json.loads(parsed)
    parsed_obj["extraction"]["report_date"] = demo["report_date"]

    conn.execute(
        """INSERT INTO Report (
            id, "userId", filename, "storagePath", "parsedData",
            status, "currentStage", "uploadedAt", "reportDate",
            "patientAge", "patientGender"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            report_id,
            user_id,
            demo["filename"],
            f"seed/{report_id}-{demo['filename']}",
            json.dumps(parsed_obj),
            "ready",
            "complete",
            demo["uploaded_at"],
            demo["report_date"],
            21,
            "male",
        ),
    )

    for t in tests:
        test_id = TEST_IDS.get(t["test_name"])
        conn.execute(
            """INSERT INTO TestResult (
                id, "reportId", "testId", "testName",
                value, unit, "reportRange", flagged, status, confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                str(uuid.uuid4()),
                report_id,
                test_id,
                t["test_name"],
                t["value"],
                t["unit"],
                t["reference_range"],
                1 if t["flagged"] else 0,
                t["status"],
                0.9,
            ),
        )

    conn.commit()
    print(f"  Created Report: {demo['filename']} ({demo['report_date']})")
    return report_id


def main():
    conn = connect()

    # 1. Clean up duplicates
    cleanup_duplicates(conn)

    # 2. Update existing report's report_date
    update_existing_report_date(conn)

    # 3. Seed demo reports
    print("\nSeeding demo reports...")
    seed_report(conn, EXISTING_USER_ID, DEMO_REPORT_2)
    seed_report(conn, EXISTING_USER_ID, DEMO_REPORT_3)
    seed_report(conn, EXISTING_USER_ID, DEMO_REPORT_4)

    # Verify
    print("\nVerification:")
    reports = conn.execute(
        'SELECT id, filename, status, "reportDate" FROM Report ORDER BY "uploadedAt"'
    ).fetchall()
    for r in reports:
        test_count = conn.execute(
            'SELECT COUNT(*) as cnt FROM TestResult WHERE "reportId" = ?',
            (r[0],),
        ).fetchone()[0]
        print(f"  {r['filename']}: {test_count} tests, report_date={r['reportDate']}")

    # Check for remaining duplicates
    dups = conn.execute(
        'SELECT "testName", COUNT(*) as cnt FROM TestResult GROUP BY "testName" HAVING cnt > 1'
    ).fetchall()
    if dups:
        print(f"\n⚠  Remaining duplicates: {dict(dups)}")
    else:
        print("\n✅ No duplicate tests")

    conn.close()
    print("\nDone! Restart the API server for changes to take effect.")


if __name__ == "__main__":
    main()
