/**
 * Category 9: Classical Ayurvedic References Dataset
 */
module.exports = [
  {
    id: "AYU-CLAS-001",
    category: "CLASSICAL_QUESTIONS",
    intent: "SUSHRUTA_AGNI",
    question: "What does Sushruta Samhita say about Agni?",
    variations: [
      "What does Sushruta Samhita say about Agni?",
      "Show me the classical source for Agni",
      "What is Sushruta definition of health?",
      "Which Samhita defines health as sama agni?",
      "Sushruta Sutra Sthana Chapter 15 Agni verse"
    ],
    expectedAnswerType: "CLASSICAL_REFERENCE",
    answer: "📜 **Classical Ayurvedic Reference**\n\n• **Samhita:** Sushruta Samhita\n• **Sthana:** Sutra Sthana\n• **Chapter:** 15 (Dhoshadhatu Mala Kshaya Vriddhi Vijnaniya)\n• **Verse:** 41\n• **Verse Text:** *'sama dosa sama agnisca sama dhatu mala kriyah prasannatmendriya manah svastha ityabhidhiyate'*\n• **Translation:** Health is the state of balanced doshas, balanced Agni (digestive fire), balanced tissues (dhatus), proper waste elimination, and a serene mind and senses.\n• **Source URL:** https://niimh.nic.in/ebooks/esushruta/",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "SS-SUTRA-15-41",
        sourceId: "sushruta-samhita",
        sourceName: "Sushruta Samhita",
        sourceUrl: "https://niimh.nic.in/ebooks/esushruta/",
        samhita: "Sushruta Samhita",
        sthana: "Sutra Sthana",
        chapter: "15",
        chapterName: "Dhoshadhatu Mala Kshaya Vriddhi Vijnaniya",
        verse: "41",
        originalText: "sama dosa sama agnisca sama dhatu mala kriyah prasannatmendriya manah svastha ityabhidhiyate",
        transliteration: "sama dosa sama agnisca sama dhatu mala kriyah prasannatmendriya manah svastha ityabhidhiyate",
        translation: "Health is the state of balanced doshas, balanced Agni, balanced tissues, proper waste elimination, and a serene mind and senses.",
        explanation: "Primary Sushruta definition of health.",
        topics: ["agni", "svasthya"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Sushruta Samhita Sutra Sthana Ch 15 Verse 41"],
    disclaimer: "📜 Verified Classical Source Reference from NIIMH e-Sushruta."
  },
  {
    id: "AYU-CLAS-002",
    category: "CLASSICAL_QUESTIONS",
    intent: "UNVERIFIED_CITATION_REQUEST",
    question: "Show me the verse from Sushruta Samhita about modern diabetes insulin dosing.",
    variations: [
      "Show me the verse from Sushruta Samhita about modern diabetes insulin dosing",
      "Which chapter in Ashtanga Hridaya discusses chemotherapy?",
      "Give me the classical Sanskrit verse for aspirin dosage"
    ],
    expectedAnswerType: "CLASSICAL_REFERENCE",
    answer: "Classical source reference could not be verified in the currently indexed AyurSutra knowledge base.",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: [],
    disclaimer: "⚠️ Unverified reference policy: No fake citations generated."
  }
];
