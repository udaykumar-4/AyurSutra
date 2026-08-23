/**
 * Category 2: Digestion & Acidity Dataset
 */
module.exports = [
  {
    id: "AYU-DIG-001",
    category: "DIGESTION_ACIDITY",
    intent: "ACIDITY_MANAGEMENT",
    question: "I have acidity frequently. What dietary changes can I make?",
    variations: [
      "I have acidity frequently. What dietary changes can I make?",
      "How to reduce acidity in Ayurveda?",
      "What should I eat for hyperacidity?",
      "What foods trigger acidity?",
      "Ayurvedic remedy for heart burn",
      "Why do I get acid reflux after eating?",
      "How can I soothe my burning stomach naturally?",
      "What is Pitta acidity?",
      "Can warm water help with acidity?",
      "Should I avoid spicy food for acidity?",
      "What fruits are good for acidity?",
      "What remedies help with indigestion and acidity?"
    ],
    expectedAnswerType: "DIET_GUIDANCE",
    answer: "Hyperacidity (Amlapitta) is traditionally associated with aggravated Pitta dosha. Recommended dietary principles (Pathya) include eating cooling, mild, sweet, and bitter taste foods such as steamed zucchini, cooked rice, soaked raisins, and sip cumin-coriander water. Limit excessively spicy, sour, salty, deep-fried, and fermented foods (Apathya).",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "AH-SUTRA-8-1",
        sourceId: "ashtanga-hridaya",
        sourceName: "Ashtanga Hridaya",
        sourceUrl: "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read",
        samhita: "Ashtanga Hridaya",
        sthana: "Sutra Sthana",
        chapter: "8",
        chapterName: "Matrasitiya Adhyaya",
        verse: "1",
        originalText: "matrasam asniyat. matra hi agneh pravartika...",
        transliteration: "matrasam asniyat matra hi agneh pravartika",
        translation: "Food should be consumed in proper quantity, as proper measure kindles and maintains digestive Agni.",
        explanation: "Eating in moderation prevents Pitta aggravation and stomach heaviness.",
        topics: ["digestion", "matra", "pitta_acidity"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Ashtanga Hridaya Sutra Sthana Ch 8"],
    disclaimer: "⚠️ Educational guidance only. If acidity persists with severe pain, vomiting, or weight loss, consult a qualified physician for evaluation."
  },
  {
    id: "AYU-DIG-002",
    category: "DIGESTION_ACIDITY",
    intent: "BLOATING_GAS",
    question: "Why do I feel bloated and heavy after eating?",
    variations: [
      "Why do I feel bloated and heavy after eating?",
      "How to reduce stomach gas in Ayurveda?",
      "What causes Vata gas in stomach?",
      "What is Mandagni?",
      "Why is my digestion so slow?",
      "How to kindle digestive fire (Agni)?",
      "What is CCF tea?",
      "Is ginger good for bloating?",
      "What should I eat when stomach feels full?",
      "Ayurvedic tips for gas and flatulence"
    ],
    expectedAnswerType: "DIET_GUIDANCE",
    answer: "Abdominal bloating and heaviness indicate Mandagni (sluggish digestive fire) and accumulated Ama (undigested residue). Chewing a small slice of fresh ginger with a pinch of sea salt 15 minutes before meals, sipping warm Cumin-Coriander-Fennel (CCF) tea, and avoiding cold/iced drinks helps rekindle Agni.",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Curated Digestive Rules"],
    disclaimer: "⚠️ Educational information. Persistent severe abdominal swelling requires clinical assessment."
  }
];
