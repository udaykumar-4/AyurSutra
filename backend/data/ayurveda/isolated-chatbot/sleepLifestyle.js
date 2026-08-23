/**
 * Category 8: Sleep & Lifestyle Dataset
 */
module.exports = [
  {
    id: "AYU-SLEEP-001",
    category: "SLEEP_LIFESTYLE",
    intent: "AYURVEDIC_SLEEP",
    question: "What does Ayurveda say about sleep?",
    variations: [
      "What does Ayurveda say about sleep?",
      "What is Nidra in Ayurveda?",
      "How many hours should I sleep according to Ayurveda?",
      "What can I do before sleeping?",
      "What is an Ayurvedic bedtime routine?",
      "What foods should I avoid before sleep?",
      "Can I drink warm milk before sleep?",
      "Is daytime sleeping recommended?",
      "What does Ayurveda say about irregular sleep?",
      "How to fix insomnia with Ayurveda?"
    ],
    expectedAnswerType: "LIFESTYLE",
    answer: "Nidra (sleep) is recognized in Ayurveda as one of the three pillars of life (Trayopastambha), essential for tissue repair (Dhatu Poshana), immunity, and mental clarity.\n\n• **Bedtime Routine:** Aim to sleep before 10:00 PM (during the grounded Kapha time window). Sip warm almond/cow milk with a pinch of nutmeg & turmeric 30 minutes prior.\n• **Foot Massage:** Massage the soles of your feet with warm sesame oil or Ghee (Padabhyanga) to calm Vata.\n• **Daytime Napping:** Avoid daytime sleeping (Divasvapna) except during hot summer months or severe weakness, as it aggravates Kapha and forms Ama.",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "AH-SUTRA-7-54",
        sourceId: "ashtanga-hridaya",
        sourceName: "Ashtanga Hridaya",
        sourceUrl: "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read",
        samhita: "Ashtanga Hridaya",
        sthana: "Sutra Sthana",
        chapter: "7",
        chapterName: "Annarakshadiya Adhyaya",
        verse: "54",
        originalText: "nidrayattam sukham duhkham pustih karsyam balabalat...",
        transliteration: "nidrayattam sukham duhkham pustih karsyam balabalat",
        translation: "Happiness, sorrow, nourishment, emaciation, strength, and weakness all depend upon proper sleep.",
        explanation: "Sleep governs physical vitality and emotional equilibrium.",
        topics: ["sleep", "nidra", "trayopastambha"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Ashtanga Hridaya Sutra Sthana Ch 7 Verse 54"],
    disclaimer: "⚠️ Educational lifestyle information."
  }
];
