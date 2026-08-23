/**
 * Category 6: Abhyanga Therapy Dataset
 */
module.exports = [
  {
    id: "AYU-ABHY-001",
    category: "ABHYANGA",
    intent: "ABHYANGA_EDUCATION",
    question: "What is Abhyanga?",
    variations: [
      "What is Abhyanga?",
      "What happens during Abhyanga?",
      "What are the benefits of Abhyanga?",
      "How is Abhyanga traditionally performed?",
      "What oil is used for Abhyanga?",
      "What should I do after Abhyanga?",
      "Can I shower immediately after Abhyanga?",
      "What to avoid after Abhyanga massage?",
      "How often can I do self-Abhyanga?"
    ],
    expectedAnswerType: "THERAPY_GENERAL",
    answer: "🌿 **Abhyanga (Warm Herbal Oil Massage):**\nAbhyanga is the classical Ayurvedic full-body massage using warm medicated herbal oil (such as Mahanarayan or sesame oil) tailored to your constitution.\n\n• **Traditional Rationale:** Lubricates joints, calms Vata dosha, enhances lymphatic circulation, and softens skin.\n• **How It Is Performed:** Rhythmic, synchronized strokes applied down the limbs and circularly around joints.\n• **Aftercare:** Rest for 15-30 minutes so oil penetrates tissues, followed by a warm bath/shower (using mild herbal powder or non-drying soap). Avoid cold drafts and drink warm water.",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "AH-SUTRA-2-8",
        sourceId: "ashtanga-hridaya",
        sourceName: "Ashtanga Hridaya",
        sourceUrl: "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read",
        samhita: "Ashtanga Hridaya",
        sthana: "Sutra Sthana",
        chapter: "2",
        chapterName: "Dinacharya Adhyaya",
        verse: "8",
        originalText: "abhyangam acared nityam sa jarasramavataha...",
        transliteration: "abhyangam acared nityam sa jarasramavataha",
        translation: "Abhyanga should be practiced daily; it wards off aging, fatigue, and Vata disorders.",
        explanation: "Classical texts recommend daily warm oil application for longevity and strength.",
        topics: ["abhyanga", "dinacharya", "vata_relief"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Ashtanga Hridaya Sutra Sthana Ch 2 Verse 8"],
    disclaimer: "⚠️ Educational procedure description. Consult your clinician for specific oil selection."
  }
];
