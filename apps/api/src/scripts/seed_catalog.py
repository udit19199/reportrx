"""
Seed the test catalog with 5 core panels and Indian-specific reference ranges.

Run once after setting up the database:
    python -m src.scripts.seed_catalog

DISCLAIMER: The reference ranges provided here are general population
guidelines sourced from standard Indian diagnostic lab references
(Lal PathLabs, Thyrocare, Apollo Diagnostics). They are intended for
informational purposes only and should NOT be used for clinical decision
making. Always consult the reference ranges printed on the actual lab
report and your healthcare provider for medical interpretation.
"""

import uuid
import sys
from pathlib import Path

# Add parent dir so we can import from src
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.database import SessionLocal, engine, Base
from src.models import TestCatalog, Panel, PanelTest, TestReferenceRange


DISCLAIMER = "Indian population reference. Not for clinical decision making."


def seed():
    """Main seed function — idempotent (skips existing catalog entries)."""
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(TestCatalog).first()
        if existing:
            print("Catalog already seeded, skipping.")
            return

        # ── Test catalog ──────────────────────────────────────────────
        tests = {}  # name -> test id

        def add_test(name: str, unit: str, category: str) -> str:
            tid = str(uuid.uuid4())
            db.add(TestCatalog(id=tid, test_name=name, standard_unit=unit, category=category))
            tests[name] = tid
            return tid

        def add_range(test_id: str, gender: str | None, age_min: int | None, age_max: int | None,
                      range_min: float | None, range_max: float | None,
                      range_text: str | None = None,
                      range_type: str = "numeric", priority: int = 0,
                      notes: str | None = None):
            db.add(TestReferenceRange(
                id=str(uuid.uuid4()),
                test_id=test_id,
                gender=gender, age_min=age_min, age_max=age_max,
                range_min=range_min, range_max=range_max,
                range_text=range_text, range_type=range_type,
                notes=notes or DISCLAIMER, priority=priority,
            ))

        # ===== 1. CBC (Complete Blood Count) ===========================
        cat = "hematology"

        tid = add_test("Hemoglobin", "g/dL", cat)
        add_range(tid, "male",   18, None,  13.0, 17.0)
        add_range(tid, "female", 18, None,  12.0, 15.5)
        add_range(tid, None,     1,  18,    11.0, 15.0)

        tid = add_test("Red Blood Cell Count", "10^6/μL", cat)
        add_range(tid, "male",   18, None,  4.5, 5.5)
        add_range(tid, "female", 18, None,  4.0, 5.0)
        add_range(tid, None,     1,  18,    4.0, 5.2)

        tid = add_test("Hematocrit", "%", cat)
        add_range(tid, "male",   18, None,  40.0, 50.0)
        add_range(tid, "female", 18, None,  36.0, 46.0)
        add_range(tid, None,     1,  18,    35.0, 45.0)

        tid = add_test("Mean Corpuscular Volume", "fL", cat)
        add_range(tid, None, 18, None, 83.0, 101.0)
        add_range(tid, None, 1,  18,   80.0, 100.0)

        tid = add_test("Mean Corpuscular Hemoglobin", "pg", cat)
        add_range(tid, None, 18, None, 27.0, 32.0)
        add_range(tid, None, 1,  18,   25.0, 31.0)

        tid = add_test("Mean Corpuscular Hemoglobin Concentration", "g/dL", cat)
        add_range(tid, None, 18, None, 31.5, 34.5)
        add_range(tid, None, 1,  18,   32.0, 36.0)

        tid = add_test("Red Cell Distribution Width", "%", cat)
        add_range(tid, None, None, None, 11.5, 14.5)

        tid = add_test("White Blood Cell Count", "10^3/μL", cat)
        add_range(tid, None, 18, None, 4.0, 11.0)
        add_range(tid, None, 1,  18,   5.0, 14.5)

        tid = add_test("Neutrophils", "%", cat)
        add_range(tid, None, 18, None, 40.0, 80.0)
        add_range(tid, None, 1,  18,   30.0, 60.0)

        tid = add_test("Lymphocytes", "%", cat)
        add_range(tid, None, 18, None, 20.0, 40.0)
        add_range(tid, None, 1,  18,   30.0, 50.0)

        tid = add_test("Monocytes", "%", cat)
        add_range(tid, None, None, None, 2.0, 10.0)

        tid = add_test("Eosinophils", "%", cat)
        add_range(tid, None, None, None, 1.0, 6.0)

        tid = add_test("Basophils", "%", cat)
        add_range(tid, None, None, None, 0.0, 2.0)

        tid = add_test("Absolute Lymphocyte Count", "10^3/μL", cat)
        add_range(tid, None, None, None, 1.0, 3.0)

        tid = add_test("Absolute Neutrophil Count", "10^3/μL", cat)
        add_range(tid, None, None, None, 1.5, 7.0)

        tid = add_test("Platelet Count", "10^3/μL", cat)
        add_range(tid, None, 18, None, 150.0, 410.0)
        add_range(tid, None, 1,  18,   150.0, 450.0)

        # ===== 2. KFT (Kidney Function Test) ===========================
        cat = "biochemistry"

        tid = add_test("Creatinine", "mg/dL", cat)
        add_range(tid, "male",   18, None,  0.7, 1.3)
        add_range(tid, "female", 18, None,  0.6, 1.1)
        add_range(tid, None,     1,  18,    0.2, 0.7)
        add_range(tid, None,     65, None,  0.6, 1.2)  # elderly

        tid = add_test("Urea", "mg/dL", cat)
        add_range(tid, None, 18, None, 15.0, 40.0)
        add_range(tid, None, 1,  18,   10.0, 30.0)

        tid = add_test("Uric Acid", "mg/dL", cat)
        add_range(tid, "male",   18, None,  3.5, 7.2)
        add_range(tid, "female", 18, None,  2.5, 6.0)
        add_range(tid, None,     1,  18,    2.0, 5.5)

        tid = add_test("Sodium", "mEq/L", cat)
        add_range(tid, None, None, None, 136.0, 145.0)

        tid = add_test("Potassium", "mEq/L", cat)
        add_range(tid, None, 18, None, 3.5, 5.1)
        add_range(tid, None, 1,  18,   3.4, 4.7)

        tid = add_test("Calcium", "mg/dL", cat)
        add_range(tid, None, None, None, 8.5, 10.5)

        tid = add_test("Phosphorus", "mg/dL", cat)
        add_range(tid, None, 18, None, 2.5, 4.5)
        add_range(tid, None, 1,  18,   3.5, 5.5)

        tid = add_test("Chloride", "mEq/L", cat)
        add_range(tid, None, None, None, 98.0, 108.0)

        tid = add_test("BUN/Creatinine Ratio", "Ratio", cat)
        add_range(tid, None, None, None, None, None, "12:1 - 20:1", "ratio")

        # ===== 3. LFT (Liver Function Test) ============================
        cat = "biochemistry"

        tid = add_test("Bilirubin Total", "mg/dL", cat)
        add_range(tid, None, None, None, 0.3, 1.2)

        tid = add_test("Bilirubin Direct", "mg/dL", cat)
        add_range(tid, None, None, None, 0.0, 0.3)

        tid = add_test("Bilirubin Indirect", "mg/dL", cat)
        add_range(tid, None, None, None, 0.2, 0.8)

        tid = add_test("ALT", "U/L", cat)
        add_range(tid, "male",   18, None,  10.0, 49.0)
        add_range(tid, "female", 18, None,  10.0, 40.0)
        add_range(tid, None,     1,  18,    10.0, 50.0)

        tid = add_test("AST", "U/L", cat)
        add_range(tid, None, 18, None, 0.0, 35.0)
        add_range(tid, None, 1,  18,   10.0, 50.0)

        tid = add_test("Alkaline Phosphatase", "U/L", cat)
        add_range(tid, None, 18, None, 44.0, 147.0)
        add_range(tid, None, 1,  18,   100.0, 350.0)
        add_range(tid, None, 65, None, 50.0, 190.0)

        tid = add_test("GGT", "U/L", cat)
        add_range(tid, "male",   18, None,  10.0, 50.0)
        add_range(tid, "female", 18, None,  7.0, 35.0)

        tid = add_test("Total Protein", "g/dL", cat)
        add_range(tid, None, None, None, 6.0, 8.0)

        tid = add_test("Albumin", "g/dL", cat)
        add_range(tid, None, None, None, 3.2, 5.0)

        tid = add_test("Globulin", "g/dL", cat)
        add_range(tid, None, None, None, 2.1, 3.5)

        tid = add_test("A/G Ratio", "Ratio", cat)
        add_range(tid, None, None, None, 0.8, 2.1)

        # ===== 4. Lipid Profile ========================================
        cat = "biochemistry"

        tid = add_test("Cholesterol Total", "mg/dL", cat)
        add_range(tid, None, 18, None, None, 200.0, "<= 199.9", "max_only")
        add_range(tid, None, 1,  18,   None, 170.0, "<= 170", "max_only")

        tid = add_test("HDL Cholesterol", "mg/dL", cat)
        add_range(tid, "male",   18, None,  40.0, None, ">= 40", "min_only")
        add_range(tid, "female", 18, None,  50.0, None, ">= 50", "min_only")
        add_range(tid, None,     1,  18,    45.0, None, ">= 45", "min_only")

        tid = add_test("LDL Cholesterol", "mg/dL", cat)
        add_range(tid, None, 18, None, None, 100.0, "<= 100", "max_only", priority=1)
        add_range(tid, None, 18, None, None, 130.0, "<= 130", "max_only")
        add_range(tid, None, 1,  18,   None, 110.0, "<= 110", "max_only")

        tid = add_test("Triglycerides", "mg/dL", cat)
        add_range(tid, None, None, None, None, 150.0, "<= 149.9", "max_only")

        tid = add_test("VLDL Cholesterol", "mg/dL", cat)
        add_range(tid, None, None, None, 5.0, 40.0)

        tid = add_test("Non-HDL Cholesterol", "mg/dL", cat)
        add_range(tid, None, None, None, None, 130.0, "<= 130", "max_only")

        # ===== 5. Thyroid Profile ======================================
        cat = "hormone"

        tid = add_test("Thyroid Stimulating Hormone", "μIU/mL", cat)
        add_range(tid, None, 18, None, 0.4, 4.5)
        add_range(tid, None, 1,  18,   0.4, 5.0)
        add_range(tid, "female", 18, 50, 0.3, 4.0, priority=1)  # stricter for reproductive-age women
        # Pregnancy ranges
        add_range(tid, "female", 18, None, 0.2, 3.0, priority=2, notes="Pregnancy reference — TSH drops in 1st trimester. Not for clinical decision making.")

        tid = add_test("Free T4", "ng/dL", cat)
        add_range(tid, None, None, None, 0.8, 1.8)

        tid = add_test("Free T3", "pg/mL", cat)
        add_range(tid, None, None, None, 2.3, 4.2)

        tid = add_test("T3 Total", "ng/mL", cat)
        add_range(tid, None, None, None, 0.8, 2.0)

        tid = add_test("T4 Total", "μg/dL", cat)
        add_range(tid, None, None, None, 4.5, 12.6)

        # ===== 6. Diabetes Profile =====================================
        cat = "biochemistry"

        tid = add_test("Glucose Fasting", "mg/dL", cat)
        add_range(tid, None, None, None, 70.0, 100.0)
        # Impaired fasting glucose
        add_range(tid, None, None, None, 100.0, 126.0, range_text="100 - 126", range_type="numeric",
                  priority=-1, notes="Pre-diabetic range. " + DISCLAIMER)

        tid = add_test("Glucose", "mg/dL", cat)
        add_range(tid, None, None, None, 70.0, 100.0)

        tid = add_test("Glucose Postprandial", "mg/dL", cat)
        add_range(tid, None, None, None, None, 140.0, "< 140", "max_only")

        tid = add_test("HbA1c", "%", cat)
        add_range(tid, None, None, None, None, 5.7, "< 5.7", "max_only")
        add_range(tid, None, None, None, 5.7, 6.4, priority=-1,
                  notes="Pre-diabetic range (5.7-6.4%). " + DISCLAIMER)

        tid = add_test("Insulin Fasting", "μIU/mL", cat)
        add_range(tid, None, None, None, 2.6, 24.9)

        db.flush()

        # ── Panels ────────────────────────────────────────────────────

        def add_panel(slug: str, name: str, desc: str, order: int, test_names: list[str]):
            pid = str(uuid.uuid4())
            db.add(Panel(id=pid, name=name, slug=slug, description=desc, display_order=order))
            for i, tname in enumerate(test_names):
                if tname in tests:
                    db.add(PanelTest(id=str(uuid.uuid4()), panel_id=pid,
                                     test_id=tests[tname], display_order=i))
                else:
                    print(f"  WARNING: Test '{tname}' not found in catalog, skipping")
            return pid

        add_panel("cbc", "Complete Blood Count",
                  "Measures the cells and cellular components of blood. Used to screen for anemia, infections, and blood disorders.",
                  1, [
                      "Hemoglobin", "Red Blood Cell Count", "Hematocrit",
                      "Mean Corpuscular Volume", "Mean Corpuscular Hemoglobin",
                      "Mean Corpuscular Hemoglobin Concentration", "Red Cell Distribution Width",
                      "White Blood Cell Count", "Neutrophils", "Lymphocytes", "Monocytes",
                      "Eosinophils", "Basophils", "Absolute Lymphocyte Count",
                      "Absolute Neutrophil Count", "Platelet Count",
                  ])

        add_panel("kft", "Kidney Function Test",
                  "Assesses kidney health by measuring waste products and electrolytes. Includes Creatinine, Urea, Uric Acid, and electrolytes.",
                  2, [
                      "Creatinine", "Urea", "Uric Acid", "BUN/Creatinine Ratio",
                      "Sodium", "Potassium", "Calcium", "Phosphorus", "Chloride",
                  ])

        add_panel("lft", "Liver Function Test",
                  "Evaluates liver health by measuring enzymes, proteins, and bilirubin. Includes ALT, AST, ALP, GGT, and proteins.",
                  3, [
                      "Bilirubin Total", "Bilirubin Direct", "Bilirubin Indirect",
                      "ALT", "AST", "Alkaline Phosphatase", "GGT",
                      "Total Protein", "Albumin", "Globulin", "A/G Ratio",
                  ])

        add_panel("lipid", "Lipid Profile",
                  "Measures cholesterol types and triglycerides. Used for cardiovascular risk assessment.",
                  4, [
                      "Cholesterol Total", "HDL Cholesterol", "LDL Cholesterol",
                      "Triglycerides", "VLDL Cholesterol", "Non-HDL Cholesterol",
                  ])

        add_panel("thyroid", "Thyroid Profile",
                  "Evaluates thyroid gland function. Includes TSH, Free T3, Free T4, and Total T3/T4.",
                  5, [
                      "Thyroid Stimulating Hormone", "Free T4", "Free T3",
                      "T3 Total", "T4 Total",
                  ])

        add_panel("diabetes", "Diabetes Profile",
                  "Screens for and monitors diabetes. Includes Fasting Glucose, HbA1c, and Postprandial Glucose.",
                  6, [
                      "Glucose Fasting", "Glucose", "Glucose Postprandial",
                      "HbA1c", "Insulin Fasting",
                  ])

        db.commit()
        print(f"✅ Seeded {len(tests)} tests across 6 panels with demographic reference ranges.")
        print("⚠️  DISCLAIMER: Reference ranges are general Indian population guidelines.")
        print("   They should NOT be used for clinical decision making.")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
