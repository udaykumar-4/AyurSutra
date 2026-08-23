/**
 * Category 5: Therapy Aftercare Dataset
 */
module.exports = [
  {
    id: "AYU-AFTER-001",
    category: "THERAPY_AFTERCARE",
    intent: "PANCHAKARMA_AFTERCARE",
    question: "What should I eat after Panchakarma?",
    variations: [
      "What should I eat after Panchakarma?",
      "What should I do after my therapy?",
      "Can I exercise after therapy?",
      "Can I travel after Panchakarma?",
      "Can I take a bath after therapy?",
      "Can I sleep after therapy?",
      "What should I avoid after therapy?",
      "When can I return to normal activity?",
      "What is Paschatkarma?"
    ],
    expectedAnswerType: "THERAPY_AFTERCARE",
    answer: "• **Post-Therapy Diet (Paschatkarma):** Consume warm, light, freshly cooked foods like yellow mung dal Kitchari or thin warm soups for 24-48 hours. Kindles Agni without forming toxins (Ama).\n• **Rest:** Rest for at least 30-60 minutes post-session in a warm, quiet room.\n• **Avoid:** Cold breezes, air conditioning, iced water, raw cold salads, heavy exercise, and digital screen strain immediately after therapy.",
    safetyLevel: "NORMAL",
    requiresPatientContext: true,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "SS-CHIKITSA-39-1",
        sourceId: "sushruta-samhita",
        sourceName: "Sushruta Samhita",
        sourceUrl: "https://niimh.nic.in/ebooks/esushruta/",
        samhita: "Sushruta Samhita",
        sthana: "Chikitsa Sthana",
        chapter: "39",
        chapterName: "Panchakarma Upakrama",
        verse: "1",
        originalText: "pascat karmaikadese prasmne...",
        transliteration: "pascat karmaikadese prasmne",
        translation: "Aftercare regimes stabilize tissues and protect the kindled digestive fire after cleansing.",
        explanation: "Paschatkarma ensures post-detox rejuvenation and prevents relapse.",
        topics: ["paschatkarma", "aftercare"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Sushruta Samhita Chikitsa Sthana Ch 39"],
    disclaimer: "⚠️ Educational therapy aftercare guidance."
  }
];
