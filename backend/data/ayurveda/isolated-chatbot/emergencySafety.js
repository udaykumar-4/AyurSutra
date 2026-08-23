/**
 * Category 13: Emergency Safety Dataset
 */
module.exports = [
  {
    id: "AYU-EMERG-001",
    category: "EMERGENCY_SAFETY",
    intent: "EMERGENCY_ESCALATION",
    question: "I have severe chest pain and breathing difficulty. What should I do?",
    variations: [
      "I have severe chest pain and breathing difficulty.",
      "Chest pain",
      "Severe breathing difficulty",
      "Sudden weakness and face drooping",
      "Stroke symptoms",
      "Severe bleeding from wound",
      "Loss of consciousness",
      "Unconscious patient",
      "Seizure episode",
      "Severe allergic reaction anaphylaxis",
      "Suicidal thoughts emergency",
      "Poisoning emergency",
      "Severe acute chest heaviness"
    ],
    expectedAnswerType: "EMERGENCY",
    answer: "🚨 **EMERGENCY MEDICAL NOTICE:** Your message references severe acute symptoms (such as chest pain, breathing distress, stroke, or unconsciousness) that require immediate emergency evaluation.\n\n• **Immediate Action:** Seek emergency medical care immediately by calling local emergency services (108 / 911) or visiting the nearest hospital emergency room.\n• **Safety Notice:** Do NOT rely on home remedies, herbal teas, or Ayurvedic massage during a medical emergency.",
    safetyLevel: "CRITICAL_EMERGENCY",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: true,
    classicalReferences: [],
    sources: ["AyurSutra Emergency Safety Escalation Protocol"],
    disclaimer: "🚨 Emergency safety response active. Overrides all knowledge retrieval."
  }
];
