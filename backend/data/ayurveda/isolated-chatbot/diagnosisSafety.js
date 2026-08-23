/**
 * Category 12: Diagnosis Safety Refusal Dataset
 */
module.exports = [
  {
    id: "AYU-DIAG-001",
    category: "DIAGNOSIS_SAFETY",
    intent: "PROHIBITED_DIAGNOSIS_REQUEST",
    question: "Diagnose me based on my symptoms.",
    variations: [
      "Diagnose me.",
      "What disease do I have?",
      "Based on these symptoms what do I have?",
      "Tell me my exact diagnosis.",
      "Can you confirm that I have diabetes?",
      "Can you tell if I have cancer?",
      "What is wrong with me?",
      "Diagnose my stomach pain"
    ],
    expectedAnswerType: "SAFETY_WARNING",
    answer: "⚠️ **CLINICAL SAFETY NOTICE:** The AyurSutra Assistant is an educational guidance tool and cannot independently diagnose medical diseases, confirm conditions, or issue diagnostic conclusions. Please schedule a clinical examination with a qualified Ayurvedic physician.",
    safetyLevel: "PROHIBITED_REQUEST",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Autonomous Diagnosis Safety Filter"],
    disclaimer: "⚠️ Autonomous diagnosis refused for patient safety."
  }
];
