/**
 * Multi-Turn Follow-Up Conversation Scenarios
 */
module.exports = [
  {
    scenarioId: "SCENARIO-001-ACIDITY-ALLERGY",
    description: "Multi-turn acidity query transitioning to milk allergy exclusion",
    turns: [
      {
        turn: 1,
        userMessage: "I have acidity frequently.",
        expectedIntent: "ACIDITY_MANAGEMENT",
        expectedKeywordsInAnswer: ["Pitta", "Amlapitta", "cooling"]
      },
      {
        turn: 2,
        userMessage: "Can I drink milk?",
        expectedIntent: "DIET_GENERAL",
        expectedKeywordsInAnswer: ["milk", "digestibility"]
      },
      {
        turn: 3,
        userMessage: "I'm allergic to milk.",
        expectedIntent: "MILK_ALLERGY_MODIFICATION",
        expectedKeywordsInAnswer: ["EXCLUDED", "dairy-free", "almond milk"]
      }
    ]
  },
  {
    scenarioId: "SCENARIO-002-DINACHARYA-CLASSICAL",
    description: "Multi-turn Dinacharya query requesting Ashtanga Hridaya source verification",
    turns: [
      {
        turn: 1,
        userMessage: "What is Dinacharya?",
        expectedIntent: "DINACHARYA_ROUTINE",
        expectedKeywordsInAnswer: ["Daily Routine", "Brahma Muhurta"]
      },
      {
        turn: 2,
        userMessage: "What does Ashtanga Hridaya say about it?",
        expectedIntent: "DINACHARYA_ROUTINE",
        expectedKeywordsInAnswer: ["Ashtanga Hridaya", "brahme muhurte"]
      },
      {
        turn: 3,
        userMessage: "Show me the classical source.",
        expectedIntent: "DINACHARYA_ROUTINE",
        expectedKeywordsInAnswer: ["Ashtanga Hridaya Sutra Sthana Ch 2 Verse 1", "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read"]
      }
    ]
  }
];
