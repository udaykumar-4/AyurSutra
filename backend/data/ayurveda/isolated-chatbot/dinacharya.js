/**
 * Category 8/9: Dinacharya & Ritucharya Dataset
 */
module.exports = [
  {
    id: "AYU-DINA-001",
    category: "DINACHARYA",
    intent: "DINACHARYA_ROUTINE",
    question: "What is Dinacharya?",
    variations: [
      "What is Dinacharya?",
      "What is the Ayurvedic daily routine?",
      "What time should I wake up?",
      "What should I do after waking?",
      "What does Ayurveda say about oral hygiene?",
      "What is tongue scraping?",
      "What is oil pulling?",
      "When should I exercise?",
      "When should I eat?",
      "When should I sleep?",
      "What does Ayurveda say about bathing?",
      "What does Ayurveda say about daily oil application?"
    ],
    expectedAnswerType: "LIFESTYLE",
    answer: "🌿 **Dinacharya (Ayurvedic Daily Routine):**\nDinacharya is the structured daily lifestyle regimen designed to align human physiology with solar and circadian rhythms.\n\n• **Brahma Muhurta:** Wake up approximately 45 minutes before sunrise when the atmosphere is pure.\n• **Hygiene:** Perform tongue scraping (Jihva Nirlekhana) to clear overnight Ama, followed by oil pulling (Gandusha).\n• **Exercise:** Practice light movement or Yoga to half-capacity (Ardha Shaktya).\n• **Bathing:** Warm bath to kindle Agni and cleanse body.",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "AH-SUTRA-2-1",
        sourceId: "ashtanga-hridaya",
        sourceName: "Ashtanga Hridaya",
        sourceUrl: "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read",
        samhita: "Ashtanga Hridaya",
        sthana: "Sutra Sthana",
        chapter: "2",
        chapterName: "Dinacharya Adhyaya",
        verse: "1",
        originalText: "brahme muhurte budhyeta svastho raksartham ayusah...",
        transliteration: "brahme muhurte budhyeta svastho raksartham ayusah",
        translation: "A healthy person should wake up during Brahma Muhurta to preserve health and life.",
        explanation: "Early rising aligns body rhythms with natural cosmic energy.",
        topics: ["dinacharya", "brahma_muhurta"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Ashtanga Hridaya Sutra Sthana Ch 2 Verse 1"],
    disclaimer: "⚠️ Educational daily routine guide."
  }
];
