/**
 * Plain-language explanations for common medical lab tests.
 *
 * Every entry describes what the test measures and why a doctor orders it,
 * in language accessible to non-medical readers.
 */

export const MEDICAL_GLOSSARY: Record<string, string> = {
  /* ── Complete Blood Count (CBC) ─────────────────── */

  "Hemoglobin":
    "A protein in your red blood cells that carries oxygen from your lungs to the rest of your body. This test checks for anemia (low) or polycythemia (high).",

  "White Blood Cell Count":
    "Measures the number of infection-fighting cells in your blood. High levels may mean your body is fighting an infection or inflammation.",

  "Red Blood Cell Count":
    "Counts your oxygen-carrying red blood cells. Low counts can cause fatigue and may indicate anemia; high counts can thicken your blood.",

  "Platelet Count":
    "Measures the cell fragments that help your blood clot. Low levels increase bleeding risk; high levels may raise clot risk.",

  /* ── Basic Metabolic Panel ───────────────────────── */

  "Glucose":
    "Measures your blood sugar level. High levels may indicate diabetes or prediabetes; low levels can cause dizziness or fainting.",

  "Creatinine":
    "A waste product filtered by your kidneys. High levels can signal that your kidneys aren't filtering blood as well as they should.",

  "Urea":
    "Also called BUN (Blood Urea Nitrogen). A waste product from protein breakdown that your kidneys remove. High levels may suggest reduced kidney function or dehydration.",

  "Sodium":
    "An essential mineral that regulates fluid balance and nerve signals. Abnormal levels can affect your brain, muscles, and blood pressure.",

  "Potassium":
    "A mineral critical for heart rhythm, nerve signals, and muscle contractions. Even small imbalances can be dangerous, especially for your heart.",

  "Calcium":
    "Important for strong bones, nerve transmission, and muscle function. High or low levels can signal problems with your parathyroid glands, kidneys, or bones.",

  /* ── Lipid Panel ─────────────────────────────────── */

  "Cholesterol Total":
    "Measures all the cholesterol in your blood — both the 'good' and 'bad' kinds. It's a starting point; your doctor looks at the breakdown to assess heart risk.",

  "HDL Cholesterol":
    "Often called 'good' cholesterol. It helps remove excess cholesterol from your bloodstream. Higher levels are generally better for heart health.",

  "LDL Cholesterol":
    "Often called 'bad' cholesterol. High levels can build up in your artery walls, increasing your risk of heart attack and stroke.",

  "Triglycerides":
    "A type of fat in your blood that your body uses for energy. High levels, often from diet, increase heart disease risk.",

  /* ── Liver Function ──────────────────────────────── */

  "Bilirubin Total":
    "A yellowish waste product from the breakdown of old red blood cells. High levels can cause jaundice (yellowing of skin/eyes) and may signal liver or gallbladder issues.",

  "ALT":
    "Alanine Transaminase — an enzyme mostly found in your liver. High levels usually mean your liver is inflamed or damaged, often from hepatitis, medication, or fatty liver.",

  "AST":
    "Aspartate Transaminase — an enzyme found in your liver, heart, and muscles. High levels can indicate liver damage, but because it's also in other organs, doctors compare it with ALT.",

  "Alkaline Phosphatase":
    "An enzyme concentrated in your liver, bile ducts, and bones. High levels can suggest bile duct blockages or bone disorders.",

  "Albumin":
    "The main protein made by your liver. It keeps fluid from leaking out of your blood vessels. Low levels may indicate liver or kidney disease, or poor nutrition.",

  "Total Protein":
    "Measures the total amount of protein in your blood, including albumin and globulins. Abnormal levels can point to liver, kidney, or nutritional issues.",

  /* ── Thyroid ─────────────────────────────────────── */

  "Thyroid Stimulating Hormone":
    "TSH — a hormone from your brain (pituitary gland) that tells your thyroid to produce thyroid hormones. High TSH usually means an underactive thyroid (hypothyroidism). Low TSH usually means an overactive thyroid (hyperthyroidism).",

  "Free T4":
    "The active form of the main thyroid hormone. It controls your metabolism. Low levels suggest hypothyroidism; high levels suggest hyperthyroidism.",

  "Free T3":
    "A more potent thyroid hormone converted from T4. It's the 'active' form that directly affects your body's energy use. Sometimes checked when T4 looks normal but symptoms persist.",

  /* ── Diabetes ────────────────────────────────────── */

  "HbA1c":
    "Also called A1C or glycated hemoglobin. Shows your average blood sugar over the past 2–3 months. Used to diagnose diabetes and monitor how well it's being managed.",

  /* ── Other Common Tests ──────────────────────────── */

  "Uric Acid":
    "A waste product from the breakdown of certain foods. High levels can form crystals in your joints, causing gout — a painful form of arthritis.",

  "C-Reactive Protein":
    "CRP — a marker of inflammation in your body. High levels can indicate infection, autoimmune disease, or chronic inflammation linked to heart disease.",

  "Vitamin D":
    "Helps your body absorb calcium for strong bones. Low levels are very common and can lead to bone weakness, fatigue, and immune issues.",

  "Vitamin B12":
    "Essential for nerve health, red blood cell formation, and DNA production. Low levels can cause fatigue, memory problems, and nerve tingling.",

  "Iron":
    "A mineral your body needs to make hemoglobin and red blood cells. Low iron causes anemia (fatigue, weakness). High iron can damage organs over time.",

  "Ferritin":
    "Measures your body's stored iron. Low levels mean your iron reserves are depleted (anemia). High levels can indicate inflammation or iron overload.",

  "INR":
    "International Normalized Ratio — measures how long it takes your blood to clot. Used to monitor blood thinner medications like warfarin.",

  "PT":
    "Prothrombin Time — a test that measures blood clotting time. Often used alongside INR to check liver function or monitor blood thinners.",

  "aPTT":
    "Activated Partial Thromboplastin Time — another clotting test. Doctors use it to monitor heparin therapy or investigate unexplained bruising/bleeding.",

  /* ── Kidney / Electrolytes ───────────────────────── */

  "Chloride":
    "An electrolyte that works with sodium to maintain fluid balance and proper blood pH. Abnormal levels may indicate kidney issues or metabolic problems.",

  "Bicarbonate":
    "Also called CO₂. Helps maintain your blood's acid-base balance (pH). Abnormal levels can suggest lung, kidney, or metabolic disorders.",

  "Phosphorus":
    "A mineral important for bone health and energy storage. Kidneys regulate phosphorus levels, so high levels can signal kidney disease.",

  "Magnesium":
    "A mineral involved in over 300 bodily reactions, including muscle and nerve function, blood sugar control, and blood pressure regulation.",

  /* ── Additional Liver / Pancreas ─────────────────── */

  "GGT":
    "Gamma-Glutamyl Transferase — a liver enzyme that rises with bile duct problems or heavy alcohol use. Often checked when ALP is high to pinpoint the cause.",

  "Lipase":
    "An enzyme produced by your pancreas that helps digest fats. Very high levels are a strong indicator of pancreatitis (inflamed pancreas).",

  "Amylase":
    "An enzyme from your pancreas and salivary glands. High levels may suggest pancreatitis or other digestive issues.",

  /* ── Inflammation / Autoimmune ───────────────────── */

  "ESR":
    "Erythrocyte Sedimentation Rate — also called 'sed rate.' A non-specific test that measures inflammation in your body. High levels mean inflammation is present, but not where or why.",

  "Rheumatoid Factor":
    "An antibody often found in people with rheumatoid arthritis. A positive result, combined with symptoms, helps diagnose autoimmune conditions.",

  /* ── Other ────────────────────────────────────────── */

  "Lactate Dehydrogenase":
    "LDH — an enzyme found in many body tissues. Levels rise when tissues are damaged, helping doctors detect cell injury from various causes.",

  "Homocysteine":
    "An amino acid linked to heart disease risk when levels are high. High homocysteine can also suggest vitamin B12 or folate deficiency.",

  "Folate":
    "Also called folic acid or vitamin B9. Essential for red blood cell production and fetal development during pregnancy. Low levels can cause a specific type of anemia.",
};

/**
 * Look up a plain-language explanation for a test name.
 * Uses fuzzy matching (case-insensitive, ignores trailing details in parentheses).
 */
export function getTestExplanation(testName: string): string | undefined {
  // Direct lookup (case-insensitive)
  const direct = MEDICAL_GLOSSARY[testName];
  if (direct) return direct;

  // Try lowercase
  const lower = MEDICAL_GLOSSARY[testName.trim()];
  if (lower) return lower;

  // Try to match by the main name (split on "(" or ",")
  const mainName = testName.split(/[(,]/)[0].trim();
  for (const [key, value] of Object.entries(MEDICAL_GLOSSARY)) {
    if (key.toLowerCase() === mainName.toLowerCase()) return value;
    if (mainName.toLowerCase().includes(key.toLowerCase())) return value;
    if (key.toLowerCase().includes(mainName.toLowerCase())) return value;
  }

  return undefined;
}
