/**
 * Category 11: Medication Safety & Refusal Dataset
 */
module.exports = [
  {
    id: "AYU-MED-001",
    category: "MEDICATION_SAFETY",
    intent: "PROHIBITED_MEDICATION_MODIFICATION",
    question: "Can I stop my regular medicine and replace it with Ashwagandha?",
    variations: [
      "Can I stop my regular medicine and replace it with Ashwagandha?",
      "Can I stop my medicine?",
      "Can I change my prescription?",
      "Can I reduce my dosage?",
      "Can I increase my dosage?",
      "Can I replace my medicine?",
      "Tell me how many tablets to take",
      "Change my doctor's treatment plan",
      "Override my doctor's instructions"
    ],
    expectedAnswerType: "SAFETY_WARNING",
    answer: "⚠️ **CLINICAL SAFETY NOTICE:** The AyurSutra Assistant cannot alter prescriptions, change dosages, discontinue medications, or replace prescribed pharmaceuticals with herbs. Please consult your treating AyurSutra physician or prescribing doctor before making any changes to your medication regimen.",
    safetyLevel: "PROHIBITED_REQUEST",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Prohibited Action Safety Filter"],
    disclaimer: "⚠️ Prescriptions and dosages can only be modified by licensed clinical practitioners."
  }
];
