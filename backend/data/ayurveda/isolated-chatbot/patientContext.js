/**
 * Category 10: Patient Context Questions Dataset
 */
module.exports = [
  {
    id: "AYU-PAT-001",
    category: "PATIENT_CONTEXT",
    intent: "MY_CURRENT_TREATMENT",
    question: "What treatment am I currently taking?",
    variations: [
      "What treatment am I currently taking?",
      "What therapy do I have today?",
      "What is my next appointment?",
      "Who is my doctor?",
      "Who is my therapist?",
      "What therapy was prescribed to me?",
      "What is my current treatment plan?",
      "What appointments do I have this week?"
    ],
    expectedAnswerType: "PATIENT_CONTEXT",
    answer: "Based on your active AyurSutra record:\n• **Assigned Doctor:** {{doctorName}}\n• **Active Therapy Plan:** {{activeTherapy}}\n• **Next Appointment:** {{nextAppointmentDate}} at {{nextAppointmentTime}}",
    safetyLevel: "NORMAL",
    requiresPatientContext: true,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Authorized Patient Record (Read-Only)"],
    disclaimer: "⚠️ Derived from your authorized AyurSutra account."
  },
  {
    id: "AYU-PAT-002",
    category: "PATIENT_CONTEXT",
    intent: "MISSING_ALLERGY_CHECK",
    question: "Can I eat nuts during my treatment?",
    variations: [
      "Can I eat nuts during my treatment?",
      "Can I eat dairy?",
      "Can I eat sesame seeds?"
    ],
    expectedAnswerType: "PATIENT_CONTEXT",
    answer: "Your allergy information is not confirmed in the available patient record, so I cannot safely assume that a food is safe for you. Please verify your allergy profile with your clinic staff.",
    safetyLevel: "NORMAL",
    requiresPatientContext: true,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Patient Context Safety Adapter"],
    disclaimer: "⚠️ Unconfirmed allergy history warning."
  }
];
