/**
 * Category 4: Therapy Preparation Dataset
 */
module.exports = [
  {
    id: "AYU-PREP-001",
    category: "THERAPY_PREPARATION",
    intent: "THERAPY_PREPARATION_GENERAL",
    question: "What should I eat before my Ayurvedic therapy?",
    variations: [
      "What should I eat before my Ayurvedic therapy?",
      "How should I prepare for my therapy appointment?",
      "Can I eat before Abhyanga?",
      "Can I drink coffee before Panchakarma?",
      "What to avoid before therapy?",
      "Should I sleep well before therapy?",
      "Can I exercise before therapy?",
      "What should I bring for my therapy appointment?"
    ],
    expectedAnswerType: "THERAPY_PREPARATION",
    answer: "• **Meal Timing:** Eat a light, warm meal (like simple porridge or rice gruel) at least 1.5 to 2 hours BEFORE your therapy. Do NOT arrive on a heavy stomach or completely fasting (unless explicitly instructed for Vamana/Snehapana).\n• **Avoid:** Coffee, alcohol, heavy fried foods, cold drinks, and heavy physical exercise immediately before therapy.\n• **Attire:** Wear comfortable, loose cotton clothing.",
    safetyLevel: "NORMAL",
    requiresPatientContext: true,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Clinical Therapy Rules"],
    disclaimer: "⚠️ Therapy preparation guidelines. Follow specific clinician pre-procedure instructions."
  }
];
